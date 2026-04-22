package com.hetzneropencontrol

import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import org.json.JSONArray

const val WIDGET_PREFS = "hetzner_widget"
const val WIDGET_SERVERS_KEY = "servers_json"

data class WidgetServer(val name: String, val status: String)

class ServersWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory =
        ServersRemoteViewsFactory(applicationContext)
}

class ServersRemoteViewsFactory(private val ctx: Context) : RemoteViewsService.RemoteViewsFactory {

    private var servers: List<WidgetServer> = emptyList()

    override fun onCreate() { load() }
    override fun onDataSetChanged() { load() }
    override fun onDestroy() {}

    private fun load() {
        val prefs = ctx.getSharedPreferences(WIDGET_PREFS, Context.MODE_PRIVATE)
        val json = prefs.getString(WIDGET_SERVERS_KEY, "[]") ?: "[]"
        servers = try {
            val arr = JSONArray(json)
            (0 until arr.length()).map { i ->
                val obj = arr.getJSONObject(i)
                WidgetServer(
                    name = obj.optString("name", "Unknown"),
                    status = obj.optString("status", "unknown")
                )
            }
        } catch (_: Exception) { emptyList() }
    }

    override fun getCount() = servers.size

    override fun getViewAt(position: Int): RemoteViews {
        val server = servers.getOrNull(position)
            ?: return RemoteViews(ctx.packageName, R.layout.widget_server_item)

        val views = RemoteViews(ctx.packageName, R.layout.widget_server_item)
        views.setTextViewText(R.id.server_name, server.name)
        views.setTextViewText(R.id.server_status, server.status)

        val dotColor = when (server.status) {
            "running"  -> 0xFF34C759.toInt()
            "off"      -> 0xFF8E8E93.toInt()
            "starting" -> 0xFFFF9F0A.toInt()
            "stopping" -> 0xFFFF9F0A.toInt()
            "error"    -> 0xFFFF3B30.toInt()
            else       -> 0xFF8E8E93.toInt()
        }
        views.setTextColor(R.id.server_dot, dotColor)

        // Fill-in intent so tapping any row opens the app
        views.setOnClickFillInIntent(R.id.server_name, Intent())
        views.setOnClickFillInIntent(R.id.server_dot, Intent())
        views.setOnClickFillInIntent(R.id.server_status, Intent())

        return views
    }

    override fun getLoadingView(): RemoteViews? = null
    override fun getViewTypeCount() = 1
    override fun getItemId(position: Int) = position.toLong()
    override fun hasStableIds() = false
}
