import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useEffect, useRef } from 'react';
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
  description?: string;
  options: PickerOption<T>[];
  selectedValue?: T;
  scrollToSelectedOnOpen?: boolean;
  onSelect: (value: T) => void;
  onClose: () => void;
  allowClear?: boolean;
  clearLabel?: string;
  onClear?: () => void;
}

export function OptionPickerModal<T extends string = string>({
  visible,
  title,
  description,
  options,
  selectedValue,
  scrollToSelectedOnOpen = true,
  onSelect,
  onClose,
  allowClear,
  clearLabel,
  onClear,
}: OptionPickerModalProps<T>) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const { scaleFont, t } = useI18n();
  const resolvedClearLabel = clearLabel ?? t('commonClear');
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;
  const dialogWidth = Math.min(560, Math.max(320, width - 32));
  const sheetPaddingBottom = isDesktopWeb ? spacing.xl : Math.max(insets.bottom, 16) + 8;
  const sheetMarginBottom = isDesktopWeb ? 0 : Math.max(insets.bottom, 8);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (!visible || !scrollToSelectedOnOpen || !selectedValue) {
      return;
    }

    const selectedIndex = options.findIndex((option) => option.value === selectedValue);
    if (selectedIndex < 0) {
      return;
    }

    const estimatedRowHeight = 66;
    const estimatedGap = 10;
    const offset = Math.max(0, selectedIndex * (estimatedRowHeight + estimatedGap) - 80);
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: offset, animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [options, scrollToSelectedOnOpen, selectedValue, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.backdrop,
          isDesktopWeb ? styles.backdropCentered : null,
          { backgroundColor: colors.overlay },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />
        <View
          style={[
            styles.sheet,
            isDesktopWeb
              ? {
                  width: dialogWidth,
                  maxHeight: '80%',
                  borderRadius: radius.xl,
                }
              : null,
            {
              backgroundColor: colors.surface,
              paddingBottom: sheetPaddingBottom,
              marginBottom: sheetMarginBottom,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(22) }]}>{title}</Text>
          {description ? (
            <Text style={[styles.description, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{description}</Text>
          ) : null}

          <ScrollView ref={scrollRef} style={{ maxHeight: 380 }}>
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
  backdropCentered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
  description: {
    lineHeight: 20,
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
