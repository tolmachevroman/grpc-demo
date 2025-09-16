#!/usr/bin/env node

/**
 * gRPC Dashboard Server Benchmark Script
 * Generates an avalanche of update requests for performance testing
 *
 * Usage:
 *   node benchmark.js [options]
 *
 * Options:
 *   --requests, -r    Number of total requests (default: 1000)
 *   --concurrent, -c  Number of concurrent connections (default: 10)
 *   --interval, -i    Delay between requests in ms (default: 0)
 *   --host            Server host (default: localhost)
 *   --port, -p        Server port (default: 50051)
 *   --streaming, -s   Test streaming performance
 *   --mixed, -m       Mix of read/write operations
 *   --broadcast, -b   Test broadcasting to multiple clients
 *   --bandwidth, -w   Run bandwidth measurement tests
 *   --help, -h        Show this help message
 */

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Parse command line arguments
let args = process.argv.slice(2);
// Support npm run: if invoked as 'npm run benchmark -- --bandwidth', skip args before '--'
const doubleDashIndex = args.indexOf('--');
if (doubleDashIndex !== -1) {
  args = args.slice(doubleDashIndex + 1);
}

const config = {
  requests: 1000,
  concurrent: 10,
  interval: 0,
  host: 'localhost',
  port: 50051,
  streaming: false,
  mixed: false,
  broadcast: false,
  bandwidth: false,
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--requests':
    case '-r':
      config.requests = parseInt(args[++i]);
      break;
    case '--concurrent':
    case '-c':
      config.concurrent = parseInt(args[++i]);
      break;
    case '--interval':
    case '-i':
      config.interval = parseInt(args[++i]);
      break;
    case '--host':
      config.host = args[++i];
      break;
    case '--port':
    case '-p':
      config.port = parseInt(args[++i]);
      break;
    case '--streaming':
    case '-s':
      config.streaming = true;
      break;
    case '--mixed':
    case '-m':
      config.mixed = true;
      break;
    case '--broadcast':
    case '-b':
      config.broadcast = true;
      break;
    case '--bandwidth':
    case '-w':
      config.bandwidth = true;
      break;
    case '--help':
    case '-h':
      console.log('Usage: node benchmark.js [options]\n');
      console.log('Options:');
      console.log('  --requests, -r    Number of total requests (default: 1000)');
      console.log('  --concurrent, -c  Number of concurrent connections (default: 10)');
      console.log('  --interval, -i    Delay between requests in ms (default: 0)');
      console.log('  --host            Server host (default: localhost)');
      console.log('  --port, -p        Server port (default: 50051)');
      console.log('  --streaming, -s   Test streaming performance');
      console.log('  --mixed, -m       Mix of read/write operations');
      console.log('  --broadcast, -b   Test broadcasting to multiple clients');
      console.log('  --bandwidth, -w   Run bandwidth measurement tests');
      console.log('  --help, -h        Show this help message');
      console.log('\nExamples:');
      console.log('  node benchmark.js -r 100');
      console.log('  node benchmark.js -r 10000 -c 50');
      console.log('  node benchmark.js -r 1000 -i 10');
      console.log('  node benchmark.js -s -r 1000');
      console.log('  node benchmark.js -b');
      console.log('  node benchmark.js -w');
      process.exit(0);
  }
}

