const reactNativeConfig = require('@react-native/eslint-config/flat');

module.exports = [
  ...reactNativeConfig,
  {
    ignores: ['node_modules/', 'android/', 'ios/', 'scripts/'],
  },
];
