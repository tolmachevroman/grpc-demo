package com.demo.android.grpc.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.demo.android.grpc.DashboardState
import com.demo.android.grpc.Priority
import kotlin.math.roundToInt

@Composable
fun DashboardCard(
    dashboardState: DashboardState,
    onUpdateField: (field: String, value: Any) -> Unit,
    modifier: Modifier = Modifier
) {
    var editableTitle by remember { mutableStateOf(dashboardState.title) }
    var editableDescription by remember { mutableStateOf(dashboardState.description) }
    var editableStatusMessage by remember { mutableStateOf(dashboardState.statusMessage) }

    // Update local state when dashboardState changes
    LaunchedEffect(dashboardState) {
        editableTitle = dashboardState.title
        editableDescription = dashboardState.description
        editableStatusMessage = dashboardState.statusMessage
    }

    Card(
        modifier = modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Dashboard Control",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Always-editable Text Fields
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                AlwaysEditableField(
                    label = "Title",
                    value = editableTitle,
                    onValueChange = {
                        editableTitle = it
                        onUpdateField("title", it)
                    }
                )

                AlwaysEditableField(
                    label = "Description",
                    value = editableDescription,
                    onValueChange = {
                        editableDescription = it
                        onUpdateField("description", it)
                    }
                )

                AlwaysEditableField(
                    label = "Status",
                    value = editableStatusMessage,
                    onValueChange = {
                        editableStatusMessage = it
                        onUpdateField("status_message", it)
                    }
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Sliders for numeric values
                Column(
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    SliderField(
                        label = "User Count",
                        value = dashboardState.userCount.toFloat(),
                        onValueChange = { onUpdateField("user_count", it.roundToInt()) },
                        valueRange = 0f..200f,
                        steps = 39,
                        valueFormatter = { "${it.roundToInt()} users" }
                    )

                    SliderField(
                        label = "Temperature",
                        value = dashboardState.temperature.toFloat(),
                        onValueChange = { onUpdateField("temperature", it.toDouble()) },
                        valueRange = 0f..50f,
                        steps = 49,
                        valueFormatter = { "${it.roundToInt()}°C" }
                    )

                    SliderField(
                        label = "Progress",
                        value = dashboardState.progressPercentage.toFloat(),
                        onValueChange = { onUpdateField("progress_percentage", it.roundToInt()) },
                        valueRange = 0f..100f,
                        steps = 99,
                        valueFormatter = { "${it.roundToInt()}%" }
                    )

                    // Priority buttons: LOW, MEDIUM, HIGH, CRITICAL
                    PriorityButtonField(
                        label = "Priority Level",
                        currentPriority = dashboardState.priority,
                        onPriorityChange = { selectedPriority ->
                            onUpdateField("priority", selectedPriority)
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Toggle Switches with better spacing
            Column {
                Text(
                    text = "System Controls",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                Column(
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    SwitchField(
                        label = "System Enabled",
                        checked = dashboardState.isEnabled,
                        onCheckedChange = {
                            android.util.Log.d(
                                "DashboardCard",
                                " System Enabled switch toggled to: $it"
                            )
                            onUpdateField("is_enabled", it)
                        }
                    )

                    SwitchField(
                        label = "Maintenance Mode",
                        checked = dashboardState.maintenanceMode,
                        onCheckedChange = {
                            android.util.Log.d(
                                "DashboardCard",
                                " Maintenance Mode switch toggled to: $it"
                            )
                            onUpdateField("maintenance_mode", it)
                        }
                    )

                    SwitchField(
                        label = "Notifications",
                        checked = dashboardState.notificationsOn,
                        onCheckedChange = {
                            android.util.Log.d(
                                "DashboardCard",
                                " Notifications switch toggled to: $it"
                            )
                            onUpdateField("notifications_on", it)
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Timestamp
            Text(
                text = "Last Updated: ${
                    java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault())
                        .format(java.util.Date(dashboardState.lastUpdated.toLongOrNull() ?: 0))
                }",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun AlwaysEditableField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = 4.dp)
        )

        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            textStyle = MaterialTheme.typography.bodyMedium
        )
    }
}

@Composable
private fun SliderField(
    label: String,
    value: Float,
    onValueChange: (Float) -> Unit,
    valueRange: ClosedFloatingPointRange<Float>,
    steps: Int,
    valueFormatter: (Float) -> String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 12.sp
                )
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                ) {
                    Text(
                        text = valueFormatter(value),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        fontSize = 12.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(3.dp))

            Slider(
                value = value,
                onValueChange = onValueChange,
                valueRange = valueRange,
                steps = steps,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(22.dp)
                    .padding(horizontal = 0.dp),
                colors = SliderDefaults.colors(
                    thumbColor = MaterialTheme.colorScheme.primary,
                    activeTrackColor = MaterialTheme.colorScheme.primary,
                    inactiveTrackColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.24f),
                    activeTickColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.38f),
                    inactiveTickColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.12f)
                )
            )

            // Show range indicators
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 1.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = valueFormatter(valueRange.start),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 10.sp
                )
                Text(
                    text = valueFormatter(valueRange.endInclusive),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 10.sp
                )
            }
        }
    }
}

