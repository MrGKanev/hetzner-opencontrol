import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import type { RootStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface MenuItem {
  label: string;
  icon: string;
  onPress: () => void;
}

export default function ServersMenuScreen() {
  const navigation = useNavigation<Nav>();

  const items: MenuItem[] = [
    { label: 'All Servers', icon: '🖥', onPress: () => (navigation as any).navigate('ServerList') },
    { label: 'Activities', icon: '⚡️', onPress: () => {} },
    { label: 'Snapshots', icon: '📷', onPress: () => {} },
    { label: 'Backups', icon: '🗄', onPress: () => {} },
    { label: 'Placement Groups', icon: '⊞', onPress: () => {} },
    { label: 'Primary IPs', icon: '🌐', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hetzner Cloud</Text>
      </View>
      <ScrollView>
        <Text style={styles.sectionLabel}>SERVERS</Text>
        {items.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.row, i === items.length - 1 && styles.rowLast]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Text style={styles.rowIcon}>{item.icon}</Text>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { ...Typography.h1 },
  sectionLabel: { ...Typography.label, paddingHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: { fontSize: 18, width: 32 },
  rowLabel: { ...Typography.body, flex: 1 },
  rowChevron: { color: Colors.textMuted, fontSize: 22, fontWeight: '300' },
});
