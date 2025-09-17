# iOS gRPC Dashboard Demo

A modern iOS application built with SwiftUI demonstrating real-time bidirectional communication using native gRPC, Protocol Buffers, and collaborative dashboard synchronization.

## Features

- **Real-time Collaboration**: Changes sync instantly across all connected clients (Web, iOS, Android)
- **Native gRPC**: Direct gRPC communication without proxies (unlike web clients)
- **Type-Safe**: Full Swift support with types generated from `.proto` files
- **SwiftUI**: Modern declarative UI with reactive data binding
- **Bidirectional Streaming**: Both sends updates and receives real-time updates from server

## Prerequisites

- **Xcode 15+** with iOS 17+ target
- **Swift 5.9+** with strict concurrency support
- **gRPC Server** running (see [server setup](#server-setup))

## Quick Start

### 1. Server Setup

First, start the gRPC server:

```bash
# Terminal 1: Start the gRPC server
cd ../server
npm install
npm start
# Server runs on localhost:50051
```

### 2. Run iOS App

1. **Open in Xcode**:
   ```bash
   open "gRPC Demo.xcodeproj"
   ```

2. **Build and Run**:
   - Select your target device/simulator
   - Press `Cmd+R` or click the Run button
   - App targets iOS 17+ and uses modern Swift concurrency

3. **Connect and Test**:
   - Tap "Connect" to establish gRPC connection
   - Tap "Start Real-Time" to begin streaming updates
   - Modify any dashboard field and see changes sync across all clients!

## How gRPC Works in This iOS App

### Architecture Overview

```
SwiftUI Views → DashboardViewModel → DashboardService → gRPC Server
                     ↓                    ↓               ↓
               @Published State    Delegate Pattern   Native gRPC
```

### Service Definition

The app uses the `dashboard.DashboardService` defined in `proto/dashboard.proto`:

```protobuf
service DashboardService {
  rpc GetDashboard(GetDashboardRequest) returns (GetDashboardResponse);
  rpc UpdateDashboard(UpdateDashboardRequest) returns (UpdateDashboardResponse);
  rpc StreamDashboard(StreamDashboardRequest) returns (stream StreamDashboardResponse);
}
```

### Generated Swift Code

Protocol buffers are compiled into Swift:
- **Types**: `Dashboard_DashboardState`, `Dashboard_Priority`, etc.
- **Client**: `Dashboard_DashboardService.Client` with typed methods
- **Messages**: Strongly-typed request/response classes

### Bidirectional Communication

#### Outgoing Updates (iOS → Others)
1. User interacts with iOS UI (toggle switch, change temperature, etc.)
2. `DashboardViewModel` calls `DashboardService.updateField()`
3. Service sends `UpdateDashboard` RPC to server
4. Server broadcasts update to all connected `StreamDashboard` clients
5. Other clients (Web/Android) receive the update instantly

#### Incoming Updates (Others → iOS)
1. Other clients (Web/Android) make changes
2. Server broadcasts via `StreamDashboard` stream
3. iOS `DashboardService` receives update through stream
4. Service notifies `DashboardViewModel` via delegate
5. SwiftUI updates UI automatically via `@Published` properties

### Real-time Streaming

```swift
// iOS establishes persistent stream to receive updates
try await dashboardService.streamDashboard(request: clientRequest) { streamResponse in
    for try await response in streamResponse.messages {
        // Real-time update received from server
        let dashboardData = convertProtoToData(response.state)
        await notifyUpdate(dashboardData)
    }
}
```

## Project Structure

```
iOS/gRPC Demo/
├── gRPC Demo/
│   ├── Generated/                    # Auto-generated gRPC code
│   │   ├── dashboard.pb.swift       # Protocol Buffer types
│   │   └── dashboard.grpc.swift     # gRPC service client
│   ├── Models/
│   │   └── DashboardData.swift      # Swift data models
│   ├── Services/
│   │   └── DashboardService.swift   # gRPC communication layer
│   ├── ViewModels/
│   │   └── DashboardViewModel.swift # SwiftUI view model
│   ├── Views/
│   │   └── ContentView.swift        # SwiftUI interface
│   └── ContentView.swift            # Main app view
└── gRPC Demo.xcodeproj
```

## Key Components

### DashboardService
- **Purpose**: Handles all gRPC communication
- **Features**: Connection management, field updates, real-time streaming
- **Pattern**: Delegate-based notifications to ViewModel

### DashboardViewModel
- **Purpose**: SwiftUI-compatible reactive state management
- **Features**: `@Published` properties, async operations, optimistic updates
- **Pattern**: Observes service via delegate, publishes state changes

### Generated gRPC Code
- **Auto-generated** from `.proto` files during build
- **Type-safe** Swift interfaces for all gRPC operations
- **No manual maintenance** required

## Usage Examples

### Basic Operations

```swift
// Connect to server
await viewModel.connect()

// Start real-time updates
await viewModel.startRealTime()

// Update fields (syncs to all clients)
await viewModel.toggleEnabled()
await viewModel.updateTemperature(25.0)
await viewModel.updateTitle("New Dashboard Title")
```

### SwiftUI Integration

```swift
struct ContentView: View {
    @StateObject private var viewModel = DashboardViewModel()
    
    var body: some View {
        VStack {
            // Reactive UI - updates automatically
            Text(viewModel.dashboard.title)
            Toggle("Enabled", isOn: $viewModel.dashboard.isEnabled)
                .onChange(of: viewModel.dashboard.isEnabled) { _ in
                    Task { await viewModel.toggleEnabled() }
                }
        }
        .task {
            await viewModel.connect()
            await viewModel.startRealTime()
        }
    }
}
```

## Configuration

### Server Connection

Default configuration connects to localhost. Update in `DashboardService.swift`:

```swift
// For iOS Simulator (default)
let service = DashboardService(host: "127.0.0.1", port: 50051)

// For Physical Device - replace with your Mac's IP
let service = DashboardService(host: "192.168.1.100", port: 50051)

// For Remote Server
let service = DashboardService(host: "your-domain.com", port: 50051)
```

### Finding Your Mac's IP

```bash
# Find your local IP address
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## Development Workflow

### 1. Modify Proto Schema

Edit `proto/dashboard.proto` to add new fields or services:

```protobuf
message DashboardState {
  string title = 1;
  // Add new field
  string new_field = 13;
}
```

### 2. Regenerate Swift Code

```bash
# From project root
protoc --swift_out=iOS/gRPC\ Demo/gRPC\ Demo/Generated \
       --grpc-swift_out=iOS/gRPC\ Demo/gRPC\ Demo/Generated \
       proto/dashboard.proto
```

### 3. Update Swift Code

- Add new field to `DashboardData` struct
- Update `convertProtoToData()` and `setProtoField()` methods
- Add UI controls and ViewModel methods as needed

### 4. Test Across Platforms

1. Update server to handle new field
2. Update web and Android clients
3. Verify real-time sync works across all platforms

## Troubleshooting

### Connection Issues

**Problem**: "Failed to connect to server"
- **Solution**: Ensure gRPC server is running on port 50051
- **Check**: `lsof -i :50051` should show server process
- **Physical Device**: Update IP address to your Mac's local IP

**Problem**: "Connection refused" on physical device
- **Solution**: Ensure iOS device and Mac are on same Wi-Fi network
- **Firewall**: Check macOS firewall settings allow port 50051

### Real-time Updates Not Working

**Problem**: iOS updates others, but doesn't receive updates from others
- **Solution**: Ensure `startRealTime()` is called after connection
- **Check**: Look for "StreamDashboard connection established" in logs

**Problem**: Updates are delayed or missing
- **Solution**: Check server logs for streaming connection issues
- **Network**: Verify stable network connection

### Build Issues

**Problem**: Generated gRPC files not found
- **Solution**: Regenerate Swift files from proto using `protoc`
- **Clean**: Try Product → Clean Build Folder in Xcode

**Problem**: Swift concurrency warnings
- **Solution**: Update to Xcode 15+ and enable strict concurrency
- **Target**: Ensure iOS deployment target is 17+

### Debugging

Enable detailed logging by adding to `DashboardService.swift`:

```swift
// Add this to see all gRPC operations
print("🔄 gRPC Operation: \(operation) - \(details)")
```

Use Xcode's Console to monitor:
- Connection status
- Stream establishment
- Field updates
- Error messages

## Testing Real-time Collaboration

1. **Start all clients**:
   ```bash
   # Terminal 1: Server
   cd server && npm start
   
   # Terminal 2: Web
   cd web && npm run dev
   
   # Terminal 3: iOS (Xcode)
   # Open and run iOS project
   ```

2. **Test bidirectional sync**:
   - Change temperature in web → See update in iOS instantly
   - Toggle switch in iOS → See change in web immediately
   - Open Android app → All three stay synchronized

3. **Verify real-time performance**:
   - Updates should appear within ~100ms across all clients
   - No polling delays or refresh required
   - Works with multiple concurrent users

## Why Native gRPC?

Unlike web browsers that require gRPC-Web + Envoy proxy, iOS can use **native gRPC**:

- ✅ **Direct HTTP/2** connection to server
- ✅ **No proxy required** (unlike web clients)
- ✅ **Better performance** with binary Protocol Buffers
- ✅ **Full streaming support** (bidirectional, server, client)
- ✅ **Type safety** with generated Swift code

This makes the iOS implementation simpler and more efficient than web-based gRPC clients.

## Related Projects

- **Server**: `../server/` - Node.js gRPC server implementation
- **Web Client**: `../web/` - React TypeScript with gRPC-Web
- **Android Client**: `../android/` - Kotlin with native gRPC
- **Proto Definitions**: `../proto/` - Shared Protocol Buffer schemas

All clients synchronize in real-time through the same gRPC server, demonstrating true cross-platform collaboration.
