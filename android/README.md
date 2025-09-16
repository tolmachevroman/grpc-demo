# Android gRPC Dashboard Client

A modern Android application demonstrating gRPC communication with a Node.js server, built with Jetpack Compose and Koin dependency injection.

## Architecture

This Android app is part of a multi-platform gRPC demo system:

```
┌─────────────────┐    gRPC (50051)     ┌──────────────────┐
│   Android App   │ ──────────────────► │   gRPC Server    │
│ (Jetpack        │                     │   (Node.js)      │
│  Compose)       │                     └──────────────────┘
└─────────────────┘                            │
                                               │
┌─────────────────┐    gRPC-Web (8080)         │
│    Web App      │ ──────────────────► ┌──────▼──────┐
│   (React)       │                     │    Envoy    │
└─────────────────┘                     │    Proxy    │
                                        └─────────────┘
```

## Features

- **Real-time Dashboard**: Live dashboard with system metrics
- **gRPC Communication**: Direct native gRPC calls (no gRPC-Web needed)
- **Modern UI**: Built with Jetpack Compose and Material Design 3
- **Dependency Injection**: Uses Koin for clean architecture
- **Error Handling**: Comprehensive error handling and retry functionality
- **Streaming Support**: Real-time updates via gRPC streaming

## Tech Stack

- **UI**: Jetpack Compose with Material Design 3
- **Architecture**: MVVM with Repository pattern
- **DI**: Koin dependency injection
- **gRPC**: Native gRPC with Kotlin coroutines
- **Build**: Gradle with Kotlin DSL and Version Catalogs
- **Protocol Buffers**: Auto-generated from `.proto` files

## Screenshots

*Add screenshots of your app here*

## Setup

### Prerequisites

- Android Studio Hedgehog (2023.1.1) or later
- Android SDK API 24+ (Android 7.0+)
- Java 11 or later
- Running gRPC server (see [server setup](../server/README.md))

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd grpc-demo/android
   ```

2. **Open in Android Studio**:
    - Open Android Studio
    - Choose "Open an existing project"
    - Navigate to the `android` folder

3. **Sync and Build**:
   ```bash
   ./gradlew clean build
   ```

4. **Install on device/emulator**:
   ```bash
   ./gradlew installDebug
   ```

## Server Configuration

The app connects to a gRPC server running on:

- **Emulator**: `10.0.2.2:50051` (maps to `localhost:50051` on host machine)
- **Physical Device**: Update IP in `AppModule.kt` to your machine's IP address

### Configuring Server Address

Edit `app/src/main/java/com/demo/android/grpc/di/AppModule.kt`:

```kotlin
// For Android Emulator
val host = "10.0.2.2"

// For Physical Device - replace with your machine's IP
// val host = "192.168.1.100"

// For Remote Server
// val host = "your-server-domain.com"

val port = 50051
```

## Project Structure

```
app/src/main/
├── java/com/demo/android/grpc/
│   ├── di/
│   │   └── AppModule.kt              # Koin dependency injection
│   ├── data/remote/
│   │   └── DashboardRepository.kt    # gRPC data layer
│   ├── ui/screens/
│   │   ├── MainActivity.kt           # Main UI with Compose
│   │   └── DashboardViewModel.kt     # ViewModel with state management
│   ├── ui/theme/
│   │   └── ...                       # Material Design 3 theme
│   └── DashboardApplication.kt       # Application class with Koin setup
├── proto/
│   └── dashboard.proto               # Protocol Buffer definitions
└── res/
    └── ...                           # Android resources
```

## gRPC Services

The app implements the following gRPC services:

### Unary Calls

- **GetDashboard**: Fetch current dashboard state
- **UpdateDashboard**: Update dashboard fields

### Streaming Calls

- **StreamDashboard**: Real-time dashboard updates
- **SyncDashboard**: Bidirectional sync (future implementation)

## Development

### Building

```bash
# Clean build
./gradlew clean build

# Install debug version
./gradlew installDebug

# Generate protobuf files only
./gradlew generateDebugProto
```

### Key Features

1. **Automatic Proto Generation**:
    - Protobuf files are generated automatically after `clean`
    - See `tasks.named("clean")` in `build.gradle.kts`

2. **Error Handling**:
    - Network errors are handled gracefully
    - Retry functionality for failed requests
    - Loading states and user feedback

3. **Logging**:
    - Comprehensive logging throughout the app
    - Use `adb logcat | grep -E "(Koin|DashboardRepository)"` to see gRPC calls

### Testing Connection

1. **Start the server**:
   ```bash
   cd ../server
   npm start
   ```

2. **Launch the app** and tap "Load Dashboard"

3. **Check logs**:
   ```bash
   adb logcat | grep -E "(Koin|DashboardRepository|MainActivity)"
   ```

## Troubleshooting

### Common Issues

1. **"No definition found for type 'io.grpc.Channel'"**
   - Fixed: Koin properly binds `Channel` interface to `ManagedChannel`

2. **"UNIMPLEMENTED: The server does not implement the method"**
   - Fixed: Proto package declarations match between client and server

3. **Connection refused**
    - Ensure server is running on correct host/port
    - For emulator, use `10.0.2.2` to reach host machine's `localhost`
    - For physical device, use your machine's actual IP address

4. **Build errors with Hilt**
   - Fixed: Replaced Hilt with Koin for better Kotlin compatibility

### Debugging Steps

1. **Check server is running**:
   ```bash
   curl -v http://localhost:50051
   # Should see "Bad Request" (expected for gRPC endpoint)
   ```

2. **Verify proto files match**:
    - Compare `app/src/main/proto/dashboard.proto` with `../proto/dashboard.proto`
    - Ensure both have `package dashboard;`

3. **Check generated files**:
   ```bash
   ./gradlew generateDebugProto
   ls app/build/generated/sources/proto/debug/
   ```

## Future Enhancements

- [ ] Real-time streaming implementation
- [ ] Offline support with local caching
- [ ] Push notifications for critical alerts
- [ ] Dark/Light theme toggle
- [ ] Settings screen for server configuration
- [ ] Unit and integration tests
- [ ] CI/CD pipeline

## Dependencies

### Core Android

- Jetpack Compose BOM 2025.09.00
- Kotlin 2.2.20
- Android Gradle Plugin 8.12.3

### gRPC & Networking

- gRPC Stub 1.58.0
- gRPC Kotlin Stub 1.4.0
- gRPC OkHttp 1.58.0
- Protocol Buffers 3.24.4

### Dependency Injection

- Koin 4.1.0
- Koin Compose 4.1.0

See [`gradle/libs.versions.toml`](gradle/libs.versions.toml) for complete dependency list.

## License

[Add your license here]

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

- Create an issue for bugs or feature requests
- Check server logs if gRPC calls fail
- Ensure server and client proto files match

---

**Part of the gRPC Multi-Platform Demo**

- 📱 [Android Client](.) (this project)
- 🌐 [Web Client](../web/)
- 🖥️ [Node.js Server](../server/)
- 📋 [iOS Client](../ios/) (future)