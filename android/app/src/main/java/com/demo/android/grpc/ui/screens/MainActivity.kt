package com.demo.android.grpc.ui.screens

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.demo.android.grpc.DashboardState
import com.demo.android.grpc.ui.components.DashboardCard
import com.demo.android.grpc.ui.components.ErrorState
import com.demo.android.grpc.ui.components.LoadingState
import com.demo.android.grpc.ui.components.WelcomeState
import com.demo.android.grpc.ui.theme.GRPCAndroidDemoTheme
import org.koin.androidx.compose.koinViewModel
import java.util.Locale

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            GRPCAndroidDemoTheme {
                DashboardApp()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardApp() {
    val viewModel: DashboardViewModel = koinViewModel()
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("gRPC Dashboard") },
                actions = {
                    // Show connection status instead of refresh button
                    if (uiState.dashboardState != null) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // Streaming indicator
                            val scale = rememberInfiniteTransition()
                            val scaleValue by scale.animateFloat(
                                initialValue = 1f,
                                targetValue = 1.2f,
                                animationSpec = infiniteRepeatable(
                                    animation = tween(500, easing = LinearEasing),
                                    repeatMode = RepeatMode.Reverse
                                )
                            )
                            Text(
                                text = "●",
                                color = if (uiState.error == null) Color(0xFF2E7D32) else MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.titleMedium,
                                modifier = Modifier.scale(scaleValue)
                            )
                            Text(
                                text = if (uiState.error == null) "Live" else "Offline",
                                style = MaterialTheme.typography.labelMedium,
                                color = if (uiState.error == null) Color(0xFF2E7D32) else MaterialTheme.colorScheme.error
                            )
                        }
                    }
                }
            )
        },
        modifier = Modifier.fillMaxSize()
    ) { innerPadding ->
        DashboardContent(
            uiState = uiState,
            onLoadDashboard = { viewModel.connectToDashboard() },
            onUpdateField = { field, value -> viewModel.updateField(field, value) },
            onRetry = { viewModel.reconnect() },
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        )
    }
}

@Composable
fun DashboardContent(
    uiState: DashboardUiState,
    onLoadDashboard: () -> Unit,
    onUpdateField: (String, Any) -> Unit,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(modifier = modifier) {
        when {
            uiState.isLoading -> {
                LoadingState()
            }

            uiState.error != null -> {
                ErrorState(
                    error = uiState.error,
                    onRetry = onRetry
                )
            }

            uiState.dashboardState != null -> {
                DashboardScreen(
                    dashboardState = uiState.dashboardState,
                    onUpdateField = onUpdateField
                )
            }

            else -> {
                WelcomeState(
                    onLoadDashboard = onLoadDashboard
                )
            }
        }
    }
}

@Composable
fun DashboardScreen(
    dashboardState: DashboardState,
    onUpdateField: (String, Any) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Connection Status - Live streaming indicator
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = Color(0xFF2E7D32).copy(alpha = 0.1f) // Light green background
            )
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Pulsing indicator for live streaming
                val infiniteTransition = rememberInfiniteTransition()
                val alpha by infiniteTransition.animateFloat(
                    initialValue = 0.5f,
                    targetValue = 1f,
                    animationSpec = infiniteRepeatable(
                        animation = tween(1000, easing = LinearEasing),
                        repeatMode = RepeatMode.Reverse
                    )
                )

                Text(
                    text = "●",
                    style = MaterialTheme.typography.titleLarge,
                    color = Color(0xFF2E7D32).copy(alpha = alpha)
                )
                Column {
                    Text(
                        text = "Live Streaming",
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color(0xFF2E7D32),
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = "Real-time updates active",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF2E7D32).copy(alpha = 0.7f)
                    )
                }
            }
        }

        // Main Dashboard Card
        DashboardCard(
            dashboardState = dashboardState,
            onUpdateField = onUpdateField
        )

        // System Information Card
        SystemInfoCard(
            dashboardState = dashboardState
        )
    }
}

@Composable
fun SystemInfoCard(
    dashboardState: DashboardState,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "System Information",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Priority Level
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = "Priority Level",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = dashboardState.priority.name.removePrefix("PRIORITY_"),
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        color = when (dashboardState.priority.name) {
                            "PRIORITY_CRITICAL" -> MaterialTheme.colorScheme.error
                            "PRIORITY_HIGH" -> MaterialTheme.colorScheme.tertiary
                            "PRIORITY_MEDIUM" -> MaterialTheme.colorScheme.primary
                            else -> MaterialTheme.colorScheme.onSurfaceVariant
                        }
                    )
                }

                // Configuration count
                Column(
                    modifier = Modifier.weight(1f),
                    horizontalAlignment = Alignment.End
                ) {
                    Text(
                        text = "Configuration Items",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${dashboardState.configMap.size}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // Show key config items if available
            if (dashboardState.configMap.isNotEmpty()) {
                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Configuration",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(8.dp))

                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    dashboardState.configMap.entries.take(3).forEach { (key, value) ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = key.replaceFirstChar { if (it.isLowerCase()) it.titlecase(java.util.Locale.ROOT) else it.toString() },
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = value,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
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