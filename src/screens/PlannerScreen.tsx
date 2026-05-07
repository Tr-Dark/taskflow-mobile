import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SurfaceCard } from '../components/SurfaceCard';
import { TaskRow } from '../components/TaskRow';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import { TimeBlock } from '../types';
import { radius, spacing, useThemeColors } from '../theme';
import {
  addDays,
  formatLocalizedDate,
  generateTimeOptions,
  isTimeInPlannerRange,
  timeToMinutes,
  todayDateString,
  toDateString,
} from '../utils/date';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Planner'>,
  NativeStackScreenProps<RootStackParamList>
>;

type PlannerEntry = {
  block: TimeBlock;
  taskTitle: string;
  category?: string;
  categoryColor?: string;
  startMinutes: number;
  endMinutes: number;
  durationHours: number;
};

type PlannerLane = {
  id: string;
  entries: PlannerEntry[];
};

const QUARTER_SLOT_HEIGHT = 22;
const MIN_DURATION_HOURS = 0.25;

function getDurationHours(startTime: string, endTime: string) {
  return Math.max(MIN_DURATION_HOURS, (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60);
}

function getBlockHeight(durationHours: number) {
  const isUltraCompact = durationHours <= 0.25;
  const isCompact = durationHours > 0.25 && durationHours <= 0.5;
  const quarters = Math.max(1, Math.round(durationHours * 4));
  return Math.max(isUltraCompact ? 30 : isCompact ? 38 : 56, QUARTER_SLOT_HEIGHT * quarters);
}

function getNowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function buildPlannerLanes(entries: PlannerEntry[]) {
  const lanes: PlannerLane[] = [];

  for (const entry of entries) {
    const lane = lanes.find((currentLane) => {
      const lastEntry = currentLane.entries[currentLane.entries.length - 1];
      return !lastEntry || lastEntry.endMinutes <= entry.startMinutes;
    });

    if (lane) {
      lane.entries.push(entry);
      continue;
    }

    lanes.push({
      id: `lane-${lanes.length + 1}`,
      entries: [entry],
    });
  }

  return lanes;
}

function buildOccupiedHours(entries: PlannerEntry[]) {
  if (!entries.length) {
    return 0;
  }

  const sorted = [...entries].sort((a, b) => a.startMinutes - b.startMinutes);
  let occupiedMinutes = 0;
  let currentStart = sorted[0].startMinutes;
  let currentEnd = sorted[0].endMinutes;

  for (const entry of sorted.slice(1)) {
    if (entry.startMinutes < currentEnd) {
      currentEnd = Math.max(currentEnd, entry.endMinutes);
      continue;
    }

    occupiedMinutes += currentEnd - currentStart;
    currentStart = entry.startMinutes;
    currentEnd = entry.endMinutes;
  }

  occupiedMinutes += currentEnd - currentStart;
  return occupiedMinutes / 60;
}

export function PlannerScreen({ navigation }: Props) {
  const { activeData, state, assignTaskToSlot, removeTimeBlock } = useApp();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { language, scaleFont, scaleLineHeight, t } = useI18n();
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [currentMinutes, setCurrentMinutes] = useState(getNowMinutes());
  const plannerSlots = useMemo(
    () => generateTimeOptions(state.settings.plannerStartHour, state.settings.plannerEndHour),
    [state.settings.plannerEndHour, state.settings.plannerStartHour],
  );
  const plannerDurationHours = state.settings.plannerEndHour - state.settings.plannerStartHour;
  const pageWidth = Math.max(280, windowWidth - spacing.lg * 2 - 8);

  const categoryColorMap = useMemo(
    () => new Map(activeData.categories.map((category) => [category.name, category.color])),
    [activeData.categories],
  );

  const taskMap = useMemo(() => new Map(activeData.tasks.map((task) => [task.id, task])), [activeData.tasks]);

  const dayTasks = useMemo(
    () => activeData.tasks.filter((task) => task.status === 'active' && task.dueDate === selectedDate),
    [activeData.tasks, selectedDate],
  );

  const dayBlocks = useMemo(
    () =>
      activeData.timeBlocks
        .filter((block) => {
          const task = taskMap.get(block.taskId);
          return (
            block.date === selectedDate &&
            task?.status === 'active' &&
            isTimeInPlannerRange(
              block.startTime,
              state.settings.plannerStartHour,
              state.settings.plannerEndHour,
            )
          );
        })
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
    [
      activeData.timeBlocks,
      selectedDate,
      state.settings.plannerEndHour,
      state.settings.plannerStartHour,
      taskMap,
    ],
  );

  const plannerEntries = useMemo<PlannerEntry[]>(
    () =>
      dayBlocks.map((block) => {
        const task = taskMap.get(block.taskId);
        return {
          block,
          taskTitle: task?.title ?? t('plannerTaskFallback'),
          category: task?.category,
          categoryColor: task?.category ? categoryColorMap.get(task.category) : undefined,
          startMinutes: timeToMinutes(block.startTime),
          endMinutes: timeToMinutes(block.endTime),
          durationHours: getDurationHours(block.startTime, block.endTime),
        };
      }),
    [categoryColorMap, dayBlocks, t, taskMap],
  );

  const plannerLanes = useMemo(() => buildPlannerLanes(plannerEntries), [plannerEntries]);

  useEffect(() => {
    setCurrentMinutes(getNowMinutes());
    const timer = setInterval(() => setCurrentMinutes(getNowMinutes()), 30_000);
    return () => clearInterval(timer);
  }, []);

  function changeDate(days: number) {
    const next = addDays(new Date(`${selectedDate}T12:00:00`), days);
    setSelectedDate(toDateString(next));
  }

  const totalTaskHours = plannerEntries.reduce((sum, entry) => sum + entry.durationHours, 0);
  const occupiedHours = buildOccupiedHours(plannerEntries);
  const unscheduledTasks = dayTasks.filter(
    (task) =>
      !task.scheduledStartTime ||
      !isTimeInPlannerRange(
        task.scheduledStartTime,
        state.settings.plannerStartHour,
        state.settings.plannerEndHour,
      ),
  );
  const assignableTasks = unscheduledTasks.filter((task) => {
    const existingBlock = activeData.timeBlocks.find(
      (block) => block.taskId === task.id && block.date === selectedDate,
    );
    return (
      !existingBlock ||
      !isTimeInPlannerRange(
        existingBlock.startTime,
        state.settings.plannerStartHour,
        state.settings.plannerEndHour,
      )
    );
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 12) + spacing.sm,
            paddingBottom: 104 + Math.max(insets.bottom, 12),
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(30) }]}>
            {t('plannerTitle')}
          </Text>
          <View style={styles.dateRow}>
            <Pressable
              style={[styles.dateButton, { backgroundColor: colors.surfaceMuted }]}
              onPress={() => changeDate(-1)}
              accessibilityRole="button"
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>
            <View style={[styles.dateBadge, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={[styles.dateBadgeText, { color: colors.primary, fontSize: scaleFont(14) }]}>
                {formatLocalizedDate(language, selectedDate, {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            </View>
            <Pressable
              style={[styles.dateButton, { backgroundColor: colors.surfaceMuted }]}
              onPress={() => changeDate(1)}
              accessibilityRole="button"
            >
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>
            {t('plannerUnscheduledSection')}
          </Text>
          {unscheduledTasks.length ? (
            <View style={styles.taskList}>
              {unscheduledTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onPress={() => navigation.navigate('TaskDetails', { taskId: task.id })}
                />
              ))}
            </View>
          ) : (
            <SurfaceCard>
              <Text
                style={[
                  styles.emptyText,
                  { color: colors.mutedText, fontSize: scaleFont(14), lineHeight: scaleLineHeight(20) },
                ]}
              >
                {t('plannerUnscheduledEmpty')}
              </Text>
            </SurfaceCard>
          )}
        </View>

        {plannerLanes.length > 1 ? (
          <SurfaceCard style={styles.swipeHintCard}>
            <View style={styles.swipeHintRow}>
              <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
              <Text style={[styles.swipeHintTitle, { color: colors.text, fontSize: scaleFont(14) }]}>
                {t('plannerConflictDeckTitle')}
              </Text>
            </View>
            <Text
              style={[
                styles.swipeHintBody,
                { color: colors.mutedText, fontSize: scaleFont(13), lineHeight: scaleLineHeight(18) },
              ]}
            >
              {t('plannerConflictDeckHint')}
            </Text>
            <View style={styles.laneDots}>
              {plannerLanes.map((lane, index) => (
                <View
                  key={lane.id}
                  style={[
                    styles.laneDot,
                    {
                      backgroundColor: index === 0 ? colors.primary : colors.border,
                      width: index === 0 ? 22 : 8,
                    },
                  ]}
                />
              ))}
            </View>
          </SurfaceCard>
        ) : null}

        <ScrollView
          horizontal={plannerLanes.length > 1}
          pagingEnabled={plannerLanes.length > 1}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={plannerLanes.length > 1 ? styles.lanesRow : undefined}
        >
          {(plannerLanes.length ? plannerLanes : [{ id: 'lane-1', entries: [] }]).map((lane, laneIndex) => (
            <View key={lane.id} style={{ width: pageWidth }}>
              {plannerLanes.length > 1 ? (
                <Text
                  style={[
                    styles.laneLabel,
                    { color: colors.mutedText, fontSize: scaleFont(12) },
                  ]}
                >
                  {t('plannerConflictDeckPage', { current: laneIndex + 1, total: plannerLanes.length })}
                </Text>
              ) : null}
              <SurfaceCard style={styles.scheduleCard}>
                <PlannerLaneView
                  lane={lane}
                  plannerSlots={plannerSlots}
                  showCurrentTime={selectedDate === todayDateString()}
                  currentMinutes={currentMinutes}
                  onOpenTask={(taskId) => navigation.navigate('TaskDetails', { taskId })}
                  onRemoveTask={removeTimeBlock}
                  onSelectSlot={setSelectedSlot}
                />
              </SurfaceCard>
            </View>
          ))}
        </ScrollView>

        <SurfaceCard>
          <Text style={[styles.summaryTitle, { color: colors.text, fontSize: scaleFont(22) }]}>
            {t('plannerSummary')}
          </Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedText, fontSize: scaleFont(14) }]}>
              {t('plannerScheduledTasks')}:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text, fontSize: scaleFont(14) }]}>
              {plannerEntries.length}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedText, fontSize: scaleFont(14) }]}>
              {t('plannerTotalTime')}:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text, fontSize: scaleFont(14) }]}>
              {totalTaskHours.toFixed(2)} h
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedText, fontSize: scaleFont(14) }]}>
              {t('plannerOccupiedTime')}:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text, fontSize: scaleFont(14) }]}>
              {occupiedHours.toFixed(2)} h
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedText, fontSize: scaleFont(14) }]}>
              {t('plannerFreeTime')}:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text, fontSize: scaleFont(14) }]}>
              {Math.max(0, plannerDurationHours - occupiedHours).toFixed(2)} h
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedText, fontSize: scaleFont(14) }]}>
              {t('plannerUnscheduled')}:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text, fontSize: scaleFont(14) }]}>
              {unscheduledTasks.length}
            </Text>
          </View>
        </SurfaceCard>

        <SurfaceCard style={[styles.tipCard, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }]}>
          <Text
            style={[
              styles.tipText,
              { color: colors.primary, fontSize: scaleFont(14), lineHeight: scaleLineHeight(20) },
            ]}
          >
            {t('plannerTip')}
          </Text>
        </SurfaceCard>
      </ScrollView>

      <Modal visible={!!selectedSlot} transparent animationType="slide" onRequestClose={() => setSelectedSlot(null)}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedSlot(null)} />
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, 16) + 8,
                marginBottom: Math.max(insets.bottom, 8),
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text, fontSize: scaleFont(22) }]}>
              {t('plannerAddTaskAt', { time: selectedSlot ?? '' })}
            </Text>
            {assignableTasks.length ? (
              <ScrollView style={{ maxHeight: 320 }}>
                {assignableTasks.map((task) => {
                  const duration = task.plannedHours || 1;
                  return (
                    <Pressable
                      key={task.id}
                      style={[
                        styles.modalTask,
                        { borderColor: colors.border, backgroundColor: colors.surface },
                      ]}
                      onPress={() => {
                        if (selectedSlot) {
                          const assigned = assignTaskToSlot(task.id, selectedDate, selectedSlot, duration);
                          if (assigned) {
                            setSelectedSlot(null);
                          }
                        }
                      }}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.modalTaskTitle, { color: colors.text, fontSize: scaleFont(15) }]}>
                        {task.title}
                      </Text>
                      <Text style={[styles.modalTaskMeta, { color: colors.mutedText, fontSize: scaleFont(13) }]}>
                        {task.category ?? t('plannerNoCategory')} - {duration} h
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <Text
                style={[
                  styles.modalEmpty,
                  { color: colors.mutedText, fontSize: scaleFont(14), lineHeight: scaleLineHeight(20) },
                ]}
              >
                {t('plannerNoTasksForDay')}
              </Text>
            )}

            <Pressable style={styles.modalClose} onPress={() => setSelectedSlot(null)} accessibilityRole="button">
              <Text style={[styles.modalCloseText, { color: colors.primary, fontSize: scaleFont(15) }]}>
                {t('commonClose')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function PlannerLaneView({
  lane,
  plannerSlots,
  showCurrentTime,
  currentMinutes,
  onOpenTask,
  onRemoveTask,
  onSelectSlot,
}: {
  lane: PlannerLane;
  plannerSlots: string[];
  showCurrentTime: boolean;
  currentMinutes: number;
  onOpenTask: (taskId: string) => void;
  onRemoveTask: (blockId: string) => void;
  onSelectSlot: (slot: string) => void;
}) {
  const colors = useThemeColors();
  const { scaleFont, t } = useI18n();

  const slotEntryMap = useMemo(() => {
    const map = new Map<string, { entry: PlannerEntry; isStart: boolean }>();

    for (const entry of lane.entries) {
      for (const slot of plannerSlots) {
        const slotMinutes = timeToMinutes(slot);
        if (slotMinutes >= entry.startMinutes && slotMinutes < entry.endMinutes) {
          map.set(slot, {
            entry,
            isStart: slotMinutes === entry.startMinutes,
          });
        }
      }
    }

    return map;
  }, [lane.entries, plannerSlots]);

  const currentTimeMarker = useMemo(() => {
    if (!showCurrentTime) {
      return null;
    }

    const currentEntry = lane.entries.find(
      (entry) => currentMinutes >= entry.startMinutes && currentMinutes < entry.endMinutes,
    );

    if (currentEntry) {
      const progress =
        (currentMinutes - currentEntry.startMinutes) /
        Math.max(1, currentEntry.endMinutes - currentEntry.startMinutes);

      return {
        slot: currentEntry.block.startTime,
        top: 2 + Math.max(0, Math.min(1, progress)) * getBlockHeight(currentEntry.durationHours),
      };
    }

    const firstSlotMinutes = plannerSlots.length ? timeToMinutes(plannerSlots[0]) : 0;
    const lastSlotMinutes = plannerSlots.length
      ? timeToMinutes(plannerSlots[plannerSlots.length - 1]) + 15
      : 0;

    if (currentMinutes < firstSlotMinutes || currentMinutes >= lastSlotMinutes) {
      return null;
    }

    const quarterStartMinutes = Math.floor(currentMinutes / 15) * 15;
    const quarterSlot = `${Math.floor(quarterStartMinutes / 60)
      .toString()
      .padStart(2, '0')}:${(quarterStartMinutes % 60).toString().padStart(2, '0')}`;
    const progress = (currentMinutes - quarterStartMinutes) / 15;

    return {
      slot: quarterSlot,
      top: 2 + progress * QUARTER_SLOT_HEIGHT,
    };
  }, [currentMinutes, lane.entries, plannerSlots, showCurrentTime]);

  return (
    <>
      {plannerSlots.map((slot) => {
        const slotEntry = slotEntryMap.get(slot);
        if (slotEntry && !slotEntry.isStart) {
          return <View key={slot} style={styles.coveredRow} />;
        }

        const showTimeLabel = slot.endsWith(':00') || Boolean(slotEntry?.isStart);

        return (
          <View key={slot} style={[styles.slotRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.slotTime, { color: colors.mutedText, fontSize: scaleFont(12) }]}>
              {showTimeLabel ? slot : ''}
            </Text>
            <View style={styles.slotContent}>
              {currentTimeMarker?.slot === slot ? (
                <View style={[styles.nowLine, { top: currentTimeMarker.top, backgroundColor: colors.dangerText }]}>
                  <View style={[styles.nowDot, { backgroundColor: colors.dangerText }]} />
                </View>
              ) : null}
              {slotEntry ? (
                <PlannerBlock
                  taskTitle={slotEntry.entry.taskTitle}
                  category={slotEntry.entry.category}
                  categoryColor={slotEntry.entry.categoryColor}
                  startTime={slotEntry.entry.block.startTime}
                  endTime={slotEntry.entry.block.endTime}
                  durationHours={slotEntry.entry.durationHours}
                  onPress={() => onOpenTask(slotEntry.entry.block.taskId)}
                  onLongPress={() => onRemoveTask(slotEntry.entry.block.id)}
                />
              ) : (
                <Pressable
                  style={[styles.emptySlot, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={() => onSelectSlot(slot)}
                  accessibilityRole="button"
                >
                  <Ionicons name="add" size={16} color={colors.mutedText} />
                  {slot.endsWith(':00') ? (
                    <Text style={[styles.emptySlotText, { color: colors.mutedText, fontSize: scaleFont(14) }]}>
                      {t('plannerAddTask')}
                    </Text>
                  ) : null}
                </Pressable>
              )}
            </View>
          </View>
        );
      })}
    </>
  );
}

function PlannerBlock({
  taskTitle,
  category,
  categoryColor,
  startTime,
  endTime,
  durationHours,
  onPress,
  onLongPress,
}: {
  taskTitle: string;
  category?: string;
  categoryColor?: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const colors = useThemeColors();
  const { scaleFont } = useI18n();
  const quarters = Math.max(1, Math.round(durationHours * 4));
  const isUltraCompact = durationHours <= 0.25;
  const isCompact = durationHours > 0.25 && durationHours <= 0.5;
  const showTitleOnly = durationHours <= 0.5;
  const showTimeOnly = durationHours > 0.5 && durationHours <= 0.75;
  const height = getBlockHeight(durationHours);

  return (
    <Pressable
      style={[
        styles.blockCard,
        isCompact ? styles.blockCardCompact : null,
        showTitleOnly ? styles.blockCardTight : null,
        {
          height,
          backgroundColor: colors.primary,
          borderColor: colors.primaryDark,
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
    >
      <View style={styles.blockTopRow}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            styles.blockTitle,
            {
              fontSize: scaleFont(isUltraCompact ? 11 : isCompact ? 12 : 15),
            },
          ]}
        >
          {taskTitle}
        </Text>
        {!showTitleOnly && categoryColor ? (
          <View style={[styles.blockCategoryDot, { backgroundColor: categoryColor }]} />
        ) : null}
      </View>

      {showTitleOnly ? null : showTimeOnly ? (
        <View style={styles.blockCompactRow}>
          <View style={[styles.blockTimePill, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
            <Text style={[styles.blockTimeCompact, { fontSize: scaleFont(11) }]}>
              {startTime}-{endTime}
            </Text>
          </View>
        </View>
      ) : (
        <>
          {category ? (
            <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.blockCategory, { fontSize: scaleFont(12) }]}>
              {category}
            </Text>
          ) : null}
          <Text style={[styles.blockTime, { fontSize: scaleFont(12) }]}>
            {startTime} - {endTime}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: 14,
  },
  title: {
    fontWeight: '800',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadge: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dateBadgeText: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  taskList: {
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
  },
  swipeHintCard: {
    gap: 8,
  },
  swipeHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swipeHintTitle: {
    fontWeight: '700',
  },
  swipeHintBody: {},
  laneDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  laneDot: {
    height: 8,
    borderRadius: 999,
  },
  lanesRow: {
    gap: spacing.md,
  },
  laneLabel: {
    fontWeight: '700',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  scheduleCard: {
    padding: 0,
    overflow: 'hidden',
  },
  slotRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    alignItems: 'stretch',
  },
  coveredRow: {
    height: 0,
  },
  slotTime: {
    width: 64,
    paddingTop: 6,
    paddingLeft: 12,
  },
  slotContent: {
    flex: 1,
    paddingVertical: 2,
    paddingRight: 12,
    position: 'relative',
  },
  nowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 999,
    zIndex: 5,
  },
  nowDot: {
    position: 'absolute',
    left: -6,
    top: -4,
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  emptySlot: {
    minHeight: QUARTER_SLOT_HEIGHT,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  emptySlotText: {
    fontWeight: '600',
  },
  blockCard: {
    borderRadius: radius.lg,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    overflow: 'hidden',
  },
  blockCardCompact: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  blockCardTight: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  blockTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  blockTitle: {
    color: '#fff',
    fontWeight: '700',
    flex: 1,
  },
  blockCategoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  blockCategory: {
    color: '#E6E2FF',
    marginTop: 6,
  },
  blockTime: {
    color: '#DDD7FF',
    marginTop: 10,
  },
  blockCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  blockCompactMeta: {
    flex: 1,
    marginTop: 0,
  },
  blockTimePill: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  blockTimeCompact: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summaryTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  summaryLabel: {},
  summaryValue: {
    fontWeight: '700',
  },
  tipCard: {},
  tipText: {},
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalTitle: {
    fontWeight: '800',
  },
  modalTask: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  modalTaskTitle: {
    fontWeight: '600',
  },
  modalTaskMeta: {
    marginTop: 4,
  },
  modalEmpty: {},
  modalClose: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCloseText: {
    fontWeight: '700',
  },
});
