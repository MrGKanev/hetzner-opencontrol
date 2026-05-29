jest.mock('../../src/api/servers', () => ({ getServers: jest.fn() }));
jest.mock('../../src/services/notifications', () => ({
  sendServerStatusNotification: jest.fn(),
}));
jest.mock('../../src/api/queryClient', () => ({
  queryClient: { getQueryData: jest.fn(() => undefined), setQueryData: jest.fn() },
}));
jest.mock('../../src/hooks/useServersQuery', () => ({
  SERVERS_KEY: ['servers'],
}));

import { renderHook, act } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { getServers } from '../../src/api/servers';
import { sendServerStatusNotification } from '../../src/services/notifications';
import { queryClient } from '../../src/api/queryClient';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useAuthStore } from '../../src/store/authStore';
import { useServerPoller } from '../../src/services/serverPoller';

const mockGetServers = getServers as jest.Mock;
const mockNotify = sendServerStatusNotification as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  useSettingsStore.setState({ refreshInterval: 0, notificationsEnabled: false, hapticsEnabled: true });
  useAuthStore.setState({ isAuthenticated: true, isLoading: false, error: null, biometricType: 'none' });
  (AppState as any).currentState = 'active';
  mockGetServers.mockResolvedValue([]);
  (queryClient.getQueryData as jest.Mock).mockReturnValue(undefined);
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

// ── start / stop ──────────────────────────────────────────────────────────────

it('does not start polling when refreshInterval is 0', () => {
  renderHook(() => useServerPoller());
  jest.runAllTimers();
  expect(mockGetServers).not.toHaveBeenCalled();
});

it('polls at the configured interval', async () => {
  useSettingsStore.setState({ refreshInterval: 30 });
  renderHook(() => useServerPoller());

  await act(async () => {
    jest.advanceTimersByTime(30_000);
  });
  expect(mockGetServers).toHaveBeenCalledTimes(1);

  await act(async () => {
    jest.advanceTimersByTime(30_000);
  });
  expect(mockGetServers).toHaveBeenCalledTimes(2);
});

it('clears the interval on unmount', async () => {
  useSettingsStore.setState({ refreshInterval: 30 });
  const { unmount } = renderHook(() => useServerPoller());
  unmount();

  await act(async () => {
    jest.advanceTimersByTime(60_000);
  });
  expect(mockGetServers).not.toHaveBeenCalled();
});

// ── auth / AppState guards ────────────────────────────────────────────────────

it('skips a tick when not authenticated', async () => {
  useAuthStore.setState({ isAuthenticated: false });
  useSettingsStore.setState({ refreshInterval: 30 });
  renderHook(() => useServerPoller());

  await act(async () => {
    jest.advanceTimersByTime(30_000);
  });
  expect(mockGetServers).not.toHaveBeenCalled();
});

it('skips a tick when app is in background', async () => {
  (AppState as any).currentState = 'background';
  useSettingsStore.setState({ refreshInterval: 30 });
  renderHook(() => useServerPoller());

  await act(async () => {
    jest.advanceTimersByTime(30_000);
  });
  expect(mockGetServers).not.toHaveBeenCalled();
});

// ── status change notifications ───────────────────────────────────────────────

it('sends a notification when a server status changes', async () => {
  useSettingsStore.setState({ refreshInterval: 30, notificationsEnabled: true });

  const servers = [{ id: 1, name: 'web-01', status: 'running' }];
  mockGetServers.mockResolvedValue(servers);

  // Pre-populate prevStatusRef by making one poll to establish baseline
  renderHook(() => useServerPoller());
  await act(async () => { jest.advanceTimersByTime(30_000); });

  // Now server goes offline on the second poll
  mockGetServers.mockResolvedValue([{ id: 1, name: 'web-01', status: 'off' }]);
  await act(async () => { jest.advanceTimersByTime(30_000); });

  expect(mockNotify).toHaveBeenCalledWith('web-01', 'running', 'off');
});

it('does not notify when notifications are disabled', async () => {
  useSettingsStore.setState({ refreshInterval: 30, notificationsEnabled: false });
  const servers = [{ id: 1, name: 'web-01', status: 'running' }];
  mockGetServers.mockResolvedValue(servers);

  renderHook(() => useServerPoller());
  await act(async () => { jest.advanceTimersByTime(30_000); });
  mockGetServers.mockResolvedValue([{ id: 1, name: 'web-01', status: 'off' }]);
  await act(async () => { jest.advanceTimersByTime(30_000); });

  expect(mockNotify).not.toHaveBeenCalled();
});

it('updates queryClient cache after each poll', async () => {
  useSettingsStore.setState({ refreshInterval: 30 });
  const servers = [{ id: 1, name: 'web-01', status: 'running' }];
  mockGetServers.mockResolvedValue(servers);

  renderHook(() => useServerPoller());
  await act(async () => { jest.advanceTimersByTime(30_000); });

  expect(queryClient.setQueryData).toHaveBeenCalledWith(['servers'], servers);
});

it('silently ignores polling errors', async () => {
  useSettingsStore.setState({ refreshInterval: 30 });
  mockGetServers.mockRejectedValue(new Error('Network error'));

  renderHook(() => useServerPoller());
  await expect(
    act(async () => { jest.advanceTimersByTime(30_000); }),
  ).resolves.not.toThrow();
});

// ── dynamic interval change ───────────────────────────────────────────────────

it('restarts with a new interval when refreshInterval changes', async () => {
  useSettingsStore.setState({ refreshInterval: 60 });
  renderHook(() => useServerPoller());

  // Tick at 60s
  await act(async () => { jest.advanceTimersByTime(60_000); });
  expect(mockGetServers).toHaveBeenCalledTimes(1);

  // Change interval to 30s
  act(() => useSettingsStore.setState({ refreshInterval: 30 }));

  // Only 30s later it should fire again (not 60s)
  await act(async () => { jest.advanceTimersByTime(30_000); });
  expect(mockGetServers).toHaveBeenCalledTimes(2);
});
