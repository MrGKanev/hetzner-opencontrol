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

import { getVolumes, deleteVolume, detachVolume, attachVolume } from '../../api/volumes';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { ActionSheetModal, showActionSheet } from '../../components/common/ActionSheet';
import type { Volume } from '../../models';

const attachedActions = [
  { label: 'Detach', icon: '⏏️' },
  { label: 'Delete', icon: '🗑', destructive: true },
];

const freeActions = [
  { label: 'Delete', icon: '🗑', destructive: true },
];

export default function VolumeListScreen() {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selected, setSelected] = useState<Volume | null>(null);

  const load = async () => {
    try {
      setVolumes(await getVolumes());
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getActions = (volume: Volume) =>
    volume.server !== null ? attachedActions : freeActions;

  const openActions = (volume: Volume) => {
    setSelected(volume);
    const actions = getActions(volume);
    if (Platform.OS === 'ios') {
      showActionSheet({
        title: volume.name,
        options: actions,
        onSelect: i => handleAction(i, actions, volume),
      });
    } else {
      setSheetVisible(true);
    }
  };

  const handleAction = async (
    index: number,
    actions: typeof attachedActions,
    volume: Volume,
  ) => {
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
        Alert.alert('Delete Volume', `Delete "${volume.name}"? All data will be lost.`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete', style: 'destructive',
            onPress: async () => {
              try {
                await deleteVolume(volume.id);
                setVolumes(prev => prev.filter(v => v.id !== volume.id));
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
        <Text style={styles.title}>Volumes</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={volumes}
          keyExtractor={v => String(v.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          renderItem={({ item }) => (
            <VolumeRow
              volume={item}
              onPress={() => openActions(item)}
              onLongPress={() => openActions(item)}
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
}: {
  volume: Volume;
  onPress: () => void;
  onLongPress: () => void;
}) {
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
        <Text style={[styles.badgeText, { color: isAttached ? Colors.primary : Colors.success }]}>
          {isAttached ? 'Attached' : 'Available'}
        </Text>
      </View>
    </TouchableOpacity>
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
  rowContent: { flex: 1 },
  volumeName: { ...Typography.h3 },
  volumeMeta: { ...Typography.bodySmall, marginTop: 2 },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeAttached: { backgroundColor: Colors.primary + '20' },
  badgeFree: { backgroundColor: Colors.success + '20' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  empty: { ...Typography.bodySmall, textAlign: 'center', marginTop: 40 },
});
