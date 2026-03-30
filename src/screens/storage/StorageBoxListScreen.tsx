import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../../theme';

export default function StorageBoxListScreen() {
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { ...Typography.h1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  placeholderText: { ...Typography.h3, marginBottom: Spacing.sm },
  placeholderSub: { ...Typography.bodySmall, textAlign: 'center' },
});
