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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getPlacementGroups, deletePlacementGroup } from '../../api/servers';
import type { PlacementGroup } from '../../models';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';
import { ActionSheetModal, showActionSheet } from '../../components/common/ActionSheet';

const actions = [
  { label: 'Delete', icon: '🗑', destructive: true },
];

export default function PlacementGroupListScreen() {
  const [groups, setGroups] = useState<PlacementGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<PlacementGroup | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const colors = useColors();
  const styles = makeStyles(colors);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setGroups(await getPlacementGroups());
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openActions = (group: PlacementGroup) => {
    setSelected(group);
    if (Platform.OS === 'ios') {
      showActionSheet({
        title: group.name,
        options: actions,
        onSelect: i => handleAction(i, group),
      });
    } else {
      setSheetVisible(true);
    }
  };

  const handleAction = async (index: number, group: PlacementGroup) => {
    if (actions[index].label === 'Delete') {
      if (group.servers.length > 0) {
        Alert.alert('Cannot Delete', 'Remove all servers from this placement group before deleting it.');
        return;
      }
      Alert.alert('Delete Placement Group', `Delete "${group.name}"? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deletePlacementGroup(group.id);
              setGroups(prev => prev.filter(g => g.id !== group.id));
            } catch (e: any) { Alert.alert('Error', e.message); }
          },
        },
      ]);
    }
  };

  const renderItem = ({ item }: { item: PlacementGroup }) => (
    <TouchableOpacity style={styles.card} onPress={() => openActions(item)} activeOpacity={0.75}>
      <View style={styles.iconWrap}>
        <Icon name="view-grid-plus-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}  ·  {item.servers.length} server{item.servers.length !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={[styles.badge, item.servers.length > 0 ? styles.badgeActive : styles.badgeEmpty]}>
        <Text style={[styles.badgeText, { color: item.servers.length > 0 ? colors.primary : colors.textMuted }]}>
          {item.servers.length > 0 ? `${item.servers.length} server${item.servers.length !== 1 ? 's' : ''}` : 'Empty'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Placement Groups</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Icon name="view-grid-plus-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No Placement Groups</Text>
            </View>
          }
        />
      )}

      <ActionSheetModal
        visible={sheetVisible}
        title={selected?.name}
        options={actions}
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
  meta: { ...Typography.caption, color: c.textMuted, marginTop: 2 },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  badgeActive: { backgroundColor: c.primary + '22' },
  badgeEmpty: { backgroundColor: c.surface },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
