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
import { novncHtml, buildNovncHash } from '../../assets/novncHtml';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';

type Props = NativeStackScreenProps<RootStackParamList, 'VncConsole'>;

export default function VncConsoleScreen({ route, navigation }: Props) {
  const { serverId, serverName } = route.params;
  const [consoleUrl, setConsoleUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const colors = useColors();
  const styles = makeStyles(colors);

  useEffect(() => {
    loadConsole();
  }, []);

  const loadConsole = async () => {
    setLoading(true);
    try {
      const { wss_url, password } = await requestConsole(serverId);
      setConsoleUrl(buildNovncHash(wss_url, password));
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
          <View style={[styles.statusDot, { backgroundColor: connected ? colors.success : colors.warning }]} />
          <Text style={styles.statusText}>{connected ? 'Connected' : 'Connecting...'}</Text>
        </View>
      </SafeAreaView>

      {/* Console */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Requesting console access...</Text>
        </View>
      ) : consoleUrl ? (
        <WebView
          source={{ html: novncHtml, baseUrl: consoleUrl }}
          style={styles.webview}
          onLoadStart={() => setConnected(false)}
          onLoadEnd={() => setConnected(true)}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
        />
      ) : null}

      {/* Status Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Text style={styles.footerText}>Connected to console</Text>
      </SafeAreaView>
    </View>
  );
}


const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  headerSafe: { backgroundColor: c.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  closeBtn: {
    backgroundColor: c.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  closeBtnText: { color: c.textPrimary, fontWeight: '600' },
  serverName: { ...Typography.body, color: c.textPrimary, flex: 1, textAlign: 'center', fontWeight: '600' },
  refreshBtn: { padding: Spacing.sm },
  refreshIcon: { color: c.primary, fontSize: 22 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...Typography.bodySmall, color: c.textSecondary, fontWeight: '500' },
  webview: { flex: 1, backgroundColor: c.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { ...Typography.bodySmall, color: c.textSecondary },
  footer: { backgroundColor: c.surface },
  footerText: { ...Typography.caption, color: c.textMuted, textAlign: 'center', paddingVertical: Spacing.sm },
});
