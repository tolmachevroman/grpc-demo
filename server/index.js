// server/index.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load proto file with proper long handling
const PROTO_PATH = path.join(__dirname, '../proto/dashboard.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String, // Convert int64 to/from strings for safe handling
  enums: String,
  defaults: true,
  oneofs: true,
});

const dashboardProto = grpc.loadPackageDefinition(packageDefinition).dashboard;

// In-memory dashboard state
let dashboardState = {
  title: 'System Dashboard',
  description: 'Main control panel for the system',
  status_message: 'All systems operational',
  is_enabled: true,
  maintenance_mode: false,
  notifications_on: true,
  user_count: 42,
  temperature: 23.5,
  progress_percentage: 75,
  priority: 'PRIORITY_MEDIUM',
  last_updated: Date.now().toString(),
  config: {
    theme: 'dark',
    language: 'en',
    refresh_rate: '5000',
  },
};

// Store active stream connections
const activeStreams = new Map();

// Broadcast updates to all connected clients
function broadcastUpdate(updatedBy, updatedFields) {
  const response = {
    state: dashboardState,
    updated_by: updatedBy,
    updated_fields: updatedFields,
  };

  activeStreams.forEach((stream, clientId) => {
    try {
      stream.write(response);
      console.log(`Update sent to client ${clientId}`);
    } catch (error) {
      console.error(`Failed to send update to client ${clientId}:`, error);
      activeStreams.delete(clientId);
    }
  });
}

