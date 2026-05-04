import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n';
import { Task } from '../types';
import { radius, useThemeColors } from '../theme';

interface TaskRowProps {
  task: Task;
  onPress: () => void;
  onToggleStatus?: () => void;
}

function getPriorityKey(priority?: Task['priority']) {
  if (priority === 'high') return 'priorityHigh';
  if (priority === 'medium') return 'priorityMedium';
  if (priority === 'low') return 'priorityLow';
  return null;
}

function formatDurationLabel(hours?: number) {
  if (!hours) return null;

  const minutes = Math.round(hours * 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const wholeHours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes ? `${wholeHours} h ${restMinutes} min` : `${wholeHours} h`;
}

export function TaskRow({ task, onPress, onToggleStatus }: TaskRowProps) {
  const colors = useThemeColors();
  const { scaleFont, t } = useI18n();
  const priorityKey = getPriorityKey(task.priority);
  const durationLabel = formatDurationLabel(task.plannedHours);
  const subtasks = task.subtasks ?? [];
  const completedSubtasks = subtasks.filter((item) => item.completed).length;

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.row}>
        <Pressable
          onPress={onToggleStatus}
          style={styles.checkWrap}
          accessibilityRole="button"
          accessibilityLabel={task.status === 'completed' ? t('statusCompleted') : t('statusActive')}
          hitSlop={10}
          disabled={!onToggleStatus}
        >
          <Ionicons
            name={task.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={task.status === 'completed' ? '#22A45D' : colors.border}
          />
        </Pressable>

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: colors.text, fontSize: scaleFont(16) },
              task.status === 'completed' ? [styles.completedTitle, { color: colors.mutedText }] : null,
            ]}
          >
            {task.title}
          </Text>

          <View style={styles.metaWrap}>
            {!task.isRefined ? (
              <View style={[styles.badge, { backgroundColor: colors.warningSoft }]}>
                <Ionicons name="sparkles" size={12} color={colors.warningText} />
                <Text style={[styles.badgeText, { color: colors.warningText, fontSize: scaleFont(12) }]}>
                  {t('taskNeedsRefine')}
                </Text>
              </View>
            ) : null}

            {task.category ? (
              <View style={[styles.badge, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={[styles.badgeText, { color: colors.mutedText, fontSize: scaleFont(12) }]}>
                  {task.category}
                </Text>
              </View>
            ) : null}

            {priorityKey ? (
              <View
                style={[
                  styles.badge,
                  task.priority === 'high'
                    ? { backgroundColor: colors.dangerSoft }
                    : task.priority === 'medium'
                      ? { backgroundColor: colors.warningSoft }
                      : { backgroundColor: '#E9F1FF' },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { fontSize: scaleFont(12) },
                    task.priority === 'high'
                      ? { color: colors.dangerText }
                      : task.priority === 'medium'
                        ? { color: colors.warningText }
                        : { color: '#2253D6' },
                  ]}
                >
                  {t(priorityKey)}
                </Text>
              </View>
            ) : null}

            {durationLabel ? (
              <View style={[styles.badge, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="time-outline" size={12} color={colors.mutedText} />
                <Text style={[styles.badgeText, { color: colors.mutedText, fontSize: scaleFont(12) }]}>
                  {durationLabel}
                </Text>
              </View>
            ) : null}

            {task.scheduledStartTime ? (
              <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="calendar-outline" size={12} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary, fontSize: scaleFont(12) }]}>
                  {task.scheduledStartTime}
                </Text>
              </View>
            ) : null}

            {subtasks.length ? (
              <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="checkmark-done-outline" size={12} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary, fontSize: scaleFont(12) }]}>
                  {completedSubtasks}/{subtasks.length}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  checkWrap: {
    minWidth: 32,
    minHeight: 32,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 10,
  },
  title: {
    fontWeight: '500',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
  },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontWeight: '500',
  },
});
