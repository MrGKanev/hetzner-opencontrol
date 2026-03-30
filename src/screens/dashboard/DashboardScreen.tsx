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
import MapView, { Marker } from 'react-native-maps';

import { useServerStore } from '../../store/serverStore';
import { getLocations } from '../../api/locations';
import { getFloatingIPs, getPrimaryIPs, getLoadBalancers, getFirewalls, getNetworks } from '../../api/networking';
import { getVolumes } from '../../api/volumes';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
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
  const [locations, setLocations] = useState<Location[]>([]);
  const [counts, setCounts] = useState<ResourceCounts | null>(null);
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
      setLocations(locs);
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
  }, [fetchServers, servers.length]);

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshServers();
    await loadData();
    setRefreshing(false);
  };

  // Get unique locations where we have servers
  const serverLocations = locations.filter(loc =>
    servers.some(s => s.datacenter.location.name === loc.name)
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>

        {/* Map */}
        <MapView
          style={styles.map}
          customMapStyle={darkMapStyle}
          initialRegion={{ latitude: 51, longitude: 10, latitudeDelta: 60, longitudeDelta: 80 }}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
        >
          {serverLocations.map(loc => (
            <Marker
              key={loc.id}
              coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
              pinColor={Colors.primary}
            />
          ))}
        </MapView>

        {/* Resource Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ALL LOCATIONS</Text>
          {isLoading && !counts ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />
          ) : (
            <View style={styles.grid}>
              <ResourceCard icon="🖥" label="Servers" count={counts?.servers ?? 0} />
              <ResourceCard icon="⚖️" label="Load Balancers" count={counts?.loadBalancers ?? 0} />
              <ResourceCard icon="🌐" label="Primary IPs" count={counts?.primaryIPs ?? 0} />
              <ResourceCard icon="📌" label="Floating IPs" count={counts?.floatingIPs ?? 0} />
              <ResourceCard icon="💾" label="Volumes" count={counts?.volumes ?? 0} />
              <ResourceCard icon="🔥" label="Firewalls" count={counts?.firewalls ?? 0} />
              <ResourceCard icon="🔗" label="Networks" count={counts?.networks ?? 0} />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ResourceCard({ icon, label, count }: { icon: string; label: string; count: number }) {
  return (
    <TouchableOpacity style={styles.resourceCard} activeOpacity={0.7}>
      <Text style={styles.resourceIcon}>{icon}</Text>
      <Text style={styles.resourceCount}>{count}</Text>
      <Text style={styles.resourceLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: { ...Typography.h1 },
  map: { height: 200, marginHorizontal: Spacing.lg, borderRadius: BorderRadius.lg, overflow: 'hidden' },
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
    minHeight: 80,
    justifyContent: 'center',
  },
  resourceIcon: { fontSize: 18, marginBottom: 4 },
  resourceCount: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  resourceLabel: { ...Typography.bodySmall, marginTop: 2 },
});

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', stylers: [{ color: '#0d0d0d' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#333333' }] },
];
