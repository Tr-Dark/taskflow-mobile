import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SurfaceCard } from '../components/SurfaceCard';
import { TaskRow } from '../components/TaskRow';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import { radius, spacing, useThemeColors } from '../theme';
import {
  addDays,
  formatLocalizedDate,
  timeToMinutes,
  todayDateString,
  toDateString,
} from '../utils/date';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Planner'>,
  NativeStackScreenProps<RootStackParamList>
>;

const slots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

export function PlannerScreen({ navigation }: Props) {
  const { activeData, assignTaskToSlot, removeTimeBlock } = useApp();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { language, scaleFont, scaleLineHeight, t } = useI18n();
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const dayTasks = useMemo(
    () => activeData.tasks.filter((task) => task.status !== 'completed' && (!task.dueDate || task.dueDate === selectedDate)),
    [activeData.tasks, selectedDate],
  );

  const dayBlocks = useMemo(
    () =>
      activeData.timeBlocks
        .filter((block) => block.date === selectedDate)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
    [activeData.timeBlocks, selectedDate],
  );

  function changeDate(days: number) {
    const next = addDays(new Date(`${selectedDate}T12:00:00`), days);
    setSelectedDate(toDateString(next));
  }

  function findBlockStartingAt(slot: string) {
    return dayBlocks.find((block) => block.startTime === slot) ?? null;
  }

  function isCoveredByAnotherBlock(slot: string) {
    return dayBlocks.some((block) => block.startTime < slot && block.endTime > slot);
  }

  function durationHours(startTime: string, endTime: string) {
    return Math.max(1, (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60);
  }

  const totalHours = dayBlocks.reduce((sum, block) => sum + durationHours(block.startTime, block.endTime), 0);
  const unscheduledTasks = dayTasks.filter((task) => !task.scheduledStartTime);

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
          <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(30) }]}>{t('plannerTitle')}</Text>
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
                {formatLocalizedDate(language, selectedDate, { weekday: 'short', day: 'numeric', month: 'short' })}
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

        <SurfaceCard style={styles.scheduleCard}>
          {slots.map((slot) => {
            const block = findBlockStartingAt(slot);
            if (isCoveredByAnotherBlock(slot)) {
              return <View key={slot} style={styles.coveredRow} />;
            }

            const task = block ? activeData.tasks.find((item) => item.id === block.taskId) : null;

            return (
              <View key={slot} style={[styles.slotRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.slotTime, { color: colors.mutedText, fontSize: scaleFont(12) }]}>{slot}</Text>
                <View style={styles.slotContent}>
                  {block ? (
                    <Pressable
                      style={[
                        styles.blockCard,
                        {
                          minHeight: 72 * durationHours(block.startTime, block.endTime),
                          backgroundColor: colors.primary,
                        },
                      ]}
                      onPress={() => navigation.navigate('TaskDetails', { taskId: block.taskId })}
                      onLongPress={() => removeTimeBlock(block.id)}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.blockTitle, { fontSize: scaleFont(15) }]}>{task?.title ?? t('plannerTaskFallback')}</Text>
                      {task?.category ? (
                        <Text style={[styles.blockCategory, { fontSize: scaleFont(12) }]}>{task.category}</Text>
                      ) : null}
                      <Text style={[styles.blockTime, { fontSize: scaleFont(12) }]}>
                        {block.startTime} - {block.endTime}
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[styles.emptySlot, { borderColor: colors.border, backgroundColor: colors.surface }]}
                      onPress={() => setSelectedSlot(slot)}
                      accessibilityRole="button"
                    >
                      <Ionicons name="add" size={16} color={colors.mutedText} />
                      <Text style={[styles.emptySlotText, { color: colors.mutedText, fontSize: scaleFont(14) }]}>
                        {t('plannerAddTask')}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </SurfaceCard>

        <SurfaceCard>
          <Text style={[styles.summaryTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{t('plannerSummary')}</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('plannerScheduledTasks')}:</Text>
            <Text style={[styles.summaryValue, { color: colors.text, fontSize: scaleFont(14) }]}>{dayBlocks.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('plannerTotalTime')}:</Text>
            <Text style={[styles.summaryValue, { color: colors.text, fontSize: scaleFont(14) }]}>{totalHours} h</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('plannerFreeTime')}:</Text>
            <Text style={[styles.summaryValue, { color: colors.text, fontSize: scaleFont(14) }]}>{Math.max(0, 14 - totalHours)} h</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('plannerUnscheduled')}:</Text>
            <Text style={[styles.summaryValue, { color: colors.text, fontSize: scaleFont(14) }]}>{unscheduledTasks.length}</Text>
          </View>
        </SurfaceCard>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{t('plannerUnscheduledSection')}</Text>
          {unscheduledTasks.length ? (
            <View style={styles.taskList}>
              {unscheduledTasks.map((task) => (
                <TaskRow key={task.id} task={task} onPress={() => navigation.navigate('TaskDetails', { taskId: task.id })} />
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

        <SurfaceCard style={[styles.tipCard, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }]}>
          <Text style={[styles.tipText, { color: colors.primary, fontSize: scaleFont(14), lineHeight: scaleLineHeight(20) }]}>
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
            {dayTasks.length ? (
              <ScrollView style={{ maxHeight: 320 }}>
                {dayTasks.map((task) => {
                  const duration = Math.max(1, Math.round(task.plannedHours || 1));
                  return (
                    <Pressable
                      key={task.id}
                      style={[styles.modalTask, { borderColor: colors.border, backgroundColor: colors.surface }]}
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
                      <Text style={[styles.modalTaskTitle, { color: colors.text, fontSize: scaleFont(15) }]}>{task.title}</Text>
                      <Text style={[styles.modalTaskMeta, { color: colors.mutedText, fontSize: scaleFont(13) }]}>
                        {task.category ?? t('plannerNoCategory')} • {duration} h
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
              <Text style={[styles.modalCloseText, { color: colors.primary, fontSize: scaleFont(15) }]}>{t('commonClose')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingTop: 18,
    paddingLeft: 12,
  },
  slotContent: {
    flex: 1,
    paddingVertical: 8,
    paddingRight: 12,
  },
  emptySlot: {
    minHeight: 56,
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
  },
  blockTitle: {
    color: '#fff',
    fontWeight: '700',
  },
  blockCategory: {
    color: '#E6E2FF',
    marginTop: 6,
  },
  blockTime: {
    color: '#DDD7FF',
    marginTop: 10,
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
