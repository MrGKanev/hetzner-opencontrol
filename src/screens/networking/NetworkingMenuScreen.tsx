import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import type { NetworkingStackParamList } from '../../navigation/NetworkingNavigator';

type Nav = NativeStackNavigationProp<NetworkingStackParamList>;

export default function NetworkingMenuScreen() {
  const navigation = useNavigation<Nav>();

  const items = [
    { label: 'Load Balancers', icon: '⚖️', screen: 'LoadBalancerList' as const },
    { label: 'Firewalls', icon: '🔥', screen: 'FirewallList' as const },
    { label: 'Private Networks', icon: '🔗', screen: 'NetworkList' as const },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Networking</Text>
      </View>
      <ScrollView>
        {items.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.row, i < items.length - 1 && styles.rowBorder]}
            onPress={() => navigation.navigate(item.screen)}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  rowIcon: { fontSize: 20, width: 36 },
  rowLabel: { ...Typography.body, flex: 1 },
  rowChevron: { color: Colors.textMuted, fontSize: 22, fontWeight: '300' },
});
