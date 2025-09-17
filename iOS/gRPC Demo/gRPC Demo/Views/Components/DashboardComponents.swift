//
//  DashboardComponents.swift
//  gRPC Demo
//
//  Created by Roman Tolmachev on 20-09-25.
//

import SwiftUI

// MARK: - UI Components

struct NumericField: View {
    let title: String
    @Binding var value: Int
    let range: ClosedRange<Int>
    let format: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(title)
                    .font(.subheadline)
                
                Spacer()
                
                Text(String(format: format, value))
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Slider(
                value: Binding(
                    get: {
                        Double(value)
                    },
                    set: { newValue in
                        value = Int(newValue)
                    }
                ),
                in: Double(range.lowerBound)...Double(range.upperBound),
                step: 1
            )
        }
    }
}

struct HeaderSection: View {
    @ObservedObject var viewModel: DashboardViewModel
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Circle()
                    .fill(viewModel.isConnected ? Color.green : Color.orange)
                    .frame(width: 12, height: 12)
                    .animation(.easeInOut, value: viewModel.isConnected)
                
                Text(viewModel.isConnected ? "Connected to gRPC Server" : "Demo Mode")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text("Last Updated: \(viewModel.dashboard.lastUpdated, formatter: timeFormatter)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text(viewModel.dashboard.title)
                    .font(.title)
                    .bold()
                
                Text(viewModel.dashboard.description)
                    .font(.body)
                    .foregroundColor(.secondary)
                
                Text(viewModel.dashboard.statusMessage)
                    .font(.callout)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.blue.opacity(0.1))
                    .foregroundColor(.blue)
                    .cornerRadius(8)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    private var timeFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateStyle = .none
        formatter.timeStyle = .medium
        return formatter
    }
}

struct StatusTogglesSection: View {
    @ObservedObject var viewModel: DashboardViewModel
    
