const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load proto file
const PROTO_PATH = path.join(__dirname, '../proto/dashboard.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const dashboardProto = grpc.loadPackageDefinition(packageDefinition).dashboard;

// In-memory dashboard state - using snake_case to match proto
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

// Convert snake_case keys to camelCase for client responses
function toCamelCaseObject(obj) {
  const result = {};
  Object.keys(obj).forEach((key) => {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  });
  console.log('🐍➡️🐪 Converting state:', { original: obj, converted: result });
  return result;
}

// Broadcast updates to all connected clients
function broadcastUpdate(updatedBy, updatedFields) {
  console.log(`📡 Broadcasting to ${activeStreams.size} clients...`);
  console.log(`   Updated by: ${updatedBy}`);
  console.log(`   Fields: ${updatedFields}`);

  const response = {
    state: toCamelCaseObject(dashboardState),
    updated_by: updatedBy || 'server',
    updated_fields: updatedFields || [],
  };

  let successCount = 0;
  activeStreams.forEach((stream, clientId) => {
    try {
      stream.write(response);
      successCount++;
      console.log(`   ✅ Sent to ${clientId}`);
    } catch (error) {
      console.error(`   ❌ Failed to send to ${clientId}:`, error.message);
      activeStreams.delete(clientId);
    }
  });

  console.log(`📡 Broadcast complete: ${successCount} clients\n`);
}

// Service implementation
const dashboardService = {
  // Get current dashboard state
  getDashboard: (call, callback) => {
    console.log('GetDashboard called');
    callback(null, { state: toCamelCaseObject(dashboardState) });
  },

  // Update dashboard fields
  updateDashboard: (call, callback) => {
    const { updates, updated_fields, updatedFields } = call.request;

    // Handle both snake_case and camelCase field names
    const fieldsToUpdate = updated_fields || updatedFields;

    const toSnakeCase = (str) => str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

    // Try to identify the client from the call metadata or peer info
    let clientId = 'unknown_client';
    try {
      // Get peer info (this shows the connection source)
      const peer = call.getPeer();

      // Try to get metadata if client sends it
      const metadata = call.metadata;
      if (metadata) {
        const clientIdArray = metadata.get('client-id');
        if (clientIdArray && clientIdArray.length > 0) {
          clientId = clientIdArray[0];
        } else {
          // Fallback: use peer address
          clientId = peer || 'client';
        }
      }

      // Identify common clients by pattern
      if (peer && peer.includes(':50051')) {
        clientId = 'benchmark'; // Local connections are likely benchmark
      } else if (peer && peer.includes(':8080')) {
        clientId = 'web_app'; // Envoy proxy connections are web
      }
    } catch (e) {
      // Fallback to generic client
      console.log('Could not identify client:', e.message);
    }

    console.log(`\n🔄 UpdateDashboard called by ${clientId}`);
    console.log('   Updates for fields (updated_fields):', updated_fields);
    console.log('   Updates for fields (updatedFields):', updatedFields);
    console.log('   Final fieldsToUpdate:', fieldsToUpdate);
    console.log('   Updates object keys:', Object.keys(updates || {}));

    try {
      if (!updates) {
        callback(null, {
          success: false,
          message: 'No updates provided',
          state: toCamelCaseObject(dashboardState),
        });
        return;
      }

      let fieldsUpdated = [];

      // Only update the fields specified in fieldsToUpdate
      if (fieldsToUpdate && fieldsToUpdate.length > 0) {
        fieldsToUpdate.forEach((field) => {
          // Convert camelCase field name to snake_case for server state
          const snakeField = toSnakeCase(field);

          // Check if the update contains this field (in camelCase)
          if (updates.hasOwnProperty(field) && updates[field] !== undefined) {
            const oldValue = dashboardState[snakeField];
            const newValue = updates[field];
            dashboardState[snakeField] = newValue;
            fieldsUpdated.push(snakeField);
            console.log(`   ✓ ${field} -> ${snakeField}: ${oldValue} → ${newValue}`);
          } else {
            console.log(`   ⚠️ Field ${field} not found in updates or is undefined`);
          }
        });
      } else {
        console.log('   ⚠️ No fieldsToUpdate specified, skipping update');
      }
      if (fieldsUpdated.length === 0) {
        callback(null, {
          success: false,
          message: 'No valid fields to update',
          state: toCamelCaseObject(dashboardState),
        });
        return;
      }

      // Update timestamp
      dashboardState.last_updated = Date.now();

      console.log(`   ✅ Updated ${fieldsUpdated.length} fields`);

      // Broadcast to all connected clients by client id
      broadcastUpdate(clientId, fieldsUpdated);

      callback(null, {
        success: true,
        message: `Updated ${fieldsUpdated.length} fields`,
        state: toCamelCaseObject(dashboardState),
      });
    } catch (error) {
      console.error('Update error:', error);
      callback(null, {
        success: false,
        message: `Update failed: ${error.message}`,
        state: toCamelCaseObject(dashboardState),
      });
    }
  },

  // Stream dashboard updates
  streamDashboard: (call) => {
    const clientId = call.request.client_id || `client_${Date.now()}`;
    console.log(`\n👋 Client ${clientId} connected to stream`);

    // Store the stream
    activeStreams.set(clientId, call);
    console.log(`   Active streams: ${activeStreams.size}`);

    // Send initial state
    try {
      const initialResponse = {
        state: toCamelCaseObject(dashboardState),
        updated_by: 'server',
        updated_fields: [],
      };
      call.write(initialResponse);
      console.log(`   ✅ Sent initial state`);
    } catch (error) {
      console.error(`   ❌ Failed to send initial state:`, error);
    }

    // Handle disconnect
    call.on('cancelled', () => {
      console.log(`👋 Client ${clientId} disconnected`);
      activeStreams.delete(clientId);
    });

    call.on('error', (error) => {
      console.error(`Stream error for ${clientId}:`, error.message);
      activeStreams.delete(clientId);
    });

    call.on('end', () => {
      console.log(`Stream ended for ${clientId}`);
      activeStreams.delete(clientId);
    });
  },

  // Bidirectional streaming
  syncDashboard: (call) => {
    const clientId = `sync_${Date.now()}`;
    console.log(`\n🔄 Sync client ${clientId} connected`);

    // Store this sync stream
    activeStreams.set(clientId, call);

    // Send initial state
    call.write({
      state: toCamelCaseObject(dashboardState),
      updated_by: 'server',
      updated_fields: [],
    });

    // Handle incoming updates
    call.on('data', (request) => {
      console.log(`Sync update from ${clientId}`);

      try {
        let actuallyUpdated = [];

        if (request.updated_fields && request.updated_fields.length > 0) {
          request.updated_fields.forEach((field) => {
            if (request.updates && request.updates.hasOwnProperty(field)) {
              dashboardState[field] = request.updates[field];
              actuallyUpdated.push(field);
            }
          });
        } else if (request.updates) {
          Object.keys(request.updates).forEach((field) => {
            dashboardState[field] = request.updates[field];
            actuallyUpdated.push(field);
          });
        }

        if (actuallyUpdated.length > 0) {
          dashboardState.last_updated = Date.now();
          broadcastUpdate(clientId, actuallyUpdated);
        }
      } catch (error) {
        console.error(`Sync update error:`, error);
      }
    });

    // Handle disconnect
    call.on('end', () => {
      console.log(`Sync client ${clientId} disconnected`);
      activeStreams.delete(clientId);
      call.end();
    });

    call.on('error', (error) => {
      console.error(`Sync error for ${clientId}:`, error);
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
    console.log(`📡 Waiting for connections...\n`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});

// Start the server
startServer();
