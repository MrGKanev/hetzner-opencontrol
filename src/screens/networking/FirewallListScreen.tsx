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

import { getFirewalls, deleteFirewall } from '../../api/networking';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { ActionSheetModal, showActionSheet } from '../../components/common/ActionSheet';
import type { Firewall } from '../../models';
import type { NetworkingStackParamList } from '../../navigation/NetworkingNavigator';

type Nav = NativeStackNavigationProp<NetworkingStackParamList>;

const ACTIONS = [
  { label: 'View Rules', icon: '📋' },
  { label: 'Delete Firewall', icon: '🗑', destructive: true },
];

export default function FirewallListScreen() {
  const navigation = useNavigation<Nav>();
  const [firewalls, setFirewalls] = useState<Firewall[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedFirewall, setSelectedFirewall] = useState<Firewall | null>(null);

  const load = async () => {
    try {
      setFirewalls(await getFirewalls());
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openActions = (fw: Firewall) => {
    setSelectedFirewall(fw);
    if (Platform.OS === 'ios') {
      showActionSheet({
        title: fw.name,
        options: ACTIONS,
        onSelect: i => handleAction(i, fw),
      });
    } else {
      setSheetVisible(true);
    }
  };

  const handleAction = (index: number, fw: Firewall) => {
    switch (index) {
      case 0:
        navigation.navigate('FirewallDetail', { firewallId: fw.id });
        break;
      case 1:
        Alert.alert('Delete Firewall', `Delete "${fw.name}"? This cannot be undone.`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteFirewall(fw.id);
                setFirewalls(prev => prev.filter(f => f.id !== fw.id));
              } catch (e: any) {
                Alert.alert('Error', e.message);
              }
            },
          },
        ]);
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Firewalls</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateFirewall')}>
          <Text style={styles.addIcon}>＋</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={firewalls}
          keyExtractor={f => String(f.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('FirewallDetail', { firewallId: item.id })}
              onLongPress={() => openActions(item)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.fwName}>{item.name}</Text>
                <Text style={styles.fwMeta}>
                  {item.rules.length} rule{item.rules.length !== 1 ? 's' : ''} ·{' '}
                  {item.applied_to.length} applied
                </Text>
              </View>
              <TouchableOpacity onPress={() => openActions(item)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.menuDots}>•••</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No firewalls found</Text>}
        />
      )}

      {/* Android Action Sheet */}
      <ActionSheetModal
        visible={sheetVisible}
        title={selectedFirewall?.name}
        options={ACTIONS}
        onSelect={i => { if (selectedFirewall) handleAction(i, selectedFirewall); }}
        onCancel={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: { ...Typography.h1 },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: { color: Colors.primary, fontSize: 18 },
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
  rowLeft: { flex: 1 },
  fwName: { ...Typography.h3 },
  fwMeta: { ...Typography.bodySmall, marginTop: 2 },
  menuDots: { color: Colors.textMuted, fontSize: 16, letterSpacing: 1, padding: Spacing.xs },
  empty: { ...Typography.bodySmall, textAlign: 'center', marginTop: 40 },
});
