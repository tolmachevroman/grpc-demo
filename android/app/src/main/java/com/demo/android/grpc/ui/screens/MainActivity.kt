package com.demo.android.grpc.ui.screens

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.demo.android.grpc.DashboardState
import com.demo.android.grpc.ui.theme.GRPCAndroidDemoTheme
import org.koin.androidx.compose.koinViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            GRPCAndroidDemoTheme {
                DashboardScreen()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = koinViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("gRPC Dashboard") }
            )
        },
        modifier = Modifier.fillMaxSize()
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
        ) {
            when {
                uiState.isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }

                uiState.error != null -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Error: ${uiState.error}",
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = { viewModel.loadDashboard() }
                        ) {
                            Text("Retry")
                        }
                    }
                }

                uiState.dashboardState != null -> {
                    DashboardContent(
                        dashboardState = uiState.dashboardState!!,
                        modifier = Modifier.fillMaxSize()
                    )
                }

                else -> {
                    // Initial state - show load button
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Welcome to gRPC Dashboard",
                            style = MaterialTheme.typography.headlineMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Connect to the server to view dashboard data",
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Button(
                            onClick = { viewModel.loadDashboard() }
                        ) {
                            Text("Load Dashboard")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DashboardContent(
    dashboardState: DashboardState,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Dashboard Overview",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))

                Text("Title: ${dashboardState.title}")
                Text("Description: ${dashboardState.description}")
                Text("Status: ${dashboardState.statusMessage}")
                Text("User Count: ${dashboardState.userCount}")
                Text("Temperature: ${dashboardState.temperature}°C")
                Text("Progress: ${dashboardState.progressPercentage}%")

                Spacer(modifier = Modifier.height(16.dp))

                Row {
                    Text("System Enabled: ")
                    Text(
                        text = if (dashboardState.isEnabled) "Yes" else "No",
                        color = if (dashboardState.isEnabled)
                            MaterialTheme.colorScheme.primary else
                            MaterialTheme.colorScheme.error
                    )
                }

                Row {
                    Text("Maintenance Mode: ")
                    Text(
                        text = if (dashboardState.maintenanceMode) "Yes" else "No",
                        color = if (dashboardState.maintenanceMode)
                            MaterialTheme.colorScheme.error else
                            MaterialTheme.colorScheme.primary
                    )
                }

                Row {
                    Text("Notifications: ")
                    Text(
                        text = if (dashboardState.notificationsOn) "On" else "Off",
                        color = if (dashboardState.notificationsOn)
                            MaterialTheme.colorScheme.primary else
                            MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun DashboardScreenPreview() {
    GRPCAndroidDemoTheme {
        // Preview would need a mock DashboardState
    }
}