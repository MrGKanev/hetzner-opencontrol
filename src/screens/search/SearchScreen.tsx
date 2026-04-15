import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getServers } from '../../api/servers';
import { getVolumes } from '../../api/volumes';
import {
  getFirewalls,
  getNetworks,
  getFloatingIPs,
  getPrimaryIPs,
  getLoadBalancers,
} from '../../api/networking';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { useColors } from '../../store/themeStore';
import type { ThemeColors } from '../../theme';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type ResourceType = 'server' | 'volume' | 'firewall' | 'network' | 'floating_ip' | 'primary_ip' | 'load_balancer';

interface Result {
  id: number;
  type: ResourceType;
  title: string;
  subtitle: string;
  icon: string;
  navigable: boolean;
}

const TYPE_LABEL: Record<ResourceType, string> = {
  server: 'Server',
  volume: 'Volume',
  firewall: 'Firewall',
  network: 'Network',
  floating_ip: 'Floating IP',
  primary_ip: 'Primary IP',
  load_balancer: 'Load Balancer',
};

const TYPE_ICON: Record<ResourceType, string> = {
  server: 'server',
  volume: 'harddisk',
  firewall: 'shield-outline',
  network: 'lan',
  floating_ip: 'ip-network-outline',
  primary_ip: 'ip',
  load_balancer: 'scale-balance',
};

export default function SearchScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const navigation = useNavigation<Nav>();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const [servers, volumes, firewalls, networks, floatingIps, primaryIps, loadBalancers] =
        await Promise.allSettled([
          getServers(),
          getVolumes(),
          getFirewalls(),
          getNetworks(),
          getFloatingIPs(),
          getPrimaryIPs(),
          getLoadBalancers(),
        ]);

      const found: Result[] = [];

      if (servers.status === 'fulfilled') {
        servers.value
          .filter(s =>
            s.name.toLowerCase().includes(trimmed) ||
            s.public_net.ipv4?.ip.includes(trimmed) ||
            s.public_net.ipv6?.ip.toLowerCase().includes(trimmed) ||
            s.datacenter.location.name.toLowerCase().includes(trimmed) ||
            s.server_type.name.toLowerCase().includes(trimmed),
          )
          .forEach(s => found.push({
            id: s.id,
            type: 'server',
            title: s.name,
            subtitle: `${s.server_type.name} · ${s.public_net.ipv4?.ip ?? 'no IPv4'} · ${s.status}`,
            icon: TYPE_ICON.server,
            navigable: true,
          }));
      }

      if (volumes.status === 'fulfilled') {
        volumes.value
          .filter(v =>
            v.name.toLowerCase().includes(trimmed) ||
            v.location.name.toLowerCase().includes(trimmed),
          )
          .forEach(v => found.push({
            id: v.id,
            type: 'volume',
            title: v.name,
            subtitle: `${v.size} GB · ${v.location.name} · ${v.status}`,
            icon: TYPE_ICON.volume,
            navigable: false,
          }));
      }

      if (firewalls.status === 'fulfilled') {
        firewalls.value
          .filter(f => f.name.toLowerCase().includes(trimmed))
          .forEach(f => found.push({
            id: f.id,
            type: 'firewall',
            title: f.name,
            subtitle: `${f.rules.length} rule${f.rules.length !== 1 ? 's' : ''}`,
            icon: TYPE_ICON.firewall,
            navigable: true,
          }));
      }

      if (networks.status === 'fulfilled') {
        networks.value
          .filter(n =>
            n.name.toLowerCase().includes(trimmed) ||
            n.ip_range.includes(trimmed),
          )
          .forEach(n => found.push({
            id: n.id,
            type: 'network',
            title: n.name,
            subtitle: n.ip_range,
            icon: TYPE_ICON.network,
            navigable: true,
          }));
      }

      if (floatingIps.status === 'fulfilled') {
        floatingIps.value
          .filter(ip =>
            ip.name.toLowerCase().includes(trimmed) ||
            ip.ip.includes(trimmed),
          )
          .forEach(ip => found.push({
            id: ip.id,
            type: 'floating_ip',
            title: ip.name,
            subtitle: `${ip.ip} · ${ip.type}`,
            icon: TYPE_ICON.floating_ip,
            navigable: false,
          }));
      }

      if (primaryIps.status === 'fulfilled') {
        primaryIps.value
          .filter(ip =>
            ip.name.toLowerCase().includes(trimmed) ||
            ip.ip.includes(trimmed),
          )
          .forEach(ip => found.push({
            id: ip.id,
            type: 'primary_ip',
            title: ip.name,
            subtitle: `${ip.ip} · ${ip.type}`,
            icon: TYPE_ICON.primary_ip,
            navigable: false,
          }));
      }

      if (loadBalancers.status === 'fulfilled') {
        loadBalancers.value
          .filter(lb =>
            lb.name.toLowerCase().includes(trimmed) ||
            lb.public_net?.ipv4?.ip?.includes(trimmed),
          )
          .forEach(lb => found.push({
            id: lb.id,
            type: 'load_balancer',
            title: lb.name,
            subtitle: `${lb.targets?.length ?? 0} target${(lb.targets?.length ?? 0) !== 1 ? 's' : ''}`,
            icon: TYPE_ICON.load_balancer,
            navigable: true,
          }));
      }

      setResults(found);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      setSearched(false);
    }
  };

  const handleSubmit = () => search(query);

  const navigateTo = (item: Result) => {
    if (item.type === 'server') {
      navigation.navigate('ServerDetail', { serverId: item.id });
    }
    // Firewall, Network, LoadBalancer detail screens are inside nested navigators;
    // navigate to their list tabs for now — deep linking into nested tabs
    // would require a more complex setup.
  };

  const renderItem = ({ item }: { item: Result }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => item.navigable && item.type === 'server' ? navigateTo(item) : undefined}
      activeOpacity={item.navigable && item.type === 'server' ? 0.7 : 1}
    >
      <View style={styles.iconWrap}>
        <Icon name={item.icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowSub}>{item.subtitle}</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{TYPE_LABEL[item.type]}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSeparator = () => <View style={styles.divider} />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>Search</Text>

      <View style={styles.searchRow}>
        <Icon name="magnify" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Servers, IPs, firewalls, volumes…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!loading && searched && results.length === 0 && (
        <View style={styles.center}>
          <Icon name="magnify-close" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>No results for "{query}"</Text>
        </View>
      )}

      {!loading && !searched && (
        <View style={styles.center}>
          <Icon name="magnify" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>Search across all resources</Text>
        </View>
      )}

      {!loading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={item => `${item.type}-${item.id}`}
          renderItem={renderItem}
          ItemSeparatorComponent={renderSeparator}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      ...Typography.h2,
      color: c.textPrimary,
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: BorderRadius.md,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      paddingHorizontal: Spacing.sm,
    },
    searchIcon: {
      marginRight: Spacing.xs,
    },
    input: {
      flex: 1,
      ...Typography.body,
      color: c.textPrimary,
      paddingVertical: Spacing.sm + 2,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    emptyText: {
      ...Typography.body,
      color: c.textMuted,
    },
    list: {
      paddingHorizontal: Spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm + 2,
      gap: Spacing.sm,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.sm,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: {
      flex: 1,
    },
    rowTitle: {
      ...Typography.body,
      color: c.textPrimary,
      fontWeight: '600',
    },
    rowSub: {
      ...Typography.bodySmall,
      color: c.textSecondary,
    },
    badge: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    badgeText: {
      ...Typography.caption,
      color: c.textMuted,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.cardBorder,
    },
  });
}
