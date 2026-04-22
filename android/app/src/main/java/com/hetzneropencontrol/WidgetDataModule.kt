package com.hetzneropencontrol

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetDataModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "WidgetData"

    @ReactMethod
    fun updateServers(json: String) {
        val ctx = reactApplicationContext
        ctx.getSharedPreferences(WIDGET_PREFS, android.content.Context.MODE_PRIVATE)
            .edit()
            .putString(WIDGET_SERVERS_KEY, json)
            .apply()

        ServersWidgetProvider.updateAllWidgets(ctx)
    }
}
