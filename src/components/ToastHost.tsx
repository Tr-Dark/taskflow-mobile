import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { radius, spacing, useThemeColors } from '../theme';

export function ToastHost() {
  const { toast, clearToast } = useApp();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  if (!toast) {
    return null;
  }

  const toneStyle =
    toast.tone === 'success'
      ? { backgroundColor: colors.successSoft, borderColor: colors.successSoft, textColor: colors.successText }
      : toast.tone === 'warning'
        ? { backgroundColor: colors.warningSoft, borderColor: colors.warningSoft, textColor: colors.warningText }
        : { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft, textColor: colors.primary };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, 12) + 22,
        },
      ]}
    >
      <Pressable
        onPress={clearToast}
        style={[
          styles.toast,
          {
            backgroundColor: toneStyle.backgroundColor,
            borderColor: toneStyle.borderColor,
          },
        ]}
      >
        <Text style={[styles.message, { color: toneStyle.textColor }]}>{toast.message}</Text>
        <Text style={[styles.dismiss, { color: toneStyle.textColor }]}>OK</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  dismiss: {
    fontSize: 13,
    fontWeight: '800',
  },
});
