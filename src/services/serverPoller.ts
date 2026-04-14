import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { useServerStore } from '../store/serverStore';
import { useAuthStore } from '../store/authStore';
import { sendServerStatusNotification } from './notifications';
import { getServers } from '../api/servers';

/**
 * Hook that drives background polling and server-status-change notifications.
 * Mount once in App.tsx.
 */
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

      // Only poll when app is active
      if (AppState.currentState !== 'active') return;

      try {
        const servers = await getServers();
        const { notificationsEnabled } = useSettingsStore.getState();
        const prev = prevStatusRef.current;

        // Detect status changes and fire notifications
        if (notificationsEnabled) {
          for (const server of servers) {
            const oldStatus = prev[server.id];
            if (oldStatus && oldStatus !== server.status) {
              sendServerStatusNotification(server.name, oldStatus, server.status);
            }
          }
        }

        // Update prev map and store
        prevStatusRef.current = Object.fromEntries(servers.map(s => [s.id, s.status]));
        useServerStore.setState({ servers, lastFetched: Date.now() });
      } catch {
        // Silently ignore polling errors
      }
    }, seconds * 1000);
  }

  useEffect(() => {
    // Seed prev statuses from already-loaded servers
    const servers = useServerStore.getState().servers;
    prevStatusRef.current = Object.fromEntries(servers.map(s => [s.id, s.status]));

    // Start poller at current setting
    startPoller(useSettingsStore.getState().refreshInterval);

    // Re-start poller only when refreshInterval changes
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
