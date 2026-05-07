import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n';
import { useThemeColors } from '../theme';

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  const colors = useThemeColors();
  const { scaleFont, scaleLineHeight } = useI18n();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(18) }]}>{title}</Text>
      <Text
        style={[
          styles.description,
          { color: colors.mutedText, fontSize: scaleFont(14), lineHeight: scaleLineHeight(20) },
        ]}
      >
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
});
