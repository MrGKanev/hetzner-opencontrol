import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getNetwork } from '../../api/networking';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';
import type { Network, Subnet } from '../../models';
import type { NetworkingStackParamList } from '../../navigation/NetworkingNavigator';

type Props = NativeStackScreenProps<NetworkingStackParamList, 'NetworkDetail'>;

export default function NetworkDetailScreen({ route, navigation }: Props) {
  const { networkId } = route.params;
  const [network, setNetwork] = useState<Network | null>(null);
  const [loading, setLoading] = useState(true);
  const colors = useColors();
  const styles = makeStyles(colors);

  useEffect(() => {
    getNetwork(networkId)
      .then(setNetwork)
      .catch(e => Alert.alert('Error', e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }
  if (!network) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{network.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Overview" colors={colors}>
          <InfoRow label="IP Range" value={network.ip_range} mono colors={colors} />
          <InfoRow label="Servers" value={String(network.servers.length)} colors={colors} />
          <InfoRow label="Load Balancers" value={String(network.load_balancers.length)} colors={colors} />
          <InfoRow label="Delete Protection" value={network.protection.delete ? 'Enabled' : 'Disabled'} colors={colors} />
        </Section>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subnets ({network.subnets.length})</Text>
          {network.subnets.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No subnets configured</Text>
            </View>
          ) : (
            network.subnets.map((subnet, i) => <SubnetRow key={i} subnet={subnet} colors={colors} />)
          )}
        </View>

        {Object.keys(network.labels).length > 0 && (
          <Section title="Labels" colors={colors}>
            {Object.entries(network.labels).map(([k, v]) => (
              <InfoRow key={k} label={k} value={v} mono colors={colors} />
            ))}
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SubnetRow({ subnet, colors }: { subnet: Subnet; colors: ThemeColors }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.subnetCard}>
      <View style={styles.subnetHeader}>
        <View style={styles.subnetTypeBadge}>
          <Text style={styles.subnetTypeText}>{subnet.type}</Text>
        </View>
        <Text style={styles.subnetRange}>{subnet.ip_range}</Text>
      </View>
      <View style={styles.subnetDetails}>
        <Text style={styles.subnetDetail}>Zone: {subnet.network_zone}</Text>
        <Text style={styles.subnetDetail}>Gateway: {subnet.gateway}</Text>
      </View>
    </View>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: ThemeColors }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value, mono, colors }: { label: string; value: string; mono?: boolean; colors: ThemeColors }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.mono]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backIcon: { color: c.primary, fontSize: 30, fontWeight: '300' },
  title: { ...Typography.h2, color: c.textPrimary, flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  section: { gap: Spacing.sm },
  sectionTitle: { ...Typography.h3, color: c.textPrimary },
  card: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: c.cardBorder,
  },
  infoLabel: { ...Typography.bodySmall, color: c.textSecondary },
  infoValue: { ...Typography.body, color: c.textPrimary, textAlign: 'right', flex: 1 },
  mono: { fontFamily: 'monospace', fontSize: 13 },
  emptyCard: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    padding: Spacing.md,
    alignItems: 'center',
  },
  emptyText: { ...Typography.bodySmall, color: c.textSecondary },
  subnetCard: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  subnetHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  subnetTypeBadge: {
    backgroundColor: c.primary + '30',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  subnetTypeText: { fontSize: 11, fontWeight: '700', color: c.primary },
  subnetRange: { ...Typography.body, color: c.textPrimary, fontFamily: 'monospace', fontWeight: '600' },
  subnetDetails: { flexDirection: 'row', gap: Spacing.lg },
  subnetDetail: { ...Typography.bodySmall, color: c.textSecondary },
});
