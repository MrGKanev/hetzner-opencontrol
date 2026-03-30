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

import { useServerStore } from '../../store/serverStore';
import { getLocations } from '../../api/locations';
import { getFloatingIPs, getPrimaryIPs, getLoadBalancers, getFirewalls, getNetworks } from '../../api/networking';
import { getVolumes } from '../../api/volumes';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import WorldMap, { type MapMarker } from '../../components/common/WorldMap';
import type { Location } from '../../models';

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

      const activeLocationNames = new Set(servers.map(s => s.datacenter.location.name));

      setMapMarkers(locs.map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        label: `${loc.city} (${loc.name})`,
        active: activeLocationNames.has(loc.name),
      })));

      setCounts({
        servers: servers.length,
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
          <Text style={styles.title}>Dashboard</Text>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <WorldMap markers={mapMarkers} height={200} />
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
  title: { ...Typography.h1 },
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
