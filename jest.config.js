const rnPackages = [
  "react-native",
  "@react-native",
  "@react-navigation",
  "@react-native-async-storage",
  "@react-native-community",
  "react-native-gesture-handler",
  "react-native-safe-area-context",
  "react-native-screens",
  "react-native-vector-icons",
  "react-native-keychain",
  "react-native-biometrics",
  "react-native-webview",
  "react-native-svg",
  "react-native-haptic-feedback",
  "react-native-gifted-charts",
  "@notifee",
].join("|");

module.exports = {
  preset: "@react-native/jest-preset",
  setupFilesAfterEnv: ["./jest.setup.js"],
  transformIgnorePatterns: [
    // Flat node_modules: ignore everything except RN packages
    `node_modules/(?!\\.pnpm)(?!(${rnPackages})/)`,
    // pnpm virtual store: same exception list at the real module path
    `node_modules/\\.pnpm/[^/]+/node_modules/(?!(${rnPackages})/)`,
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/assets/**",
    "!src/**/*.d.ts",
  ],
};
