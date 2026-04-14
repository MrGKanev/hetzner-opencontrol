import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useSettingsStore } from '../store/settingsStore';

const options = { enableVibrateFallback: true, ignoreAndroidSystemSettings: false };

function trigger(type: string) {
  if (!useSettingsStore.getState().hapticsEnabled) return;
  ReactNativeHapticFeedback.trigger(type as any, options);
}

export const Haptics = {
  // Light tap - for navigation, toggle, select
  light: () => trigger('impactLight'),

  // Medium - for buttons, confirm
  medium: () => trigger('impactMedium'),

  // Heavy - for destructive actions (power off, delete)
  heavy: () => trigger('impactHeavy'),

  // Success - after a successful operation
  success: () => trigger('notificationSuccess'),

  // Error - on error
  error: () => trigger('notificationError'),

  // Warning - for confirming dangerous actions
  warning: () => trigger('notificationWarning'),
};
