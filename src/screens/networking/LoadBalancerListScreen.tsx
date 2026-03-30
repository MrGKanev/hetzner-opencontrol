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

import { getLoadBalancers, deleteLoadBalancer } from '../../api/networking';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { ActionSheetModal, showActionSheet } from '../../components/common/ActionSheet';
import type { LoadBalancer } from '../../models';
import type { NetworkingStackParamList } from '../../navigation/NetworkingNavigator';

type Nav = NativeStackNavigationProp<NetworkingStackParamList>;

const ACTIONS = [
  { label: 'View Details', icon: '⚖️' },
  { label: 'Delete Load Balancer', icon: '🗑', destructive: true },
];

export default function LoadBalancerListScreen() {
  const navigation = useNavigation<Nav>();
  const [lbs, setLbs] = useState<LoadBalancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selected, setSelected] = useState<LoadBalancer | null>(null);

  const load = async () => {
    try {
      setLbs(await getLoadBalancers());
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openActions = (lb: LoadBalancer) => {
    setSelected(lb);
    if (Platform.OS === 'ios') {
      showActionSheet({ title: lb.name, options: ACTIONS, onSelect: i => handleAction(i, lb) });
    } else {
      setSheetVisible(true);
    }
  };

  const handleAction = (index: number, lb: LoadBalancer) => {
    switch (index) {
      case 0:
        navigation.navigate('LoadBalancerDetail', { lbId: lb.id });
        break;
      case 1:
        Alert.alert('Delete Load Balancer', `Delete "${lb.name}"?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete', style: 'destructive',
            onPress: async () => {
              try {
                await deleteLoadBalancer(lb.id);
                setLbs(prev => prev.filter(l => l.id !== lb.id));
              } catch (e: any) { Alert.alert('Error', e.message); }
            },
          },
        ]);
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Load Balancers</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={lbs}
          keyExtractor={lb => String(lb.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('LoadBalancerDetail', { lbId: item.id })}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowTop}>
                  <Text style={styles.lbName}>{item.name}</Text>
                  <AlgorithmBadge type={item.algorithm.type} />
                </View>
                <Text style={styles.lbMeta}>
                  {item.load_balancer_type.name} · {item.location.city} · {item.services.length} service{item.services.length !== 1 ? 's' : ''}
                </Text>
                {item.public_net.enabled && (
                  <Text style={styles.lbIp}>{item.public_net.ipv4.ip}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => openActions(item)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.menuDots}>•••</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No load balancers found</Text>}
        />
      )}

      <ActionSheetModal
        visible={sheetVisible}
        title={selected?.name}
        options={ACTIONS}
        onSelect={i => { if (selected) handleAction(i, selected); }}
        onCancel={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

function AlgorithmBadge({ type }: { type: string }) {
  const label = type === 'round_robin' ? 'Round Robin' : 'Least Conn';
  return (
    <View style={styles.algBadge}>
      <Text style={styles.algText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { ...Typography.h1 },
  list: { padding: Spacing.lg },
  row: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLeft: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  lbName: { ...Typography.h3 },
  lbMeta: { ...Typography.bodySmall },
  lbIp: { fontFamily: 'monospace', fontSize: 12, color: Colors.textSecondary },
  menuDots: { color: Colors.textMuted, fontSize: 16, letterSpacing: 1, padding: Spacing.xs },
  empty: { ...Typography.bodySmall, textAlign: 'center', marginTop: 40 },
  algBadge: {
    backgroundColor: Colors.info + '30',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  algText: { fontSize: 11, fontWeight: '600', color: Colors.info },
});
