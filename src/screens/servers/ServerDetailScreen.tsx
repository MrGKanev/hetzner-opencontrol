import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation';
import { getServer, powerOnServer, powerOffServer, rebootServer, resetServer, shutdownServer } from '../../api/servers';
import { useServerStore } from '../../store/serverStore';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { ActionSheetModal, showActionSheet, type ActionSheetOption } from '../../components/common/ActionSheet';
import { Haptics } from '../../services/haptics';
import type { Server } from '../../models';

type Props = NativeStackScreenProps<RootStackParamList, 'ServerDetail'>;

type Tab = 'overview' | 'metrics';

export default function ServerDetailScreen({ route, navigation }: Props) {
  const { serverId } = route.params;
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [sheetVisible, setSheetVisible] = useState(false);

  const { updateServerInList } = useServerStore();

  const load = useCallback(async () => {
    try {
      const s = await getServer(serverId);
      setServer(s);
      updateServerInList(s);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => { load(); }, []);

  const runAction = async (label: string, fn: () => Promise<any>) => {
    Haptics.warning();
    Alert.alert(label, `Are you sure you want to ${label.toLowerCase()} this server?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label,
        style: 'destructive',
        onPress: async () => {
          Haptics.heavy();
          setActionLoading(true);
          try {
            await fn();
            Haptics.success();
            await load();
          } catch (e: any) {
            Haptics.error();
            Alert.alert('Error', e.message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const buildOptions = (s: Server): ActionSheetOption[] => {
    const isRunning = s.status === 'running';
    const isOff = s.status === 'off';
    const opts: ActionSheetOption[] = [];
    if (isRunning) {
      opts.push(
        { label: 'Power Off', icon: '⏻', destructive: true },
        { label: 'Graceful Shutdown', icon: '⏹' },
        { label: 'Reboot', icon: '↺' },
        { label: 'Hard Reset', icon: '⚠️', destructive: true },
      );
    }
    if (isOff) {
      opts.push({ label: 'Power On', icon: '▶️' });
    }
    opts.push(
      { label: 'Open Console', icon: '🖥' },
      { label: 'Enable Rescue Mode', icon: '🛟' },
      { label: 'Attach ISO', icon: '💿' },
      { label: 'Edit Server', icon: '✏️' },
      { label: 'Change Server Type', icon: '⇅' },
      { label: 'Protection Settings', icon: '🔒' },
      { label: 'Reverse DNS', icon: '🔄' },
    );
    return opts;
  };

  const showActions = () => {
    if (!server) return;
    const options = buildOptions(server);
    if (Platform.OS === 'ios') {
      showActionSheet({ title: server.name, options, onSelect: i => handleActionIndex(i, options, server) });
    } else {
      setSheetVisible(true);
    }
  };

  const handleActionIndex = (index: number, options: ActionSheetOption[], s: Server) => {
    switch (options[index].label) {
      case 'Power Off': runAction('Power Off', () => powerOffServer(s.id)); break;
      case 'Graceful Shutdown': runAction('Shutdown', () => shutdownServer(s.id)); break;
      case 'Reboot': runAction('Reboot', () => rebootServer(s.id)); break;
      case 'Hard Reset': runAction('Hard Reset', () => resetServer(s.id)); break;
      case 'Power On': runAction('Power On', () => powerOnServer(s.id)); break;
      case 'Open Console': navigation.navigate('VncConsole', { serverId: s.id, serverName: s.name }); break;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!server) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.serverName} numberOfLines={1}>{server.name}</Text>
        <TouchableOpacity onPress={showActions} disabled={actionLoading}>
          {actionLoading
            ? <ActivityIndicator color={Colors.primary} size="small" />
            : <Text style={styles.menuIcon}>•••</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'overview' && styles.tabActive]}
          onPress={() => setTab('overview')}
        >
          <Text style={[styles.tabText, tab === 'overview' && styles.tabTextActive]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'metrics' && styles.tabActive]}
          onPress={() => navigation.navigate('ServerMetrics', { serverId: server.id })}
        >
          <Text style={[styles.tabText]}>Metrics</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* General Info */}
        <Section title="General Information">
          <InfoRow label="Name" value={server.name} />
          <InfoRow label="Status" value={server.status} valueColor={server.status === 'running' ? Colors.success : Colors.textMuted} />
          <InfoRow label="Created" value={new Date(server.created).toLocaleString()} />
          <InfoRow label="Type" value={server.server_type.name} />
          <InfoRow label="Cores" value={String(server.server_type.cores)} />
          <InfoRow label="Memory" value={`${server.server_type.memory} GB`} />
          <InfoRow label="Disk" value={`${server.server_type.disk} GB`} />
          <InfoRow label="Architecture" value={server.server_type.architecture} />
        </Section>

        {/* Network */}
        <Section title="Network">
          {server.public_net.ipv4 && (
            <InfoRow label="IPv4" value={server.public_net.ipv4.ip} copyable />
          )}
          {server.public_net.ipv6 && (
            <InfoRow label="IPv6" value={server.public_net.ipv6.ip} copyable />
          )}
        </Section>

        {/* Location */}
        <Section title="Location">
          <InfoRow label="Datacenter" value={server.datacenter.name} />
          <InfoRow label="City" value={server.datacenter.location.city} />
          <InfoRow label="Country" value={server.datacenter.location.country} />
        </Section>

        {/* Protection */}
        <Section title="Protection">
          <InfoRow label="Delete" value={server.protection.delete ? 'Enabled' : 'Disabled'} />
          <InfoRow label="Rebuild" value={server.protection.rebuild ? 'Enabled' : 'Disabled'} />
        </Section>
      </ScrollView>

      {/* Android Action Sheet */}
      <ActionSheetModal
        visible={sheetVisible}
        title={server.name}
        options={buildOptions(server)}
        onSelect={i => handleActionIndex(i, buildOptions(server), server)}
        onCancel={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value, valueColor, copyable }: {
  label: string;
  value: string;
  valueColor?: string;
  copyable?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]} numberOfLines={1}>
        {value}
        {copyable ? '  📋' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backIcon: { color: Colors.primary, fontSize: 30, fontWeight: '300', marginRight: 4 },
  serverName: { ...Typography.h2, flex: 1 },
  menuIcon: { color: Colors.primary, fontSize: 18, fontWeight: '700', letterSpacing: 2 },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: BorderRadius.sm },
  tabActive: { backgroundColor: Colors.surface },
  tabText: { ...Typography.bodySmall, fontWeight: '500' },
  tabTextActive: { color: Colors.textPrimary },

  content: { padding: Spacing.lg, gap: Spacing.md },

  section: { gap: Spacing.sm },
  sectionTitle: { ...Typography.h3 },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  infoLabel: { ...Typography.bodySmall },
  infoValue: { ...Typography.body, flex: 1, textAlign: 'right' },
});
