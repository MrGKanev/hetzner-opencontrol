import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getPricing } from '../../api/pricing';
import type { Pricing, ServerTypePricing } from '../../models';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';

export default function PricingCalculatorScreen() {
  const navigation = useNavigation();
  const colors = useColors();
  const styles = makeStyles(colors);

  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);

  // Selections
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedServerType, setSelectedServerType] = useState<ServerTypePricing | null>(null);
  const [volumeGb, setVolumeGb] = useState('');
  const [includeBackup, setIncludeBackup] = useState(false);
  const [floatingIps, setFloatingIps] = useState(0);

  useEffect(() => {
    getPricing()
      .then(p => {
        setPricing(p);
        // Default to first available location
        if (p.server_types.length > 0 && p.server_types[0].pricings.length > 0) {
          setSelectedLocation(p.server_types[0].pricings[0].location.name);
        }
      })
      .catch(e => Alert.alert('Error', e.message))
      .finally(() => setLoading(false));
  }, []);

  const locations = useMemo(() => {
    if (!pricing) return [];
    const set = new Set<string>();
    pricing.server_types.forEach(st =>
      st.pricings.forEach(p => set.add(p.location.name)),
    );
    return Array.from(set).sort();
  }, [pricing]);

  const serverTypesForLocation = useMemo(() => {
    if (!pricing || !selectedLocation) return [];
    return pricing.server_types.filter(st =>
      st.pricings.some(p => p.location.name === selectedLocation),
    );
  }, [pricing, selectedLocation]);

  const selectedPricing = useMemo(() => {
    if (!selectedServerType || !selectedLocation) return null;
    return selectedServerType.pricings.find(p => p.location.name === selectedLocation) ?? null;
  }, [selectedServerType, selectedLocation]);

  const estimate = useMemo(() => {
    if (!pricing) return null;

    const serverMonthly = selectedPricing
      ? parseFloat(selectedPricing.price_monthly.gross)
      : 0;

    const backupMonthly = includeBackup && selectedPricing
      ? serverMonthly * (parseFloat(pricing.server_backup.percentage) / 100)
      : 0;

    const gb = parseInt(volumeGb, 10) || 0;
    const volumeMonthly = gb > 0
      ? gb * parseFloat(pricing.volume.price_per_gb_month.gross)
      : 0;

    const floatingMonthly = floatingIps > 0
      ? floatingIps * parseFloat(pricing.floating_ip.price_monthly.gross)
      : 0;

    const total = serverMonthly + backupMonthly + volumeMonthly + floatingMonthly;

    return {
      server: serverMonthly,
      backup: backupMonthly,
      volume: volumeMonthly,
      floating: floatingMonthly,
      total,
      currency: pricing.currency,
    };
  }, [pricing, selectedPricing, includeBackup, volumeGb, floatingIps]);

  const fmt = (n: number, currency: string) =>
    `${n.toFixed(2)} ${currency}`;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Pricing Calculator</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pricing Calculator</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Location */}
        <Text style={styles.sectionLabel}>LOCATION</Text>
        <View style={styles.chipRow}>
          {locations.map(loc => (
            <TouchableOpacity
              key={loc}
              style={[styles.chip, selectedLocation === loc && styles.chipActive]}
              onPress={() => {
                setSelectedLocation(loc);
                setSelectedServerType(null);
              }}
            >
              <Text style={[styles.chipText, selectedLocation === loc && styles.chipTextActive]}>
                {loc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Server Type */}
        <Text style={styles.sectionLabel}>SERVER TYPE</Text>
        {serverTypesForLocation.map(st => {
          const p = st.pricings.find(p => p.location.name === selectedLocation)!;
          const active = selectedServerType?.id === st.id;
          return (
            <TouchableOpacity
              key={st.id}
              style={[styles.serverRow, active && styles.serverRowActive]}
              onPress={() => setSelectedServerType(st)}
            >
              <View style={styles.serverInfo}>
                <Text style={[styles.serverName, active && { color: colors.primary }]}>{st.name}</Text>
              </View>
              <Text style={[styles.serverPrice, active && { color: colors.primary }]}>
                {parseFloat(p.price_monthly.gross).toFixed(2)} {pricing!.currency}/mo
              </Text>
              {active && <Icon name="check-circle" size={18} color={colors.primary} style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
          );
        })}

        {/* Extras */}
        <Text style={styles.sectionLabel}>EXTRAS</Text>
        <View style={styles.card}>

          {/* Backup toggle */}
          <TouchableOpacity
            style={styles.extraRow}
            onPress={() => setIncludeBackup(v => !v)}
          >
            <Icon
              name={includeBackup ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={20}
              color={includeBackup ? colors.primary : colors.textMuted}
            />
            <View style={styles.extraLabel}>
              <Text style={styles.extraText}>Automated Backups</Text>
              {pricing && (
                <Text style={styles.extraSub}>
                  +{pricing.server_backup.percentage}% of server cost
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Volume */}
          <View style={styles.extraRow}>
            <Icon name="harddisk" size={20} color={colors.textMuted} />
            <View style={styles.extraLabel}>
              <Text style={styles.extraText}>Volume</Text>
              {pricing && (
                <Text style={styles.extraSub}>
                  {parseFloat(pricing.volume.price_per_gb_month.gross).toFixed(4)} {pricing.currency}/GB/mo
                </Text>
              )}
            </View>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.numberInput}
                value={volumeGb}
                onChangeText={t => setVolumeGb(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.inputUnit}>GB</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Floating IPs */}
          <View style={styles.extraRow}>
            <Icon name="ip-network-outline" size={20} color={colors.textMuted} />
            <View style={styles.extraLabel}>
              <Text style={styles.extraText}>Floating IPs</Text>
              {pricing && (
                <Text style={styles.extraSub}>
                  {parseFloat(pricing.floating_ip.price_monthly.gross).toFixed(2)} {pricing.currency}/IP/mo
                </Text>
              )}
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setFloatingIps(v => Math.max(0, v - 1))}
              >
                <Icon name="minus" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.stepValue}>{floatingIps}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setFloatingIps(v => v + 1)}
              >
                <Icon name="plus" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Estimate */}
        {estimate && (
          <>
            <Text style={styles.sectionLabel}>ESTIMATE</Text>
            <View style={styles.card}>
              {estimate.server > 0 && (
                <View style={styles.lineRow}>
                  <Text style={styles.lineLabel}>Server</Text>
                  <Text style={styles.lineValue}>{fmt(estimate.server, estimate.currency)}</Text>
                </View>
              )}
              {estimate.backup > 0 && (
                <View style={styles.lineRow}>
                  <Text style={styles.lineLabel}>Backups</Text>
                  <Text style={styles.lineValue}>{fmt(estimate.backup, estimate.currency)}</Text>
                </View>
              )}
              {estimate.volume > 0 && (
                <View style={styles.lineRow}>
                  <Text style={styles.lineLabel}>Volume ({volumeGb} GB)</Text>
                  <Text style={styles.lineValue}>{fmt(estimate.volume, estimate.currency)}</Text>
                </View>
              )}
              {estimate.floating > 0 && (
                <View style={styles.lineRow}>
                  <Text style={styles.lineLabel}>Floating IPs ×{floatingIps}</Text>
                  <Text style={styles.lineValue}>{fmt(estimate.floating, estimate.currency)}</Text>
                </View>
              )}
              <View style={[styles.lineRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total / month</Text>
                <Text style={styles.totalValue}>{fmt(estimate.total, estimate.currency)}</Text>
              </View>
            </View>
            <Text style={styles.vatNote}>All prices include VAT</Text>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    backBtn: { marginRight: Spacing.sm },
    backIcon: { color: c.primary, fontSize: 30, fontWeight: '300' },
    title: { ...Typography.h1, color: c.textPrimary },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl },
    sectionLabel: {
      ...Typography.label,
      color: c.textSecondary,
      marginTop: Spacing.md,
      marginBottom: Spacing.xs,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: c.cardBorder,
      backgroundColor: c.card,
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { ...Typography.bodySmall, color: c.textSecondary },
    chipTextActive: { color: '#fff', fontWeight: '600' },
    serverRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.xs,
    },
    serverRowActive: { borderColor: c.primary },
    serverInfo: { flex: 1 },
    serverName: { ...Typography.body, color: c.textPrimary, fontWeight: '500' },
    serverPrice: { ...Typography.bodySmall, color: c.textSecondary },
    card: {
      backgroundColor: c.card,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.cardBorder,
      overflow: 'hidden',
    },
    extraRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    extraLabel: { flex: 1 },
    extraText: { ...Typography.body, color: c.textPrimary },
    extraSub: { ...Typography.caption, color: c.textMuted, marginTop: 2 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.cardBorder },
    inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    numberInput: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: c.cardBorder,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      ...Typography.body,
      color: c.textPrimary,
      width: 64,
      textAlign: 'right',
    },
    inputUnit: { ...Typography.bodySmall, color: c.textMuted },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    stepBtn: {
      width: 28,
      height: 28,
      borderRadius: BorderRadius.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepValue: { ...Typography.body, color: c.textPrimary, minWidth: 20, textAlign: 'center' },
    lineRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.cardBorder,
    },
    lineLabel: { ...Typography.body, color: c.textSecondary },
    lineValue: { ...Typography.body, color: c.textPrimary },
    totalRow: {
      borderBottomWidth: 0,
      paddingVertical: Spacing.md,
    },
    totalLabel: { ...Typography.body, color: c.textPrimary, fontWeight: '700' },
    totalValue: { ...Typography.h3, color: c.primary },
    vatNote: { ...Typography.caption, color: c.textMuted, textAlign: 'center', marginTop: Spacing.xs },
  });
}