// Bandwidth measurement helpers
function getMessageSize(obj) {
  const str = JSON.stringify(obj);
  return Buffer.byteLength(str, 'utf8');
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

async function testBandwidth() {
  console.log('Bandwidth Measurement Test\n');
  console.log('=====================================\n');

  const client = new dashboardProto.DashboardService(`${config.host}:${config.port}`, grpc.credentials.createInsecure());

  // Test 1: Measure GetDashboard (read) bandwidth
  console.log('1) Testing GetDashboard bandwidth...\n');

  const getRequest = {};
  const getRequestSize = getMessageSize(getRequest);
  console.log('   Request size: ' + formatBytes(getRequestSize));

  const getResponse = await new Promise((resolve, reject) => {
    client.getDashboard(getRequest, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });

  const getResponseSize = getMessageSize(getResponse);
  console.log('   Response size: ' + formatBytes(getResponseSize));
  console.log('   Total: ' + formatBytes(getRequestSize + getResponseSize));

  // Test 2: Small update (1 field)
  console.log('\n2) Testing small update (1 field)...\n');

  const smallUpdate = {
    updates: {
      title: 'Small Update Test',
    },
    updated_fields: ['title'],
  };

  const smallRequestSize = getMessageSize(smallUpdate);
  console.log('   Request size: ' + formatBytes(smallRequestSize));

  const smallResponse = await new Promise((resolve, reject) => {
    client.updateDashboard(smallUpdate, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });

  const smallResponseSize = getMessageSize(smallResponse);
  console.log('   Response size: ' + formatBytes(smallResponseSize));
  console.log('   Total: ' + formatBytes(smallRequestSize + smallResponseSize));

  // Test 3: Large update (many fields)
  console.log('\n3) Testing large update (many fields)...\n');

  const largeUpdate = {
    updates: {
      title: 'Large Update Test with Very Long Title to Increase Message Size',
      description:
        'This is a much longer description field that contains significantly more text to test how the message size scales with content length. We want to see the bandwidth impact.',
      status_message: 'Complex status with additional information and details',
      is_enabled: true,
      maintenance_mode: false,
      notifications_on: true,
      user_count: 999999,
      temperature: 98.765432,
      progress_percentage: 100,
      priority: 'PRIORITY_CRITICAL',
      config: {
        setting1: 'value1',
        setting2: 'value2',
        setting3: 'value3',
        setting4: 'value4',
        setting5: 'value5',
      },
    },
    updated_fields: [
      'title',
      'description',
      'status_message',
      'is_enabled',
      'maintenance_mode',
      'notifications_on',
      'user_count',
      'temperature',
      'progress_percentage',
      'priority',
      'config',
    ],
  };

  const largeRequestSize = getMessageSize(largeUpdate);
  console.log('   Request size: ' + formatBytes(largeRequestSize));

  const largeResponse = await new Promise((resolve, reject) => {
    client.updateDashboard(largeUpdate, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });

  const largeResponseSize = getMessageSize(largeResponse);
  console.log('   Response size: ' + formatBytes(largeResponseSize));
  console.log('   Total: ' + formatBytes(largeRequestSize + largeResponseSize));

  // Test 4: Stream bandwidth
  console.log('\n4) Testing streaming bandwidth...\n');

  let streamBytesReceived = 0;
  let streamMessageCount = 0;

  const stream = client.streamDashboard({ client_id: 'bandwidth_test' });

  stream.on('data', (response) => {
    const size = getMessageSize(response);
    streamBytesReceived += size;
    streamMessageCount++;
    if (streamMessageCount <= 3) {
      console.log('   Stream message #' + streamMessageCount + ': ' + formatBytes(size));
    }
  });

  // Increase pressure: send 100 updates
  const updateCount = 100;
  for (let i = 0; i < updateCount; i++) {
    await new Promise((resolve) => {
      client.updateDashboard(
        {
          updates: { user_count: 100 + i },
          updated_fields: ['user_count'],
        },
        resolve
      );
    });
    await new Promise((r) => setTimeout(r, 10)); // small delay to avoid flooding
  }

  await new Promise((r) => setTimeout(r, 1000));
  stream.cancel();

  console.log('\n   Total stream messages: ' + streamMessageCount);
  console.log('   Total stream bandwidth: ' + formatBytes(streamBytesReceived));
  console.log('   Avg per message: ' + formatBytes(streamBytesReceived / streamMessageCount));

  // Summary
  console.log('\n=====================================');
  console.log('BANDWIDTH SUMMARY\n');

  console.log('Message Size Comparison:');
  console.log('   Empty read:    ' + formatBytes(getRequestSize + getResponseSize));
  console.log('   Small update:  ' + formatBytes(smallRequestSize + smallResponseSize));
  console.log('   Large update:  ' + formatBytes(largeRequestSize + largeResponseSize));
  console.log('   Stream msg:    ' + formatBytes(streamBytesReceived / streamMessageCount) + ' avg');

  const ratio = largeRequestSize / smallRequestSize;
  console.log('   Large update is ' + ratio.toFixed(1) + 'x bigger than small update');
  console.log('   Response includes full state (' + formatBytes(getResponseSize) + ' baseline)');
  console.log('   Streaming adds ~' + formatBytes(streamBytesReceived / streamMessageCount) + ' per update');

  client.close();
  process.exit(0);
}

// Load proto file
const PROTO_PATH = path.join(__dirname, '../../proto/dashboard.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const dashboardProto = grpc.loadPackageDefinition(packageDefinition).dashboard;

// Statistics tracking
const stats = {
  successful: 0,
  failed: 0,
  totalLatency: 0,
  minLatency: Infinity,
  maxLatency: 0,
  latencies: [],
  startTime: null,
  endTime: null,
};

// Generate random update data
function generateRandomUpdate() {
  const fields = [
    'title',
    'description',
    'status_message',
    'is_enabled',
    'maintenance_mode',
    'notifications_on',
    'user_count',
    'temperature',
    'progress_percentage',
    'priority',
  ];

  const selectedFields = [];
  const updates = {};

  // Randomly select 1-3 fields to update
  const numFields = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < numFields; i++) {
    const field = fields[Math.floor(Math.random() * fields.length)];
    if (!selectedFields.includes(field)) {
      selectedFields.push(field);

      // Generate appropriate random value based on field type
      switch (field) {
        case 'title':
          updates.title = `Dashboard ${Math.floor(Math.random() * 10000)}`;
          break;
        case 'description':
          updates.description = `Updated at ${new Date().toISOString()}`;
          break;
        case 'status_message':
          const statuses = ['All systems go', 'Running smoothly', 'Peak performance', 'Optimal state'];
          updates.status_message = statuses[Math.floor(Math.random() * statuses.length)];
          break;
        case 'is_enabled':
        case 'maintenance_mode':
        case 'notifications_on':
          updates[field] = Math.random() > 0.5;
          break;
        case 'user_count':
          updates.user_count = Math.floor(Math.random() * 1000);
          break;
        case 'temperature':
          updates.temperature = Math.random() * 50 - 10; // -10 to 40
          break;
        case 'progress_percentage':
          updates.progress_percentage = Math.floor(Math.random() * 101);
          break;
        case 'priority':
          updates.priority = ['PRIORITY_LOW', 'PRIORITY_MEDIUM', 'PRIORITY_HIGH', 'PRIORITY_CRITICAL'][Math.floor(Math.random() * 4)];
          break;
      }
    }
  }

  return { updates, updated_fields: selectedFields };
}

// Create a client connection
function createClient() {
  return new dashboardProto.DashboardService(`${config.host}:${config.port}`, grpc.credentials.createInsecure());
}

// Execute a single update request
function executeUpdate(client, requestId) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const { updates, updated_fields } = generateRandomUpdate();

    // Debug: Log what we're sending
    if (requestId === 0 || requestId % 100 === 0) {
      console.log(`📤 Sending update #${requestId}:`, { updates, updated_fields });
    }

    // Send the request with both updates and updated_fields
    const request = {
      updates: updates,
      updated_fields: updated_fields,
    };

    client.updateDashboard(request, (error, response) => {
      const latency = Date.now() - startTime;

      if (error) {
        stats.failed++;
        console.error(`Request ${requestId} failed:`, error.message);
        reject(error);
      } else {
        stats.successful++;
        stats.totalLatency += latency;

        if (latency < stats.minLatency) stats.minLatency = latency;
        if (latency > stats.maxLatency) stats.maxLatency = latency;

        stats.latencies.push(latency); // <-- Add this line

        if (stats.successful % 100 === 0) {
          console.log(`✓ Completed ${stats.successful} requests...`);
        }

        // Debug: Log server response
        if (response && response.success === false) {
          console.warn(`⚠️ Request ${requestId} returned success=false:`, response.message);
        }

        resolve({ requestId, latency, response });
      }
    });
  });
}

// Execute a single read request
function executeGet(client, requestId) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    client.getDashboard({}, (error, response) => {
      const latency = Date.now() - startTime;

      if (error) {
        stats.failed++;
        console.error(`Get request ${requestId} failed:`, error.message);
        reject(error);
      } else {
        stats.successful++;
        stats.totalLatency += latency;
        stats.latencies.push(latency);

        if (latency < stats.minLatency) stats.minLatency = latency;
        if (latency > stats.maxLatency) stats.maxLatency = latency;

        resolve({ requestId, latency, response });
      }
    });
  });
}

