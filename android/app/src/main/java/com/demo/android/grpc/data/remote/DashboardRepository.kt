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
            Log.d(TAG, "Updating dashboard state...")
            val request = UpdateDashboardRequest.newBuilder()
                .setUpdates(updates)
                .addAllUpdatedFields(updatedFields)
                .build()
            val response = dashboardService.updateDashboard(request)
            Log.d(TAG, "Dashboard state updated successfully")
            Result.success(response.state)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to update dashboard state", e)
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