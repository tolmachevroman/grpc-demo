import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

// gRPC - All types come from generated
import { DashboardState, Priority, GetDashboardRequest, UpdateDashboardRequest, StreamDashboardRequest } from './generated/dashboard';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';

// Constants (just values, no types)
import { INITIAL_DASHBOARD } from './constants/dashboard';

import { normalizeState, withTimestamp } from './utils/grpc-helpers';

// Components
import { DashboardHeader } from './components/dashboard/DashboardHeader';
import { StatusCard } from './components/dashboard/StatusCard';
import { ToggleControls } from './components/dashboard/ToggleControls';
import { MetricsCards } from './components/dashboard/MetricsCards';
import { ConfigurationPanel } from './components/dashboard/ConfigurationPanel';
import { LoadingScreen } from './components/dashboard/LoadingScreen';
import { DashboardServiceClient } from './generated/dashboard.client';

const SunIcon = () => (
  <span role="img" aria-label="Light">
    🌞
  </span>
);
const MoonIcon = () => (
  <span role="img" aria-label="Dark">
    🌙
  </span>
);

function App() {
  const [dashboard, setDashboard] = useState<DashboardState>(INITIAL_DASHBOARD);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<DashboardServiceClient | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Fix for your App.tsx useEffect to prevent duplicate connections

  useEffect(() => {
    let isMounted = true;
    let streamAbortController: AbortController | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    let currentStreamId: string | null = null; // Track the stream ID

    const startStream = async (grpcClient: DashboardServiceClient) => {
      // Cancel any existing stream first
      if (streamAbortController) {
        console.log('🔄 Canceling previous stream...');
        streamAbortController.abort();
      }

      // Generate unique stream ID
      currentStreamId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`📡 Starting new stream: ${currentStreamId}`);

      const streamRequest = StreamDashboardRequest.create({
        clientId: currentStreamId,
      });

      streamAbortController = new AbortController();
      abortControllerRef.current = streamAbortController;

      try {
        const stream = grpcClient.streamDashboard(streamRequest, {
          abort: streamAbortController.signal,
        });

        for await (const response of stream.responses) {
          if (!isMounted) {
            console.log(`⚠️ Received update after unmount, ignoring`);
            return;
          }

          console.log(`📥 [${currentStreamId}] Stream update received`);

          if (response.state) {
            setDashboard(normalizeState(response.state));
            setConnected(true);
            setError(null);
          }

          if (response.updatedBy) {
            console.log(`   Update from: ${response.updatedBy}`);
          }
        }

        // If stream ends naturally and component is still mounted, reconnect
        if (isMounted) {
          console.log(`⚠️ Stream ${currentStreamId} ended, will reconnect...`);
          reconnectWithBackoff(grpcClient);
        }
      } catch (err: any) {
        if (!isMounted) {
          console.log(`✅ Stream ${currentStreamId} canceled due to unmount`);
          return;
        }

        if (err.name === 'AbortError') {
          console.log(`✅ Stream ${currentStreamId} aborted`);
        } else {
          console.error(`❌ Stream ${currentStreamId} error:`, err);
          setConnected(false);
          setError(`Connection lost: ${err.message}`);
          reconnectWithBackoff(grpcClient);
        }
      }
    };

    const reconnectWithBackoff = (grpcClient: DashboardServiceClient) => {
      if (!isMounted) return;

      reconnectAttempts++;
      const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
      console.log(`⏳ Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);

      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => {
        if (isMounted) startStream(grpcClient);
      }, delay);
    };

    const initializeGrpc = async () => {
      try {
        console.log('🚀 Initializing gRPC client...');
        setLoading(true);
        setError(null);

        const transport = new GrpcWebFetchTransport({
          baseUrl: 'http://localhost:8080',
          format: 'text',
        });
        const grpcClient = new DashboardServiceClient(transport);
        setClient(grpcClient);

        // Get initial state
        try {
          const request = GetDashboardRequest.create();
          const { response } = await grpcClient.getDashboard(request);

          if (response.state) {
            console.log('✅ Initial state loaded');
            setDashboard(normalizeState(response.state));
            setConnected(true);
            setLoading(false);
          }
        } catch (err) {
          console.error('Failed to get initial dashboard:', err);
          setLoading(false);
        }

        // Start streaming with reconnect
        reconnectAttempts = 0;
        startStream(grpcClient);
      } catch (err: any) {
        console.error('❌ gRPC initialization failed:', err);
        setError('Failed to connect to server. Make sure the server and Envoy are running.');
        setConnected(false);
        setLoading(false);
      }
    };

    // Initialize only once
    initializeGrpc();

    return () => {
      console.log(`🧹 Cleaning up gRPC connections (stream: ${currentStreamId})`);
      isMounted = false;

      // Cancel any active stream
      if (streamAbortController) {
        streamAbortController.abort();
        streamAbortController = null;
      }

      // Cancel the shared abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Clear any pending reconnection
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      console.log('✅ Cleanup complete');
    };
  }, []); // Empty dependency array - run only once

  const updateDashboard = useCallback(
    async (updates: Partial<DashboardState>) => {
      if (!client || !connected) {
        // Optimistic update when not connected
        setDashboard(
          (prev) =>
            ({
              ...prev,
              ...withTimestamp(updates),
            } as DashboardState)
        );
        return;
      }

      try {
        const updatedFields = Object.keys(updates).filter((key) => updates[key as keyof DashboardState] !== undefined);

        // Only send if there are actual updates and updatedFields
        if (!updates || Object.keys(updates).length === 0 || !updatedFields || updatedFields.length === 0) {
          console.warn('[updateDashboard] No updates or updatedFields to send. Skipping request.');
          return;
        }

        // Create a minimal updates object with only the changed fields
        const minimalUpdates = {} as any;
        updatedFields.forEach((field) => {
          minimalUpdates[field] = updates[field as keyof DashboardState];
        });

        console.log('📤 Sending update:', { updates: minimalUpdates, updatedFields });

        const request = UpdateDashboardRequest.create({
          updates: minimalUpdates,
          updatedFields: updatedFields,
        });

        const { response } = await client.updateDashboard(request);

        if (response) {
          if ('success' in response && response.success) {
            console.log('✅ Update successful');
          } else if ('success' in response && !response.success) {
            console.error('❌ Update failed');
            setError('Update failed');
          }

          // Always use the returned state if available
          if (response.state) {
            setDashboard(normalizeState(response.state));
          }
        }
      } catch (err) {
        console.error('Update failed:', err);
        setError('Failed to update dashboard');
        // Optimistic update on error
        setDashboard(
          (prev) =>
            ({
              ...prev,
              ...withTimestamp(updates),
            } as DashboardState)
        );
      }
    },
    [client, connected]
  );

  const handleToggle = useCallback(
    (field: keyof DashboardState) => {
      const currentValue = dashboard[field];
      if (typeof currentValue === 'boolean') {
        updateDashboard({ [field]: !currentValue });
      }
    },
    [dashboard, updateDashboard]
  );

  const handleSliderChange = useCallback(
    (field: keyof DashboardState, value: number) => {
      updateDashboard({ [field]: value });
    },
    [updateDashboard]
  );

  const handlePriorityChange = useCallback(
    (priority: Priority) => {
      updateDashboard({ priority });
    },
    [updateDashboard]
  );

  const handleConfigUpdate = useCallback(
    (config: Record<string, string>) => {
      updateDashboard({ config });
    },
    [updateDashboard]
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardHeader
          dashboard={dashboard}
          connected={connected}
          error={error}
          theme={theme}
          toggleTheme={toggleTheme}
          SunIcon={SunIcon}
          MoonIcon={MoonIcon}
        />

        {/* All Content Sections */}
        <div className="space-y-6">
          <StatusCard dashboard={dashboard} onPriorityChange={handlePriorityChange} />
          <ToggleControls dashboard={dashboard} onToggle={handleToggle} />
          <MetricsCards dashboard={dashboard} onSliderChange={handleSliderChange} />
          <ConfigurationPanel dashboard={dashboard} onConfigUpdate={handleConfigUpdate} />
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-6 border-t">
          Last updated: {new Date(parseInt(dashboard.lastUpdated || '0', 10)).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export default App;
