import notifee, { AndroidImportance } from '@notifee/react-native';

const CHANNEL_ID = 'server-status';

async function ensureChannel() {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Server Status',
    importance: AndroidImportance.HIGH,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

export async function sendServerStatusNotification(serverName: string, oldStatus: string, newStatus: string) {
  await ensureChannel();
  await notifee.displayNotification({
    title: `Server: ${serverName}`,
    body: `Status changed: ${capitalise(oldStatus)} → ${capitalise(newStatus)}`,
    android: {
      channelId: CHANNEL_ID,
      smallIcon: 'ic_notification',
      pressAction: { id: 'default' },
    },
  });
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
