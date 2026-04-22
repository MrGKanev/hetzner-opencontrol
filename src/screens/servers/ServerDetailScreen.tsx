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
import { getServer, powerOnServer, powerOffServer, rebootServer, resetServer, shutdownServer, enableRescueMode, rebuildServer, getImages, attachIso, detachIso, getIsos, getServerActions } from '../../api/servers';
import { useServerStore } from '../../store/serverStore';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';
import { ActionSheetModal, showActionSheet, type ActionSheetOption } from '../../components/common/ActionSheet';
import { Haptics } from '../../services/haptics';
import type { Server, Action } from '../../models';

type Props = NativeStackScreenProps<RootStackParamList, 'ServerDetail'>;

type Tab = 'overview' | 'metrics' | 'activities';

export default function ServerDetailScreen({ route, navigation }: Props) {
  const { serverId } = route.params;
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [activities, setActivities] = useState<Action[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const colors = useColors();
  const styles = makeStyles(colors);

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

  useEffect(() => {
    if (tab !== 'activities') return;
    setActivitiesLoading(true);
    getServerActions(serverId)
      .then(setActivities)
      .catch((e: any) => Alert.alert('Error', e.message))
      .finally(() => setActivitiesLoading(false));
  }, [tab]);

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
      { label: 'Rebuild', icon: '🔨', destructive: true },
    );
    if (s.iso !== null) {
      opts.push({ label: 'Detach ISO', icon: '⏏️' });
    } else {
      opts.push({ label: 'Attach ISO', icon: '💿' });
    }
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
      case 'Enable Rescue Mode': handleRescueMode(s); break;
      case 'Rebuild': handleRebuild(s); break;
      case 'Attach ISO': handleAttachIso(s); break;
      case 'Detach ISO': runAction('Detach ISO', () => detachIso(s.id)); break;
    }
  };

  const handleRescueMode = (s: Server) => {
    Haptics.warning();
    Alert.alert(
      'Enable Rescue Mode',
      'Choose rescue system type. The server will boot into rescue mode on next reboot.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'linux64',
          onPress: () => runRescue(s, 'linux64'),
        },
        {
          text: 'freebsd64',
          onPress: () => runRescue(s, 'freebsd64'),
        },
      ],
    );
  };

  const runRescue = async (s: Server, type: 'linux64' | 'freebsd64') => {
    Haptics.heavy();
    setActionLoading(true);
    try {
      const result = await enableRescueMode(s.id, type);
      Haptics.success();
      Alert.alert(
        'Rescue Mode Enabled',
        `Type: ${type}\n\nRoot password:\n${result.root_password}\n\nReboot the server to enter rescue mode.`,
        [{ text: 'OK' }],
      );
      await load();
    } catch (e: any) {
      Haptics.error();
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAttachIso = async (s: Server) => {
    setActionLoading(true);
    let isos: import('../../models').Iso[] = [];
    try {
      isos = await getIsos();
    } catch (e: any) {
      Alert.alert('Error', e.message);
      setActionLoading(false);
      return;
    } finally {
      setActionLoading(false);
    }

    if (isos.length === 0) {
      Alert.alert('No ISOs available');
      return;
    }

    const options = isos.map(iso => ({ label: iso.description, icon: '💿' as string }));

    if (Platform.OS === 'ios') {
      showActionSheet({
        title: 'Choose ISO to Attach',
        options,
        onSelect: i => runAction('Attach ISO', () => attachIso(s.id, isos[i].id)),
      });
    } else {
      Alert.alert(
        'Attach ISO',
        'Choose an ISO to mount:',
        [
          { text: 'Cancel', style: 'cancel' },
          ...isos.slice(0, 5).map(iso => ({
            text: iso.description,
            onPress: () => runAction('Attach ISO', () => attachIso(s.id, iso.id)),
          })),
        ],
      );
    }
  };

  const handleRebuild = async (s: Server) => {
    Haptics.warning();
    setActionLoading(true);
    let images: import('../../models').Image[] = [];
    try {
      images = await getImages('system');
    } catch (e: any) {
      Alert.alert('Error', e.message);
      setActionLoading(false);
      return;
    } finally {
      setActionLoading(false);
    }

    if (images.length === 0) {
      Alert.alert('No images available');
      return;
    }

    const options = images.map(img => ({
      label: img.description,
      icon: '💿' as string,
    }));

    if (Platform.OS === 'ios') {
      showActionSheet({
        title: 'Choose Image to Rebuild',
        options,
        onSelect: i => confirmRebuild(s, images[i]),
      });
    } else {
      // On Android use a simple Alert list (first 3 options as workaround)
      Alert.alert(
        'Rebuild Server',
        'This will erase all data on the server. Choose an image:',
        [
          { text: 'Cancel', style: 'cancel' },
          ...images.slice(0, 5).map(img => ({
            text: img.description,
            onPress: () => confirmRebuild(s, img),
          })),
        ],
      );
    }
  };

  const confirmRebuild = (s: Server, image: import('../../models').Image) => {
    Alert.alert(
      'Confirm Rebuild',
      `Rebuild "${s.name}" with ${image.description}?\n\nAll data will be permanently lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rebuild', style: 'destructive',
          onPress: async () => {
            Haptics.heavy();
            setActionLoading(true);
            try {
              const result = await rebuildServer(s.id, image.name ?? image.id);
              Haptics.success();
              if (result.root_password) {
                Alert.alert('Rebuild Started', `Root password:\n${result.root_password}`);
              }
              await load();
            } catch (e: any) {
              Haptics.error();
              Alert.alert('Error', e.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
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
            ? <ActivityIndicator color={colors.primary} size="small" />
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
        <TouchableOpacity
          style={[styles.tab, tab === 'activities' && styles.tabActive]}
          onPress={() => setTab('activities')}
        >
          <Text style={[styles.tabText, tab === 'activities' && styles.tabTextActive]}>Activity</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'overview' && (
          <>
            {/* General Info */}
            <Section title="General Information" colors={colors}>
              <InfoRow label="Name" value={server.name} colors={colors} />
              <InfoRow label="Status" value={server.status} valueColor={server.status === 'running' ? colors.success : colors.textMuted} colors={colors} />
              <InfoRow label="Created" value={new Date(server.created).toLocaleString()} colors={colors} />
              <InfoRow label="Type" value={server.server_type.name} colors={colors} />
              <InfoRow label="Cores" value={String(server.server_type.cores)} colors={colors} />
              <InfoRow label="Memory" value={`${server.server_type.memory} GB`} colors={colors} />
              <InfoRow label="Disk" value={`${server.server_type.disk} GB`} colors={colors} />
              <InfoRow label="Architecture" value={server.server_type.architecture} colors={colors} />
            </Section>

            {/* Network */}
            <Section title="Network" colors={colors}>
              {server.public_net.ipv4 && (
                <InfoRow label="IPv4" value={server.public_net.ipv4.ip} copyable colors={colors} />
              )}
              {server.public_net.ipv6 && (
                <InfoRow label="IPv6" value={server.public_net.ipv6.ip} copyable colors={colors} />
              )}
            </Section>

            {/* ISO */}
            {server.iso && (
              <Section title="Mounted ISO" colors={colors}>
                <InfoRow label="Name" value={server.iso.description} colors={colors} />
                <InfoRow label="Type" value={server.iso.type} colors={colors} />
              </Section>
            )}

            {/* Location */}
            <Section title="Location" colors={colors}>
              <InfoRow label="Datacenter" value={server.datacenter.name} colors={colors} />
              <InfoRow label="City" value={server.datacenter.location.city} colors={colors} />
              <InfoRow label="Country" value={server.datacenter.location.country} colors={colors} />
            </Section>

            {/* Protection */}
            <Section title="Protection" colors={colors}>
              <InfoRow label="Delete" value={server.protection.delete ? 'Enabled' : 'Disabled'} colors={colors} />
              <InfoRow label="Rebuild" value={server.protection.rebuild ? 'Enabled' : 'Disabled'} colors={colors} />
            </Section>
          </>
        )}

        {tab === 'activities' && (
          activitiesLoading
            ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            : activities.length === 0
              ? <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>No activity found</Text>
              : <ActivityLog actions={activities} colors={colors} />
        )}
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

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: ThemeColors }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value, valueColor, copyable, colors }: {
  label: string;
  value: string;
  valueColor?: string;
  copyable?: boolean;
  colors: ThemeColors;
}) {
  const styles = makeStyles(colors);
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

const ACTION_LABELS: Record<string, string> = {
  poweron: 'Power On',
  poweroff: 'Power Off',
  reboot: 'Reboot',
  reset: 'Hard Reset',
  shutdown: 'Shutdown',
  rebuild: 'Rebuild',
  enable_rescue: 'Enable Rescue Mode',
  disable_rescue: 'Disable Rescue Mode',
  attach_iso: 'Attach ISO',
  detach_iso: 'Detach ISO',
  create_image: 'Create Snapshot',
  change_type: 'Change Type',
  request_console: 'Open Console',
  create_server: 'Create Server',
  delete_server: 'Delete Server',
};

function ActivityLog({ actions, colors }: { actions: Action[]; colors: ThemeColors }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Actions</Text>
      <View style={styles.sectionCard}>
        {actions.map((action, idx) => {
          const label = ACTION_LABELS[action.command] ?? action.command;
          const statusColor =
            action.status === 'success' ? colors.success :
            action.status === 'error' ? '#FF3B30' :
            colors.primary;
          const icon =
            action.status === 'success' ? '✓' :
            action.status === 'error' ? '✕' : '…';
          const started = new Date(action.started).toLocaleString();
          return (
            <View key={action.id} style={[styles.activityRow, idx === actions.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.activityIcon, { backgroundColor: statusColor + '22' }]}>
                <Text style={[styles.activityIconText, { color: statusColor }]}>{icon}</Text>
              </View>
              <View style={styles.activityBody}>
                <Text style={styles.activityLabel}>{label}</Text>
                <Text style={styles.activityTime}>{started}</Text>
              </View>
              {action.status === 'running' && (
                <Text style={[styles.activityProgress, { color: colors.primary }]}>{action.progress}%</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backIcon: { color: c.primary, fontSize: 30, fontWeight: '300', marginRight: 4 },
  serverName: { ...Typography.h2, color: c.textPrimary, flex: 1 },
  menuIcon: { color: c.primary, fontSize: 18, fontWeight: '700', letterSpacing: 2 },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: BorderRadius.sm },
  tabActive: { backgroundColor: c.surface },
  tabText: { ...Typography.bodySmall, color: c.textSecondary, fontWeight: '500' },
  tabTextActive: { color: c.textPrimary },

  content: { padding: Spacing.lg, gap: Spacing.md },

  section: { gap: Spacing.sm },
  sectionTitle: { ...Typography.h3, color: c.textPrimary },
  sectionCard: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: c.cardBorder,
  },
  infoLabel: { ...Typography.bodySmall, color: c.textSecondary },
  infoValue: { ...Typography.body, color: c.textPrimary, flex: 1, textAlign: 'right' },

  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: c.cardBorder,
    gap: Spacing.sm,
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconText: { fontSize: 13, fontWeight: '700' },
  activityBody: { flex: 1 },
  activityLabel: { ...Typography.body, color: c.textPrimary },
  activityTime: { ...Typography.bodySmall, color: c.textSecondary, marginTop: 1 },
  activityProgress: { ...Typography.bodySmall, fontWeight: '600' },
});
