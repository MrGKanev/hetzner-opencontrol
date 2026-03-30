import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation';
import { requestConsole } from '../../api/servers';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'VncConsole'>;

export default function VncConsoleScreen({ route, navigation }: Props) {
  const { serverId, serverName } = route.params;
  const [consoleUrl, setConsoleUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    loadConsole();
  }, []);

  const loadConsole = async () => {
    setLoading(true);
    try {
      const { wss_url, password } = await requestConsole(serverId);
      // Build noVNC URL — use a self-hosted or bundled noVNC page
      // The URL is the Hetzner WSS endpoint, we wrap it with noVNC
      const novncUrl = buildNoVncUrl(wss_url, password);
      setConsoleUrl(novncUrl);
    } catch (e: any) {
      Alert.alert('Error', e.message, [{ text: 'Close', onPress: () => navigation.goBack() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.serverName} numberOfLines={1}>{serverName}</Text>
          <TouchableOpacity onPress={loadConsole} style={styles.refreshBtn}>
            <Text style={styles.refreshIcon}>↺</Text>
          </TouchableOpacity>
        </View>
        {/* Status bar */}
        <View style={styles.statusBar}>
          <View style={[styles.statusDot, { backgroundColor: connected ? Colors.success : Colors.warning }]} />
          <Text style={styles.statusText}>{connected ? 'Connected' : 'Connecting...'}</Text>
        </View>
      </SafeAreaView>

      {/* Console */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Requesting console access...</Text>
        </View>
      ) : consoleUrl ? (
        <WebView
          source={{ uri: consoleUrl }}
          style={styles.webview}
          onLoadStart={() => setConnected(false)}
          onLoadEnd={() => setConnected(true)}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
        />
      ) : null}

      {/* Status Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Text style={styles.footerText}>Connected to console</Text>
      </SafeAreaView>
    </View>
  );
}

function buildNoVncUrl(wssUrl: string, password: string): string {
  // Uses the public noVNC web client hosted at novnc.com
  // or can be self-hosted/bundled in assets
  const encoded = encodeURIComponent(wssUrl);
  const encodedPass = encodeURIComponent(password);
  return `https://novnc.com/noVNC/vnc.html?autoconnect=true&reconnect=true&password=${encodedPass}&path=${encoded}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerSafe: { backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  closeBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  closeBtnText: { color: Colors.textPrimary, fontWeight: '600' },
  serverName: { ...Typography.body, flex: 1, textAlign: 'center', fontWeight: '600' },
  refreshBtn: { padding: Spacing.sm },
  refreshIcon: { color: Colors.primary, fontSize: 22 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...Typography.bodySmall, fontWeight: '500' },
  webview: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { ...Typography.bodySmall },
  footer: { backgroundColor: Colors.surface },
  footerText: { ...Typography.caption, textAlign: 'center', paddingVertical: Spacing.sm },
});
