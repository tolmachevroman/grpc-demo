# gRPC Dashboard Web Client

A modern React application demonstrating real-time bidirectional communication using gRPC-Web, TypeScript, and Protocol Buffers.

## Features

- **Real-time Updates**: Changes sync instantly across all connected clients
- **Type-Safe**: Full TypeScript support with types generated from `.proto` files
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Bidirectional Streaming**: Supports both unary calls and server streaming
- **Zero Type Duplication**: Uses generated types directly - no manual type definitions

## Prerequisites

- Node.js 18+ and npm
- Protocol Buffer compiler (`protoc`)
- Envoy proxy (for gRPC-Web translation)

### Install protoc

```bash
# macOS
brew install protobuf

# Ubuntu/Debian
sudo apt-get install -y protobuf-compiler

# Verify installation
protoc --version
```

### Install Envoy

```bash
# macOS
brew install envoy

# Ubuntu/Debian
sudo apt-get install envoy

# Docker alternative
docker pull envoyproxy/envoy:v1.28-latest
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate TypeScript from Proto Files

```bash
# Generate TypeScript types and client from .proto files
npm run generate-schema

# This creates:
# - src/generated/dashboard.ts (types)
# - src/generated/dashboard.client.ts (gRPC client)
```

### 3. Start the Backend Services

You need three services running:

#### Terminal 1: gRPC Server
```bash
cd ../server
npm install
npm start
# Runs on port 50051
```

#### Terminal 2: Envoy Proxy
```bash
cd ../server
envoy -c envoy.yaml
# Or use the simple config if having issues:
# envoy -c envoy-simple.yaml
# Runs on port 8080
```

#### Terminal 3: Web App
```bash
npm run dev
# Runs on http://localhost:3000
```

## How gRPC Works in This App

### Proto Definition

The service is defined in `proto/dashboard.proto`:
```protobuf
service DashboardService {
  rpc GetDashboard(GetDashboardRequest) returns (GetDashboardResponse);
  rpc UpdateDashboard(UpdateDashboardRequest) returns (UpdateDashboardResponse);
  rpc StreamDashboard(StreamDashboardRequest) returns (stream StreamDashboardResponse);
}
```

### Code Generation

The proto file is compiled into TypeScript:
- **Types**: `DashboardState`, `Priority`, etc.
- **Client**: `DashboardServiceClient` with typed methods
- **Requests/Responses**: Typed message classes

### Client Setup

```typescript
// Create transport layer
const transport = new GrpcWebFetchTransport({
  baseUrl: 'http://localhost:8080',  // Envoy proxy
  format: 'binary',
});

// Create typed client
const client = new DashboardServiceClient(transport);

// Make typed RPC calls
const response = await client.getDashboard(request);
```

### Real-time Streaming

```typescript
// Open a server stream for real-time updates
const stream = client.streamDashboard(request);

// Listen for updates
for await (const response of stream.responses) {
  // Handle real-time updates
  setDashboard(response.state);
}
```

### Type Safety

All types are generated from the proto file:
```typescript
// TypeScript knows all these fields from the proto
dashboard.title         // string
dashboard.isEnabled     // boolean
dashboard.temperature   // number
dashboard.priority      // Priority enum
```

## Why Envoy?

Browsers can't speak native gRPC (which requires HTTP/2 with trailers). Envoy acts as a proxy that:
1. Accepts gRPC-Web requests from the browser (HTTP/1.1)
2. Translates them to native gRPC (HTTP/2)
3. Forwards to the gRPC server
4. Translates responses back to gRPC-Web

## Key Concepts

### Protocol Buffers
- Language-agnostic schema definition
- Efficient binary serialization (smaller than JSON)
- Strong typing with code generation
- Backward compatibility built-in

### gRPC-Web
- Browser-compatible version of gRPC
- Supports unary and server streaming (not client streaming)
- Requires proxy (Envoy) for browser-server communication

### Type Generation Flow
```
dashboard.proto → protoc → TypeScript types → Type-safe React app
```

## Configuration

### Envoy Proxy
- Listens on port 8080
- Forwards to gRPC server on port 50051
- Handles CORS and gRPC-Web translation

### Vite Dev Server
- Proxies `/dashboard.DashboardService` to Envoy
- Handles hot module replacement

### TypeScript
- Strict mode enabled
- Path aliases configured (`@/` → `./src/`)

## Troubleshooting

### "premature EOF" Error
- Check Envoy is running: `lsof -i :8080`
- Check Envoy logs for errors

### Updates Not Working
- Verify server is using camelCase field names
- Check browser console for request/response logs
- Clear browser cache

### Connection Failed
1. Check all services are running (server, Envoy, web)
2. Verify ports are correct (50051, 8080, 3000)
3. Check firewall isn't blocking local connections

### Type Errors
- Regenerate proto files: `npm run generate-schema`
- Ensure you're importing from `./generated/` not manually defined types

## Development Workflow

1. **Modify Proto File**: Edit `proto/dashboard.proto`
2. **Regenerate Types**: Run `npm run generate-schema`
3. **TypeScript Updates**: IDE shows type errors if breaking changes
4. **Hot Reload**: Changes appear instantly in browser

## Learn More

- [gRPC-Web Documentation](https://github.com/grpc/grpc-web)
- [Protocol Buffers Guide](https://protobuf.dev/programming-guides/proto3/)
- [Envoy Proxy Documentation](https://www.envoyproxy.io/docs/envoy/latest/)
- [@protobuf-ts Documentation](https://github.com/timostamm/protobuf-ts)
- [shadcn/ui Components](https://ui.shadcn.com/)

## Features Demonstrated

- Unary RPC: GetDashboard, UpdateDashboard
- Server Streaming: Real-time dashboard updates
- Type Safety: Full TypeScript with generated types
- Real-time Sync: Multiple clients stay synchronized
- Modern UI: Responsive design with dark theme
- Error Handling: Graceful fallbacks when offline

## License

MIT
