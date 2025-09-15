import { useState, useEffect, useCallback } from 'react';
import './App.css';

import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import {
  GetDashboardRequest,
  GetDashboardResponse,
  UpdateDashboardRequest,
  UpdateDashboardResponse,
  StreamDashboardRequest,
  StreamDashboardResponse,
  DashboardState,
  Priority,
} from './generated/dashboard';
import { DashboardServiceClient } from './generated/dashboard.client';

// Mock/fallback data for when gRPC isn't connected
const INITIAL_DASHBOARD = {
  title: 'System Dashboard',
  description: 'Main control panel for the system',
  statusMessage: 'All systems operational',
  isEnabled: true,
  maintenanceMode: false,
  notificationsOn: true,
  userCount: 42,
  temperature: 23.5,
  progressPercentage: 75,
  priority: 2, // MEDIUM
  lastUpdated: Date.now(),
  config: {
    theme: 'dark',
    language: 'en',
    refresh_rate: '5000',
  },
};

const PriorityConfig = {
  [Priority.UNSPECIFIED]: { label: 'Unspecified', color: 'bg-gray-500' },
  [Priority.LOW]: { label: 'Low', color: 'bg-green-500' },
  [Priority.MEDIUM]: { label: 'Medium', color: 'bg-yellow-500' },
  [Priority.HIGH]: { label: 'High', color: 'bg-orange-500' },
  [Priority.CRITICAL]: { label: 'Critical', color: 'bg-red-500' },
};

interface DashboardData {
  title: string;
  description: string;
  statusMessage: string;
  isEnabled: boolean;
  maintenanceMode: boolean;
  notificationsOn: boolean;
  userCount: number;
  temperature: number;
  progressPercentage: number;
  priority: Priority;
  lastUpdated: number;
  config: { [key: string]: string };
}