// Service implementation
const dashboardService = {
  // Get current dashboard state
  getDashboard: (call, callback) => {
    console.log('GetDashboard called');
    callback(null, {
      state: dashboardState,
    });
  },

  // Update dashboard state
  updateDashboard: (call, callback) => {
    const { state, updated_by } = call.request;

    if (state) {
      // Update fields that were provided
      const updatedFields = [];

      if (state.title !== undefined) {
        dashboardState.title = state.title;
        updatedFields.push('title');
      }
      if (state.description !== undefined) {
        dashboardState.description = state.description;
        updatedFields.push('description');
      }
      if (state.status_message !== undefined) {
        dashboardState.status_message = state.status_message;
        updatedFields.push('status_message');
      }
      if (state.is_enabled !== undefined) {
        dashboardState.is_enabled = state.is_enabled;
        updatedFields.push('is_enabled');
      }
      if (state.maintenance_mode !== undefined) {
        dashboardState.maintenance_mode = state.maintenance_mode;
        updatedFields.push('maintenance_mode');
      }
      if (state.notifications_on !== undefined) {
        dashboardState.notifications_on = state.notifications_on;
        updatedFields.push('notifications_on');
      }
      if (state.user_count !== undefined) {
        dashboardState.user_count = state.user_count;
        updatedFields.push('user_count');
      }
      if (state.temperature !== undefined) {
        dashboardState.temperature = state.temperature;
        updatedFields.push('temperature');
      }
      if (state.progress_percentage !== undefined) {
        dashboardState.progress_percentage = state.progress_percentage;
        updatedFields.push('progress_percentage');
      }
      if (state.priority !== undefined) {
        dashboardState.priority = state.priority;
        updatedFields.push('priority');
      }
      if (state.config !== undefined) {
        dashboardState.config = state.config;
        updatedFields.push('config');
      }

      // Always update the timestamp
      dashboardState.last_updated = Date.now().toString();

      console.log(`Dashboard updated by ${updated_by}:`, updatedFields);

      // Broadcast update to all connected clients
      broadcastUpdate(updated_by, updatedFields);
    }

    callback(null, {
      state: dashboardState,
      success: true,
    });
  },

  // Stream dashboard updates
  streamDashboard: (call) => {
    const clientId = call.request.client_id || `client_${Date.now()}`;
    console.log(`Client ${clientId} connected to stream`);

    // Send initial state
    call.write({
      state: dashboardState,
      updated_by: 'server',
      updated_fields: [],
    });

    // Store this stream connection
    activeStreams.set(clientId, call);

    // Handle client disconnect
    call.on('end', () => {
      console.log(`Client ${clientId} disconnected`);
      activeStreams.delete(clientId);
      call.end();
    });

    call.on('error', (error) => {
      console.error(`Stream error for client ${clientId}:`, error);
      activeStreams.delete(clientId);
    });
  },

  // Bidirectional sync stream
  syncDashboard: (call) => {
    const clientId = call.metadata.get('client-id')?.[0] || `sync_${Date.now()}`;
    console.log(`Client ${clientId} connected for sync`);

    // Send initial state
    call.write({
      state: dashboardState,
      updatedBy: 'server',
      updatedFields: [],
    });

    // Handle incoming updates from client
    call.on('data', (request) => {
      try {
        const { state, updated_by } = request;

        if (state) {
          // Update state
          const updatedFields = [];

          // Apply updates (same logic as updateDashboard)
          if (state.title !== undefined) {
            dashboardState.title = state.title;
            updatedFields.push('title');
          }
          if (state.description !== undefined) {
            dashboardState.description = state.description;
            updatedFields.push('description');
          }
          if (state.status_message !== undefined) {
            dashboardState.status_message = state.status_message;
            updatedFields.push('status_message');
          }
          if (state.is_enabled !== undefined) {
            dashboardState.is_enabled = state.is_enabled;
            updatedFields.push('is_enabled');
          }
          if (state.maintenance_mode !== undefined) {
            dashboardState.maintenance_mode = state.maintenance_mode;
            updatedFields.push('maintenance_mode');
          }
          if (state.notifications_on !== undefined) {
            dashboardState.notifications_on = state.notifications_on;
            updatedFields.push('notifications_on');
          }
          if (state.user_count !== undefined) {
            dashboardState.user_count = state.user_count;
            updatedFields.push('user_count');
          }
          if (state.temperature !== undefined) {
            dashboardState.temperature = state.temperature;
            updatedFields.push('temperature');
          }
          if (state.progress_percentage !== undefined) {
            dashboardState.progress_percentage = state.progress_percentage;
            updatedFields.push('progress_percentage');
          }
          if (state.priority !== undefined) {
            dashboardState.priority = state.priority;
            updatedFields.push('priority');
          }
          if (state.config !== undefined) {
            dashboardState.config = state.config;
            updatedFields.push('config');
          }

          // Update timestamp
          dashboardState.last_updated = Date.now().toString();

          console.log(`Sync update from ${updated_by || clientId}:`, updatedFields);

          // Create response
          const response = {
            state: dashboardState,
            updated_by: updated_by || clientId,
            updated_fields: updatedFields,
          };

          // Broadcast to all other streams
          activeStreams.forEach((stream, streamId) => {
            if (streamId !== clientId) {
              try {
                stream.write(response);
              } catch (error) {
                console.error('Failed to broadcast:', error);
              }
            }
          });

          // Also send back to sync stream
          call.write(response);
        }
      } catch (error) {
        console.error(`Update error from ${clientId}:`, error);
      }
    });

    // Store this sync stream as active
    activeStreams.set(clientId, call);

    // Handle disconnect
    call.on('end', () => {
      console.log(`Client ${clientId} ended sync`);
      activeStreams.delete(clientId);
      call.end();
    });

    call.on('error', (error) => {
      console.error(`Sync error for client ${clientId}:`, error);
      activeStreams.delete(clientId);
    });
  },
};

// Create and start the server
function startServer() {
  const server = new grpc.Server();

  server.addService(dashboardProto.DashboardService.service, dashboardService);

  const port = process.env.PORT || '50051';
  const host = '0.0.0.0';

  server.bindAsync(`${host}:${port}`, grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
      console.error('Failed to start server:', error);
      return;
    }
    console.log(`✅ gRPC server running on port ${port}`);
    console.log(`📊 Dashboard initialized with ${Object.keys(dashboardState).length} fields`);
    console.log(`🔄 Real-time sync enabled`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  activeStreams.forEach((stream, clientId) => {
    console.log(`Closing stream for client ${clientId}`);
    stream.end();
  });
  process.exit(0);
});

// Start the server
startServer();
