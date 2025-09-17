package com.demo.android.grpc.ui.screens

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.demo.android.grpc.DashboardState
import com.demo.android.grpc.data.remote.DashboardRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch

class DashboardViewModel(
    private val repository: DashboardRepository
) : ViewModel() {

    companion object {
        private const val TAG = "DashboardViewModel"
    }

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    // Store pending updates to batch them
    private val pendingUpdates = mutableMapOf<String, Any>()

    // Client ID for streaming
    private val clientId = "android_client_${System.currentTimeMillis()}"

    init {
        Log.d(TAG, "DashboardViewModel initialized with client ID: $clientId")
        // Load dashboard and start streaming
        connectToDashboard()
    }

    fun connectToDashboard() {
        Log.d(TAG, "Connecting to dashboard...")
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            // First, get initial dashboard state
            repository.getDashboardState()
                .onSuccess { dashboardState ->
                    Log.d(TAG, "Initial dashboard loaded successfully")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        dashboardState = dashboardState,
                        error = null
                    )

                    // Start streaming for real-time updates
                    startStreaming()
                }
                .onFailure { error ->
                    Log.e(TAG, "Failed to load initial dashboard", error)
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message ?: "Connection failed"
                    )
                }
        }
    }

    private fun startStreaming() {
        Log.d(TAG, "Starting dashboard stream...")
        viewModelScope.launch {
            repository.streamDashboardUpdates(clientId)
                .catch { error ->
                    Log.e(TAG, "Stream error", error)
                    _uiState.value = _uiState.value.copy(
                        error = "Stream disconnected: ${error.message}"
                    )
                }
                .collect { updatedState ->
                    Log.d(TAG, "Received streamed update")
                    _uiState.value = _uiState.value.copy(
                        dashboardState = updatedState,
                        error = null // Clear any previous errors
                    )
                }
        }
    }

    fun reconnect() {
        Log.d(TAG, "Reconnecting...")
        connectToDashboard()
    }

    fun updateField(field: String, value: Any) {
        Log.d(TAG, "Updating field: $field = $value")

        // Add to pending updates
        pendingUpdates[field] = value

        // Apply the update immediately to local state for responsive UI
        val currentState = _uiState.value.dashboardState
        if (currentState != null) {
            val updatedState = updateDashboardStateField(currentState, field, value)
            _uiState.value = _uiState.value.copy(dashboardState = updatedState)
        }

        // Send update to server (this will trigger a stream update for all clients)
        sendPendingUpdates()
    }

    private fun sendPendingUpdates() {
        if (pendingUpdates.isEmpty()) return
        val currentState = _uiState.value.dashboardState ?: return

        val updates = pendingUpdates.toMap()
        val fieldsToUpdate = updates.keys.toList()
        pendingUpdates.clear()

        // Convert snake_case field names to camelCase to match protobuf field names
        val camelCaseFields = fieldsToUpdate.map { snakeField ->
            when (snakeField) {
                "user_count" -> "userCount"
                "progress_percentage" -> "progressPercentage"
                "is_enabled" -> "isEnabled"
                "maintenance_mode" -> "maintenanceMode"
                "notifications_on" -> "notificationsOn"
                "status_message" -> "statusMessage"
                "last_updated" -> "lastUpdated"
                else -> snakeField // Fields without underscores remain the same
            }
        }

        Log.d(TAG, "Sending batch of ${fieldsToUpdate.size} field updates to server")
        Log.d(TAG, "Snake_case fields: $fieldsToUpdate")
        Log.d(TAG, "CamelCase fields: $camelCaseFields")

        viewModelScope.launch {
            val updatedState = buildUpdatedDashboardState(currentState, updates)
            repository.updateDashboardState(updatedState, camelCaseFields)
                .onSuccess {
                    Log.d(TAG, "Server update successful (batched) - stream will provide update")
                    // The stream will reflect the change; no need to update UI here.
                }
                .onFailure { error ->
                    Log.e(TAG, "Failed to update server", error)
                    _uiState.value = _uiState.value.copy(
                        error = "Update failed: ${error.message}"
                    )
                    connectToDashboard()
                }
        }
    }

    private fun updateDashboardStateField(state: DashboardState, field: String, value: Any): DashboardState {
        return try {
            val builder = state.toBuilder()

            when (field) {
                "title" -> builder.title = value as String
                "description" -> builder.description = value as String
                "status_message" -> builder.statusMessage = value as String
                "user_count" -> builder.userCount = value as Int
                "temperature" -> builder.temperature = value as Double
                "progress_percentage" -> builder.progressPercentage = value as Int
                "is_enabled" -> builder.isEnabled = value as Boolean
                "maintenance_mode" -> builder.maintenanceMode = value as Boolean
                "notifications_on" -> builder.notificationsOn = value as Boolean
                else -> {
                    Log.w(TAG, "Unknown field: $field")
                    return state
                }
            }

            builder.lastUpdated = System.currentTimeMillis().toString()
            builder.build()
        } catch (e: Exception) {
            Log.e(TAG, "Error updating field $field", e)
            state
        }
    }

    private fun buildUpdatedDashboardState(baseState: DashboardState, updates: Map<String, Any>): DashboardState {
        val builder = baseState.toBuilder()

        updates.forEach { (field, value) ->
            try {
                when (field) {
                    "title" -> builder.title = value as String
                    "description" -> builder.description = value as String
                    "status_message" -> builder.statusMessage = value as String
                    "user_count" -> builder.userCount = value as Int
                    "temperature" -> builder.temperature = value as Double
                    "progress_percentage" -> builder.progressPercentage = value as Int
                    "is_enabled" -> builder.isEnabled = value as Boolean
                    "maintenance_mode" -> builder.maintenanceMode = value as Boolean
                    "notifications_on" -> builder.notificationsOn = value as Boolean
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error applying update for field $field", e)
            }
        }

        builder.lastUpdated = System.currentTimeMillis().toString()
        return builder.build()
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    override fun onCleared() {
        super.onCleared()
        Log.d(TAG, "ViewModel cleared - stream will be automatically cancelled")
    }
}

data class DashboardUiState(
    val isLoading: Boolean = false,
    val dashboardState: DashboardState? = null,
    val error: String? = null
)