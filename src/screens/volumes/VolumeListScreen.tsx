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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getVolumes, deleteVolume, detachVolume } from '../../api/volumes';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import type { Volume } from '../../models';

export default function VolumeListScreen() {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const v = await getVolumes();
      setVolumes(v);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          renderItem={({ item }) => <VolumeRow volume={item} onRefresh={load} />}
          ListEmptyComponent={<Text style={styles.empty}>No volumes found</Text>}
        />
      )}
    </SafeAreaView>
  );
}

function VolumeRow({ volume, onRefresh }: { volume: Volume; onRefresh: () => void }) {
  const isAttached = volume.server !== null;

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7}>
      <View style={styles.rowContent}>
        <Text style={styles.volumeName}>{volume.name}</Text>
        <Text style={styles.volumeMeta}>
          {volume.size} GB · {volume.location.name}
          {volume.format ? ` · ${volume.format}` : ''}
        </Text>
      </View>
      <View style={[styles.badge, isAttached ? styles.badgeAttached : styles.badgeFree]}>
        <Text style={styles.badgeText}>{isAttached ? 'Attached' : 'Available'}</Text>
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
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  badgeAttached: { backgroundColor: Colors.primary + '30' },
  badgeFree: { backgroundColor: Colors.success + '30' },
  badgeText: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  empty: { ...Typography.bodySmall, textAlign: 'center', marginTop: 40 },
});
