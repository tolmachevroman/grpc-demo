//
//  DashboardService.swift
//  gRPC Demo
//
//  Created by Roman Tolmachev on 20-09-25.
//

import Foundation
import SwiftUI
import SwiftProtobuf
@preconcurrency import Combine
import GRPCCore
import GRPCNIOTransportHTTP2

// MARK: - Protocol for ViewModel communication
@MainActor
protocol DashboardServiceDelegate: AnyObject {
    func dashboardService(_ service: DashboardService, didReceiveUpdate dashboard: DashboardData)
    func dashboardService(_ service: DashboardService, didEncounterError error: Error)
    func dashboardService(_ service: DashboardService, didChangeConnectionStatus isConnected: Bool)
}

// MARK: - DashboardService - Full Duplex (Updates + Streaming)
final class DashboardService: @unchecked Sendable {
    
    // MARK: - Properties
    weak var delegate: DashboardServiceDelegate?
    
    private let serverHost: String
    private let serverPort: Int
    private var isStreaming = false
    private var streamingTask: Task<Void, Never>?
    
    // MARK: - Initialization
    init(host: String = "127.0.0.1", port: Int = 50051) {
        self.serverHost = host
        self.serverPort = port
        print("🔧 DashboardService: Initialized with server \(host):\(port)")
    }
    
    deinit {
        print("🧹 DashboardService: deinit - stopping streaming")
        streamingTask?.cancel()
    }
    
    // MARK: - Connection Management
    func testConnection() async -> Bool {
        print("🔌 DashboardService: Testing connection to \(serverHost):\(serverPort)")
        
        do {
            try await withGRPCClient(
                transport: .http2NIOPosix(
                    target: .dns(host: serverHost, port: serverPort),
                    transportSecurity: .plaintext
                )
            ) { client in
                let dashboardService = Dashboard_DashboardService.Client(wrapping: client)
                let testRequest = Dashboard_GetDashboardRequest()
                let _ = try await dashboardService.getDashboard(testRequest)
                print("✅ DashboardService: Connection test successful")
            }
            
            await notifyConnectionStatus(true)
            return true
            
        } catch {
            print("❌ DashboardService: Connection test failed: \(error)")
            await notifyConnectionStatus(false)
            await notifyError(error)
            return false
        }
    }
    
    // MARK: - Dashboard Operations
    func fetchDashboard() async -> DashboardData? {
        print("📊 DashboardService: Fetching dashboard data")
        
        do {
            return try await withGRPCClient(
                transport: .http2NIOPosix(
                    target: .dns(host: serverHost, port: serverPort),
                    transportSecurity: .plaintext
                )
            ) { client in
                let dashboardService = Dashboard_DashboardService.Client(wrapping: client)
                let request = Dashboard_GetDashboardRequest()
                let response = try await dashboardService.getDashboard(request)
                
                if response.hasState {
                    let dashboardData = convertProtoToData(response.state)
                    print("✅ DashboardService: Dashboard data fetched successfully")
                    return dashboardData
                } else {
                    print("⚠️ DashboardService: Response has no state")
                    return nil
                }
            }
        } catch {
            print("❌ DashboardService: Failed to fetch dashboard: \(error)")
            await notifyError(error)
            return nil
        }
    }
    
    func updateField(_ fieldName: String, value: Any) async -> Bool {
        print("🔄 DashboardService: Updating field '\(fieldName)' with value: \(value)")
        
        do {
            return try await withGRPCClient(
                transport: .http2NIOPosix(
                    target: .dns(host: serverHost, port: serverPort),
                    transportSecurity: .plaintext
                )
            ) { client in
                let dashboardService = Dashboard_DashboardService.Client(wrapping: client)
                
                var request = Dashboard_UpdateDashboardRequest()
                var updates = Dashboard_DashboardState()
                
                // Set the specific field being updated
                let success = setProtoField(&updates, fieldName: fieldName, value: value)
                guard success else {
                    print("❌ DashboardService: Unknown field: \(fieldName)")
                    return false
                }
                
                // Set timestamp
                let timestampMs = Int64(Date().timeIntervalSince1970 * 1000)
                updates.lastUpdated = String(timestampMs)
                request.updates = updates
                request.updatedFields = [fieldName]
                
                let response = try await dashboardService.updateDashboard(request)
                
                if response.success {
                    print("✅ DashboardService: Field '\(fieldName)' updated successfully")
                    // Note: We don't update here because the stream will send us the latest state
                    return true
                } else {
                    print("❌ DashboardService: Server reported update failure")
                    return false
                }
            }
        } catch {
            print("❌ DashboardService: Failed to update field '\(fieldName)': \(error)")
            await notifyError(error)
            return false
        }
    }
    
    // MARK: - Real-Time Streaming (StreamDashboard)
    func startStreaming() async {
        print("🔄 DashboardService: Starting StreamDashboard gRPC streaming")
        
        guard !isStreaming else {
            print("⚠️ DashboardService: Already streaming")
            return
        }
        
        isStreaming = true
        
        // Start the streaming task
        streamingTask = Task { [weak self] in
            await self?.handleDashboardStream()
        }
        
        print("✅ DashboardService: StreamDashboard started")
    }
    
