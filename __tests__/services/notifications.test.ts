// Override the global notifee mock to include AndroidImportance
jest.mock('@notifee/react-native', () => ({
  requestPermission: jest.fn(() => Promise.resolve({ authorizationStatus: 1 })),
  createChannel: jest.fn(() => Promise.resolve('server-status')),
  displayNotification: jest.fn(() => Promise.resolve()),
  AndroidImportance: { HIGH: 3, DEFAULT: 2, LOW: 1, NONE: 0 },
}));

import notifee from '@notifee/react-native';
import {
  requestNotificationPermission,
  sendServerStatusNotification,
} from '../../src/services/notifications';

const mockNotifee = notifee as jest.Mocked<typeof notifee>;

beforeEach(() => {
  jest.clearAllMocks();
});

// ── requestNotificationPermission ─────────────────────────────────────────────

describe('requestNotificationPermission', () => {
  it('returns true when authorizationStatus >= 1', async () => {
    mockNotifee.requestPermission.mockResolvedValueOnce({
      authorizationStatus: 1,
    } as any);
    const result = await requestNotificationPermission();
    expect(result).toBe(true);
  });

  it('returns true when authorizationStatus > 1', async () => {
    mockNotifee.requestPermission.mockResolvedValueOnce({
      authorizationStatus: 2,
    } as any);
    const result = await requestNotificationPermission();
    expect(result).toBe(true);
  });

  it('returns false when authorizationStatus is 0 (denied)', async () => {
    mockNotifee.requestPermission.mockResolvedValueOnce({
      authorizationStatus: 0,
    } as any);
    const result = await requestNotificationPermission();
    expect(result).toBe(false);
  });

  it('returns false when authorizationStatus is negative', async () => {
    mockNotifee.requestPermission.mockResolvedValueOnce({
      authorizationStatus: -1,
    } as any);
    const result = await requestNotificationPermission();
    expect(result).toBe(false);
  });
});

// ── sendServerStatusNotification ──────────────────────────────────────────────

describe('sendServerStatusNotification', () => {
  beforeEach(() => {
    mockNotifee.createChannel.mockResolvedValue('server-status');
  });

  it('creates the notification channel before displaying', async () => {
    await sendServerStatusNotification('web-01', 'off', 'running');
    expect(mockNotifee.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'server-status',
        name: 'Server Status',
      }),
    );
  });

  it('displays a notification with the server name and status change', async () => {
    await sendServerStatusNotification('web-01', 'off', 'running');
    expect(mockNotifee.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Server: web-01',
        body: 'Status changed: Off → Running',
      }),
    );
  });

  it('capitalizes the old and new status in the notification body', async () => {
    await sendServerStatusNotification('db-01', 'starting', 'running');
    expect(mockNotifee.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        body: 'Status changed: Starting → Running',
      }),
    );
  });

  it('includes the correct Android channel id and press action', async () => {
    await sendServerStatusNotification('srv', 'off', 'running');
    expect(mockNotifee.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        android: expect.objectContaining({
          channelId: 'server-status',
          pressAction: { id: 'default' },
        }),
      }),
    );
  });

  it('always creates the channel even when called multiple times', async () => {
    await sendServerStatusNotification('a', 'off', 'running');
    await sendServerStatusNotification('b', 'running', 'off');
    expect(mockNotifee.createChannel).toHaveBeenCalledTimes(2);
  });
});
