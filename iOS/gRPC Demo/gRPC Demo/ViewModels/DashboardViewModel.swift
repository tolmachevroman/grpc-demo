//
//  DashboardViewModel.swift
//  gRPC Demo
//
//  Created by Roman Tolmachev on 20-09-25.
//

import SwiftUI
import Foundation
@preconcurrency import Combine

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var dashboard = DashboardData()
    @Published var isConnected = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var isStreaming = false
    
    private let dashboardService: DashboardService
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        print("🚀 DashboardViewModel: Initializing with default data")
        
        // Initialize the service
        self.dashboardService = DashboardService()
        
        // Set up delegate
        self.dashboardService.delegate = self
        
        // Initialize with default data
        dashboard = DashboardData(
            title: "System Dashboard",
            description: "Main control panel for the system",
            statusMessage: "All systems operational",
            isEnabled: true,
            maintenanceMode: false,
            notificationsOn: true,
            userCount: 42,
            temperature: 23.5,
            progressPercentage: 75,
            priority: .medium,
            lastUpdated: Date(),
            config: [
                "theme": "dark",
                "language": "en",
                "refresh_rate": "5000"
            ]
        )
        logDashboardState("Initial dashboard state")
    }

    
    // MARK: - Public Methods
    func connect() async {
        print("🔌 DashboardViewModel: Connecting to server")
        isLoading = true
        
        let connected = await dashboardService.testConnection()
        isConnected = connected
        isLoading = false
        
        if connected {
            print("✅ DashboardViewModel: Connected successfully")
        } else {
            print("❌ DashboardViewModel: Connection failed")
        }
    }
    
    func fetchDashboard() async {
        print("📊 DashboardViewModel: Fetching dashboard data")
        
        guard isConnected else {
            print("⚠️ DashboardViewModel: Not connected to server")
            return
        }
        
        isLoading = true
        
        if let fetchedDashboard = await dashboardService.fetchDashboard() {
            dashboard = fetchedDashboard
            logDashboardState("Fetched from server")
        }
        
        isLoading = false
    }
    
    func updateField(_ fieldName: String, value: Any) async {
        print("🔄 DashboardViewModel: Updating field '\(fieldName)' with value: \(value)")
        
        // Update local state immediately for responsiveness
        updateLocalField(fieldName, value: value)
        
        // Send to server if connected
        if isConnected {
            let success = await dashboardService.updateField(fieldName, value: value)
            if success {
                print("✅ DashboardViewModel: Field updated successfully on server")
            } else {
                print("❌ DashboardViewModel: Failed to update field on server")
            }
        } else {
            print("⚠️ DashboardViewModel: Not connected - local update only")
        }
    }
    
    func startStreaming() {
        print("🔄 DashboardViewModel: Starting streaming")
        
        guard isConnected else {
            print("⚠️ DashboardViewModel: Cannot start streaming - not connected")
            return
        }
        
        guard !isStreaming else {
            print("⚠️ DashboardViewModel: Already streaming")
            return
        }
        
        isStreaming = true
        
        // Start streaming in a Task
        Task {
            await dashboardService.startStreaming()
            await MainActor.run {
                self.isStreaming = false
            }
        }
    }
    
    func stopStreaming() {
        print("⏹️ DashboardViewModel: Stopping streaming")
        dashboardService.stopStreaming()
        isStreaming = false
    }
    
    func cleanup() {
        print("🧹 DashboardViewModel: Cleaning up resources")
        stopStreaming()
        cancellables.removeAll()
    }
    
    // MARK: - Private Methods
    private func updateLocalField(_ fieldName: String, value: Any) {
        print("🏠 DashboardViewModel: updateLocalField - field: '\(fieldName)', value: \(value)")
        
        switch fieldName {
        case "title":
            if let stringValue = value as? String {
                dashboard.title = stringValue
            }
        case "description":
            if let stringValue = value as? String {
                dashboard.description = stringValue
            }
        case "statusMessage":
            if let stringValue = value as? String {
                dashboard.statusMessage = stringValue
            }
        case "isEnabled":
            if let boolValue = value as? Bool {
                dashboard.isEnabled = boolValue
            }
        case "maintenanceMode":
            if let boolValue = value as? Bool {
                dashboard.maintenanceMode = boolValue
            }
        case "notificationsOn":
            if let boolValue = value as? Bool {
                dashboard.notificationsOn = boolValue
            }
        case "userCount":
            if let intValue = value as? Int32 {
                dashboard.userCount = intValue
            }
        case "temperature":
            if let doubleValue = value as? Double {
                dashboard.temperature = doubleValue
            }
        case "progressPercentage":
            if let intValue = value as? Int32 {
                dashboard.progressPercentage = intValue
            }
        case "priority":
            if let priorityValue = value as? Dashboard_Priority {
                dashboard.priority = priorityValue
            }
        case "config":
            if let configValue = value as? [String: String] {
                dashboard.config = configValue
            }
        default:
            print("❌ DashboardViewModel: Unknown local field: \(fieldName)")
        }
        
        dashboard.lastUpdated = Date()
    }
    
    private func logDashboardState(_ context: String) {
        print("📊 DashboardViewModel: Dashboard State (\(context)):")
        print("   - title: '\(dashboard.title)'")
        print("   - description: '\(dashboard.description)'")
        print("   - statusMessage: '\(dashboard.statusMessage)'")
        print("   - isEnabled: \(dashboard.isEnabled)")
        print("   - maintenanceMode: \(dashboard.maintenanceMode)")
        print("   - notificationsOn: \(dashboard.notificationsOn)")
        print("   - userCount: \(dashboard.userCount)")
        print("   - temperature: \(dashboard.temperature)")
        print("   - progressPercentage: \(dashboard.progressPercentage)")
        print("   - priority: \(dashboard.priority)")
        print("   - lastUpdated: \(dashboard.lastUpdated)")
        print("   - config: \(dashboard.config)")
    }
}

// MARK: - DashboardServiceDelegate
extension DashboardViewModel: DashboardServiceDelegate {
    func dashboardService(_ service: DashboardService, didReceiveUpdate dashboard: DashboardData) {
        print("📥 DashboardViewModel: Received dashboard update from service")
        self.dashboard = dashboard
        self.logDashboardState("Updated from gRPC stream")
    }
    
    func dashboardService(_ service: DashboardService, didEncounterError error: Error) {
        print("❌ DashboardViewModel: Service encountered error: \(error)")
        self.errorMessage = error.localizedDescription
    }
    
    func dashboardService(_ service: DashboardService, didChangeConnectionStatus isConnected: Bool) {
        print("🔗 DashboardViewModel: Connection status changed to: \(isConnected)")
        self.isConnected = isConnected
        if !isConnected {
            self.isStreaming = false
        }
    }
}
