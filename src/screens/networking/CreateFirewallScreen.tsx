import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { createFirewall } from '../../api/networking';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';
import type { FirewallRule, FirewallProtocol, FirewallDirection } from '../../models';
import type { NetworkingStackParamList } from '../../navigation/NetworkingNavigator';

type Props = NativeStackScreenProps<NetworkingStackParamList, 'CreateFirewall'>;

interface DraftRule {
  direction: FirewallDirection;
  protocol: FirewallProtocol;
  port: string;
  ips: string;
  description: string;
}

const PROTOCOLS: FirewallProtocol[] = ['tcp', 'udp', 'icmp', 'esp', 'gre'];
const DIRECTIONS: FirewallDirection[] = ['in', 'out'];

const DEFAULT_RULE: DraftRule = {
  direction: 'in',
  protocol: 'tcp',
  port: '',
  ips: '0.0.0.0/0,::/0',
  description: '',
};

export default function CreateFirewallScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [rules, setRules] = useState<DraftRule[]>([{ ...DEFAULT_RULE }]);
  const [creating, setCreating] = useState(false);
  const colors = useColors();
  const styles = makeStyles(colors);

  const addRule = () => setRules(prev => [...prev, { ...DEFAULT_RULE }]);
  const updateRule = (i: number, patch: Partial<DraftRule>) =>
    setRules(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const removeRule = (i: number) =>
    setRules(prev => prev.filter((_, idx) => idx !== i));

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Enter a firewall name'); return; }
    const parsedRules: FirewallRule[] = rules.map(r => ({
      direction: r.direction,
      protocol: r.protocol,
      port: r.port || null,
      source_ips: r.direction === 'in' ? r.ips.split(',').map(s => s.trim()).filter(Boolean) : [],
      destination_ips: r.direction === 'out' ? r.ips.split(',').map(s => s.trim()).filter(Boolean) : [],
      description: r.description || null,
    }));
    setCreating(true);
    try {
      await createFirewall(name.trim(), parsedRules);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Firewall</Text>
        <TouchableOpacity onPress={handleCreate} disabled={creating}>
          {creating
            ? <ActivityIndicator color={colors.primary} size="small" />
            : <Text style={styles.createText}>Create</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="my-firewall"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RULES</Text>
          {rules.map((rule, i) => (
            <View key={i} style={styles.ruleCard}>
              <View style={styles.ruleCardHeader}>
                <Text style={styles.ruleIndex}>Rule {i + 1}</Text>
                {rules.length > 1 && (
                  <TouchableOpacity onPress={() => removeRule(i)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.fieldLabel}>Direction</Text>
              <View style={styles.segmentRow}>
                {DIRECTIONS.map(dir => (
                  <TouchableOpacity
                    key={dir}
                    style={[styles.segment, rule.direction === dir && styles.segmentActive]}
                    onPress={() => updateRule(i, { direction: dir })}
                  >
                    <Text style={[styles.segmentText, rule.direction === dir && styles.segmentTextActive]}>
                      {dir === 'in' ? '↓ Inbound' : '↑ Outbound'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Protocol</Text>
              <View style={styles.segmentRow}>
                {PROTOCOLS.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.segment, rule.protocol === p && styles.segmentActive]}
                    onPress={() => updateRule(i, { protocol: p })}
                  >
                    <Text style={[styles.segmentText, rule.protocol === p && styles.segmentTextActive]}>
                      {p.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {(rule.protocol === 'tcp' || rule.protocol === 'udp') && (
                <>
                  <Text style={styles.fieldLabel}>Port / Range</Text>
                  <TextInput
                    style={styles.inputSmall}
                    placeholder="80  or  443  or  8000-9000"
                    placeholderTextColor={colors.textMuted}
                    value={rule.port}
                    onChangeText={v => updateRule(i, { port: v })}
                    keyboardType="numbers-and-punctuation"
                  />
                </>
              )}

              <Text style={styles.fieldLabel}>
                {rule.direction === 'in' ? 'Source IPs' : 'Destination IPs'}
              </Text>
              <TextInput
                style={styles.inputSmall}
                placeholder="0.0.0.0/0, ::/0"
                placeholderTextColor={colors.textMuted}
                value={rule.ips}
                onChangeText={v => updateRule(i, { ips: v })}
                autoCapitalize="none"
                keyboardType="ascii-capable"
              />

              <Text style={styles.fieldLabel}>Description (optional)</Text>
              <TextInput
                style={styles.inputSmall}
                placeholder="Allow HTTP"
                placeholderTextColor={colors.textMuted}
                value={rule.description}
                onChangeText={v => updateRule(i, { description: v })}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addRuleBtn} onPress={addRule}>
            <Text style={styles.addRuleText}>＋ Add Rule</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.cardBorder,
  },
  cancelText: { color: c.primary, fontSize: 17 },
  title: { ...Typography.h3, color: c.textPrimary },
  createText: { color: c.textPrimary, fontSize: 17, fontWeight: '600' },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  section: { gap: Spacing.sm },
  sectionLabel: { ...Typography.label, color: c.textSecondary },
  input: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.cardBorder,
    borderRadius: BorderRadius.md,
    color: c.textPrimary,
    padding: Spacing.md,
    fontSize: 15,
  },
  ruleCard: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  ruleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ruleIndex: { ...Typography.body, color: c.textPrimary, fontWeight: '600' },
  removeText: { color: c.error, fontSize: 14 },
  fieldLabel: { ...Typography.caption, color: c.textSecondary, marginTop: Spacing.xs },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  segment: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: c.cardBorder,
    backgroundColor: c.surface,
  },
  segmentActive: { backgroundColor: c.primary, borderColor: c.primary },
  segmentText: { ...Typography.bodySmall, color: c.textSecondary, fontWeight: '500' },
  segmentTextActive: { color: '#FFFFFF' },
  inputSmall: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.cardBorder,
    borderRadius: BorderRadius.sm,
    color: c.textPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  addRuleBtn: {
    borderWidth: 1.5,
    borderColor: c.primary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  addRuleText: { color: c.primary, fontWeight: '600', fontSize: 15 },
});
