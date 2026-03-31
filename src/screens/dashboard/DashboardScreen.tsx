import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useServerStore } from '../../store/serverStore';
import { getLocations } from '../../api/locations';
import { getFloatingIPs, getPrimaryIPs, getLoadBalancers, getFirewalls, getNetworks } from '../../api/networking';
import { getVolumes } from '../../api/volumes';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';
import GlobeView, { type GlobeMarker as MapMarker } from '../../components/common/GlobeView';
import type { RootStackParamList } from '../../navigation';
import type { Location } from '../../models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface ResourceCounts {
  servers: number;
  loadBalancers: number;
  primaryIPs: number;
  floatingIPs: number;
  volumes: number;
  firewalls: number;
  networks: number;
}

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { servers, fetchServers, refreshServers, isLoading } = useServerStore();
  const [counts, setCounts] = useState<ResourceCounts | null>(null);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const colors = useColors();
  const styles = makeStyles(colors);

  const loadData = useCallback(async () => {
    await fetchServers();
    try {
      const [locs, lbs, primaryIPs, floatingIPs, volumes, firewalls, networks] = await Promise.all([
        getLocations(),
        getLoadBalancers(),
        getPrimaryIPs(),
        getFloatingIPs(),
        getVolumes(),
        getFirewalls(),
        getNetworks(),
      ]);

      // Read fresh servers from store after fetch completes (avoid stale closure)
      const freshServers = useServerStore.getState().servers;
      const activeLocationNames = new Set(freshServers.map(s => s.datacenter.location.name));

      setMapMarkers(locs.map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        label: `${loc.city} (${loc.name})`,
        active: activeLocationNames.has(loc.name),
      })));

      setCounts({
        servers: freshServers.length,
        loadBalancers: lbs.length,
        primaryIPs: primaryIPs.length,
        floatingIPs: floatingIPs.length,
        volumes: volumes.length,
        firewalls: firewalls.length,
        networks: networks.length,
      });
    } catch {}
  }, [fetchServers, servers]);

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshServers();
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Icon name="cloud-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandName}>OpenControl</Text>
              <Text style={styles.brandSub}>Hetzner Cloud</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={styles.settingsBtn}
            >
              <Icon name="cog-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <GlobeView markers={mapMarkers} height={260} />
        </View>

        {/* Server Status Summary */}
        {servers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SERVERS</Text>
            <View style={styles.statusRow}>
              {(['running', 'off', 'starting', 'stopping'] as const).map(status => {
                const count = servers.filter(s => s.status === status).length;
                if (count === 0) return null;
                const color = status === 'running' ? colors.success
                  : status === 'off' ? colors.textMuted
                  : colors.warning;
                return (
                  <View key={status} style={[styles.statusChip, { borderColor: color + '44', backgroundColor: color + '14' }]}>
                    <View style={[styles.statusDot, { backgroundColor: color }]} />
                    <Text style={[styles.statusChipCount, { color }]}>{count}</Text>
                    <Text style={styles.statusChipLabel}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                  </View>
                );
              })}
            </View>

            {/* Recent servers */}
            <View style={styles.serverList}>
              {servers.slice(0, 4).map(s => {
                const statusColor = s.status === 'running' ? colors.success
                  : s.status === 'off' ? colors.textMuted : colors.warning;
                const ip = s.public_net.ipv4?.ip;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.serverRow}
                    onPress={() => navigation.navigate('ServerDetail', { serverId: s.id })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.serverDot, { backgroundColor: statusColor }]} />
                    <View style={styles.serverInfo}>
                      <Text style={styles.serverName} numberOfLines={1}>{s.name}</Text>
                      <Text style={styles.serverSub}>{s.server_type.name} · {ip ?? s.datacenter.location.name}</Text>
                    </View>
                    <Icon name="chevron-right" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
              {servers.length > 4 && (
                <Text style={styles.moreServers}>+{servers.length - 4} more servers</Text>
              )}
            </View>
          </View>
        )}

        {/* Resource Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ALL RESOURCES</Text>
          {isLoading && !counts ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: Spacing.lg }} />
          ) : (
            <View style={styles.grid}>
              <ResourceCard label="Servers" count={counts?.servers ?? 0} colors={colors} />
              <ResourceCard label="Load Balancers" count={counts?.loadBalancers ?? 0} colors={colors} />
              <ResourceCard label="Primary IPs" count={counts?.primaryIPs ?? 0} colors={colors} />
              <ResourceCard label="Floating IPs" count={counts?.floatingIPs ?? 0} colors={colors} />
              <ResourceCard label="Volumes" count={counts?.volumes ?? 0} colors={colors} />
              <ResourceCard label="Firewalls" count={counts?.firewalls ?? 0} colors={colors} />
              <ResourceCard label="Networks" count={counts?.networks ?? 0} colors={colors} />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ResourceCard({ label, count, colors }: { label: string; count: number; colors: ThemeColors }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.resourceCard}>
      <Text style={styles.resourceCount}>{count}</Text>
      <Text style={styles.resourceLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  settingsBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { ...Typography.h2, color: c.textPrimary, lineHeight: 22 },
  brandSub: { ...Typography.caption, color: c.textMuted, marginTop: 1 },
  mapContainer: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: c.cardBorder,
  },
  section: { padding: Spacing.lg },
  sectionLabel: { ...Typography.label, color: c.textSecondary, marginBottom: Spacing.md },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 5,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusChipCount: { fontSize: 15, fontWeight: '700' },
  statusChipLabel: { ...Typography.bodySmall, color: c.textSecondary },
  serverList: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    overflow: 'hidden',
  },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 3,
    borderBottomWidth: 1,
    borderBottomColor: c.cardBorder,
    gap: Spacing.sm,
  },
  serverDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  serverInfo: { flex: 1 },
  serverName: { ...Typography.body, color: c.textPrimary, fontWeight: '600' },
  serverSub: { ...Typography.caption, color: c.textMuted, marginTop: 1 },
  moreServers: { ...Typography.caption, color: c.textMuted, textAlign: 'center', padding: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  resourceCard: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    padding: Spacing.md,
    width: '47%',
    minHeight: 72,
    justifyContent: 'center',
  },
  resourceCount: { fontSize: 28, fontWeight: '700', color: c.textPrimary },
  resourceLabel: { ...Typography.bodySmall, color: c.textSecondary, marginTop: 2 },
});
