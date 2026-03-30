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

import { getLoadBalancer } from '../../api/networking';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';
import type { LoadBalancer, LoadBalancerService, LoadBalancerTarget } from '../../models';
import type { NetworkingStackParamList } from '../../navigation/NetworkingNavigator';

type Props = NativeStackScreenProps<NetworkingStackParamList, 'LoadBalancerDetail'>;

export default function LoadBalancerDetailScreen({ route, navigation }: Props) {
  const { lbId } = route.params;
  const [lb, setLb] = useState<LoadBalancer | null>(null);
  const [loading, setLoading] = useState(true);
  const colors = useColors();
  const styles = makeStyles(colors);

  useEffect(() => {
    getLoadBalancer(lbId)
      .then(setLb)
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
  if (!lb) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{lb.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Overview" colors={colors}>
          <InfoRow label="Type" value={lb.load_balancer_type.name} colors={colors} />
          <InfoRow label="Algorithm" value={lb.algorithm.type === 'round_robin' ? 'Round Robin' : 'Least Connections'} colors={colors} />
          <InfoRow label="Location" value={`${lb.location.city} (${lb.location.name})`} colors={colors} />
          {lb.public_net.enabled && (
            <>
              <InfoRow label="IPv4" value={lb.public_net.ipv4.ip} mono colors={colors} />
              <InfoRow label="IPv6" value={lb.public_net.ipv6.ip} mono colors={colors} />
            </>
          )}
        </Section>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services ({lb.services.length})</Text>
          {lb.services.length === 0 ? (
            <EmptyCard text="No services configured" colors={colors} />
          ) : (
            lb.services.map((svc, i) => <ServiceRow key={i} service={svc} colors={colors} />)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Targets ({lb.targets.length})</Text>
          {lb.targets.length === 0 ? (
            <EmptyCard text="No targets configured" colors={colors} />
          ) : (
            lb.targets.map((target, i) => <TargetRow key={i} target={target} colors={colors} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ServiceRow({ service, colors }: { service: LoadBalancerService; colors: ThemeColors }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.card}>
      <View style={styles.serviceHeader}>
        <View style={styles.protocolBadge}>
          <Text style={styles.protocolText}>{service.protocol.toUpperCase()}</Text>
        </View>
        <Text style={styles.servicePort}>:{service.listen_port} → :{service.destination_port}</Text>
      </View>
      <View style={styles.healthRow}>
        <Text style={styles.healthLabel}>Health Check</Text>
        <Text style={styles.healthValue}>
          {service.health_check.protocol.toUpperCase()}:{service.health_check.port} · every {service.health_check.interval}s · timeout {service.health_check.timeout}s
        </Text>
      </View>
    </View>
  );
}

function TargetRow({ target, colors }: { target: LoadBalancerTarget; colors: ThemeColors }) {
  const styles = makeStyles(colors);
  const label =
    target.type === 'server' ? `Server #${target.server?.id}` :
    target.type === 'ip' ? target.ip?.ip ?? 'IP' :
    target.label_selector?.selector ?? 'Label Selector';
  const icon = target.type === 'server' ? '🖥' : target.type === 'ip' ? '🌐' : '🏷';
  return (
    <View style={styles.targetCard}>
      <Text style={styles.targetIcon}>{icon}</Text>
      <View>
        <Text style={styles.targetType}>{target.type.replace('_', ' ').toUpperCase()}</Text>
        <Text style={styles.targetLabel}>{label}</Text>
      </View>
    </View>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: ThemeColors }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
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

function EmptyCard({ text, colors }: { text: string; colors: ThemeColors }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyText}>{text}</Text>
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
  sectionCard: {
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
  card: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  serviceHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  protocolBadge: {
    backgroundColor: c.primary + '30',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  protocolText: { fontSize: 11, fontWeight: '700', color: c.primary },
  servicePort: { ...Typography.body, color: c.textPrimary, fontFamily: 'monospace', fontWeight: '600' },
  healthRow: { gap: 2 },
  healthLabel: { ...Typography.caption, color: c.textMuted },
  healthValue: { ...Typography.bodySmall, color: c.textSecondary },
  targetCard: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  targetIcon: { fontSize: 22 },
  targetType: { ...Typography.caption, color: c.textMuted },
  targetLabel: { ...Typography.body, color: c.textPrimary, fontWeight: '600' },
  emptyCard: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    padding: Spacing.md,
    alignItems: 'center',
  },
  emptyText: { ...Typography.bodySmall, color: c.textSecondary },
});
