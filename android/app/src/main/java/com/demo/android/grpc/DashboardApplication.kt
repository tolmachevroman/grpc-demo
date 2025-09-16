package com.demo.android.grpc

import android.app.Application
import com.demo.android.grpc.di.appModule
import org.koin.android.ext.koin.androidContext
import org.koin.core.context.startKoin

class DashboardApplication : Application() {

    override fun onCreate() {
        super.onCreate()

        startKoin {
            androidContext(this@DashboardApplication)
            modules(appModule)
        }
    }
}