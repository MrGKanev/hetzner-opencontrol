import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getFirewall } from '../../api/networking';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';
import type { Firewall, FirewallRule } from '../../models';
import type { NetworkingStackParamList } from '../../navigation/NetworkingNavigator';

type Props = NativeStackScreenProps<NetworkingStackParamList, 'FirewallDetail'>;

export default function FirewallDetailScreen({ route, navigation }: Props) {
  const { firewallId } = route.params;
  const [firewall, setFirewall] = useState<Firewall | null>(null);
  const [loading, setLoading] = useState(true);
  const colors = useColors();
  const styles = makeStyles(colors);

  useEffect(() => {
    getFirewall(firewallId)
      .then(setFirewall)
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
  if (!firewall) return null;

  const inbound = firewall.rules.filter(r => r.direction === 'in');
  const outbound = firewall.rules.filter(r => r.direction === 'out');
  const sections = [
    { title: `INBOUND RULES (${inbound.length})`, data: inbound },
    { title: `OUTBOUND RULES (${outbound.length})`, data: outbound },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{firewall.name}</Text>
      </View>

      <View style={styles.appliedBanner}>
        <Text style={styles.appliedText}>
          Applied to {firewall.applied_to.length} resource{firewall.applied_to.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, i) => `${item.direction}-${i}`}
        contentContainerStyle={styles.content}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionLabel}>{section.title}</Text>
        )}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No rules configured</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <RuleRow rule={item} colors={colors} />}
        ListFooterComponent={<View style={{ height: Spacing.xl }} />}
      />
    </SafeAreaView>
  );
}

function RuleRow({ rule, colors }: { rule: FirewallRule; colors: ThemeColors }) {
  const styles = makeStyles(colors);
  const isInbound = rule.direction === 'in';
  const ips = isInbound ? rule.source_ips : rule.destination_ips;

  return (
    <View style={styles.ruleCard}>
      <View style={styles.ruleHeader}>
        <View style={[styles.dirBadge, isInbound ? styles.dirIn : styles.dirOut]}>
          <Text style={styles.dirText}>{isInbound ? '↓ IN' : '↑ OUT'}</Text>
        </View>
        <Text style={styles.ruleProtocol}>
          {rule.protocol.toUpperCase()}{rule.port ? `:${rule.port}` : ''}
        </Text>
      </View>
      {rule.description ? <Text style={styles.ruleDescription}>{rule.description}</Text> : null}
      <View style={styles.ipsContainer}>
        {ips.slice(0, 3).map((ip, i) => (
          <View key={i} style={styles.ipChip}>
            <Text style={styles.ipText}>{ip}</Text>
          </View>
        ))}
        {ips.length > 3 && (
          <View style={styles.ipChip}>
            <Text style={styles.ipText}>+{ips.length - 3} more</Text>
          </View>
        )}
      </View>
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
  appliedBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: c.primary + '20',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: c.primary + '40',
  },
  appliedText: { ...Typography.bodySmall, color: c.primary, fontWeight: '600' },
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  sectionLabel: { ...Typography.label, color: c.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.sm },
  emptySection: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    padding: Spacing.md,
    alignItems: 'center',
  },
  emptySectionText: { ...Typography.bodySmall, color: c.textSecondary },
  ruleCard: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  ruleHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dirBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
  dirIn: { backgroundColor: c.success + '30' },
  dirOut: { backgroundColor: c.info + '30' },
  dirText: { fontSize: 11, fontWeight: '700', color: c.textPrimary },
  ruleProtocol: { ...Typography.body, color: c.textPrimary, fontWeight: '700', fontFamily: 'monospace' },
  ruleDescription: { ...Typography.bodySmall, color: c.textSecondary },
  ipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  ipChip: {
    backgroundColor: c.surface,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: c.cardBorder,
  },
  ipText: { fontSize: 12, color: c.textSecondary, fontFamily: 'monospace' },
});
