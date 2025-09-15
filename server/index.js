const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load proto file
const PROTO_PATH = path.join(__dirname, '../proto/dashboard.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
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
  last_updated: Date.now(),
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
    callback(null, { state: dashboardState });
  },

  // Update dashboard fields
  updateDashboard: (call, callback) => {
    const { updates, updated_fields } = call.request;
    console.log('UpdateDashboard called with fields:', updated_fields);

    try {
      // Update only specified fields
      if (updated_fields && updated_fields.length > 0) {
        updated_fields.forEach((field) => {
          if (updates.hasOwnProperty(field)) {
            dashboardState[field] = updates[field];
          }
        });
      } else {
        // Update all provided fields
        Object.keys(updates).forEach((key) => {
          if (updates[key] !== undefined && updates[key] !== null) {
            dashboardState[key] = updates[key];
          }
        });
      }

      // Update timestamp
      dashboardState.last_updated = Date.now();

      // Broadcast to all connected clients
      broadcastUpdate('client', updated_fields || Object.keys(updates));

      callback(null, {
        success: true,
        message: 'Dashboard updated successfully',
        state: dashboardState,
      });
    } catch (error) {
      callback(null, {
        success: false,
        message: `Update failed: ${error.message}`,
        state: dashboardState,
      });
    }
  },

  // Stream dashboard updates (server-side streaming)
  streamDashboard: (call) => {
    const clientId = call.request.client_id || `client_${Date.now()}`;
    console.log(`Client ${clientId} connected to stream`);

    // Store the stream
    activeStreams.set(clientId, call);

    // Send initial state
    call.write({
      state: dashboardState,
      updated_by: 'server',
      updated_fields: [],
    });

    // Handle client disconnect
    call.on('cancelled', () => {
      console.log(`Client ${clientId} disconnected`);
      activeStreams.delete(clientId);
    });

    call.on('error', (error) => {
      console.error(`Stream error for client ${clientId}:`, error);
      activeStreams.delete(clientId);
    });
  },

  // Bidirectional streaming for real-time sync
  syncDashboard: (call) => {
    const clientId = `sync_${Date.now()}`;
    console.log(`Client ${clientId} connected for bidirectional sync`);

    // Send initial state
    call.write({
      state: dashboardState,
      updated_by: 'server',
      updated_fields: [],
    });

    // Handle incoming updates from client
    call.on('data', (request) => {
      const { updates, updated_fields } = request;
      console.log(`Received update from ${clientId}:`, updated_fields);

      try {
        // Apply updates
        if (updated_fields && updated_fields.length > 0) {
          updated_fields.forEach((field) => {
            if (updates.hasOwnProperty(field)) {
              dashboardState[field] = updates[field];
            }
          });
        }

        dashboardState.last_updated = Date.now();

        // Broadcast to all clients (including sender for confirmation)
        const response = {
          state: dashboardState,
          updated_by: clientId,
          updated_fields: updated_fields || [],
        };

        // Send to all active streams
        activeStreams.forEach((stream) => {
          try {
            stream.write(response);
          } catch (error) {
            console.error('Failed to broadcast:', error);
          }
        });

        // Also send to sync streams
        call.write(response);
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
  process.exit(0);
});

// Start the server
startServer();
