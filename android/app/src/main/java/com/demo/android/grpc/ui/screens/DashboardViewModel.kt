package com.demo.android.grpc.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.demo.android.grpc.DashboardState
import com.demo.android.grpc.data.remote.DashboardRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlin.onSuccess

class DashboardViewModel(
    private val repository: DashboardRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        // Don't automatically load dashboard to prevent startup crashes
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            repository.getDashboardState()
                .onSuccess { dashboardState ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        dashboardState = dashboardState,
                        error = null
                    )
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message ?: "Unknown error"
                    )
                }
        }
    }

    fun updateDashboard(
        title: String? = null,
        description: String? = null,
        isEnabled: Boolean? = null,
        maintenanceMode: Boolean? = null,
        notificationsOn: Boolean? = null,
        userCount: Int? = null,
        temperature: Double? = null,
        progressPercentage: Int? = null
    ) {
        val currentState = _uiState.value.dashboardState ?: return
        val updatedFields = mutableListOf<String>()

        // Build the updated state - this will need to use the actual protobuf builder
        // For now, we'll just reload the dashboard
        loadDashboard()
    }
}

data class DashboardUiState(
    val isLoading: Boolean = false,
    val dashboardState: DashboardState? = null,
    val error: String? = null
)