    var body: some View {
        VStack(spacing: 16) {
            // System Status Toggle
            HStack {
                Text("System Enabled")
                    .font(.headline)
                Spacer()
                Toggle("", isOn: Binding(
                    get: { viewModel.dashboard.isEnabled },
                    set: { newValue in
                        print("🔘 Toggle: 'System Enabled' toggled to \(newValue)")
                        viewModel.dashboard.isEnabled = newValue
                        Task {
                            await viewModel.updateField("isEnabled", value: newValue)
                        }
                    }
                ))
                .labelsHidden()
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            
            // Maintenance Mode Toggle
            HStack {
                Text("Maintenance Mode")
                    .font(.headline)
                Spacer()
                Toggle("", isOn: Binding(
                    get: { viewModel.dashboard.maintenanceMode },
                    set: { newValue in
                        print("🔘 Toggle: 'Maintenance Mode' toggled to \(newValue)")
                        viewModel.dashboard.maintenanceMode = newValue
                        Task {
                            await viewModel.updateField("maintenanceMode", value: newValue)
                        }
                    }
                ))
                .labelsHidden()
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            
            // Notifications Toggle
            HStack {
                Text("Notifications")
                    .font(.headline)
                Spacer()
                Toggle("", isOn: Binding(
                    get: { viewModel.dashboard.notificationsOn },
                    set: { newValue in
                        print("🔘 Toggle: 'Notifications' toggled to \(newValue)")
                        viewModel.dashboard.notificationsOn = newValue
                        Task {
                            await viewModel.updateField("notificationsOn", value: newValue)
                        }
                    }
                ))
                .labelsHidden()
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }
}

struct TextControlsSection: View {
    @ObservedObject var viewModel: DashboardViewModel
    
    var body: some View {
        VStack(spacing: 16) {
            // Title Editor
            VStack(alignment: .leading, spacing: 8) {
                Text("Title")
                    .font(.headline)
                
                TextField("Dashboard Title", text: Binding(
                    get: { viewModel.dashboard.title },
                    set: { newValue in
                        viewModel.dashboard.title = newValue
                        Task {
                            await viewModel.updateField("title", value: newValue)
                        }
                    }
                ))
                .textFieldStyle(RoundedBorderTextFieldStyle())
            }
            
            // Description Editor
            VStack(alignment: .leading, spacing: 8) {
                Text("Description")
                    .font(.headline)
                
                TextField("Dashboard Description", text: Binding(
                    get: { viewModel.dashboard.description },
                    set: { newValue in
                        viewModel.dashboard.description = newValue
                        Task {
                            await viewModel.updateField("description", value: newValue)
                        }
                    }
                ), axis: .vertical)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .lineLimit(2...4)
            }
            
            // Status Message Editor
            VStack(alignment: .leading, spacing: 8) {
                Text("Status Message")
                    .font(.headline)
                
                TextField("Status Message", text: Binding(
                    get: { viewModel.dashboard.statusMessage },
                    set: { newValue in
                        viewModel.dashboard.statusMessage = newValue
                        Task {
                            await viewModel.updateField("statusMessage", value: newValue)
                        }
                    }
                ))
                .textFieldStyle(RoundedBorderTextFieldStyle())
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct NumericControlsSection: View {
    @ObservedObject var viewModel: DashboardViewModel
    
    var body: some View {
        VStack(spacing: 16) {
            Text("Metrics")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            VStack(spacing: 16) {
                // User Count
                NumericField(
                    title: "User Count",
                    value: Binding(
                        get: { Int(viewModel.dashboard.userCount) },
                        set: { newValue in
                            viewModel.dashboard.userCount = Int32(newValue)
                            Task {
                                await viewModel.updateField("userCount", value: Int32(newValue))
                            }
                        }
                    ),
                    range: 0...200,
                    format: "%d users"
                )
                
                // Temperature
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Temperature")
                            .font(.subheadline)
                        
                        Spacer()
                        
                        Text(String(format: "%.1f°C", viewModel.dashboard.temperature))
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    Slider(
                        value: Binding(
                            get: { viewModel.dashboard.temperature },
                            set: { newValue in
                                viewModel.dashboard.temperature = newValue
                                Task {
                                    await viewModel.updateField("temperature", value: newValue)
                                }
                            }
                        ),
                        in: 0...50,
                        step: 0.1
                    )
                    .accentColor(.blue)
                }
                
                // Progress
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Progress")
                            .font(.subheadline)
                        
                        Spacer()
                        
                        Text("\(viewModel.dashboard.progressPercentage)%")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    ProgressView(value: Double(viewModel.dashboard.progressPercentage) / 100.0)
                        .progressViewStyle(LinearProgressViewStyle(tint: .blue))
                    
                    Slider(
                        value: Binding(
                            get: { Double(viewModel.dashboard.progressPercentage) },
                            set: { newValue in
                                viewModel.dashboard.progressPercentage = Int32(newValue)
                                Task {
                                    await viewModel.updateField("progressPercentage", value: Int32(newValue))
                                }
                            }
                        ),
                        in: 0...100,
                        step: 1
                    )
                    .accentColor(.blue)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct PrioritySection: View {
    @ObservedObject var viewModel: DashboardViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Priority Level")
                .font(.headline)
            
            Picker("Priority", selection: Binding(
                get: { viewModel.dashboard.priority },
                set: { newValue in
                    viewModel.dashboard.priority = newValue
                    Task {
                        await viewModel.updateField("priority", value: newValue)
                    }
                }
            )) {
                Text("Low").tag(Dashboard_Priority.low)
                Text("Medium").tag(Dashboard_Priority.medium)
                Text("High").tag(Dashboard_Priority.high)
                Text("Critical").tag(Dashboard_Priority.critical)
            }
            .pickerStyle(SegmentedPickerStyle())
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct ConfigSection: View {
    @ObservedObject var viewModel: DashboardViewModel
    @State private var editingConfig = false
    @State private var configText = ""
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Configuration")
                    .font(.headline)
                
                Spacer()
                
                Button(editingConfig ? "Save" : "Edit") {
                    if editingConfig {
                        // Save config
                        if let data = configText.data(using: .utf8),
                           let json = try? JSONSerialization.jsonObject(with: data) as? [String: String] {
                            viewModel.dashboard.config = json
                            Task {
                                await viewModel.updateField("config", value: json)
                            }
                        }
                    } else {
                        // Start editing
                        if let data = try? JSONSerialization.data(withJSONObject: viewModel.dashboard.config, options: .prettyPrinted),
                           let jsonString = String(data: data, encoding: .utf8) {
                            configText = jsonString
                        }
                    }
                    editingConfig.toggle()
                }
                .buttonStyle(.borderedProminent)
            }
            
            if editingConfig {
                TextEditor(text: $configText)
                    .font(.system(.caption, design: .monospaced))
                    .frame(minHeight: 120)
                    .padding(8)
                    .background(Color(.systemGray5))
                    .cornerRadius(8)
            } else {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(Array(viewModel.dashboard.config.keys.sorted()), id: \.self) { key in
                        HStack {
                            Text(key)
                                .font(.caption)
                                .fontWeight(.medium)
                            
                            Spacer()
                            
                            Text(viewModel.dashboard.config[key] ?? "")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}
