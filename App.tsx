import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Navigation from './src/navigation';
import { useAuthStore } from './src/store/authStore';
import { useProjectsStore } from './src/store/projectsStore';
import { Colors } from './src/theme';
import { useServerPoller } from './src/services/serverPoller';

export default function App() {
  const { tryRestoreSession, isAuthenticated } = useAuthStore();
  useServerPoller();

  useEffect(() => {
    if (!isAuthenticated) {
      tryRestoreSession()
        .then(async (restored) => {
          if (restored) {
            useAuthStore.setState({ isAuthenticated: true });
          } else {
            // Only auto-restore projects if biometrics are NOT active.
            // When biometrics are enabled, the user must authenticate manually
            // on the LoginScreen — same guard as tryRestoreSession itself.
            const { biometricType } = useAuthStore.getState();
            if (biometricType === 'none') {
              await useProjectsStore.getState().tryRestoreActiveProject();
            }
          }
        })
        .catch(() => {
          // Session restore failed silently — LoginScreen will be shown.
        });
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <Navigation />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
