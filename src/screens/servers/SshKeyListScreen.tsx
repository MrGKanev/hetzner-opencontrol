import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getSshKeys, createSshKey, deleteSshKey, updateSshKey } from '../../api/sshKeys';
import type { SSHKey } from '../../models';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors } from '../../store/themeStore';

export default function SshKeyListScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);

  const [keys, setKeys] = useState<SSHKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add modal
  const [addVisible, setAddVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPublicKey, setNewPublicKey] = useState('');
  const [saving, setSaving] = useState(false);

  // Rename modal
  const [renameKey, setRenameKey] = useState<SSHKey | null>(null);
  const [renameName, setRenameName] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setKeys(await getSshKeys());
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newName.trim()) { Alert.alert('Error', 'Name is required'); return; }
    if (!newPublicKey.trim()) { Alert.alert('Error', 'Public key is required'); return; }
    setSaving(true);
    try {
      const key = await createSshKey(newName.trim(), newPublicKey.trim());
      setKeys(prev => [...prev, key]);
      setAddVisible(false);
      setNewName('');
      setNewPublicKey('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (key: SSHKey) => {
    Alert.alert(
      'Delete SSH Key',
      `Delete "${key.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSshKey(key.id);
              setKeys(prev => prev.filter(k => k.id !== key.id));
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ],
    );
  };

  const handleRename = async () => {
    if (!renameKey || !renameName.trim()) return;
    setSaving(true);
    try {
      const updated = await updateSshKey(renameKey.id, renameName.trim());
      setKeys(prev => prev.map(k => k.id === updated.id ? updated : k));
      setRenameKey(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const copyFingerprint = (fingerprint: string) => {
    Clipboard.setString(fingerprint);
    Alert.alert('Copied', 'Fingerprint copied to clipboard');
  };

  const renderKey = ({ item }: { item: SSHKey }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Icon name="key-variant" size={18} color={colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.keyName}>{item.name}</Text>
          <Text style={styles.keyDate}>Added {new Date(item.created).toLocaleDateString()}</Text>
        </View>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => {
            Alert.alert(item.name, undefined, [
              {
                text: 'Copy Fingerprint',
                onPress: () => copyFingerprint(item.fingerprint),
              },
              {
                text: 'Rename',
                onPress: () => { setRenameKey(item); setRenameName(item.name); },
              },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => handleDelete(item),
              },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
        >
          <Icon name="dots-vertical" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.fingerprintRow}
        onPress={() => copyFingerprint(item.fingerprint)}
        activeOpacity={0.7}
      >
        <Icon name="fingerprint" size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
        <Text style={styles.fingerprint} numberOfLines={1}>{item.fingerprint}</Text>
        <Icon name="content-copy" size={13} color={colors.textMuted} style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>SSH Keys</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddVisible(true)}>
          <Icon name="plus" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={keys}
          keyExtractor={k => String(k.id)}
          renderItem={renderKey}
          contentContainerStyle={styles.list}
          onRefresh={() => load(true)}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.center}>
              <Icon name="key-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No SSH keys yet</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setAddVisible(true)}>
                <Text style={styles.emptyAddBtnText}>Add SSH Key</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Add Modal */}
      <Modal visible={addVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setAddVisible(false); setNewName(''); setNewPublicKey(''); }}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add SSH Key</Text>
            <TouchableOpacity onPress={handleAdd} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Text style={styles.modalSave}>Save</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. MacBook Pro"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.fieldLabel}>Public Key</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={newPublicKey}
              onChangeText={setNewPublicKey}
              placeholder="ssh-ed25519 AAAA..."
              placeholderTextColor={colors.textMuted}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
            />
            <Text style={styles.fieldHint}>Paste your public key (e.g. ~/.ssh/id_ed25519.pub)</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Rename Modal */}
      <Modal visible={!!renameKey} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setRenameKey(null)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Rename Key</Text>
            <TouchableOpacity onPress={handleRename} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Text style={styles.modalSave}>Save</Text>}
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={renameName}
              onChangeText={setRenameName}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: { ...Typography.h1, color: c.textPrimary },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: Spacing.md, gap: Spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  emptyText: { ...Typography.body, color: c.textSecondary },
  emptyAddBtn: {
    backgroundColor: c.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  emptyAddBtnText: { ...Typography.body, color: c.textPrimary, fontWeight: '600' },
  card: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  cardInfo: { flex: 1 },
  keyName: { ...Typography.body, color: c.textPrimary, fontWeight: '600' },
  keyDate: { ...Typography.caption, color: c.textMuted, marginTop: 2 },
  menuBtn: { padding: 4 },
  fingerprintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: c.cardBorder,
    backgroundColor: c.surface,
  },
  fingerprint: { ...Typography.caption, color: c.textSecondary, flex: 1, fontFamily: 'monospace' },
  // Modals
  modal: { flex: 1, backgroundColor: c.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.cardBorder,
  },
  modalTitle: { ...Typography.body, color: c.textPrimary, fontWeight: '600' },
  modalCancel: { ...Typography.body, color: c.textSecondary },
  modalSave: { ...Typography.body, color: c.primary, fontWeight: '600' },
  modalContent: { padding: Spacing.lg },
  fieldLabel: { ...Typography.label, color: c.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.cardBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Typography.body,
    color: c.textPrimary,
  },
  inputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  fieldHint: { ...Typography.caption, color: c.textMuted, marginTop: Spacing.xs },
});
