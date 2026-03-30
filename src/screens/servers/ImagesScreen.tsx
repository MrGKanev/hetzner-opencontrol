import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getImages, deleteImage } from '../../api/images';
import type { Image } from '../../models';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';
import { ActionSheetModal, showActionSheet } from '../../components/common/ActionSheet';

type Tab = 'snapshot' | 'backup';

const IMAGE_ACTIONS = [
  { label: 'Delete', icon: '🗑', destructive: true },
];

export default function ImagesScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);

  const [tab, setTab] = useState<Tab>('snapshot');
  const [snapshots, setSnapshots] = useState<Image[]>([]);
  const [backups, setBackups] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Image | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [snaps, baks] = await Promise.all([
        getImages('snapshot'),
        getImages('backup'),
      ]);
      setSnapshots(snaps);
      setBackups(baks);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const data = tab === 'snapshot' ? snapshots : backups;

  const openActions = (image: Image) => {
    setSelected(image);
    if (Platform.OS === 'ios') {
      showActionSheet({
        title: image.description || image.name || `Image #${image.id}`,
        options: IMAGE_ACTIONS,
        onSelect: i => handleAction(i, image),
      });
    } else {
      setSheetVisible(true);
    }
  };

  const handleAction = (index: number, image: Image) => {
    if (IMAGE_ACTIONS[index].label === 'Delete') {
      const label = image.description || image.name || `Image #${image.id}`;
      Alert.alert(
        `Delete ${tab === 'snapshot' ? 'Snapshot' : 'Backup'}`,
        `Delete "${label}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete', style: 'destructive',
            onPress: async () => {
              try {
                await deleteImage(image.id);
                if (tab === 'snapshot') {
                  setSnapshots(prev => prev.filter(i => i.id !== image.id));
                } else {
                  setBackups(prev => prev.filter(i => i.id !== image.id));
                }
              } catch (e: any) {
                Alert.alert('Error', e.message);
              }
            },
          },
        ],
      );
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return null;
    return bytes < 1 ? `${(bytes * 1024).toFixed(0)} MB` : `${bytes.toFixed(1)} GB`;
  };

  const renderItem = ({ item }: { item: Image }) => {
    const label = item.description || item.name || `Image #${item.id}`;
    const size = formatSize(item.image_size);
    const from = item.created_from?.name;
    const date = new Date(item.created).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openActions(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardLeft}>
          <Icon
            name={tab === 'snapshot' ? 'camera-outline' : 'backup-restore'}
            size={20}
            color={colors.primary}
            style={styles.cardIcon}
          />
          <View style={styles.cardInfo}>
            <Text style={styles.cardLabel} numberOfLines={1}>{label}</Text>
            <Text style={styles.cardMeta}>
              {from ? `From: ${from}  ·  ` : ''}{date}
              {size ? `  ·  ${size}` : ''}
            </Text>
            <Text style={styles.cardOs}>
              {item.os_flavor}{item.os_version ? ` ${item.os_version}` : ''}
              {`  ·  ${item.disk_size} GB disk`}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, item.status === 'available' ? styles.badgeOk : styles.badgePending]}>
          <Text style={[styles.badgeText, { color: item.status === 'available' ? colors.success : colors.warning }]}>
            {item.status}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const emptyIcon = tab === 'snapshot' ? 'camera-off-outline' : 'backup-restore';
  const emptyText = tab === 'snapshot'
    ? 'No snapshots\nCreate one from a server\'s action menu'
    : 'No backups\nEnable automatic backups in server settings';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Images</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'snapshot' && styles.tabActive]}
          onPress={() => setTab('snapshot')}
        >
          <Text style={[styles.tabText, tab === 'snapshot' && styles.tabTextActive]}>
            Snapshots {snapshots.length > 0 ? `(${snapshots.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'backup' && styles.tabActive]}
          onPress={() => setTab('backup')}
        >
          <Text style={[styles.tabText, tab === 'backup' && styles.tabTextActive]}>
            Backups {backups.length > 0 ? `(${backups.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Icon name={emptyIcon} size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          }
        />
      )}

      <ActionSheetModal
        visible={sheetVisible}
        title={selected ? (selected.description || selected.name || `Image #${selected.id}`) : undefined}
        options={IMAGE_ACTIONS}
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
  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: c.surface,
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabActive: { backgroundColor: c.card },
  tabText: { ...Typography.bodySmall, color: c.textMuted, fontWeight: '500' },
  tabTextActive: { color: c.textPrimary, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md, marginTop: 40 },
  emptyText: { ...Typography.bodySmall, color: c.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  cardIcon: { marginRight: Spacing.sm, marginTop: 2 },
  cardInfo: { flex: 1 },
  cardLabel: { ...Typography.body, color: c.textPrimary, fontWeight: '600' },
  cardMeta: { ...Typography.caption, color: c.textSecondary, marginTop: 2 },
  cardOs: { ...Typography.caption, color: c.textMuted, marginTop: 1 },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  badgeOk: { backgroundColor: c.success + '22' },
  badgePending: { backgroundColor: c.warning + '22' },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
