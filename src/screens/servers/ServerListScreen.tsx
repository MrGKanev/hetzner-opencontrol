import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useServerStore } from '../../store/serverStore';
import { powerOnServer, powerOffServer, rebootServer, deleteServer } from '../../api/servers';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { ActionSheetModal, showActionSheet } from '../../components/common/ActionSheet';
import { Haptics } from '../../services/haptics';
import type { RootStackParamList } from '../../navigation';
import type { Server, ServerStatus } from '../../models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const runningActions = [
  { label: 'View Details', icon: 'monitor' },
  { label: 'Open Console', icon: 'console' },
  { label: 'Reboot', icon: 'restart' },
  { label: 'Power Off', icon: 'power', destructive: true },
  { label: 'Delete', icon: 'delete-outline', destructive: true },
];

const offActions = [
  { label: 'View Details', icon: 'monitor' },
  { label: 'Power On', icon: 'play-circle-outline' },
  { label: 'Delete', icon: 'delete-outline', destructive: true },
];

export default function ServerListScreen() {
  const navigation = useNavigation<Nav>();
  const { servers, fetchServers, refreshServers, isLoading } = useServerStore();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selected, setSelected] = useState<Server | null>(null);

  useEffect(() => { fetchServers(); }, []);

  const getActions = (server: Server) =>
    server.status === 'running' ? runningActions : offActions;

  const openActions = (server: Server) => {
    Haptics.light();
    setSelected(server);
    const actions = getActions(server);
    if (Platform.OS === 'ios') {
      showActionSheet({
        title: server.name,
        options: actions,
        onSelect: i => handleAction(i, actions, server),
      });
    } else {
      setSheetVisible(true);
    }
  };

  const handleAction = async (
    index: number,
    actions: typeof runningActions,
    server: Server,
  ) => {
    const label = actions[index].label;
    switch (label) {
      case 'View Details':
        navigation.navigate('ServerDetail', { serverId: server.id });
        break;
      case 'Open Console':
        navigation.navigate('VncConsole', { serverId: server.id, serverName: server.name });
        break;
      case 'Reboot':
        Haptics.warning();
        Alert.alert('Reboot', `Reboot "${server.name}"?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reboot', onPress: () => { Haptics.medium(); rebootServer(server.id).then(() => { Haptics.success(); refreshServers(); }); } },
        ]);
        break;
      case 'Power Off':
        Haptics.warning();
        Alert.alert('Power Off', `Power off "${server.name}"?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Power Off', style: 'destructive', onPress: () => { Haptics.heavy(); powerOffServer(server.id).then(() => { Haptics.success(); refreshServers(); }); } },
        ]);
        break;
      case 'Power On':
        Haptics.medium();
        await powerOnServer(server.id);
        Haptics.success();
        refreshServers();
        break;
      case 'Delete':
        Haptics.warning();
        Alert.alert('Delete Server', `Delete "${server.name}"? This cannot be undone.`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete', style: 'destructive',
            onPress: async () => {
              Haptics.heavy();
              try {
                await deleteServer(server.id);
                Haptics.success();
                refreshServers();
              } catch (e: any) { Haptics.error(); Alert.alert('Error', e.message); }
            },
          },
        ]);
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
            <ServerRow
              server={item}
              onPress={() => navigation.navigate('ServerDetail', { serverId: item.id })}
              onLongPress={() => openActions(item)}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No servers found</Text>}
        />
      )}

      <ActionSheetModal
        visible={sheetVisible}
        title={selected?.name}
        options={selected ? getActions(selected) : []}
        onSelect={i => {
          if (selected) handleAction(i, getActions(selected), selected);
        }}
        onCancel={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

function ServerRow({
  server,
  onPress,
  onLongPress,
}: {
  server: Server;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const statusColor = getStatusColor(server.status);
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      activeOpacity={0.7}
    >
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
