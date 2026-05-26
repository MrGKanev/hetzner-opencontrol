import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useSettingsStore } from "../store/settingsStore";
import { useAuthStore } from "../store/authStore";
import { sendServerStatusNotification } from "./notifications";
import { getServers } from "../api/servers";
import { queryClient } from "../api/queryClient";
import { SERVERS_KEY } from "../hooks/useServersQuery";

export function useServerPoller() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStatusRef = useRef<Record<number, string>>({});

  function clearPoller() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function startPoller(seconds: number) {
    clearPoller();
    if (seconds === 0) return;

    intervalRef.current = setInterval(async () => {
      const { isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated) return;
      if (AppState.currentState !== "active") return;

      try {
        const servers = await getServers();
        const { notificationsEnabled } = useSettingsStore.getState();
        const prev = prevStatusRef.current;

        if (notificationsEnabled) {
          for (const server of servers) {
            const oldStatus = prev[server.id];
            if (oldStatus && oldStatus !== server.status) {
              sendServerStatusNotification(server.name, oldStatus, server.status);
            }
          }
        }

        prevStatusRef.current = Object.fromEntries(
          servers.map((s) => [s.id, s.status]),
        );
        queryClient.setQueryData(SERVERS_KEY, servers);
      } catch {
        // Silently ignore polling errors
      }
    }, seconds * 1000);
  }

  useEffect(() => {
    const cached = queryClient.getQueryData<typeof SERVERS_KEY>(SERVERS_KEY);
    if (Array.isArray(cached)) {
      prevStatusRef.current = Object.fromEntries(
        (cached as any[]).map((s: any) => [s.id, s.status]),
      );
    }

    startPoller(useSettingsStore.getState().refreshInterval);

    let prevInterval = useSettingsStore.getState().refreshInterval;
    const unsub = useSettingsStore.subscribe((state) => {
      if (state.refreshInterval !== prevInterval) {
        prevInterval = state.refreshInterval;
        startPoller(state.refreshInterval);
      }
    });

    return () => {
      clearPoller();
      unsub();
    };
  }, []);
}
