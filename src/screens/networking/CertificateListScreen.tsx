import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getCertificates, deleteCertificate } from '../../api/networking';
import type { Certificate } from '../../models';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';
import { ActionSheetModal, showActionSheet } from '../../components/common/ActionSheet';

const actions = [
  { label: 'Delete', icon: '🗑', destructive: true },
];

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function expiryStatus(notAfter: string | null): 'valid' | 'expiring' | 'expired' | 'unknown' {
  if (!notAfter) return 'unknown';
  const diff = new Date(notAfter).getTime() - Date.now();
  if (diff < 0) return 'expired';
  if (diff < 30 * 24 * 60 * 60 * 1000) return 'expiring';
  return 'valid';
}

export default function CertificateListScreen() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Certificate | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const colors = useColors();
  const styles = makeStyles(colors);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setCerts(await getCertificates());
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openActions = (cert: Certificate) => {
    setSelected(cert);
    if (Platform.OS === 'ios') {
      showActionSheet({
        title: cert.name,
        options: actions,
        onSelect: i => handleAction(i, cert),
      });
    } else {
      setSheetVisible(true);
    }
  };

  const handleAction = async (index: number, cert: Certificate) => {
    if (actions[index].label === 'Delete') {
      Alert.alert('Delete Certificate', `Delete "${cert.name}"? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deleteCertificate(cert.id);
              setCerts(prev => prev.filter(c => c.id !== cert.id));
            } catch (e: any) { Alert.alert('Error', e.message); }
          },
        },
      ]);
    }
  };

  const renderItem = ({ item }: { item: Certificate }) => {
    const status = expiryStatus(item.not_valid_after);
    const statusColor = status === 'valid' ? colors.primary : status === 'expiring' ? '#F59E0B' : status === 'expired' ? '#EF4444' : colors.textMuted;
    const statusLabel = status === 'valid' ? 'Valid' : status === 'expiring' ? 'Expiring soon' : status === 'expired' ? 'Expired' : 'Unknown';

    return (
      <TouchableOpacity style={styles.card} onPress={() => openActions(item)} activeOpacity={0.75}>
        <View style={styles.iconWrap}>
          <Icon name="certificate-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.typeBadge}>{item.type === 'managed' ? 'Let\'s Encrypt' : 'Uploaded'}</Text>
          {item.domain_names.length > 0 && (
            <Text style={styles.meta} numberOfLines={1}>
              {item.domain_names.join(', ')}
            </Text>
          )}
          {item.not_valid_after && (
            <Text style={styles.meta}>Expires {formatDate(item.not_valid_after)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Certificates</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={certs}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Icon name="certificate-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No Certificates</Text>
            </View>
          }
        />
      )}

      <ActionSheetModal
        visible={sheetVisible}
        title={selected?.name}
        options={actions}
        onSelect={i => { if (selected) handleAction(i, selected); }}
        onCancel={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { ...Typography.h1, color: c.textPrimary },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md, marginTop: 40 },
  emptyText: { ...Typography.body, color: c.textSecondary },
  card: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  info: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  name: { ...Typography.body, color: c.textPrimary, fontWeight: '600', flex: 1, marginRight: Spacing.sm },
  typeBadge: { ...Typography.caption, color: c.textSecondary, marginBottom: 2 },
  meta: { ...Typography.caption, color: c.textMuted, marginTop: 1 },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
