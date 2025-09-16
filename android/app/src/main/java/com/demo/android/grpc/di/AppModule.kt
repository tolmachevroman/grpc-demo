package com.demo.android.grpc.di

import android.util.Log
import com.demo.android.grpc.DashboardServiceGrpcKt
import com.demo.android.grpc.data.remote.DashboardRepository
import com.demo.android.grpc.ui.screens.DashboardViewModel
import io.grpc.Channel
import io.grpc.ManagedChannel
import io.grpc.okhttp.OkHttpChannelBuilder
import org.koin.core.module.dsl.viewModel
import org.koin.dsl.module
import java.util.concurrent.TimeUnit

val appModule = module {

    // gRPC ManagedChannel
    single<ManagedChannel> {
        try {
            Log.d("Koin", "Creating gRPC channel...")

            // Configuration for different environments
            val host = "10.0.2.2"  // For Android Emulator -> localhost
            // val host = "192.168.1.100"  // Replace with your actual IP for physical device
            // val host = "your-server-domain.com"  // For remote server

            val port = 50051  // Adjust if your Envoy is on a different port

            Log.d("Koin", "Connecting to gRPC server at $host:$port")

            val channel = OkHttpChannelBuilder.forAddress(host, port)
                .usePlaintext()
                .keepAliveTime(30, TimeUnit.SECONDS)
                .keepAliveTimeout(5, TimeUnit.SECONDS)
                .keepAliveWithoutCalls(true)
                .maxInboundMessageSize(4 * 1024 * 1024)
                .build()
            Log.d("Koin", "gRPC channel created successfully")
            channel
        } catch (e: Exception) {
            Log.w("Koin", "Failed to create OkHttp channel, using fallback", e)
            // Fallback to basic channel if OkHttp fails
            val fallbackChannel = io.grpc.ManagedChannelBuilder.forAddress("10.0.2.2", 50051)
                .usePlaintext()
                .build()
            Log.d("Koin", "Fallback gRPC channel created")
            fallbackChannel
        }
    }

    // Bind Channel interface to ManagedChannel implementation
    single<Channel> { get<ManagedChannel>() }

    // gRPC Service
    single<DashboardServiceGrpcKt.DashboardServiceCoroutineStub> {
        try {
            Log.d("Koin", "Creating gRPC service stub...")
            val stub = DashboardServiceGrpcKt.DashboardServiceCoroutineStub(get<Channel>())
            Log.d("Koin", "gRPC service stub created successfully")
            stub
        } catch (e: Exception) {
            Log.e("Koin", "Failed to create gRPC service stub", e)
            throw e
        }
    }

    // Repository
    single<DashboardRepository> {
        try {
            Log.d("Koin", "Creating DashboardRepository...")
            val repository = DashboardRepository(get())
            Log.d("Koin", "DashboardRepository created successfully")
            repository
        } catch (e: Exception) {
            Log.e("Koin", "Failed to create DashboardRepository", e)
            throw e
        }
    }

    // ViewModel
    viewModel {
        try {
            Log.d("Koin", "Creating DashboardViewModel...")
            val viewModel = DashboardViewModel(get())
            Log.d("Koin", "DashboardViewModel created successfully")
            viewModel
        } catch (e: Exception) {
            Log.e("Koin", "Failed to create DashboardViewModel", e)
            throw e
        }
    }
}