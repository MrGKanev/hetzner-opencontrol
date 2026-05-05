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

import { getNetworks, deleteNetwork } from '../../api/networking';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';
import { ActionSheetModal } from '../../components/common/ActionSheet';
import type { Network } from '../../models';
import type { NetworkingStackParamList } from '../../navigation/NetworkingNavigator';
import { useResourceList } from '../../hooks/useResourceList';
import { confirmDelete } from '../../utils/dialogs';

type Nav = NativeStackNavigationProp<NetworkingStackParamList>;

const ACTIONS = [
  { label: 'View Details', icon: '🔗' },
  { label: 'Delete Network', icon: '🗑', destructive: true },
];

export default function NetworkListScreen() {
  const navigation = useNavigation<Nav>();
  const colors = useColors();
  const styles = makeStyles(colors);

  const { data: networks, setData: setNetworks, loading, refreshing, selected, sheetVisible, setSheetVisible, refresh, openSheet } =
    useResourceList(getNetworks);

  const handleAction = (index: number, net: Network) => {
    switch (index) {
      case 0:
        navigation.navigate('NetworkDetail', { networkId: net.id });
        break;
      case 1:
        confirmDelete(net.name, async () => {
          await deleteNetwork(net.id);
          setNetworks(prev => prev.filter(n => n.id !== net.id));
        });
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Networks</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={networks}
          keyExtractor={n => String(n.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('NetworkDetail', { networkId: item.id })}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.netName}>{item.name}</Text>
                <Text style={styles.netMeta}>
                  {item.ip_range} · {item.subnets.length} subnet{item.subnets.length !== 1 ? 's' : ''} · {item.servers.length} server{item.servers.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => openSheet(item, item.name, ACTIONS, i => handleAction(i, item))} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.menuDots}>•••</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No private networks found</Text>}
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
  rowLeft: { flex: 1 },
  netName: { ...Typography.h3, color: c.textPrimary },
  netMeta: { ...Typography.bodySmall, color: c.textSecondary, marginTop: 2 },
  menuDots: { color: c.textMuted, fontSize: 16, letterSpacing: 1, padding: Spacing.xs },
  empty: { ...Typography.bodySmall, color: c.textSecondary, textAlign: 'center', marginTop: 40 },
});
