import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTextInput } from '../components/AppTextInput';
import { OptionPickerModal, PickerOption } from '../components/OptionPickerModal';
import { PrimaryButton } from '../components/PrimaryButton';
import { SurfaceCard } from '../components/SurfaceCard';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { RootStackParamList } from '../navigation/AppNavigator';
import { radius, spacing, useThemeColors } from '../theme';
import { SubtaskItem, TaskDraft, TaskPriority, TaskStatus } from '../types';
import { futureDateFromNow, generateTimeOptions, generateUpcomingDateOptions, todayDateString } from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskDetails'>;

function getReadableTextColor(hexColor: string) {
  const hex = hexColor.replace('#', '');
  const normalized =
    hex.length === 3
      ? hex
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : hex;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? '#1F1F2E' : '#FFFFFF';
}

function formatDuration(hours: number | undefined, noDurationLabel: string) {
  if (!hours) return noDurationLabel;
  const minutes = Math.round(hours * 60);
  if (minutes < 60) return `${minutes} min`;
  const wholeHours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes ? `${wholeHours} h ${restMinutes} min` : `${wholeHours} h`;
}

function displayDate(value: string | undefined, fallbackLabel: string) {
  if (!value) return fallbackLabel;
  const options = generateUpcomingDateOptions(30);
  return options.find((option) => option.value === value)?.label ?? value;
}

