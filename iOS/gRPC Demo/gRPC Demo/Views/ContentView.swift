import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = DashboardViewModel()
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header Section
                    HeaderSection(viewModel: viewModel)
                    
                    // Status Toggles
                    StatusTogglesSection(viewModel: viewModel)
                    
                    // Text Controls
                    TextControlsSection(viewModel: viewModel)
                    
                    // Numeric Controls
                    NumericControlsSection(viewModel: viewModel)
                    
                    // Priority Section
                    PrioritySection(viewModel: viewModel)
                    
                    // Configuration Section
                    ConfigSection(viewModel: viewModel)
                }
                .padding()
            }
            .navigationTitle("gRPC Dashboard")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                await viewModel.fetchDashboard()
            }
        }
        .onAppear {
            Task {
                await viewModel.connect()
                await viewModel.fetchDashboard()
                viewModel.startStreaming()
            }
        }
        .onDisappear {
            viewModel.stopStreaming()
        }
    }
}

#Preview {
    ContentView()
}
