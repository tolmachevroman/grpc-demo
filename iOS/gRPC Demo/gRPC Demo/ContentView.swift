import SwiftUI
import GRPCCore
import GRPCNIOTransportHTTP2
import SwiftProtobuf
import Combine

@MainActor
final class DashboardViewModel: ObservableObject {
    @Published var dashboard = Dashboard_DashboardState()
    @Published var isConnected = false
    @Published var statusMessage = "Not connected"
    
    private var transport: HTTP2ClientTransport.Posix?  // ← Fixed type
    
    func connect() async {
        do {
            // Fixed API call
            let transport = try HTTP2ClientTransport.Posix(
                target: .ipv4(address: "127.0.0.1", port: 50051),  // ← Fixed parameter name
                transportSecurity: .plaintext
            )
            
            self.transport = transport
            self.isConnected = true
            self.statusMessage = "✅ Connected"
            
            // Test basic connection
            await loadDashboard()
            
        } catch {
            self.isConnected = false
            self.statusMessage = "❌ Connection failed: \(error)"
        }
    }
    
    func loadDashboard() async {
        guard let _ = self.transport else { return }  // ← Removed unused variable
        
        // Create request using generated types
        _ = Dashboard_GetDashboardRequest()
        
        // For now, let's just test the connection
        // We'll implement the actual gRPC call once we get the basic connection working
        self.statusMessage = "✅ Transport connected - implementing gRPC calls next"
        
        // Simulate some dashboard data to show the UI works
        var testDashboard = Dashboard_DashboardState()
        testDashboard.title = "Test Dashboard"
        testDashboard.description_p = "Connected to gRPC server"
        testDashboard.statusMessage = "All systems operational"
        testDashboard.userCount = 42
        testDashboard.temperature = 23.5
        
        self.dashboard = testDashboard
    }
}

struct ContentView: View {
    @StateObject private var viewModel = DashboardViewModel()
    
    var body: some View {
        VStack(spacing: 20) {
            Text("gRPC Dashboard")
                .font(.largeTitle)
                .bold()
            
            Text(viewModel.statusMessage)
                .foregroundColor(viewModel.isConnected ? .green : .red)
            
            if viewModel.isConnected {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Dashboard Data:")
                        .font(.headline)
                    
                    Text("Title: \(viewModel.dashboard.title)")
                    Text("Description: \(viewModel.dashboard.description_p)")
                    Text("Status: \(viewModel.dashboard.statusMessage)")
                    Text("Users: \(viewModel.dashboard.userCount)")
                    Text("Temperature: \(String(format: "%.1f", viewModel.dashboard.temperature))°C")
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(8)
            }
            
            Button(viewModel.isConnected ? "Refresh" : "Connect") {
                Task {
                    if viewModel.isConnected {
                        await viewModel.loadDashboard()
                    } else {
                        await viewModel.connect()
                    }
                }
            }
            .buttonStyle(.borderedProminent)
            
            Spacer()
        }
        .padding()
        .onAppear {
            Task { await viewModel.connect() }
        }
    }
}

#Preview {
    ContentView()
}