    func stopStreaming() {
        print("⏹️ DashboardService: Stopping StreamDashboard")
        isStreaming = false
        streamingTask?.cancel()
        streamingTask = nil
        print("✅ DashboardService: StreamDashboard stopped")
    }
    
    // MARK: - Private Streaming Logic
    private func handleDashboardStream() async {
        print("📡 DashboardService: Setting up StreamDashboard connection")
        
        do {
            try await withGRPCClient(
                transport: .http2NIOPosix(
                    target: .dns(host: serverHost, port: serverPort),
                    transportSecurity: .plaintext
                )
            ) { client in
                let dashboardService = Dashboard_DashboardService.Client(wrapping: client)
                
                // Create streaming request
                var streamRequest = Dashboard_StreamDashboardRequest()
                streamRequest.clientID = "ios_\(UUID().uuidString)"
                
                print("📤 DashboardService: Starting stream with clientID: \(streamRequest.clientID)")
                
                let clientRequest = ClientRequest(message: streamRequest)
                
                try await dashboardService.streamDashboard(
                    request: clientRequest,
                    options: .defaults
                ) { streamResponse in
                    print("📥 DashboardService: StreamDashboard connection established")
                    
                    do {
                        for try await response in streamResponse.messages {
                            print("🔄 DashboardService: Received streamed update from '\(response.updatedBy)'")
                            print("🔄 DashboardService: Updated fields: \(response.updatedFields)")
                            
                            let dashboardData = self.convertProtoToData(response.state)
                            await self.notifyUpdate(dashboardData)
                        }
                    } catch {
                        print("❌ DashboardService: Stream error: \(error)")
                        await self.notifyError(error)
                    }
                    
                    return ()
                }
            }
        } catch {
            print("❌ DashboardService: Failed to establish StreamDashboard: \(error)")
            await notifyError(error)
        }
        
        print("📡 DashboardService: StreamDashboard connection ended")
    }
    
    // MARK: - Helper Methods
    private func setProtoField(_ updates: inout Dashboard_DashboardState, fieldName: String, value: Any) -> Bool {
        switch fieldName {
        case "title":
            if let stringValue = value as? String {
                updates.title = stringValue
                return true
            }
        case "description":
            if let stringValue = value as? String {
                updates.description_p = stringValue
                return true
            }
        case "statusMessage":
            if let stringValue = value as? String {
                updates.statusMessage = stringValue
                return true
            }
        case "isEnabled":
            if let boolValue = value as? Bool {
                updates.isEnabled = boolValue
                return true
            }
        case "maintenanceMode":
            if let boolValue = value as? Bool {
                updates.maintenanceMode = boolValue
                return true
            }
        case "notificationsOn":
            if let boolValue = value as? Bool {
                updates.notificationsOn = boolValue
                return true
            }
        case "userCount":
            if let intValue = value as? Int32 {
                updates.userCount = intValue
                return true
            }
        case "temperature":
            if let doubleValue = value as? Double {
                updates.temperature = doubleValue
                return true
            }
        case "progressPercentage":
            if let intValue = value as? Int32 {
                updates.progressPercentage = intValue
                return true
            }
        case "priority":
            if let priorityValue = value as? Dashboard_Priority {
                updates.priority = priorityValue
                return true
            }
        case "config":
            if let configValue = value as? [String: String] {
                updates.config = configValue
                return true
            }
        default:
            return false
        }
        return false
    }
    
    private func convertProtoToData(_ protoState: Dashboard_DashboardState) -> DashboardData {
        let safeTimestamp = protoState.lastUpdated.isEmpty ? "0" : protoState.lastUpdated
        
        return DashboardData(
            title: protoState.title,
            description: protoState.description_p,
            statusMessage: protoState.statusMessage,
            isEnabled: protoState.isEnabled,
            maintenanceMode: protoState.maintenanceMode,
            notificationsOn: protoState.notificationsOn,
            userCount: protoState.userCount,
            temperature: protoState.temperature,
            progressPercentage: protoState.progressPercentage,
            priority: protoState.priority,
            lastUpdated: Date(timeIntervalSince1970: (Double(safeTimestamp) ?? 0) / 1000),
            config: protoState.config
        )
    }
    
    // MARK: - Delegate Notifications
    @MainActor
    private func notifyUpdate(_ dashboard: DashboardData) async {
        delegate?.dashboardService(self, didReceiveUpdate: dashboard)
    }
    
    @MainActor
    private func notifyError(_ error: Error) async {
        delegate?.dashboardService(self, didEncounterError: error)
    }
    
    @MainActor
    private func notifyConnectionStatus(_ isConnected: Bool) async {
        delegate?.dashboardService(self, didChangeConnectionStatus: isConnected)
    }
}

// MARK: - Data Models
struct DashboardData: Sendable {
    var title: String = ""
    var description: String = ""
    var statusMessage: String = ""
    var isEnabled: Bool = false
    var maintenanceMode: Bool = false
    var notificationsOn: Bool = false
    var userCount: Int32 = 0
    var temperature: Double = 0.0
    var progressPercentage: Int32 = 0
    var priority: Dashboard_Priority = .unspecified
    var lastUpdated: Date = Date()
    var config: [String: String] = [:]
}
