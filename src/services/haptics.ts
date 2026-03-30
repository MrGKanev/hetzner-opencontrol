import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = { enableVibrateFallback: true, ignoreAndroidSystemSettings: false };

export const Haptics = {
  // Light tap — for navigation, toggle, select
  light: () => ReactNativeHapticFeedback.trigger('impactLight', options),

  // Medium — for buttons, confirm
  medium: () => ReactNativeHapticFeedback.trigger('impactMedium', options),

  // Heavy — for destructive actions (power off, delete)
  heavy: () => ReactNativeHapticFeedback.trigger('impactHeavy', options),

  // Success — after a successful operation
  success: () => ReactNativeHapticFeedback.trigger('notificationSuccess', options),

  // Error — on error
  error: () => ReactNativeHapticFeedback.trigger('notificationError', options),

  // Warning — for confirming dangerous actions
  warning: () => ReactNativeHapticFeedback.trigger('notificationWarning', options),
};
