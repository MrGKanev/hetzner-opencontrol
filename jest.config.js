module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-gesture-handler|react-native-safe-area-context|react-native-screens|react-native-vector-icons|react-native-keychain|react-native-biometrics|react-native-webview|react-native-svg|react-native-haptic-feedback|react-native-gifted-charts|@notifee)/)',
  ],
};
