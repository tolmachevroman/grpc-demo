package com.demo.android.grpc.data.remote

import android.util.Log
import com.demo.android.grpc.DashboardServiceGrpcKt
import com.demo.android.grpc.DashboardState
import com.demo.android.grpc.GetDashboardRequest
import com.demo.android.grpc.StreamDashboardRequest
import com.demo.android.grpc.UpdateDashboardRequest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class DashboardRepository(
    private val dashboardService: DashboardServiceGrpcKt.DashboardServiceCoroutineStub
) {

    companion object {
        private const val TAG = "DashboardRepository"
    }

    suspend fun getDashboardState(): Result<DashboardState> {
        return try {
            Log.d(TAG, "Requesting dashboard state...")
            val request = GetDashboardRequest.getDefaultInstance()
            val response = dashboardService.getDashboard(request)
            Log.d(TAG, "Dashboard state received successfully")
            Result.success(response.state)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get dashboard state", e)
            Result.failure(e)
        }
    }

    suspend fun updateDashboardState(
        updates: DashboardState,
        updatedFields: List<String>
    ): Result<DashboardState> {
        return try {
            Log.d(TAG, "=== SENDING UPDATE TO SERVER ===")
            Log.d(TAG, "Updated fields: ${updatedFields.joinToString()}")
            Log.d(TAG, "Update values:")
            updatedFields.forEach { field ->
                when (field) {
                    "title" -> Log.d(TAG, "  $field: '${updates.title}'")
                    "description" -> Log.d(TAG, "  $field: '${updates.description}'")
                    "status_message" -> Log.d(TAG, "  $field: '${updates.statusMessage}'")
                    "user_count" -> Log.d(TAG, "  $field: ${updates.userCount}")
                    "temperature" -> Log.d(TAG, "  $field: ${updates.temperature}")
                    "progress_percentage" -> Log.d(TAG, "  $field: ${updates.progressPercentage}")
                    "is_enabled" -> Log.d(TAG, "  $field: ${updates.isEnabled}")
                    "maintenance_mode" -> Log.d(TAG, "  $field: ${updates.maintenanceMode}")
                    "notifications_on" -> Log.d(TAG, "  $field: ${updates.notificationsOn}")
                    else -> Log.d(TAG, "  $field: [unknown]")
                }
            }

            Log.d(TAG, "Creating UpdateDashboardRequest...")
            val request = UpdateDashboardRequest.newBuilder()
                .setUpdates(updates)
                .addAllUpdatedFields(updatedFields)
                .build()

            Log.d(TAG, "Request details:")
            Log.d(TAG, "  - updatedFields: ${request.updatedFieldsList}")
            Log.d(TAG, "  - updates.isEnabled: ${request.updates.isEnabled}")
            Log.d(TAG, "  - updates.maintenanceMode: ${request.updates.maintenanceMode}")
            Log.d(TAG, "  - updates.notificationsOn: ${request.updates.notificationsOn}")

            Log.d(TAG, "Calling dashboardService.updateDashboard()...")
            val response = dashboardService.updateDashboard(request)
            Log.d(TAG, "✅ Server responded successfully!")
            Log.d(TAG, "Response success: ${response.success}")
            Log.d(TAG, "=== UPDATE COMPLETE ===")
            Result.success(response.state)
        } catch (e: Exception) {
            Log.e(TAG, "❌ FAILED to update dashboard state", e)
            Log.e(TAG, "Exception type: ${e.javaClass.simpleName}")
            Log.e(TAG, "Exception message: ${e.message}")
            if (e.cause != null) {
                Log.e(TAG, "Exception cause: ${e.cause?.message}")
            }
            Result.failure(e)
        }
    }

    fun streamDashboardUpdates(clientId: String): Flow<DashboardState> = flow {
        try {
            Log.d(TAG, "Starting dashboard stream for client: $clientId")
            val request = StreamDashboardRequest.newBuilder()
                .setClientId(clientId)
                .build()

            dashboardService.streamDashboard(request).collect { response ->
                Log.d(TAG, "Received dashboard update from stream")
                emit(response.state)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Dashboard stream failed", e)
            throw e
        }
    }
}