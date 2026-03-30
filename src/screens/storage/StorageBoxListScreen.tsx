import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';

export default function StorageBoxListScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Storage Boxes</Text>
      </View>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Coming soon</Text>
        <Text style={styles.placeholderSub}>Storage Box management via Hetzner Robot API</Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { ...Typography.h1, color: c.textPrimary },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  placeholderText: { ...Typography.h3, color: c.textPrimary, marginBottom: Spacing.sm },
  placeholderSub: { ...Typography.bodySmall, color: c.textSecondary, textAlign: 'center' },
});
