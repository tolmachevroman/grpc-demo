# gRPC Dashboard Server

Node.js gRPC server providing real-time dashboard synchronization for React, Android, and iOS clients.

## Setup

```bash
# Install dependencies
npm install

# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server runs on port **50051** (configurable via `PORT` environment variable).

## Project Structure

```
project-root/
├── proto/                  # Protocol Buffer definitions
│   └── dashboard.proto     # Dashboard service definition
├── server/
│   ├── index.js           # Server implementation
│   ├── package.json       # Dependencies
│   └── envoy.yaml         # Envoy proxy configuration
├── web/                   # React client (uses Envoy)
├── android/               # Android client (direct gRPC)
└── ios/                   # iOS client (direct gRPC)
```

## Service Methods

The server implements `dashboard.DashboardService` with:

- `GetDashboard` - Fetch current dashboard state
- `UpdateDashboard` - Update specific fields
- `StreamDashboard` - Server-side streaming for real-time updates
- `SyncDashboard` - Bidirectional streaming for collaborative sync

## Dashboard State

```javascript
{
  title: string,
  description: string,
  status_message: string,
  is_enabled: boolean,
  maintenance_mode: boolean,
  notifications_on: boolean,
  user_count: number,
  temperature: number,
  progress_percentage: number,
  priority: enum (LOW, MEDIUM, HIGH, CRITICAL),
  last_updated: timestamp,
  config: map<string, string>
}
```

## Testing with grpcurl

```bash
# Install grpcurl
brew install grpcurl

# List services
grpcurl -plaintext localhost:50051 list

# Get dashboard
grpcurl -plaintext localhost:50051 dashboard.DashboardService/GetDashboard

# Update fields
grpcurl -plaintext -d '{
  "updates": {
    "title": "New Title",
    "temperature": 25.5
  },
  "updated_fields": ["title", "temperature"]
}' localhost:50051 dashboard.DashboardService/UpdateDashboard
```

## Real-time Streaming

When any client updates a field:
1. Server updates its state
2. Broadcasts to all connected streaming clients
3. Returns updated state to requester

Active streams are tracked and cleaned up on disconnect.

## Envoy Proxy for Web Clients

### Why Envoy is Required

Browsers cannot make native gRPC calls due to browser limitations:
- No HTTP/2 frame control
- No access to HTTP trailers
- Limited streaming capabilities

Envoy acts as a translation layer between:
- **gRPC-Web** (browser) ↔️ **Envoy** ↔️ **gRPC** (server)

### Envoy Configuration

Create `server/envoy.yaml`:

```yaml
static_resources:
  listeners:
    - name: listener_0
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8080  # Envoy listens here
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                '@type': type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                codec_type: auto
                stat_prefix: ingress_http
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: local_service
                      domains: ['*']
                      routes:
                        - match:
                            prefix: '/'
                          route:
                            cluster: grpc_service
                            timeout: 0s
                      cors:
                        allow_origin_string_match:
                          - prefix: '*'
                        allow_methods: GET, PUT, DELETE, POST, OPTIONS
                        allow_headers: keep-alive,user-agent,cache-control,content-type,x-grpc-web,grpc-timeout
                        expose_headers: grpc-status,grpc-message
                http_filters:
                  - name: envoy.filters.http.grpc_web
                  - name: envoy.filters.http.cors
                  - name: envoy.filters.http.router

  clusters:
    - name: grpc_service
      connect_timeout: 0.25s
      type: logical_dns
      http2_protocol_options: {}
      lb_policy: round_robin
      load_assignment:
        cluster_name: grpc_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: localhost
                      port_value: 50051  # Your gRPC server
```

### Running Envoy

```bash
# Install Envoy (Mac)
brew install envoy

# Install Envoy (Docker)
docker pull envoyproxy/envoy:v1.27-latest

# Run with config file
envoy -c server/envoy.yaml

# Or with Docker
docker run -d \
  -v $(pwd)/server/envoy.yaml:/etc/envoy/envoy.yaml \
  -p 8080:8080 \
  envoyproxy/envoy:v1.27-latest
```

### Architecture Flow

```
Browser (React)          Envoy Proxy           gRPC Server
     :3000                  :8080                 :50051
       |                      |                      |
       |--gRPC-Web request--->|                      |
       |                      |--gRPC request------->|
       |                      |<----gRPC response----|
       |<--gRPC-Web response--|                      |
```

### Key Envoy Features Used

- **grpc_web filter**: Translates gRPC-Web to gRPC
- **cors filter**: Handles browser CORS requirements
- **http2_protocol_options**: Enables HTTP/2 for gRPC
- **streaming support**: Maintains bidirectional streams

### Mobile Clients

Mobile apps (Android/iOS) bypass Envoy entirely:
- Connect directly to `localhost:50051`
- Use native gRPC libraries
- Full streaming support
- Better performance

### Connection Comparison

| Client | Protocol | Port | Proxy | Streaming |
|--------|----------|------|-------|-----------|
| Web (React) | gRPC-Web | 8080 | Envoy Required | Server-side only |
| Android | gRPC | 50051 | Direct | Bidirectional |
| iOS | gRPC | 50051 | Direct | Bidirectional |
| Server-to-Server | gRPC | 50051 | Direct | Bidirectional |

## Environment Variables

```bash
PORT=50052 npm start  # Custom port
```

## Production Considerations

Current setup uses insecure credentials. For production:
- Add TLS/SSL certificates
- Implement authentication
- Add persistence layer
- Set up health checks
- Add input validation

## Troubleshooting

### Envoy Issues

**"Connection refused" from browser**
- Check Envoy is running: `ps aux | grep envoy`
- Verify port 8080 is open: `lsof -i :8080`
- Check Envoy logs for errors

**CORS errors in browser console**
- Ensure `cors` filter is in envoy.yaml
- Check `allow_origin_string_match` includes your domain
- Verify headers include `x-grpc-web`

**"Received RST_STREAM with code 2"**
- Usually means gRPC server (50051) is not running
- Start server first, then Envoy
- Check server logs for crashes

**Streaming not working**
- Verify `timeout: 0s` in route config (enables long streams)
- Check `max_stream_duration` is not set or is 0
- Ensure browser supports EventSource API

## Dependencies

- `@grpc/grpc-js` - Pure JavaScript gRPC implementation
- `@grpc/proto-loader` - Dynamic proto loading
- `nodemon` (dev) - Auto-reload on changes
