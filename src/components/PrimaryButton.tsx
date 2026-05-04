import { ActivityIndicator, Pressable, PressableProps, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { useI18n } from '../i18n';
import { radius, useThemeColors } from '../theme';

interface PrimaryButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({
  title,
  variant = 'primary',
  loading,
  disabled,
  style,
  ...props
}: PrimaryButtonProps) {
  const colors = useThemeColors();
  const { scaleFont } = useI18n();
  const variantStyle =
    variant === 'secondary'
      ? { backgroundColor: colors.primarySoft }
      : variant === 'ghost'
        ? { backgroundColor: 'transparent' }
        : variant === 'danger'
          ? { backgroundColor: colors.dangerText }
          : { backgroundColor: colors.primary };

  return (
    <Pressable
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        disabled ? styles.disabled : null,
        pressed ? styles.pressed : null,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.primary} />
      ) : (
        <Text
          style={[
            styles.text,
            { fontSize: scaleFont(15) },
            { color: variant === 'primary' || variant === 'danger' ? '#fff' : colors.primary },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
  },
});
