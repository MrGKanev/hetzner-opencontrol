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
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Icon name="cloud-outline" size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandName}>OpenControl</Text>
              <Text style={styles.brandSub}>Hetzner Cloud</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={styles.settingsBtn}
            >
              <Icon name="cog-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <GlobeView markers={mapMarkers} height={260} />
        </View>

        {/* Resource Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ALL LOCATIONS</Text>
          {isLoading && !counts ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />
          ) : (
            <View style={styles.grid}>
              <ResourceCard label="Servers" count={counts?.servers ?? 0} />
              <ResourceCard label="Load Balancers" count={counts?.loadBalancers ?? 0} />
              <ResourceCard label="Primary IPs" count={counts?.primaryIPs ?? 0} />
              <ResourceCard label="Floating IPs" count={counts?.floatingIPs ?? 0} />
              <ResourceCard label="Volumes" count={counts?.volumes ?? 0} />
              <ResourceCard label="Firewalls" count={counts?.firewalls ?? 0} />
              <ResourceCard label="Networks" count={counts?.networks ?? 0} />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ResourceCard({ label, count }: { label: string; count: number }) {
  return (
    <View style={styles.resourceCard}>
      <Text style={styles.resourceCount}>{count}</Text>
      <Text style={styles.resourceLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  settingsBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { ...Typography.h2, lineHeight: 22 },
  brandSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 1 },
  mapContainer: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  section: { padding: Spacing.lg },
  sectionLabel: { ...Typography.label, marginBottom: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  resourceCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    width: '47%',
    minHeight: 72,
    justifyContent: 'center',
  },
  resourceCount: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  resourceLabel: { ...Typography.bodySmall, marginTop: 2 },
});
