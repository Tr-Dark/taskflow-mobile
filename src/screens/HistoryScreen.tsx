import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../components/EmptyState';
import { SurfaceCard } from '../components/SurfaceCard';
import { TaskRow } from '../components/TaskRow';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { RootStackParamList } from '../navigation/AppNavigator';
import { radius, spacing, useThemeColors } from '../theme';
import { formatLocalizedDate, getDatePart, todayDateString } from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export function HistoryScreen({ navigation }: Props) {
  const { activeData } = useApp();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { language, scaleFont, scaleLineHeight, t } = useI18n();

  const days = useMemo(() => {
    const today = new Date(`${todayDateString()}T00:00:00`);
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - index);
      const dateString = date.toISOString().slice(0, 10);

      const planned = activeData.tasks.filter((task) => task.dueDate === dateString);
      const completed = activeData.tasks.filter((task) => task.completedAt && getDatePart(task.completedAt) === dateString);
      const postponed = activeData.tasks.filter((task) => task.status === 'postponed' && task.updatedAt.startsWith(dateString));

      return {
        dateString,
        planned,
        completed,
        postponed,
      };
    });
  }, [activeData.tasks]);

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
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: scaleFont(20) }]}>{t('historyTitle')}</Text>
          <View style={{ width: 42 }} />
        </View>

        <View>
          <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(30) }]}>{t('historyHeading')}</Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.mutedText, fontSize: scaleFont(15), lineHeight: scaleLineHeight(22) },
            ]}
          >
            {t('historySubtitle')}
          </Text>
        </View>

        {days.some((day) => day.planned.length || day.completed.length || day.postponed.length) ? (
          <View style={styles.sections}>
            {days.map((day) => (
              <SurfaceCard key={day.dateString}>
                <Text style={[styles.dayTitle, { color: colors.text, fontSize: scaleFont(18) }]}>
                  {formatLocalizedDate(language, day.dateString, { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('historyPlanned')}</Text>
                  <Text style={[styles.statValue, { color: colors.text, fontSize: scaleFont(14) }]}>{day.planned.length}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('historyCompleted')}</Text>
                  <Text style={[styles.statValue, { color: colors.text, fontSize: scaleFont(14) }]}>{day.completed.length}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('historyPostponedChanged')}</Text>
                  <Text style={[styles.statValue, { color: colors.text, fontSize: scaleFont(14) }]}>{day.postponed.length}</Text>
                </View>

                {day.completed.length ? (
                  <View style={styles.taskGroup}>
                    <Text style={[styles.groupTitle, { color: colors.text, fontSize: scaleFont(15) }]}>{t('historyCompleted')}</Text>
                    {day.completed.map((task) => (
                      <TaskRow key={task.id} task={task} onPress={() => navigation.navigate('TaskDetails', { taskId: task.id })} />
                    ))}
                  </View>
                ) : null}

                {day.planned.length && !day.completed.length ? (
                  <View style={styles.taskGroup}>
                    <Text style={[styles.groupTitle, { color: colors.text, fontSize: scaleFont(15) }]}>{t('historyPlanned')}</Text>
                    {day.planned.map((task) => (
                      <TaskRow key={task.id} task={task} onPress={() => navigation.navigate('TaskDetails', { taskId: task.id })} />
                    ))}
                  </View>
                ) : null}
              </SurfaceCard>
            ))}
          </View>
        ) : (
          <SurfaceCard>
            <EmptyState title={t('historyEmptyTitle')} description={t('historyEmptyDescription')} />
          </SurfaceCard>
        )}
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
  sections: {
    gap: 12,
  },
  dayTitle: {
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  statRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {},
  statValue: {
    fontWeight: '700',
  },
  taskGroup: {
    gap: 10,
    marginTop: 16,
  },
  groupTitle: {
    fontWeight: '700',
  },
});