function App() {
  const [dashboard, setDashboard] = useState<DashboardData>(INITIAL_DASHBOARD);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grpcClient, setGrpcClient] = useState<any>(null);
  const [editingConfig, setEditingConfig] = useState(false);
  const [configText, setConfigText] = useState(JSON.stringify(INITIAL_DASHBOARD.config, null, 2));

  // Try to load gRPC client
  useEffect(() => {
    const loadGrpcClient = async () => {
      try {
        // Try to import generated files
        setLoading(true);

        const transport = new GrpcWebFetchTransport({
          baseUrl: 'http://localhost:8080',
        });
        const client = new DashboardServiceClient(transport);
        setGrpcClient({ client, proto: { GetDashboardRequest, DashboardState, StreamDashboardRequest, UpdateDashboardRequest } });

        // Try to connect
        const request = GetDashboardRequest.create();
        const rpcOptions = {};

        client.getDashboard(request, rpcOptions);

        // Set up streaming
        const streamRequest = StreamDashboardRequest.create();
        streamRequest.clientId = `web_${Date.now()}`;

        const stream = client.streamDashboard(streamRequest, {});

        stream
          .then((response: any) => {
            const state = response.getState();
            if (state) {
              setDashboard(convertProtoToState(state));
              setConnected(true);
            }
          })
          .catch((err: any) => {
            console.error('Stream error:', err);
            setConnected(false);
          });
      } catch (err) {
        console.warn('gRPC client not available, running in demo mode', err);
        setError('Running in demo mode. Generate proto files and start Envoy to connect to server.');
        setConnected(false);
        setLoading(false);
      }
    };

    loadGrpcClient();
  }, []);

  // Convert proto state to local state
  const convertProtoToState = (state: any): DashboardData => {
    try {
      return {
        title: state.getTitle(),
        description: state.getDescription(),
        statusMessage: state.getStatusMessage(),
        isEnabled: state.getIsEnabled(),
        maintenanceMode: state.getMaintenanceMode(),
        notificationsOn: state.getNotificationsOn(),
        userCount: state.getUserCount(),
        temperature: state.getTemperature(),
        progressPercentage: state.getProgressPercentage(),
        priority: state.getPriority(),
        lastUpdated: state.getLastUpdated() || Date.now(),
        config: state.getConfigMap ? Object.fromEntries(state.getConfigMap().toArray()) : dashboard.config,
      };
    } catch (err) {
      console.error('Error converting proto state:', err);
      return dashboard;
    }
  };

  // Update a field (works both with and without gRPC)
  const updateField = useCallback(
    async (fieldName: string, value: any) => {
      // Optimistic update
      setDashboard((prev) => ({
        ...prev,
        [fieldName]: value,
        lastUpdated: Date.now(),
      }));

      // Try to send to server if connected
      if (grpcClient && connected) {
        try {
          const { client, proto } = grpcClient;
          const request = new proto.UpdateDashboardRequest();
          const updates = new proto.DashboardState();

          // Set the specific field
          switch (fieldName) {
            case 'title':
              updates.setTitle(value);
              break;
            case 'description':
              updates.setDescription(value);
              break;
            case 'statusMessage':
              updates.setStatusMessage(value);
              break;
            case 'isEnabled':
              updates.setIsEnabled(value);
              break;
            case 'maintenanceMode':
              updates.setMaintenanceMode(value);
              break;
            case 'notificationsOn':
              updates.setNotificationsOn(value);
              break;
            case 'userCount':
              updates.setUserCount(value);
              break;
            case 'temperature':
              updates.setTemperature(value);
              break;
            case 'progressPercentage':
              updates.setProgressPercentage(value);
              break;
            case 'priority':
              updates.setPriority(value);
              break;
          }

          request.setUpdates(updates);
          request.setUpdatedFieldsList([fieldName]);

          client.updateDashboard(request, {}, (err: any, response: any) => {
            if (err) {
              console.error(`Failed to update ${fieldName}:`, err);
            } else if (response && response.getState()) {
              setDashboard(convertProtoToState(response.getState()));
            }
          });
        } catch (err) {
          console.error(`Error updating ${fieldName}:`, err);
        }
      }
    },
    [grpcClient, connected]
  );

  // Update config
  const saveConfig = () => {
    try {
      const newConfig = JSON.parse(configText);
      setDashboard((prev) => ({
        ...prev,
        config: newConfig,
        lastUpdated: Date.now(),
      }));
      setEditingConfig(false);

      // TODO: Send config update to server
    } catch (err) {
      alert('Invalid JSON format');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dashboard">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-4xl">🎛️</span>
              gRPC Dashboard Demo
            </h1>
            <div className="flex flex-col items-center md:items-end gap-2">
              <div
                className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${
                  connected ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white' : 'bg-gradient-to-r from-orange-400 to-pink-500 text-white'
                }`}
              >
                {connected ? '🟢 Connected to Server' : '🔴 Disconnected (Demo Mode)'}
              </div>
              {error && <div className="text-xs text-gray-600 max-w-xs text-center md:text-right">💡 {error}</div>}
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-gray-800">{dashboard.userCount}</div>
            <div className="text-sm text-gray-500 mt-1 uppercase tracking-wider">Active Users</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-gray-800">{dashboard.temperature.toFixed(1)}°C</div>
            <div className="text-sm text-gray-500 mt-1 uppercase tracking-wider">Temperature</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-gray-800">{dashboard.progressPercentage}%</div>
            <div className="text-sm text-gray-500 mt-1 uppercase tracking-wider">Progress</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-transform">
            <div
              className={`text-3xl font-bold ${PriorityConfig[dashboard.priority].color} bg-clip-text text-transparent bg-gradient-to-r ${
                dashboard.priority === Priority.LOW
                  ? 'from-green-400 to-green-600'
                  : dashboard.priority === Priority.MEDIUM
                  ? 'from-yellow-400 to-yellow-600'
                  : dashboard.priority === Priority.HIGH
                  ? 'from-orange-400 to-orange-600'
                  : dashboard.priority === Priority.CRITICAL
                  ? 'from-red-400 to-red-600'
                  : 'from-gray-400 to-gray-600'
              }`}
            >
              {PriorityConfig[dashboard.priority].label}
            </div>
            <div className="text-sm text-gray-500 mt-1 uppercase tracking-wider">Priority Level</div>
          </div>
        </div>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b-2 border-gray-100 flex items-center gap-2">
              <span>📝</span> System Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  value={dashboard.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-violet-500 focus:outline-none transition-colors"
                  placeholder="Dashboard title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wider">Description</label>
                <textarea
                  value={dashboard.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-violet-500 focus:outline-none transition-colors resize-none"
                  placeholder="Dashboard description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wider">Status Message</label>
                <input
                  type="text"
                  value={dashboard.statusMessage}
                  onChange={(e) => updateField('statusMessage', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-violet-500 focus:outline-none transition-colors"
                  placeholder="Current status"
                />
              </div>
            </div>
          </div>

          {/* System Controls */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b-2 border-gray-100 flex items-center gap-2">
              <span>🔧</span> System Controls
            </h2>

            <div className="space-y-4">
              {/* Toggle Switches */}
              {[
                { key: 'isEnabled', label: 'System Enabled', value: dashboard.isEnabled },
                { key: 'maintenanceMode', label: 'Maintenance Mode', value: dashboard.maintenanceMode },
                { key: 'notificationsOn', label: 'Notifications', value: dashboard.notificationsOn },
              ].map((toggle) => (
                <div key={toggle.key} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">{toggle.label}</span>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${
                          toggle.value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {toggle.value ? 'ON' : 'OFF'}
                      </span>
                      <button
                        onClick={() => updateField(toggle.key, !toggle.value)}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                          toggle.value ? 'bg-violet-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            toggle.value ? 'translate-x-8' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics & Settings */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b-2 border-gray-100 flex items-center gap-2">
              <span>📊</span> Metrics & Settings
            </h2>

            <div className="space-y-6">
              {/* User Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">User Count</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateField('userCount', Math.max(0, dashboard.userCount - 1))}
                    className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-xl font-semibold text-gray-700 transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={dashboard.userCount}
                    onChange={(e) => updateField('userCount', parseInt(e.target.value) || 0)}
                    className="flex-1 max-w-[100px] text-center px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-violet-500 focus:outline-none"
                    min="0"
                  />
                  <button
                    onClick={() => updateField('userCount', dashboard.userCount + 1)}
                    className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-xl font-semibold text-gray-700 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">
                  Temperature: {dashboard.temperature.toFixed(1)}°C
                </label>
                <input
                  type="range"
                  min="-20"
                  max="50"
                  step="0.5"
                  value={dashboard.temperature}
                  onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-20°C</span>
                  <span>50°C</span>
                </div>
              </div>

              {/* Progress */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">
                  Progress: {dashboard.progressPercentage}%
                </label>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-violet-500 to-purple-600 h-full rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                      style={{ width: `${dashboard.progressPercentage}%` }}
                    >
                      {dashboard.progressPercentage > 10 && <span className="text-white text-xs font-semibold">{dashboard.progressPercentage}%</span>}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={dashboard.progressPercentage}
                    onChange={(e) => updateField('progressPercentage', parseInt(e.target.value))}
                    className="w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer mt-2 accent-violet-600"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Priority Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PriorityConfig).map(([value, config]) => (
                    <button
                      key={value}
                      onClick={() => updateField('priority', parseInt(value))}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        dashboard.priority === parseInt(value)
                          ? `${config.color} text-white shadow-lg transform scale-105`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b-2 border-gray-100 flex items-center gap-2">
              <span>⚙️</span> Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700 uppercase tracking-wider">JSON Config</label>
                  <button
                    onClick={() => {
                      if (editingConfig) {
                        saveConfig();
                      } else {
                        setConfigText(JSON.stringify(dashboard.config, null, 2));
                        setEditingConfig(true);
                      }
                    }}
                    className="px-3 py-1 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors"
                  >
                    {editingConfig ? '💾 Save' : '✏️ Edit'}
                  </button>
                </div>
                {editingConfig ? (
                  <textarea
                    value={configText}
                    onChange={(e) => setConfigText(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg font-mono text-sm focus:border-violet-500 focus:outline-none"
                    rows={6}
                  />
                ) : (
                  <pre className="p-3 bg-gray-50 rounded-lg font-mono text-sm overflow-x-auto">{JSON.stringify(dashboard.config, null, 2)}</pre>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Last Updated</label>
                <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg text-center">
                  <span className="text-sm text-gray-600">
                    📅 {new Date(dashboard.lastUpdated).toLocaleDateString()} 🕐 {new Date(dashboard.lastUpdated).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
