package com.demo.android.grpc.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.demo.android.grpc.DashboardState

@Composable
fun DashboardCard(
    dashboardState: DashboardState,
    onUpdateField: (field: String, value: Any) -> Unit,
    modifier: Modifier = Modifier
) {
    var isEditing by remember { mutableStateOf(false) }
    var editableTitle by remember { mutableStateOf(dashboardState.title) }
    var editableDescription by remember { mutableStateOf(dashboardState.description) }
    var editableStatusMessage by remember { mutableStateOf(dashboardState.statusMessage) }
    var editableUserCount by remember { mutableStateOf(dashboardState.userCount.toString()) }
    var editableTemperature by remember { mutableStateOf(dashboardState.temperature.toString()) }
    var editableProgressPercentage by remember { mutableStateOf(dashboardState.progressPercentage.toString()) }

    // Update local state when dashboardState changes
    LaunchedEffect(dashboardState) {
        editableTitle = dashboardState.title
        editableDescription = dashboardState.description
        editableStatusMessage = dashboardState.statusMessage
        editableUserCount = dashboardState.userCount.toString()
        editableTemperature = dashboardState.temperature.toString()
        editableProgressPercentage = dashboardState.progressPercentage.toString()
    }

    Card(
        modifier = modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header with Edit/Save button
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

                FilledTonalButton(
                    onClick = {
                        if (isEditing) {
                            // Save changes
                            onUpdateField("title", editableTitle)
                            onUpdateField("description", editableDescription)
                            onUpdateField("status_message", editableStatusMessage)
                            onUpdateField("user_count", editableUserCount.toIntOrNull() ?: 0)
                            onUpdateField("temperature", editableTemperature.toDoubleOrNull() ?: 0.0)
                            onUpdateField("progress_percentage", editableProgressPercentage.toIntOrNull() ?: 0)
                        }
                        isEditing = !isEditing
                    },
                    modifier = Modifier.height(36.dp)
                ) {
                    Text(
                        text = if (isEditing) "Save" else "Edit",
                        style = MaterialTheme.typography.labelMedium
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Editable Fields with proper spacing
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                EditableField(
                    label = "Title",
                    value = editableTitle,
                    onValueChange = { editableTitle = it },
                    isEditing = isEditing
                )

                EditableField(
                    label = "Description",
                    value = editableDescription,
                    onValueChange = { editableDescription = it },
                    isEditing = isEditing
                )

                EditableField(
                    label = "Status",
                    value = editableStatusMessage,
                    onValueChange = { editableStatusMessage = it },
                    isEditing = isEditing
                )

                Spacer(modifier = Modifier.height(4.dp))

                // Number fields in a column with proper spacing
                Column(
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    EditableNumberField(
                        label = "User Count",
                        value = editableUserCount,
                        onValueChange = { editableUserCount = it },
                        isEditing = isEditing,
                        keyboardType = KeyboardType.Number,
                        modifier = Modifier.fillMaxWidth()
                    )

                    EditableNumberField(
                        label = "Temperature (°C)",
                        value = editableTemperature,
                        onValueChange = { editableTemperature = it },
                        isEditing = isEditing,
                        keyboardType = KeyboardType.Decimal,
                        modifier = Modifier.fillMaxWidth()
                    )

                    EditableNumberField(
                        label = "Progress (%)",
                        value = editableProgressPercentage,
                        onValueChange = { editableProgressPercentage = it },
                        isEditing = isEditing,
                        keyboardType = KeyboardType.Number,
                        modifier = Modifier.fillMaxWidth()
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
                            android.util.Log.d("DashboardCard", "🔄 System Enabled switch toggled to: $it")
                            onUpdateField("is_enabled", it)
                        }
                    )

                    SwitchField(
                        label = "Maintenance Mode",
                        checked = dashboardState.maintenanceMode,
                        onCheckedChange = {
                            android.util.Log.d("DashboardCard", "🔄 Maintenance Mode switch toggled to: $it")
                            onUpdateField("maintenance_mode", it)
                        }
                    )

                    SwitchField(
                        label = "Notifications",
                        checked = dashboardState.notificationsOn,
                        onCheckedChange = {
                            android.util.Log.d("DashboardCard", "🔄 Notifications switch toggled to: $it")
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
private fun EditableField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    isEditing: Boolean,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = 4.dp)
        )

        if (isEditing) {
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                textStyle = MaterialTheme.typography.bodyMedium
            )
        } else {
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(vertical = 4.dp)
            )
        }
    }
}

@Composable
private fun EditableNumberField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    isEditing: Boolean,
    keyboardType: KeyboardType,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = 4.dp)
        )
        
        if (isEditing) {
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
                singleLine = true,
                textStyle = MaterialTheme.typography.bodyMedium
            )
        } else {
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(vertical = 4.dp)
            )
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