// Test streaming performance
async function testStreaming(client) {
  console.log('\n🔄 Testing Streaming Performance...\n');
  console.log('Starting stream listener first...');

  return new Promise((resolve) => {
    let receivedCount = 0;
    const clientId = `benchmark_${Date.now()}`;

    // Start streaming FIRST to receive updates
    const stream = client.streamDashboard({ client_id: clientId });

    stream.on('data', (response) => {
      receivedCount++;
      console.log(`📥 Received streaming update #${receivedCount}`);

      // Log details of first few updates
      if (receivedCount <= 3) {
        console.log('  Updated by:', response.updated_by);
        console.log('  Updated fields:', response.updated_fields);
      }
    });

    stream.on('error', (error) => {
      console.error('Stream error:', error);
    });

    stream.on('end', () => {
      console.log('Stream ended');
    });

    // Wait a moment for stream to establish
    setTimeout(async () => {
      console.log('\n📤 Now sending updates...\n');

      // Send updates while streaming
      const updatePromises = [];
      for (let i = 0; i < config.requests; i++) {
        updatePromises.push(executeUpdate(client, i));

        if (config.interval > 0) {
          await new Promise((r) => setTimeout(r, config.interval));
        }
      }

      await Promise.all(updatePromises);

      // Wait for final updates to arrive
      setTimeout(() => {
        stream.cancel();
        console.log(`\n📊 Streaming test complete. Sent ${config.requests} updates, received ${receivedCount} streaming updates.`);

        if (receivedCount === 0) {
          console.error('⚠️ WARNING: No streaming updates received! Check if broadcastUpdate is working.');
        } else if (receivedCount < config.requests) {
          console.warn(`⚠️ WARNING: Received fewer updates (${receivedCount}) than sent (${config.requests})`);
        }

        resolve();
      }, 2000); // Wait 2 seconds for final updates
    }, 1000); // Wait 1 second for stream to establish
  });
}

