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
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getPrimaryIPs } from '../../api/networking';
import type { PrimaryIP } from '../../models';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';

export default function PrimaryIpListScreen() {
  const [ips, setIps] = useState<PrimaryIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const copyIp = (ip: string) => {
    Clipboard.setString(ip);
    Alert.alert('Copied', `${ip} copied to clipboard`);
  };

  const renderItem = ({ item }: { item: PrimaryIP }) => {
    const isAssigned = item.assignee_id !== null;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => copyIp(item.ip)}
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
        <View style={styles.right}>
          <View style={[styles.badge, isAssigned ? styles.badgeAssigned : styles.badgeFree]}>
            <Text style={[styles.badgeText, { color: isAssigned ? colors.primary : colors.textMuted }]}>
              {isAssigned ? 'In use' : 'Free'}
            </Text>
          </View>
          <Icon name="content-copy" size={14} color={colors.textMuted} style={{ marginTop: 6 }} />
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
  right: { alignItems: 'center', marginLeft: Spacing.sm },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeAssigned: { backgroundColor: c.primary + '22' },
  badgeFree: { backgroundColor: c.surface },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
