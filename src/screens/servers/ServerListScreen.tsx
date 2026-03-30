import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useServerStore } from '../../store/serverStore';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import type { RootStackParamList } from '../../navigation';
import type { Server, ServerStatus } from '../../models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ServerListScreen() {
  const navigation = useNavigation<Nav>();
  const { servers, fetchServers, refreshServers, isLoading } = useServerStore();

  useEffect(() => { fetchServers(); }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>All Servers</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateServer')}
          style={styles.addBtn}
        >
          <Text style={styles.addIcon}>＋</Text>
        </TouchableOpacity>
      </View>

      {isLoading && servers.length === 0 ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={servers}
          keyExtractor={s => String(s.id)}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refreshServers} tintColor={Colors.primary} />
          }
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <ServerRow server={item} onPress={() => navigation.navigate('ServerDetail', { serverId: item.id })} />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No servers found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

function ServerRow({ server, onPress }: { server: Server; onPress: () => void }) {
  const statusColor = getStatusColor(server.status);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowContent}>
        <Text style={styles.serverName}>{server.name}</Text>
        <Text style={styles.serverMeta}>
          {server.server_type.name.toUpperCase()} | {server.server_type.architecture} | {server.server_type.disk}GB | {server.datacenter.location.name}
        </Text>
      </View>
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {capitalizeFirst(server.status)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function getStatusColor(status: ServerStatus): string {
  switch (status) {
    case 'running': return Colors.success;
    case 'off': return Colors.textMuted;
    case 'starting':
    case 'stopping': return Colors.warning;
    case 'rebuilding':
    case 'migrating': return Colors.info;
    default: return Colors.textMuted;
  }
}

function capitalizeFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: { marginRight: Spacing.sm },
  backIcon: { color: Colors.primary, fontSize: 30, fontWeight: '300' },
  title: { ...Typography.h1, flex: 1 },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: { color: Colors.primary, fontSize: 18 },
  list: { padding: Spacing.lg },
  separator: { height: Spacing.sm },
  row: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowContent: { flex: 1 },
  serverName: { ...Typography.h3 },
  serverMeta: { ...Typography.bodySmall, marginTop: 2 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '500' },
  empty: { ...Typography.bodySmall, textAlign: 'center', marginTop: 40 },
});
