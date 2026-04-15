import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Keychain from 'react-native-keychain';

import type { RootStackParamList } from '../../navigation';
import { useAuthStore } from '../../store/authStore';
import { Spacing, BorderRadius, Typography } from '../../theme';
import type { ThemeColors } from '../../theme';
import { useColors, useThemeStore } from '../../store/themeStore';
import { useSettingsStore, REFRESH_INTERVALS } from '../../store/settingsStore';
import { useProjectsStore } from '../../store/projectsStore';
import { requestNotificationPermission } from '../../services/notifications';
import { Haptics } from '../../services/haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const APP_VERSION = '0.0.1';
const KEYCHAIN_SERVICE = 'HetznerOpenControl';

export default function SettingsScreen({ navigation }: Props) {
  const { logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const colors = useColors();
  const styles = makeStyles(colors);
  const [maskedToken, setMaskedToken] = useState<string | null>(null);
  const [tokenVisible, setTokenVisible] = useState(false);

  const {
    hapticsEnabled, setHapticsEnabled,
    refreshInterval, setRefreshInterval,
    notificationsEnabled, setNotificationsEnabled,
  } = useSettingsStore();

  const { projects, activeProjectId, renameProject, removeProject, switchProject, addProject, isLoading: projectsLoading, error: projectsError, clearError: clearProjectsError } = useProjectsStore();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectToken, setNewProjectToken] = useState('');

  const handleAddProject = async () => {
    if (!newProjectToken.trim()) { Haptics.warning(); return; }
    const name = newProjectName.trim() || `Project ${projects.length + 1}`;
    Haptics.medium();
    const ok = await addProject(name, newProjectToken.trim());
    if (ok) {
      Haptics.success();
      setShowAddProject(false);
      setNewProjectName('');
      setNewProjectToken('');
    } else {
      Haptics.error();
    }
  };

  const revealToken = async () => {
    if (tokenVisible) { setTokenVisible(false); setMaskedToken(null); return; }
    try {
      const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
      if (credentials && credentials.password) {
        const t = credentials.password;
        setMaskedToken(t.slice(0, 6) + '••••••••••••••••' + t.slice(-4));
        setTokenVisible(true);
      } else {
        setMaskedToken('No saved token');
        setTokenVisible(true);
      }
    } catch {
      setMaskedToken('Unable to read token');
      setTokenVisible(true);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'This will remove your saved API token and return you to the login screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
      ],
    );
  };

  const handleNotificationsToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
        return;
      }
    }
    Haptics.light();
    setNotificationsEnabled(value);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Icon name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Appearance */}
        <Text style={styles.sectionHeader}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name={isDark ? 'weather-night' : 'weather-sunny'} size={20} color={colors.textSecondary} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
            </View>
            <Switch
              value={!isDark}
              onValueChange={toggle}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>
        </View>

        {/* General */}
        <Text style={styles.sectionHeader}>General</Text>
        <View style={styles.card}>
          {/* Haptics */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name="vibrate" size={20} color={colors.textSecondary} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>Haptic Feedback</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={(v) => { setHapticsEnabled(v); }}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>

          <View style={styles.divider} />

          {/* Notifications */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name="bell-outline" size={20} color={colors.textSecondary} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>Server Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>

          <View style={styles.divider} />

          {/* Refresh interval */}
          <View style={styles.refreshRow}>
            <View style={styles.rowLeft}>
              <Icon name="refresh" size={20} color={colors.textSecondary} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>Auto-Refresh</Text>
            </View>
            <View style={styles.segmentRow}>
              {REFRESH_INTERVALS.map(({ label, value }) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.segment, refreshInterval === value && styles.segmentActive]}
                  onPress={() => { Haptics.light(); setRefreshInterval(value); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.segmentText, refreshInterval === value && styles.segmentTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Projects */}
        <Text style={styles.sectionHeader}>Projects</Text>
        <View style={styles.card}>
          {projects.map((project, index) => (
            <React.Fragment key={project.id}>
              {index > 0 && <View style={styles.divider} />}
              {renamingId === project.id ? (
                    <View style={styles.renameRow}>
                      <TextInput
                        style={styles.renameInput}
                        value={renameValue}
                        onChangeText={setRenameValue}
                        autoFocus
                        autoCapitalize="words"
                        returnKeyType="done"
                        onSubmitEditing={() => {
                          if (renameValue.trim()) renameProject(project.id, renameValue.trim());
                          setRenamingId(null);
                        }}
                      />
                      <TouchableOpacity onPress={() => {
                        if (renameValue.trim()) renameProject(project.id, renameValue.trim());
                        setRenamingId(null);
                        Haptics.light();
                      }}>
                        <Icon name="check" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.row}>
                      <View style={styles.rowLeft}>
                        <Icon
                          name={project.id === activeProjectId ? 'cloud-check-outline' : 'cloud-outline'}
                          size={20}
                          color={project.id === activeProjectId ? colors.primary : colors.textSecondary}
                          style={styles.rowIcon}
                        />
                        <Text style={[styles.rowLabel, project.id === activeProjectId && { color: colors.primary }]}>
                          {project.name}
                        </Text>
                      </View>
                      <View style={styles.rowRight}>
                        {project.id !== activeProjectId && (
                          <TouchableOpacity onPress={() => { Haptics.light(); switchProject(project.id); }} style={styles.projectAction}>
                            <Icon name="swap-horizontal" size={18} color={colors.textMuted} />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => { setRenamingId(project.id); setRenameValue(project.name); Haptics.light(); }} style={styles.projectAction}>
                          <Icon name="pencil-outline" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.warning();
                            Alert.alert('Remove Project', `Remove "${project.name}"?`, [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Remove', style: 'destructive', onPress: () => { Haptics.heavy(); removeProject(project.id); } },
                            ]);
                          }}
                          style={styles.projectAction}
                        >
                          <Icon name="delete-outline" size={18} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
            </React.Fragment>
          ))}
          {projects.length > 0 && <View style={styles.divider} />}
          <SettingsRow
            icon="plus-circle-outline"
            label="Add Project"
            onPress={() => { Haptics.light(); setShowAddProject(true); }}
            colors={colors}
          />
        </View>

        {/* Add Project inline form */}
        {showAddProject && (
          <View style={[styles.card, { marginTop: Spacing.sm, padding: Spacing.md, gap: Spacing.sm }]}>
            <TextInput
              style={styles.renameInput}
              placeholder="Project name"
              placeholderTextColor={colors.textMuted}
              value={newProjectName}
              onChangeText={setNewProjectName}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.renameInput}
              placeholder="API key"
              placeholderTextColor={colors.textMuted}
              value={newProjectToken}
              onChangeText={setNewProjectToken}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {projectsError ? <Text style={{ color: colors.error, fontSize: 13 }}>{projectsError}</Text> : null}
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity
                style={[styles.button, { flex: 1, marginTop: 0, paddingVertical: Spacing.sm + 2 }]}
                onPress={handleAddProject}
                disabled={projectsLoading}
                activeOpacity={0.8}
              >
                {projectsLoading
                  ? <ActivityIndicator color={colors.textPrimary} />
                  : <Text style={styles.buttonText}>Add</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { flex: 1, marginTop: 0, paddingVertical: Spacing.sm + 2, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }]}
                onPress={() => { setShowAddProject(false); setNewProjectName(''); setNewProjectToken(''); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Account */}
        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.card}>
          {projects.length === 0 && (
            <>
              <SettingsRow
                icon="key-outline"
                label="API Token"
                value={tokenVisible && maskedToken ? maskedToken : '••••••••••••••••••••'}
                onPress={revealToken}
                actionIcon={tokenVisible ? 'eye-off-outline' : 'eye-outline'}
                colors={colors}
              />
              <View style={styles.divider} />
            </>
          )}
          <SettingsRow
            icon="logout"
            label="Sign Out"
            labelColor={colors.error}
            onPress={handleLogout}
            colors={colors}
          />
        </View>

        {/* About */}
        <Text style={styles.sectionHeader}>About</Text>
        <View style={styles.card}>
          <SettingsRow icon="information-outline" label="Version" value={APP_VERSION} colors={colors} />
          <View style={styles.divider} />
          <SettingsRow
            icon="github"
            label="Source Code"
            value="GitHub"
            onPress={() => Linking.openURL('https://github.com/GabrielKanev/Hetzner-OpenControl')}
            actionIcon="open-in-new"
            colors={colors}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="shield-check-outline"
            label="Hetzner API"
            value="docs.hetzner.cloud"
            onPress={() => Linking.openURL('https://docs.hetzner.cloud')}
            actionIcon="open-in-new"
            colors={colors}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({
  icon, label, labelColor, value, onPress, actionIcon, colors,
}: {
  icon: string;
  label: string;
  labelColor?: string;
  value?: string;
  onPress?: () => void;
  actionIcon?: string;
  colors: ThemeColors;
}) {
  const styles = makeStyles(colors);
  const content = (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Icon name={icon} size={20} color={labelColor ?? colors.textSecondary} style={styles.rowIcon} />
        <Text style={[styles.rowLabel, labelColor ? { color: labelColor } : {}]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
        {actionIcon ? <Icon name={actionIcon} size={16} color={colors.textMuted} style={{ marginLeft: 6 }} /> : null}
        {onPress && !actionIcon ? <Icon name="chevron-right" size={18} color={colors.textMuted} /> : null}
      </View>
    </View>
  );
  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  }
  return content;
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
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...Typography.h2, color: c.textPrimary },
  content: { padding: Spacing.lg, gap: Spacing.sm },
  sectionHeader: {
    ...Typography.label,
    color: c.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: c.cardBorder },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIcon: { marginRight: Spacing.sm },
  rowLabel: { ...Typography.body, color: c.textPrimary },
  rowRight: { flexDirection: 'row', alignItems: 'center', maxWidth: '55%' },
  rowValue: { ...Typography.bodySmall, color: c.textMuted, flexShrink: 1 },

  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  segmentRow: { flexDirection: 'row', gap: 4 },
  segment: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: c.cardBorder,
    backgroundColor: c.background,
  },
  segmentActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  segmentText: { fontSize: 12, fontWeight: '500', color: c.textMuted },
  segmentTextActive: { color: c.textPrimary },

  projectAction: { padding: 6 },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  renameInput: {
    flex: 1,
    backgroundColor: c.background,
    borderWidth: 1,
    borderColor: c.primary,
    borderRadius: BorderRadius.sm,
    color: c.textPrimary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    fontSize: 15,
  },
});
