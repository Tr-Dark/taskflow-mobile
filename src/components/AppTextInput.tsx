import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useI18n } from '../i18n';
import { radius, useThemeColors } from '../theme';

interface AppTextInputProps extends TextInputProps {
  label?: string;
  helperText?: string;
}

export const AppTextInput = forwardRef<TextInput, AppTextInputProps>(function AppTextInput(
  { label, helperText, multiline, style, ...props },
  ref,
) {
  const colors = useThemeColors();
  const { scaleFont, scaleLineHeight } = useI18n();
  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: colors.text, fontSize: scaleFont(14) }]}>{label}</Text> : null}
      <TextInput
        ref={ref}
        multiline={multiline}
        placeholderTextColor="#A2A2B5"
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
            fontSize: scaleFont(16),
          },
          multiline ? [styles.multiline, { lineHeight: scaleLineHeight(22) }] : null,
          style,
        ]}
        {...props}
      />
      {helperText ? (
        <Text style={[styles.helper, { color: colors.mutedText, fontSize: scaleFont(12) }]}>{helperText}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
  },
  multiline: {
    minHeight: 120,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  helper: {
    fontSize: 12,
  },
});