export function TaskDetailsScreen({ route, navigation }: Props) {
  const { activeData, state, updateTask, deleteTask, quickMoveTask, clearTaskSchedule } = useApp();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { scaleFont, t } = useI18n();
  const task = useMemo(
    () => activeData.tasks.find((item) => item.id === route.params.taskId),
    [activeData.tasks, route.params.taskId],
  );

  const priorities: { value: TaskPriority; label: string }[] = [
    { value: 'low', label: t('priorityLow') },
    { value: 'medium', label: t('priorityMedium') },
    { value: 'high', label: t('priorityHigh') },
  ];

  const statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'active', label: t('statusActive') },
    { value: 'completed', label: t('statusCompleted') },
    { value: 'postponed', label: t('statusPostponed') },
  ];

  const durationOptions: PickerOption<string>[] = [
    { value: '0.25', label: '15 min' },
    { value: '0.5', label: '30 min' },
    { value: '0.75', label: '45 min' },
    { value: '1', label: '1 h' },
    { value: '1.5', label: '1 h 30 min' },
    { value: '2', label: '2 h' },
    { value: '2.5', label: '2 h 30 min' },
    { value: '3', label: '3 h' },
    { value: '4', label: '4 h' },
  ];

  const timeOptions = generateTimeOptions(state.settings.plannerStartHour, state.settings.plannerEndHour).map((value) => ({
    value,
    label: value,
  }));

  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const [draft, setDraft] = useState<TaskDraft>(() => ({
    title: task?.title ?? '',
    category: task?.category,
    priority: task?.priority,
    dueDate: task?.dueDate,
    plannedHours: task?.plannedHours,
    scheduledStartTime: task?.scheduledStartTime,
    notes: task?.notes,
    status: task?.status,
    subtasks: task?.subtasks ?? [],
  }));

  if (!task) {
    return (
      <View style={[styles.safeArea, styles.missingWrap, { backgroundColor: colors.background }]}>
        <Text style={[styles.missingText, { color: colors.mutedText, fontSize: scaleFont(16) }]}>{t('taskMissing')}</Text>
      </View>
    );
  }

  const currentTask = task;
  const categories = activeData.categories;
  const subtasks = draft.subtasks ?? [];
  const completedSubtasks = subtasks.filter((item) => item.completed).length;

  function addSubtask() {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) {
      return;
    }

    const subtask: SubtaskItem = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setDraft((prev) => ({
      ...prev,
      subtasks: [...(prev.subtasks ?? []), subtask],
    }));
    setNewSubtaskTitle('');
  }

  function toggleSubtask(subtaskId: string) {
    setDraft((prev) => ({
      ...prev,
      subtasks: (prev.subtasks ?? []).map((item) =>
        item.id === subtaskId ? { ...item, completed: !item.completed } : item,
      ),
    }));
  }

  function removeSubtask(subtaskId: string) {
    setDraft((prev) => ({
      ...prev,
      subtasks: (prev.subtasks ?? []).filter((item) => item.id !== subtaskId),
    }));
  }

  function handleSave() {
    if (!draft.title.trim()) {
      Alert.alert(t('taskMissingTitle'), t('taskMissingBody'));
      return;
    }
    if (draft.scheduledStartTime && !draft.dueDate) {
      Alert.alert(t('taskMissingDateTitle'), t('taskMissingDateBody'));
      return;
    }
    if (draft.scheduledStartTime && !draft.plannedHours) {
      Alert.alert(t('taskMissingDurationTitle'), t('taskMissingDurationBody'));
      return;
    }

    updateTask(currentTask.id, {
      ...draft,
      title: draft.title.trim(),
    });
    navigation.goBack();
  }

  function handleDelete() {
    Alert.alert(t('taskDeleteTitle'), t('taskDeleteBody'), [
      { text: t('commonCancel'), style: 'cancel' },
      {
        text: t('commonDelete'),
        style: 'destructive',
        onPress: () => {
          deleteTask(currentTask.id);
          navigation.goBack();
        },
      },
    ]);
  }

  function applyQuickMove(action: 'today' | 'tomorrow' | 'later' | 'later-far' | 'postpone') {
    quickMoveTask(currentTask.id, action);
    setDraft((prev) => ({
      ...prev,
      dueDate:
        action === 'postpone'
          ? undefined
          : action === 'today'
            ? todayDateString()
            : action === 'tomorrow'
              ? generateUpcomingDateOptions(2)[1].value
              : action === 'later'
                ? futureDateFromNow(14)
                : futureDateFromNow(60),
      scheduledStartTime: undefined,
      status: action === 'postpone' ? 'postponed' : 'active',
    }));
  }

  return (
    <KeyboardAvoidingView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 18}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top, 12),
          },
        ]}
      >
        <Pressable
          style={[styles.iconButton, { backgroundColor: colors.surfaceMuted }]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('commonBack')}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: scaleFont(20) }]}>
          {t('taskDetailsTitle')}
        </Text>
        <Pressable
          style={[styles.iconButton, { backgroundColor: colors.dangerSoft }]}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel={t('commonDelete')}
        >
          <Ionicons name="trash-outline" size={20} color={colors.dangerText} />
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: 128 + Math.max(insets.bottom, 12) }]}
      >
        <View style={styles.quickActionRow}>
          <QuickAction label={t('taskQuickToday')} onPress={() => applyQuickMove('today')} />
          <QuickAction label={t('taskQuickTomorrow')} onPress={() => applyQuickMove('tomorrow')} />
          <QuickAction label={t('taskQuickLater')} onPress={() => applyQuickMove('later')} />
          <QuickAction label={t('taskQuickFar')} onPress={() => applyQuickMove('later-far')} />
          <QuickAction label={t('taskQuickPostpone')} danger onPress={() => applyQuickMove('postpone')} />
        </View>

        <AppTextInput
          label={t('taskTitle')}
          value={draft.title}
          onChangeText={(title) => setDraft((prev) => ({ ...prev, title }))}
        />

        <View style={styles.group}>
          <Text style={[styles.label, { color: colors.text, fontSize: scaleFont(14) }]}>{t('taskStatus')}</Text>
          <View style={styles.priorityRow}>
            {statusOptions.map((status) => {
              const isActive = draft.status === status.value;
              return (
                <Pressable
                  key={status.value}
                  accessibilityRole="button"
                  onPress={() => setDraft((prev) => ({ ...prev, status: status.value }))}
                  style={[
                    styles.priorityPill,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                    isActive
                      ? [styles.pillActive, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]
                      : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: colors.mutedText, fontSize: scaleFont(14) },
                      isActive ? [styles.pillTextActive, { color: colors.primary }] : null,
                    ]}
                  >
                    {status.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.group}>
          <Text style={[styles.label, { color: colors.text, fontSize: scaleFont(14) }]}>{t('taskCategory')}</Text>
          <View style={styles.pillGrid}>
            {categories.map((category) => {
              const isActive = draft.category === category.name;
              const textColor = getReadableTextColor(category.color);
              return (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  onPress={() =>
                    setDraft((prev) => ({
                      ...prev,
                      category: prev.category === category.name ? undefined : category.name,
                    }))
                  }
                  style={[
                    styles.pill,
                    { backgroundColor: category.color, borderColor: isActive ? colors.primary : colors.border },
                    isActive ? [styles.pillActive, { borderColor: colors.primary }] : null,
                  ]}
                >
                  <View style={styles.categoryRow}>
                    {isActive ? <Ionicons name="checkmark-circle" size={16} color={textColor} /> : null}
                    <Text style={[styles.pillText, { color: textColor, fontSize: scaleFont(14) }]}>{category.name}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.group}>
          <Text style={[styles.label, { color: colors.text, fontSize: scaleFont(14) }]}>{t('taskPriority')}</Text>
          <View style={styles.priorityRow}>
            {priorities.map((priority) => {
              const isActive = draft.priority === priority.value;
              return (
                <Pressable
                  key={priority.value}
                  accessibilityRole="button"
                  onPress={() =>
                    setDraft((prev) => ({
                      ...prev,
                      priority: prev.priority === priority.value ? undefined : priority.value,
                    }))
                  }
                  style={[
                    styles.priorityPill,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                    isActive
                      ? [styles.pillActive, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]
                      : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: colors.mutedText, fontSize: scaleFont(14) },
                      isActive ? [styles.pillTextActive, { color: colors.primary }] : null,
                    ]}
                  >
                    {priority.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <SelectField label={t('taskDueDate')} value={displayDate(draft.dueDate, t('taskNoDate'))} onPress={() => setDateModalVisible(true)} />
        <SelectField
          label={t('taskDuration')}
          value={formatDuration(draft.plannedHours, t('taskNoDuration'))}
          onPress={() => setDurationModalVisible(true)}
        />
        <SelectField
          label={t('taskScheduledTime')}
          value={draft.scheduledStartTime ?? t('taskNoTime')}
          onPress={() => setTimeModalVisible(true)}
          helperText={t('taskPlannerHelper')}
        />

        {draft.scheduledStartTime ? (
          <PrimaryButton
            title={t('taskRemoveFromPlanner')}
            variant="ghost"
            onPress={() => {
              clearTaskSchedule(currentTask.id);
              setDraft((prev) => ({ ...prev, scheduledStartTime: undefined }));
            }}
          />
        ) : null}

        <AppTextInput
          label={t('taskNotes')}
          value={draft.notes ?? ''}
          onChangeText={(notes) => setDraft((prev) => ({ ...prev, notes }))}
          multiline
          placeholder="Dodaj szczegóły lub przypomnienia..."
          helperText="Przy dłuższej treści ekran podniesie się nad klawiaturę."
        />

        <View style={styles.group}>
          <View style={styles.checklistHeader}>
            <Text style={[styles.label, { color: colors.text, fontSize: scaleFont(14) }]}>{t('taskChecklist')}</Text>
            {subtasks.length ? (
              <View style={[styles.progressBadge, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="checkmark-done-outline" size={14} color={colors.primary} />
                <Text style={[styles.progressText, { color: colors.primary, fontSize: scaleFont(12) }]}>
                  {completedSubtasks}/{subtasks.length}
                </Text>
              </View>
            ) : null}
          </View>

          <SurfaceCard style={styles.checklistCard}>
            <View style={styles.addSubtaskRow}>
              <View style={{ flex: 1 }}>
                <AppTextInput
                  value={newSubtaskTitle}
                  onChangeText={setNewSubtaskTitle}
                  placeholder={t('taskChecklistPlaceholder')}
                  onSubmitEditing={addSubtask}
                  returnKeyType="done"
                />
              </View>
              <Pressable
                style={[
                  styles.addSubtaskButton,
                  {
                    backgroundColor: newSubtaskTitle.trim() ? colors.primary : colors.surfaceMuted,
                  },
                ]}
                onPress={addSubtask}
                accessibilityRole="button"
                accessibilityLabel={t('taskChecklistAdd')}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={newSubtaskTitle.trim() ? '#FFFFFF' : colors.mutedText}
                />
              </Pressable>
            </View>

            {subtasks.length ? (
              <View style={styles.checklistList}>
                {subtasks.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.subtaskRow, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
                  >
                    <Pressable
                      style={styles.subtaskToggle}
                      onPress={() => toggleSubtask(item.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: item.completed }}
                      accessibilityLabel={item.title}
                    >
                      <Ionicons
                        name={item.completed ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={item.completed ? colors.primary : colors.mutedText}
                      />
                    </Pressable>

                    <Text
                      style={[
                        styles.subtaskText,
                        { color: item.completed ? colors.mutedText : colors.text, fontSize: scaleFont(15) },
                        item.completed ? styles.subtaskTextDone : null,
                      ]}
                    >
                      {item.title}
                    </Text>

                    <Pressable
                      style={[styles.subtaskDelete, { backgroundColor: colors.dangerSoft }]}
                      onPress={() => removeSubtask(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel={t('taskChecklistDelete')}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.dangerText} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.checklistEmpty, { color: colors.mutedText, fontSize: scaleFont(14) }]}>
                {t('taskChecklistEmpty')}
              </Text>
            )}
          </SurfaceCard>
        </View>

        {!currentTask.isRefined && !(draft.category || draft.priority) ? (
          <SurfaceCard style={[styles.warningCard, { backgroundColor: colors.warningSoft, borderColor: colors.warningSoft }]}>
            <Text style={[styles.warningText, { color: colors.warningText, fontSize: scaleFont(14) }]}>
              {t('taskRefineWarning')}
            </Text>
          </SurfaceCard>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, spacing.md),
          },
        ]}
      >
        <PrimaryButton title={t('taskSaveChanges')} onPress={handleSave} />
      </View>

      <OptionPickerModal
        visible={dateModalVisible}
        title={t('taskSetDate')}
        options={generateUpcomingDateOptions(21)}
        selectedValue={draft.dueDate}
        onSelect={(value) => setDraft((prev) => ({ ...prev, dueDate: value }))}
        allowClear
        clearLabel={t('taskClearDate')}
        onClear={() => setDraft((prev) => ({ ...prev, dueDate: undefined, scheduledStartTime: undefined }))}
        onClose={() => setDateModalVisible(false)}
      />

      <OptionPickerModal
        visible={durationModalVisible}
        title={t('taskSetDuration')}
        options={durationOptions}
        selectedValue={draft.plannedHours ? String(draft.plannedHours) : undefined}
        onSelect={(value) => setDraft((prev) => ({ ...prev, plannedHours: Number(value) }))}
        allowClear
        clearLabel={t('taskClearDuration')}
        onClear={() => setDraft((prev) => ({ ...prev, plannedHours: undefined, scheduledStartTime: undefined }))}
        onClose={() => setDurationModalVisible(false)}
      />

      <OptionPickerModal
        visible={timeModalVisible}
        title={t('taskSetTime')}
        options={timeOptions}
        selectedValue={draft.scheduledStartTime}
        onSelect={(value) => setDraft((prev) => ({ ...prev, scheduledStartTime: value }))}
        allowClear
        clearLabel={t('taskClearTime')}
        onClear={() => setDraft((prev) => ({ ...prev, scheduledStartTime: undefined }))}
        onClose={() => setTimeModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

function QuickAction({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  const colors = useThemeColors();
  const { scaleFont } = useI18n();

  return (
    <Pressable
      style={[styles.quickAction, { backgroundColor: danger ? colors.dangerSoft : colors.primarySoft }]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={[styles.quickActionText, { color: danger ? colors.dangerText : colors.primary, fontSize: scaleFont(14) }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SelectField({
  label,
  value,
  onPress,
  helperText,
}: {
  label: string;
  value: string;
  onPress: () => void;
  helperText?: string;
}) {
  const colors = useThemeColors();
  const { scaleFont, scaleLineHeight } = useI18n();

  return (
    <View style={styles.group}>
      <Text style={[styles.label, { color: colors.text, fontSize: scaleFont(14) }]}>{label}</Text>
      <Pressable
        style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
        onPress={onPress}
        accessibilityRole="button"
      >
        <Text style={[styles.selectValue, { color: colors.text, fontSize: scaleFont(16) }]}>{value}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.mutedText} />
      </Pressable>
      {helperText ? (
        <Text
          style={[
            styles.fieldHelper,
            { color: colors.mutedText, fontSize: scaleFont(12), lineHeight: scaleLineHeight(18) },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
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
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  quickActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAction: {
    minHeight: 40,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  quickActionText: {
    fontWeight: '700',
  },
  group: {
    gap: 12,
  },
  label: {
    fontWeight: '600',
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    minWidth: '30%',
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    borderWidth: 2,
  },
  pillText: {
    fontWeight: '600',
  },
  pillTextActive: {},
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityPill: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectField: {
    minHeight: 54,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  selectValue: {},
  fieldHelper: {},
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  checklistCard: {
    gap: 14,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  addSubtaskButton: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistList: {
    gap: 10,
  },
  checklistEmpty: {
    textAlign: 'center',
  },
  subtaskRow: {
    minHeight: 54,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subtaskToggle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskText: {
    flex: 1,
  },
  subtaskTextDone: {
    textDecorationLine: 'line-through',
  },
  subtaskDelete: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  progressText: {
    fontWeight: '700',
  },
  warningCard: {},
  warningText: {
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  missingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingText: {},
});
