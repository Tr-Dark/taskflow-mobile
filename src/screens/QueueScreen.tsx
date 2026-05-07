import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTextInput } from '../components/AppTextInput';
import { EmptyState } from '../components/EmptyState';
import { SurfaceCard } from '../components/SurfaceCard';
import { TaskRow } from '../components/TaskRow';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import { spacing, useThemeColors } from '../theme';
import { Task } from '../types';
import { daysFromToday } from '../utils/date';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Queue'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function QueueScreen({ navigation }: Props) {
  const { activeData } = useApp();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { scaleFont, t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'refine' | 'closer' | 'farther' | 'postponed'>('all');
  const normalizedQuery = searchQuery.trim().toLowerCase();

  function matchesTask(task: Task) {
    if (!normalizedQuery) return true;
    const haystack = [task.title, task.category, task.notes, ...(task.subtasks ?? []).map((item) => item.title)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  }

  const unrefined = activeData.tasks.filter((task) => task.status === 'active' && !task.isRefined && matchesTask(task));
  const closerLater = activeData.tasks.filter((task) => {
    const diff = daysFromToday(task.dueDate);
    return task.status === 'active' && task.isRefined && diff !== null && diff > 1 && diff <= 14 && matchesTask(task);
  });
  const fartherLater = activeData.tasks.filter((task) => {
    const diff = daysFromToday(task.dueDate);
    return task.status === 'active' && task.isRefined && (diff === null || diff > 14) && matchesTask(task);
  });
  const postponed = activeData.tasks.filter((task) => task.status === 'postponed' && matchesTask(task));

  const sections = useMemo(
    () => [
      { key: 'refine' as const, title: `${t('queueRefine')} (${unrefined.length})`, tasks: unrefined, empty: t('queueEmptyRefine') },
      { key: 'closer' as const, title: `${t('queueCloserLater')} (${closerLater.length})`, tasks: closerLater, empty: t('queueEmptyCloser') },
      { key: 'farther' as const, title: `${t('queueFartherLater')} (${fartherLater.length})`, tasks: fartherLater, empty: t('queueEmptyFarther') },
      { key: 'postponed' as const, title: `${t('queuePostponed')} (${postponed.length})`, tasks: postponed, empty: t('queueEmptyPostponed') },
    ],
    [closerLater, fartherLater, postponed, t, unrefined],
  );

  const visibleSections = filter === 'all' ? sections : sections.filter((section) => section.key === filter);
  const hasAnyResults = visibleSections.some((section) => section.tasks.length > 0);
  const filterOptions = [
    { key: 'all' as const, label: t('queueFilterAll') },
    { key: 'refine' as const, label: t('queueRefine') },
    { key: 'closer' as const, label: t('queueCloserLater') },
    { key: 'farther' as const, label: t('queueFartherLater') },
    { key: 'postponed' as const, label: t('queuePostponed') },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, 8) + spacing.md, paddingBottom: Math.max(insets.bottom, 12) + 104 },
      ]}
    >
      <View>
        <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(30) }]}>{t('queueTitle')}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText, fontSize: scaleFont(15) }]}>
          {t('queueSubtitle')}
        </Text>
      </View>

      <SurfaceCard style={[styles.infoCard, { backgroundColor: colors.primarySoft }]}>
        <Text style={[styles.infoTitle, { color: colors.primary, fontSize: scaleFont(16) }]}>
          {t('queueInfoTitle')}
        </Text>
        <Text style={[styles.infoText, { color: colors.mutedText, fontSize: scaleFont(14) }]}>
          {t('queueInfoText')}
        </Text>
      </SurfaceCard>

      <SurfaceCard style={styles.searchCard}>
        <AppTextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('queueSearchPlaceholder')}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filterOptions.map((option) => {
            const active = filter === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => setFilter(option.key)}
                accessibilityRole="button"
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.primarySoft : colors.surfaceMuted,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.filterText, { color: active ? colors.primary : colors.mutedText, fontSize: scaleFont(14) }]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </SurfaceCard>

      {hasAnyResults ? (
        visibleSections.map((section) => (
          <Section
            key={section.key}
            title={section.title}
            tasks={section.tasks}
            empty={section.empty}
            onTaskPress={(taskId) => navigation.navigate('TaskDetails', { taskId })}
          />
        ))
      ) : (
        <SurfaceCard>
          <EmptyState title={t('commonNoResults')} description={t('queueNoResults')} />
        </SurfaceCard>
      )}
    </ScrollView>
  );
}

function Section({
  title,
  tasks,
  empty,
  onTaskPress,
}: {
  title: string;
  tasks: Task[];
  empty: string;
  onTaskPress: (taskId: string) => void;
}) {
  const colors = useThemeColors();
  const { scaleFont, t } = useI18n();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{title}</Text>
      {tasks.length ? (
        <View style={styles.list}>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onPress={() => onTaskPress(task.id)} />
          ))}
        </View>
      ) : (
        <SurfaceCard>
          <EmptyState title={t('commonEmpty')} description={empty} />
        </SurfaceCard>
      )}
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
    paddingBottom: 120,
  },
  title: {
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
  },
  infoTitle: {
    fontWeight: '700',
  },
  infoText: {
    marginTop: 6,
    lineHeight: 20,
  },
  infoCard: {},
  searchCard: {
    gap: 12,
  },
  filterRow: {
    gap: 10,
  },
  filterChip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontWeight: '700',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
});
