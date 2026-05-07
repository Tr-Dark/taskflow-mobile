import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTextInput } from '../components/AppTextInput';
import { SurfaceCard } from '../components/SurfaceCard';
import { TaskRow } from '../components/TaskRow';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import { radius, spacing, useThemeColors } from '../theme';
import { Task } from '../types';
import { addDays, formatPolishDate, todayDateString, toDateString } from '../utils/date';

type ScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Today'>,
  NativeStackScreenProps<RootStackParamList>
>;

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function TodayScreen({ navigation }: ScreenProps) {
  const { activeData, state, toggleTaskStatus, quickMoveTask } = useApp();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { scaleFont, t } = useI18n();
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const [fabOpen, setFabOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'needs-refine'>('all');
  const today = todayDateString();

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const baseActiveTasks = useMemo(
    () => activeData.tasks.filter((task) => task.status === 'active' && (task.dueDate ?? today) === selectedDate),
    [activeData.tasks, selectedDate, today],
  );

  const baseCompletedTasks = useMemo(
    () => activeData.tasks.filter((task) => task.status === 'completed' && task.completedAt?.startsWith(selectedDate)),
    [activeData.tasks, selectedDate],
  );

  const dayTasks = useMemo(() => {
    return baseActiveTasks.filter((task) => {
      if (filter === 'needs-refine' && task.isRefined) return false;
      if (!normalizedQuery) return true;
      const haystack = [task.title, task.category, task.notes, ...(task.subtasks ?? []).map((item) => item.title)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [baseActiveTasks, filter, normalizedQuery]);

  const completedTasks = useMemo(() => {
    if (filter === 'active' || filter === 'needs-refine') {
      return [];
    }
    return baseCompletedTasks.filter((task) => {
      if (!normalizedQuery) return true;
      const haystack = [task.title, task.category, task.notes, ...(task.subtasks ?? []).map((item) => item.title)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [baseCompletedTasks, filter, normalizedQuery]);

  const unrefinedCount = baseActiveTasks.filter((task) => !task.isRefined).length;
  const showActiveSection = filter !== 'completed';
  const showCompletedSection = filter !== 'active' && filter !== 'needs-refine';

  const filterOptions = [
    { key: 'all' as const, label: t('todayFilterAll') },
    { key: 'active' as const, label: t('todayFilterActive') },
    { key: 'completed' as const, label: t('todayFilterCompleted') },
    { key: 'needs-refine' as const, label: t('todayFilterNeedsRefine') },
  ];

  function changeDay(days: number) {
    setSelectedDate((current) => toDateString(addDays(new Date(`${current}T12:00:00`), days)));
  }

  const fabBottom = Math.max(insets.bottom, 12) + 24;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 8) + spacing.md,
            paddingBottom: Math.max(insets.bottom, 12) + 112,
          },
        ]}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.dateLabel, { color: colors.mutedText, fontSize: scaleFont(14) }]}>
              {formatPolishDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(32) }]}>
              {selectedDate === today ? t('todayTitle') : t('todayReviewTitle')}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.historyButton, { backgroundColor: colors.surfaceMuted }]}
              onPress={() => navigation.navigate('History')}
              accessibilityRole="button"
              accessibilityLabel={t('commonBack')}
            >
              <Ionicons name="time-outline" size={20} color={colors.text} />
            </Pressable>
            <Pressable
              style={[styles.avatar, { backgroundColor: colors.primarySoft }]}
              onPress={() => navigation.navigate('Settings')}
              accessibilityRole="button"
              accessibilityLabel={t('commonSettings')}
            >
              <Text style={[styles.avatarText, { color: colors.primary, fontSize: scaleFont(14) }]}>
                {getInitials(state.settings.displayName || 'TP')}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.dateSwitcher}>
          <Pressable
            style={[styles.switcherButton, { backgroundColor: colors.surfaceMuted }]}
            onPress={() => changeDay(-1)}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <View style={[styles.switcherBadge, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={[styles.switcherText, { color: colors.primary, fontSize: scaleFont(14) }]}>
              {selectedDate === today
                ? t('todayTitle')
                : formatPolishDate(selectedDate, { weekday: 'short', day: 'numeric', month: 'short' })}
            </Text>
          </View>
          <Pressable
            style={[styles.switcherButton, { backgroundColor: colors.surfaceMuted }]}
            onPress={() => changeDay(1)}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <SurfaceCard style={[styles.statCard, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.statLabel, { color: colors.primary, fontSize: scaleFont(14) }]}>
              {t('todayCompleted')}
            </Text>
            <Text style={[styles.statValue, { color: colors.text, fontSize: scaleFont(28) }]}>
              {completedTasks.length}
            </Text>
          </SurfaceCard>
          <SurfaceCard style={[styles.statCard, { backgroundColor: colors.warningSoft }]}>
            <Text style={[styles.statLabel, { color: colors.warningText, fontSize: scaleFont(14) }]}>
              {t('todayRemaining')}
            </Text>
            <Text style={[styles.statValue, { color: colors.text, fontSize: scaleFont(28) }]}>{dayTasks.length}</Text>
          </SurfaceCard>
        </View>

        <SurfaceCard style={styles.searchCard}>
          <AppTextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('todaySearchPlaceholder')}
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

        {unrefinedCount > 0 ? (
          <Pressable
            style={[styles.alertCard, { borderColor: '#F3D88D', backgroundColor: colors.warningSoft }]}
            onPress={() => navigation.navigate('Queue')}
            accessibilityRole="button"
          >
            <Ionicons name="sparkles-outline" size={20} color={colors.warningText} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: colors.warningText, fontSize: scaleFont(14) }]}>
                {unrefinedCount} {t('todayNeedsRefine')}
              </Text>
              <Text style={[styles.alertSubtitle, { color: colors.warningText, fontSize: scaleFont(13) }]}>
                {t('todayNeedsRefineHint')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.warningText} />
          </Pressable>
        ) : null}

        {showActiveSection ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(24) }]}>
              {t('todayTasks')}
            </Text>
            <View style={styles.sectionList}>
              {dayTasks.length ? (
                dayTasks.map((task) => (
                  <SwipeableTaskRow
                    key={task.id}
                    task={task}
                    onPress={() => navigation.navigate('TaskDetails', { taskId: task.id })}
                    onToggleStatus={() => toggleTaskStatus(task.id)}
                    onPause={() => quickMoveTask(task.id, 'postpone')}
                  />
                ))
              ) : (
                <SurfaceCard>
                  <Text style={[styles.emptyText, { color: colors.mutedText, fontSize: scaleFont(14) }]}>
                    {normalizedQuery ? t('commonNoResults') : t('todayNoActive')}
                  </Text>
                </SurfaceCard>
              )}
            </View>
          </View>
        ) : null}

        {showCompletedSection ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(24) }]}>
              {t('todayCompleted')} ({completedTasks.length})
            </Text>
            <View style={styles.sectionList}>
              {completedTasks.length ? (
                completedTasks.map((task) => (
                  <SwipeableTaskRow
                    key={task.id}
                    task={task}
                    onPress={() => navigation.navigate('TaskDetails', { taskId: task.id })}
                    onToggleStatus={() => toggleTaskStatus(task.id)}
                  />
                ))
              ) : (
                <SurfaceCard>
                  <Text style={[styles.emptyText, { color: colors.mutedText, fontSize: scaleFont(14) }]}>
                    {normalizedQuery ? t('commonNoResults') : t('todayNoCompleted')}
                  </Text>
                </SurfaceCard>
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {fabOpen ? <Pressable style={StyleSheet.absoluteFill} onPress={() => setFabOpen(false)} /> : null}

      {fabOpen ? (
        <View style={[styles.fabActions, { right: 24, bottom: fabBottom + 74 }]}>
          <Pressable
            style={[styles.actionChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              setFabOpen(false);
              navigation.navigate('NoteEditor');
            }}
            accessibilityRole="button"
          >
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text, fontSize: scaleFont(14) }]}>
              {t('todayAddNote')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.actionChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              setFabOpen(false);
              navigation.navigate('QuickAdd');
            }}
            accessibilityRole="button"
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text, fontSize: scaleFont(14) }]}>
              {t('todayAddTask')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        style={[styles.fab, { bottom: fabBottom, backgroundColor: colors.primary }]}
        onPress={() => setFabOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={fabOpen ? t('commonClose') : t('commonAdd')}
      >
        <Ionicons name={fabOpen ? 'close' : 'add'} size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

function SwipeableTaskRow({
  task,
  onPress,
  onToggleStatus,
  onPause,
}: {
  task: Task;
  onPress: () => void;
  onToggleStatus?: () => void;
  onPause?: () => void;
}) {
  const colors = useThemeColors();
  const { scaleFont, t } = useI18n();
  const swipeableRef = useRef<Swipeable | null>(null);

  const actions =
    task.status === 'completed'
      ? [
          {
            label: t('todaySwipeRestore'),
            icon: 'return-up-back-outline' as const,
            backgroundColor: colors.primarySoft,
            color: colors.primary,
            onPress: onToggleStatus,
          },
        ]
      : [
          {
            label: t('todaySwipeComplete'),
            icon: 'checkmark-outline' as const,
            backgroundColor: '#DCF6E5',
            color: '#167A42',
            onPress: onToggleStatus,
          },
          {
            label: t('todaySwipePause'),
            icon: 'pause-outline' as const,
            backgroundColor: colors.warningSoft,
            color: colors.warningText,
            onPress: onPause,
          },
        ].filter((item) => Boolean(item.onPress));

  return (
    <Swipeable
      ref={swipeableRef}
      overshootRight={false}
      renderRightActions={() => (
        <View style={styles.swipeActions}>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              style={[styles.swipeAction, { backgroundColor: action.backgroundColor }]}
              onPress={() => {
                swipeableRef.current?.close();
                action.onPress?.();
              }}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Ionicons name={action.icon} size={20} color={action.color} />
              <Text style={[styles.swipeActionText, { color: action.color, fontSize: scaleFont(12) }]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    >
      <TaskRow task={task} onPress={onPress} onToggleStatus={onToggleStatus} />
    </Swipeable>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    textTransform: 'capitalize',
  },
  title: {
    fontWeight: '800',
    marginTop: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switcherButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switcherBadge: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  switcherText: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statLabel: {},
  statValue: {
    fontWeight: '800',
    marginTop: 6,
  },
  searchCard: {
    gap: 12,
  },
  filterRow: {
    gap: 10,
  },
  filterChip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontWeight: '700',
  },
  alertCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
  },
  alertTitle: {
    fontWeight: '700',
  },
  alertSubtitle: {
    marginTop: 2,
    opacity: 0.92,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  sectionList: {
    gap: 12,
  },
  swipeActions: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 12,
  },
  swipeAction: {
    width: 96,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  swipeActionText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  fabActions: {
    position: 'absolute',
    gap: 12,
    alignItems: 'flex-end',
  },
  actionChip: {
    minHeight: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#11111A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  actionText: {
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2A1C72',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 6,
  },
});
