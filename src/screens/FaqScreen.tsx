import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SurfaceCard } from '../components/SurfaceCard';
import { useI18n } from '../i18n';
import { RootStackParamList } from '../navigation/AppNavigator';
import { radius, spacing, useThemeColors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Faq'>;

export function FaqScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { scaleFont, scaleLineHeight, t } = useI18n();

  const items = [
    { title: t('faqGettingStartedTitle'), body: t('faqGettingStartedBody'), icon: 'flash-outline' as const },
    { title: t('faqQueuesTitle'), body: t('faqQueuesBody'), icon: 'list-outline' as const },
    { title: t('faqPlannerTitle'), body: t('faqPlannerBody'), icon: 'calendar-outline' as const },
    { title: t('faqSwipeTitle'), body: t('faqSwipeBody'), icon: 'swap-horizontal-outline' as const },
    { title: t('faqBackupTitle'), body: t('faqBackupBody'), icon: 'cloud-download-outline' as const },
    { title: t('faqModesTitle'), body: t('faqModesBody'), icon: 'layers-outline' as const },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 10) + spacing.md,
            paddingBottom: Math.max(insets.bottom, 16) + spacing.xl,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            style={[styles.iconButton, { backgroundColor: colors.surfaceMuted }]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel={t('commonBack')}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: scaleFont(20) }]}>{t('faqTitle')}</Text>
          <View style={{ width: 42 }} />
        </View>

        <View>
          <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(30) }]}>{t('faqTitle')}</Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.mutedText, fontSize: scaleFont(15), lineHeight: scaleLineHeight(22) },
            ]}
          >
            {t('faqSubtitle')}
          </Text>
        </View>

        <View style={styles.list}>
          {items.map((item) => (
            <SurfaceCard key={item.title} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={item.icon} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaleFont(18) }]}>{item.title}</Text>
              </View>
              <Text
                style={[
                  styles.cardBody,
                  { color: colors.mutedText, fontSize: scaleFont(14), lineHeight: scaleLineHeight(21) },
                ]}
              >
                {item.body}
              </Text>
            </SurfaceCard>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '700',
  },
  title: {
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
  },
  list: {
    gap: 12,
  },
  card: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontWeight: '700',
  },
  cardBody: {},
});
