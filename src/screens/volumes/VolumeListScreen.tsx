import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getVolumes, deleteVolume, detachVolume } from '../../api/volumes';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';
import { ActionSheetModal } from '../../components/common/ActionSheet';
import type { Volume } from '../../models';
import { useResourceList } from '../../hooks/useResourceList';
import { confirmDelete } from '../../utils/dialogs';

const attachedActions = [
  { label: 'Detach', icon: '⏏️' },
  { label: 'Delete', icon: '🗑', destructive: true },
];

const freeActions = [
  { label: 'Delete', icon: '🗑', destructive: true },
];

export default function VolumeListScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);

  const { data: volumes, setData: setVolumes, loading, refreshing, selected, sheetVisible, setSheetVisible, refresh, load, openSheet } =
    useResourceList(getVolumes);

  const getActions = (volume: Volume) => volume.server !== null ? attachedActions : freeActions;

  const handleAction = async (index: number, actions: typeof attachedActions, volume: Volume) => {
    const label = actions[index].label;
    switch (label) {
      case 'Detach':
        Alert.alert('Detach Volume', `Detach "${volume.name}" from server?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Detach',
            onPress: async () => {
              try {
                await detachVolume(volume.id);
                await load();
              } catch (e: any) { Alert.alert('Error', e.message); }
            },
          },
        ]);
        break;
      case 'Delete':
        confirmDelete(volume.name, async () => {
          await deleteVolume(volume.id);
          setVolumes(prev => prev.filter(v => v.id !== volume.id));
        });
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Volumes</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={volumes}
          keyExtractor={v => String(v.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
          }
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          renderItem={({ item }) => (
            <VolumeRow
              volume={item}
              onPress={() => openSheet(item, item.name, getActions(item), i => handleAction(i, getActions(item), item))}
              onLongPress={() => openSheet(item, item.name, getActions(item), i => handleAction(i, getActions(item), item))}
              colors={colors}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No volumes found</Text>}
        />
      )}

      <ActionSheetModal
        visible={sheetVisible}
        title={selected?.name}
        options={selected ? getActions(selected) : []}
        onSelect={i => {
          if (selected) handleAction(i, getActions(selected), selected);
        }}
        onCancel={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

function VolumeRow({
  volume,
  onPress,
  onLongPress,
  colors,
}: {
  volume: Volume;
  onPress: () => void;
  onLongPress: () => void;
  colors: ThemeColors;
}) {
  const styles = makeStyles(colors);
  const isAttached = volume.server !== null;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      activeOpacity={0.7}
    >
      <View style={styles.rowContent}>
        <Text style={styles.volumeName}>{volume.name}</Text>
        <Text style={styles.volumeMeta}>
          {volume.size} GB · {volume.location.name}
          {volume.format ? ` · ${volume.format}` : ''}
        </Text>
      </View>
      <View style={[styles.badge, isAttached ? styles.badgeAttached : styles.badgeFree]}>
        <Text style={[styles.badgeText, { color: isAttached ? colors.primary : colors.success }]}>
          {isAttached ? 'Attached' : 'Available'}
        </Text>
      </View>
    </TouchableOpacity>
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
  rowContent: { flex: 1 },
  volumeName: { ...Typography.h3, color: c.textPrimary },
  volumeMeta: { ...Typography.bodySmall, color: c.textSecondary, marginTop: 2 },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeAttached: { backgroundColor: c.primary + '20' },
  badgeFree: { backgroundColor: c.success + '20' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  empty: { ...Typography.bodySmall, color: c.textSecondary, textAlign: 'center', marginTop: 40 },
});
