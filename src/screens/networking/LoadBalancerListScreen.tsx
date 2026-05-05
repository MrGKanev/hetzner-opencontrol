import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getLoadBalancers, deleteLoadBalancer } from '../../api/networking';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';
import { ActionSheetModal } from '../../components/common/ActionSheet';
import type { LoadBalancer } from '../../models';
import type { NetworkingStackParamList } from '../../navigation/NetworkingNavigator';
import { useResourceList } from '../../hooks/useResourceList';
import { confirmDelete } from '../../utils/dialogs';

type Nav = NativeStackNavigationProp<NetworkingStackParamList>;

const ACTIONS = [
  { label: 'View Details', icon: '⚖️' },
  { label: 'Delete Load Balancer', icon: '🗑', destructive: true },
];

export default function LoadBalancerListScreen() {
  const navigation = useNavigation<Nav>();
  const colors = useColors();
  const styles = makeStyles(colors);

  const { data: lbs, setData: setLbs, loading, refreshing, selected, sheetVisible, setSheetVisible, refresh, openSheet } =
    useResourceList(getLoadBalancers);

  const handleAction = (index: number, lb: LoadBalancer) => {
    switch (index) {
      case 0:
        navigation.navigate('LoadBalancerDetail', { lbId: lb.id });
        break;
      case 1:
        confirmDelete(lb.name, async () => {
          await deleteLoadBalancer(lb.id);
          setLbs(prev => prev.filter(l => l.id !== lb.id));
        });
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Load Balancers</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={lbs}
          keyExtractor={lb => String(lb.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
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
                  <AlgorithmBadge type={item.algorithm.type} colors={colors} />
                </View>
                <Text style={styles.lbMeta}>
                  {item.load_balancer_type.name} · {item.location.city} · {item.services.length} service{item.services.length !== 1 ? 's' : ''}
                </Text>
                {item.public_net.enabled && (
                  <Text style={styles.lbIp}>{item.public_net.ipv4.ip}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => openSheet(item, item.name, ACTIONS, i => handleAction(i, item))} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
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

function AlgorithmBadge({ type, colors }: { type: string; colors: ThemeColors }) {
  const label = type === 'round_robin' ? 'Round Robin' : 'Least Conn';
  return (
    <View style={{ backgroundColor: colors.info + '30', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.info }}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { ...Typography.h1, color: c.textPrimary },
  list: { padding: Spacing.lg },
  row: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLeft: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  lbName: { ...Typography.h3, color: c.textPrimary },
  lbMeta: { ...Typography.bodySmall, color: c.textSecondary },
  lbIp: { fontFamily: 'monospace', fontSize: 12, color: c.textSecondary },
  menuDots: { color: c.textMuted, fontSize: 16, letterSpacing: 1, padding: Spacing.xs },
  empty: { ...Typography.bodySmall, color: c.textSecondary, textAlign: 'center', marginTop: 40 },
});
