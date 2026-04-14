import React, { useEffect, useState, useCallback } from 'react';
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
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getPrimaryIPs, deletePrimaryIP, unassignPrimaryIP } from '../../api/networking';
import type { PrimaryIP } from '../../models';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';
import { ActionSheetModal, showActionSheet } from '../../components/common/ActionSheet';

const assignedActions = [
  { label: 'Copy IP', icon: '📋' },
  { label: 'Unassign', icon: '⏏️' },
  { label: 'Delete', icon: '🗑', destructive: true },
];

const freeActions = [
  { label: 'Copy IP', icon: '📋' },
  { label: 'Delete', icon: '🗑', destructive: true },
];

export default function PrimaryIpListScreen() {
  const [ips, setIps] = useState<PrimaryIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<PrimaryIP | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const colors = useColors();
  const styles = makeStyles(colors);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setIps(await getPrimaryIPs());
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getActions = (ip: PrimaryIP) => ip.assignee_id !== null ? assignedActions : freeActions;

  const openActions = (ip: PrimaryIP) => {
    setSelected(ip);
    if (Platform.OS === 'ios') {
      showActionSheet({
        title: ip.name || ip.ip,
        options: getActions(ip),
        onSelect: i => handleAction(i, getActions(ip), ip),
      });
    } else {
      setSheetVisible(true);
    }
  };

  const handleAction = async (index: number, actions: typeof assignedActions, ip: PrimaryIP) => {
    const label = actions[index].label;
    switch (label) {
      case 'Copy IP':
        Clipboard.setString(ip.ip);
        Alert.alert('Copied', `${ip.ip} copied to clipboard`);
        break;

      case 'Unassign':
        Alert.alert('Unassign IP', `Unassign ${ip.ip} from server?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unassign',
            onPress: async () => {
              try {
                await unassignPrimaryIP(ip.id);
                setIps(prev => prev.map(i => i.id === ip.id ? { ...i, assignee_id: null } : i));
              } catch (e: any) { Alert.alert('Error', e.message); }
            },
          },
        ]);
        break;

      case 'Delete':
        Alert.alert('Delete Primary IP', `Delete ${ip.ip}? This cannot be undone.`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete', style: 'destructive',
            onPress: async () => {
              try {
                await deletePrimaryIP(ip.id);
                setIps(prev => prev.filter(i => i.id !== ip.id));
              } catch (e: any) { Alert.alert('Error', e.message); }
            },
          },
        ]);
        break;
    }
  };

  const renderItem = ({ item }: { item: PrimaryIP }) => {
    const isAssigned = item.assignee_id !== null;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openActions(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardLeft}>
          <View style={styles.iconWrap}>
            <Icon name={item.type === 'ipv6' ? 'ip-network-outline' : 'ip'} size={18} color={colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.ip}>{item.ip}</Text>
            <Text style={styles.meta}>
              {item.type.toUpperCase()}  ·  {item.datacenter.location.name}
              {item.auto_delete ? '  ·  Auto-delete' : ''}
            </Text>
          </View>
        </View>
        <View style={[styles.badge, isAssigned ? styles.badgeAssigned : styles.badgeFree]}>
          <Text style={[styles.badgeText, { color: isAssigned ? colors.primary : colors.textMuted }]}>
            {isAssigned ? 'In use' : 'Free'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Primary IPs</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={ips}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Icon name="ip-network-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No Primary IPs</Text>
            </View>
          }
        />
      )}

      <ActionSheetModal
        visible={sheetVisible}
        title={selected ? (selected.name || selected.ip) : undefined}
        options={selected ? getActions(selected) : []}
        onSelect={i => { if (selected) handleAction(i, getActions(selected), selected); }}
        onCancel={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { ...Typography.h1, color: c.textPrimary },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md, marginTop: 40 },
  emptyText: { ...Typography.body, color: c.textSecondary },
  card: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  info: { flex: 1 },
  name: { ...Typography.body, color: c.textPrimary, fontWeight: '600' },
  ip: { ...Typography.body, color: c.textPrimary, fontFamily: 'monospace', fontWeight: '500' },
  meta: { ...Typography.caption, color: c.textMuted, marginTop: 2 },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  badgeAssigned: { backgroundColor: c.primary + '22' },
  badgeFree: { backgroundColor: c.surface },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