@Composable
private fun PriorityButtonField(
    label: String,
    currentPriority: Priority,
    onPriorityChange: (Priority) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                ) {
                    Text(
                        text = when (currentPriority) {
                            Priority.PRIORITY_LOW -> "Low"
                            Priority.PRIORITY_MEDIUM -> "Medium"
                            Priority.PRIORITY_HIGH -> "High"
                            Priority.PRIORITY_CRITICAL -> "Critical"
                            else -> "Unspecified"
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                OutlinedButton(
                    onClick = {
                        onPriorityChange(Priority.PRIORITY_LOW)
                    },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = if (currentPriority == Priority.PRIORITY_LOW) Color(
                            0xFF4CAF50
                        ) else Color.Transparent,
                        contentColor = if (currentPriority == Priority.PRIORITY_LOW) Color.White else Color(
                            0xFF4CAF50
                        )
                    ),
                    border = BorderStroke(1.dp, Color(0xFF4CAF50)),
                    shape = RoundedCornerShape(6.dp),
                    contentPadding = PaddingValues(horizontal = 0.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = "Low",
                        style = MaterialTheme.typography.labelMedium,
                        fontSize = 12.sp
                    )
                }

                OutlinedButton(
                    onClick = {
                        onPriorityChange(Priority.PRIORITY_MEDIUM)
                    },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = if (currentPriority == Priority.PRIORITY_MEDIUM) Color(
                            0xFFFF9800
                        ) else Color.Transparent,
                        contentColor = if (currentPriority == Priority.PRIORITY_MEDIUM) Color.White else Color(
                            0xFFFF9800
                        )
                    ),
                    border = BorderStroke(1.dp, Color(0xFFFF9800)),
                    shape = RoundedCornerShape(6.dp),
                    contentPadding = PaddingValues(horizontal = 0.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = "Medium",
                        style = MaterialTheme.typography.labelMedium,
                        fontSize = 12.sp
                    )
                }

                OutlinedButton(
                    onClick = {
                        onPriorityChange(Priority.PRIORITY_HIGH)
                    },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = if (currentPriority == Priority.PRIORITY_HIGH) Color(
                            0xFFFF5722
                        ) else Color.Transparent,
                        contentColor = if (currentPriority == Priority.PRIORITY_HIGH) Color.White else Color(
                            0xFFFF5722
                        )
                    ),
                    border = BorderStroke(1.dp, Color(0xFFFF5722)),
                    shape = RoundedCornerShape(6.dp),
                    contentPadding = PaddingValues(horizontal = 0.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = "High",
                        style = MaterialTheme.typography.labelMedium,
                        fontSize = 12.sp
                    )
                }

                OutlinedButton(
                    onClick = {
                        onPriorityChange(Priority.PRIORITY_CRITICAL)
                    },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = if (currentPriority == Priority.PRIORITY_CRITICAL) Color(
                            0xFFF44336
                        ) else Color.Transparent,
                        contentColor = if (currentPriority == Priority.PRIORITY_CRITICAL) Color.White else Color(
                            0xFFF44336
                        )
                    ),
                    border = BorderStroke(1.dp, Color(0xFFF44336)),
                    shape = RoundedCornerShape(6.dp),
                    contentPadding = PaddingValues(horizontal = 0.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = "Critical",
                        style = MaterialTheme.typography.labelMedium,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun SwitchField(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium
        )
        
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange
        )
    }
}