// Test broadcasting with multiple clients
async function testBroadcast() {
  console.log('\n📡 Testing Broadcast to Multiple Clients...\n');

  const numClients = 3;
  const clients = [];
  const streams = [];
  const receivedCounts = new Map();

  // Create multiple clients and start streaming
  for (let i = 0; i < numClients; i++) {
    const client = createClient();
    clients.push(client);

    const clientId = `broadcast_client_${i}`;
    receivedCounts.set(clientId, 0);

    console.log(`🎧 Starting stream for ${clientId}...`);
    const stream = client.streamDashboard({ client_id: clientId });

    stream.on('data', (response) => {
      const count = receivedCounts.get(clientId) + 1;
      receivedCounts.set(clientId, count);
      console.log(`  📥 ${clientId} received update #${count} from ${response.updated_by}`);
    });

    stream.on('error', (error) => {
      console.error(`Stream error for ${clientId}:`, error);
    });

    streams.push(stream);
  }

  // Wait for streams to establish
  await new Promise((r) => setTimeout(r, 1500));

  console.log('\n📤 Sending updates from first client...\n');

  // Send updates from the first client
  for (let i = 0; i < 5; i++) {
    await executeUpdate(clients[0], i);
    await new Promise((r) => setTimeout(r, 500)); // 500ms between updates
  }

  // Wait for broadcasts
  await new Promise((r) => setTimeout(r, 2000));

  // Report results
  console.log('\n📊 Broadcast Test Results:');
  console.log('═══════════════════════════════════════');
  receivedCounts.forEach((count, clientId) => {
    console.log(`${clientId}: ${count} updates received`);
  });

  // Cleanup
  streams.forEach((stream) => stream.cancel());
  clients.forEach((client) => client.close());
}

