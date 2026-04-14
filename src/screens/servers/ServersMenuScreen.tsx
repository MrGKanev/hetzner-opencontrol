import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';
import type { ServersStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<ServersStackParamList>;

interface MenuItem {
  label: string;
  icon: string;
  onPress: () => void;
}

export default function ServersMenuScreen() {
  const navigation = useNavigation<Nav>();
  const colors = useColors();
  const styles = makeStyles(colors);

  const items: MenuItem[] = [
    { label: 'All Servers', icon: '🖥', onPress: () => navigation.navigate('ServerList') },
    { label: 'SSH Keys', icon: '🔑', onPress: () => navigation.navigate('SshKeyList') },
    { label: 'Snapshots & Backups', icon: '📷', onPress: () => navigation.navigate('Images') },
    { label: 'Activities', icon: '⚡️', onPress: () => {} },
    { label: 'Placement Groups', icon: '⊞', onPress: () => navigation.navigate('PlacementGroupList') },
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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { ...Typography.h1, color: c.textPrimary },
  sectionLabel: { ...Typography.label, color: c.textSecondary, paddingHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: c.cardBorder,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: { fontSize: 18, width: 32 },
  rowLabel: { ...Typography.body, color: c.textPrimary, flex: 1 },
  rowChevron: { color: c.textMuted, fontSize: 22, fontWeight: '300' },
});
