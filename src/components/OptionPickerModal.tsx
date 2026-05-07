import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../i18n';
import { radius, spacing, useThemeColors } from '../theme';

export interface PickerOption<T extends string = string> {
  label: string;
  value: T;
  description?: string;
}

interface OptionPickerModalProps<T extends string = string> {
  visible: boolean;
  title: string;
  options: PickerOption<T>[];
  selectedValue?: T;
  onSelect: (value: T) => void;
  onClose: () => void;
  allowClear?: boolean;
  clearLabel?: string;
  onClear?: () => void;
}

export function OptionPickerModal<T extends string = string>({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  allowClear,
  clearLabel,
  onClear,
}: OptionPickerModalProps<T>) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { scaleFont, t } = useI18n();
  const resolvedClearLabel = clearLabel ?? t('commonClear');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
              marginBottom: Math.max(insets.bottom, 8),
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(22) }]}>{title}</Text>

          <ScrollView style={{ maxHeight: 380 }}>
            {options.map((option) => {
              const selected = option.value === selectedValue;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  style={[
                    styles.option,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                    selected
                      ? [styles.optionSelected, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]
                      : null,
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: colors.text, fontSize: scaleFont(15) },
                      selected ? [styles.optionLabelSelected, { color: colors.primary }] : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.description ? (
                    <Text
                      style={[
                        styles.optionDescription,
                        { color: colors.mutedText, fontSize: scaleFont(13) },
                      ]}
                    >
                      {option.description}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            {allowClear && onClear ? (
              <Pressable
                style={styles.clearButton}
                accessibilityRole="button"
                onPress={() => {
                  onClear();
                  onClose();
                }}
              >
                <Text style={[styles.clearText, { color: colors.dangerText, fontSize: scaleFont(15) }]}>
                  {resolvedClearLabel}
                </Text>
              </Pressable>
            ) : null}

            <Pressable style={styles.closeButton} accessibilityRole="button" onPress={onClose}>
              <Text style={[styles.closeText, { color: colors.primary, fontSize: scaleFont(15) }]}>
                {t('commonClose')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontWeight: '800',
  },
  option: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    justifyContent: 'center',
  },
  optionSelected: {},
  optionLabel: {
    fontWeight: '600',
  },
  optionLabelSelected: {},
  optionDescription: {
    marginTop: 4,
  },
  footer: {
    gap: 10,
    marginTop: 4,
  },
  clearButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  clearText: {
    fontWeight: '700',
  },
  closeButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  closeText: {
    fontWeight: '700',
  },
});
