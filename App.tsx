import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Navigation from './src/navigation';
import { useAuthStore } from './src/store/authStore';
import { Colors } from './src/theme';

export default function App() {
  const { tryRestoreSession, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      tryRestoreSession().then(restored => {
        if (restored) {
          useAuthStore.setState({ isAuthenticated: true });
        }
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
