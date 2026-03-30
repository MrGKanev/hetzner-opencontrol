import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  ActionSheetIOS,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';

export interface ActionSheetOption {
  label: string;
  icon?: string;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  cancelLabel?: string;
  onSelect: (index: number) => void;
  onCancel: () => void;
}

// Cross-platform ActionSheet
// iOS: uses native ActionSheetIOS
// Android: custom modal bottom sheet

export function showActionSheet(params: {
  title?: string;
  options: ActionSheetOption[];
  cancelLabel?: string;
  onSelect: (index: number) => void;
}) {
  if (Platform.OS === 'ios') {
    const labels = [...params.options.map(o => o.label), params.cancelLabel ?? 'Cancel'];
    const destructiveIndex = params.options.findIndex(o => o.destructive);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: params.title,
        options: labels,
        destructiveButtonIndex: destructiveIndex >= 0 ? destructiveIndex : undefined,
        cancelButtonIndex: labels.length - 1,
        tintColor: Colors.primary,
      },
      index => {
        if (index < params.options.length) {
          params.onSelect(index);
        }
      },
    );
  }
  // Android: caller must render <ActionSheetModal> with visible state
}

export function ActionSheetModal({
  visible,
  title,
  options,
  cancelLabel = 'Cancel',
  onSelect,
  onCancel,
}: ActionSheetProps) {
  if (Platform.OS === 'ios') return null; // iOS uses native sheet

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        {title ? <Text style={styles.title}>{title}</Text> : null}

        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          {options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.option,
                opt.disabled && styles.optionDisabled,
                i < options.length - 1 && styles.optionBorder,
              ]}
              onPress={() => { onSelect(i); onCancel(); }}
              disabled={opt.disabled}
              activeOpacity={0.7}
            >
              {opt.icon ? (
                <Icon
                  name={opt.icon}
                  size={20}
                  color={opt.destructive ? Colors.error : opt.disabled ? Colors.textMuted : Colors.textPrimary}
                  style={styles.optionIcon}
                />
              ) : null}
              <Text style={[
                styles.optionLabel,
                opt.destructive && styles.optionDestructive,
                opt.disabled && styles.optionLabelDisabled,
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.separator} />

        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.cancelText}>{cancelLabel}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: 34, // safe area
    maxHeight: '70%',
  },
  title: {
    ...Typography.bodySmall,
    textAlign: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  optionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.cardBorder,
  },
  optionDisabled: { opacity: 0.4 },
  optionIcon: { width: 32 },
  optionLabel: { ...Typography.body, fontWeight: '500' },
  optionDestructive: { color: Colors.error },
  optionLabelDisabled: { color: Colors.textMuted },
  separator: { height: Spacing.sm, backgroundColor: Colors.cardBorder },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md + 2,
  },
  cancelText: { ...Typography.body, fontWeight: '600', color: Colors.primary },
});
