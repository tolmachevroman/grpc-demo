// web/src/App.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

// gRPC - All types come from generated!
import { DashboardState, Priority, GetDashboardRequest, UpdateDashboardRequest, StreamDashboardRequest } from './generated/dashboard';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';

// Constants (just values, no types)
import { INITIAL_DASHBOARD } from './constants/dashboard';

// Helpers (just 2 simple functions)
import { normalizeState, withTimestamp } from './utils/grpc-helpers';

// Components
import { DashboardHeader } from './components/dashboard/DashboardHeader';
import { StatusCard } from './components/dashboard/StatusCard';
import { ToggleControls } from './components/dashboard/ToggleControls';
import { MetricsCards } from './components/dashboard/MetricsCards';
import { ConfigurationPanel } from './components/dashboard/ConfigurationPanel';
import { LoadingScreen } from './components/dashboard/LoadingScreen';
import { DashboardServiceClient } from './generated/dashboard.client';

function App() {
  // Direct use of generated type - no conversion needed!
  const [dashboard, setDashboard] = useState<DashboardState>(INITIAL_DASHBOARD);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<DashboardServiceClient | null>(null);
  const [activeTab, setActiveTab] = useState('status');
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const initializeGrpc = async () => {
      try {
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
            setDashboard(normalizeState(response.state));
            setConnected(true);
            setLoading(false);
          }
        } catch (err) {
          console.error('Failed to get initial dashboard:', err);
          setLoading(false);
        }

        // Setup streaming
        const streamRequest = StreamDashboardRequest.create({
          clientId: `web_${Date.now()}`,
        });

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const stream = grpcClient.streamDashboard(streamRequest, {
          abort: abortController.signal,
        });

        // Handle stream updates
        (async () => {
          try {
            for await (const response of stream.responses) {
              console.log('Received stream update:', response);

              if (response.state) {
                setDashboard(normalizeState(response.state));
                setConnected(true);
                setError(null);
              }

              if (response.updatedBy) {
                console.log(`Update from: ${response.updatedBy}`);
              }
            }
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              console.error('Stream error:', err);
              setConnected(false);
              setError(`Connection lost: ${err.message}`);
            }
          }
        })();
      } catch (err: any) {
        console.error('gRPC initialization failed:', err);
        setError('Failed to connect to server. Make sure the server and Envoy are running.');
        setConnected(false);
        setLoading(false);
      }
    };

    initializeGrpc();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Simple update function - no type conversion!
  const updateDashboard = useCallback(
    async (updates: Partial<DashboardState>) => {
      if (!client || !connected) {
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
        const stateUpdate = withTimestamp({ ...dashboard, ...updates });

        const request = UpdateDashboardRequest.create({
          state: stateUpdate as DashboardState,
          updatedBy: 'web_user',
        });

        const { response } = await client.updateDashboard(request);

        if (response.state) {
          setDashboard(normalizeState(response.state));
        }
      } catch (err) {
        console.error('Update failed:', err);
        setError('Failed to update dashboard');
        setDashboard(
          (prev) =>
            ({
              ...prev,
              ...withTimestamp(updates),
            } as DashboardState)
        );
      }
    },
    [client, connected, dashboard]
  );

  // UI handlers - working directly with DashboardState fields
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
        <DashboardHeader dashboard={dashboard} connected={connected} error={error} />

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b">
          {['status', 'controls', 'metrics', 'config'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors
                ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'status' && (
            <>
              <StatusCard dashboard={dashboard} onPriorityChange={handlePriorityChange} />
              <ToggleControls dashboard={dashboard} onToggle={handleToggle} />
            </>
          )}

          {activeTab === 'controls' && <ToggleControls dashboard={dashboard} onToggle={handleToggle} />}

          {activeTab === 'metrics' && <MetricsCards dashboard={dashboard} onSliderChange={handleSliderChange} />}

          {activeTab === 'config' && <ConfigurationPanel dashboard={dashboard} onConfigUpdate={handleConfigUpdate} />}
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