// Main benchmark function
async function runBenchmark() {
  if (config.bandwidth) {
    await testBandwidth();
    return;
  }

  console.log('\nGRPC Dashboard Benchmark');
  console.log('=======================================');
  console.log(`Target: ${config.host}:${config.port}`);

  if (config.broadcast) {
    await testBroadcast();
    process.exit(0);
    return;
  }

  console.log(`Requests: ${config.requests}`);
  console.log(`Concurrent: ${config.concurrent}`);
  console.log(`Interval: ${config.interval}ms`);
  console.log(`Mode: ${config.streaming ? 'Streaming' : config.mixed ? 'Mixed R/W' : 'Write Only'}`);
  console.log('=======================================\n');

  const clients = [];
  for (let i = 0; i < config.concurrent; i++) {
    clients.push(createClient());
  }

  stats.startTime = Date.now();

  try {
    if (config.streaming) {
      await testStreaming(clients[0]);
    } else {
      const promises = [];
      for (let i = 0; i < config.requests; i++) {
        const client = clients[i % config.concurrent];
        if (config.mixed && i % 3 === 0) {
          promises.push(executeGet(client, i));
        } else {
          promises.push(executeUpdate(client, i));
        }
        if (config.interval > 0 && i < config.requests - 1) {
          await new Promise((resolve) => setTimeout(resolve, config.interval));
        }
        if (promises.length >= config.concurrent) {
          await Promise.race(promises).then(() => {
            promises.splice(0, 1);
          });
        }
      }
      await Promise.all(promises);
    }
    stats.endTime = Date.now();
    const duration = (stats.endTime - stats.startTime) / 1000;
    const avgLatency = stats.totalLatency / stats.successful;
    const requestsPerSecond = stats.successful / duration;
    stats.latencies.sort((a, b) => a - b);
    // Calculate percentiles
    function percentile(arr, p) {
      if (!arr.length) return 0;
      const sorted = arr.slice().sort((a, b) => a - b);
      const idx = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[Math.max(0, idx)];
    }
    console.log('\n=======================================');
    console.log('BENCHMARK RESULTS');
    console.log('=======================================\n');
    console.log(`Successful:      ${stats.successful}`);
    console.log(`Failed:          ${stats.failed}`);
    console.log(`Total Duration:  ${duration.toFixed(2)}s`);
    console.log(`Requests/sec:    ${requestsPerSecond.toFixed(2)}`);
    console.log('\nLatency Statistics (ms):');
    console.log(`   Min:             ${stats.minLatency}ms`);
    console.log(`   Avg:             ${avgLatency.toFixed(2)}ms`);
    console.log(`   Max:             ${stats.maxLatency}ms`);
    console.log(`   P50:             ` + percentile(stats.latencies, 50) + 'ms');
    console.log(`   P95:             ` + percentile(stats.latencies, 95) + 'ms');
    console.log(`   P99:             ` + percentile(stats.latencies, 99) + 'ms');
    console.log('\nBenchmark Complete!\n');
  } catch (error) {
    console.error('\nBenchmark failed:', error);
  } finally {
    clients.forEach((client) => client.close());
    process.exit(0);
  }
}

runBenchmark();
