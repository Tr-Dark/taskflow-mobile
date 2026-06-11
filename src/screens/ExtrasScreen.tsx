import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OptionPickerModal, PickerOption } from '../components/OptionPickerModal';
import { PrimaryButton } from '../components/PrimaryButton';
import { SurfaceCard } from '../components/SurfaceCard';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MainTabParamList } from '../navigation/AppNavigator';
import { spacing, useThemeColors } from '../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'Extras'>;

function formatTimer(total: number) {
  const minutes = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (total % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function ExtrasScreen({}: Props) {
  const {
    activeData,
    setReminderEnabled,
    setReminderInterval,
    addWaterIntake,
    addMovementBreak,
    startPausePomodoro,
    resetPomodoro,
    switchPomodoroMode,
  } = useApp();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { scaleFont, scaleLineHeight, t } = useI18n();
  const [intervalReminderType, setIntervalReminderType] = useState<'water' | 'movement' | 'break' | null>(null);
  const reminderIntervalOptions: PickerOption<string>[] = useMemo(
    () =>
      [15, 30, 45, 60, 90, 120].map((value) => ({
        value: String(value),
        label: t('reminderEvery', { value }),
      })),
    [t],
  );

  const todayPomodoros = activeData.stats.pomodoroSessions.filter((session) =>
    session.completedAt.startsWith(new Date().toISOString().slice(0, 10)),
  ).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 12) + spacing.sm,
          paddingBottom: 104 + Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View>
        <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(30) }]}>{t('extrasTitle')}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText, fontSize: scaleFont(15) }]}>{t('extrasSubtitle')}</Text>
      </View>

      <SurfaceCard>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{t('pomodoroTitle')}</Text>
        <View style={styles.timerWrap}>
          <Text style={[styles.timerLabel, { color: colors.mutedText, fontSize: scaleFont(14) }]}>
            {activeData.pomodoro.mode === 'focus' ? t('pomodoroFocus') : t('pomodoroBreak')}
          </Text>
          <Text style={[styles.timerValue, { color: colors.text, fontSize: scaleFont(46) }]}>
            {formatTimer(activeData.pomodoro.remainingSeconds)}
          </Text>
        </View>
        <PrimaryButton
          title={activeData.pomodoro.isRunning ? t('pomodoroPause') : t('pomodoroStart')}
          onPress={startPausePomodoro}
          style={{ marginTop: 12 }}
        />
        <View style={styles.buttonRow}>
          <PrimaryButton title={t('pomodoroReset')} variant="secondary" onPress={resetPomodoro} style={{ flex: 1 }} />
          <PrimaryButton
            title={activeData.pomodoro.mode === 'focus' ? t('pomodoroSwitchToBreak') : t('pomodoroSwitchToFocus')}
            variant="ghost"
            onPress={switchPomodoroMode}
            style={{ flex: 1 }}
          />
        </View>
        <Text style={[styles.helperText, { color: colors.mutedText, fontSize: scaleFont(14), lineHeight: scaleLineHeight(20) }]}>
          {t('pomodoroHint')}
        </Text>
      </SurfaceCard>

      <View style={styles.sectionBlock}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{t('remindersTitle')}</Text>
        {activeData.reminders.map((reminder) => (
          <SurfaceCard key={reminder.id}>
            <View style={styles.reminderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reminderTitle, { color: colors.text, fontSize: scaleFont(15) }]}>
                  {reminder.type === 'water'
                    ? t('reminderWater')
                    : reminder.type === 'movement'
                      ? t('reminderMovement')
                      : t('reminderBreak')}
                </Text>
                <Text style={[styles.reminderMeta, { color: colors.mutedText, fontSize: scaleFont(13) }]}>
                  {t('reminderEvery', { value: reminder.interval })}
                </Text>
              </View>
              <Switch
                value={reminder.enabled}
                onValueChange={(value) => setReminderEnabled(reminder.type, value)}
                trackColor={{ true: colors.primarySoft, false: colors.border }}
                thumbColor={reminder.enabled ? colors.primary : colors.surface}
              />
            </View>
            <View style={styles.reminderActions}>
              <PrimaryButton
                title={t('reminderChangeInterval')}
                variant="ghost"
                onPress={() => setIntervalReminderType(reminder.type)}
              />
            </View>
          </SurfaceCard>
        ))}
      </View>

      <SurfaceCard style={[styles.successCard, { backgroundColor: colors.successSoft, borderColor: colors.successSoft }]}>
        <Text
          style={[
            styles.successText,
            { color: colors.successText, fontSize: scaleFont(14), lineHeight: scaleLineHeight(20) },
          ]}
        >
          {t('extrasWellbeingHint')}
        </Text>
      </SurfaceCard>

      <SurfaceCard>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{t('statsTitle')}</Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('statsPomodoros')}:</Text>
          <Text style={[styles.summaryValue, { color: colors.text, fontSize: scaleFont(14) }]}>{todayPomodoros}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('statsWater')}:</Text>
          <Text style={[styles.summaryValue, { color: colors.text, fontSize: scaleFont(14) }]}>{activeData.stats.waterIntake}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('statsMovement')}:</Text>
          <Text style={[styles.summaryValue, { color: colors.text, fontSize: scaleFont(14) }]}>{activeData.stats.movementBreaks}</Text>
        </View>
        <View style={styles.buttonRow}>
          <PrimaryButton title={t('statsAddWater')} variant="secondary" onPress={addWaterIntake} style={{ flex: 1 }} />
          <PrimaryButton title={t('statsAddMovement')} variant="secondary" onPress={addMovementBreak} style={{ flex: 1 }} />
        </View>
      </SurfaceCard>

      <OptionPickerModal
        visible={!!intervalReminderType}
        title={t('reminderChangeInterval')}
        description={t('reminderIntervalHint')}
        options={reminderIntervalOptions}
        selectedValue={
          intervalReminderType
            ? String(activeData.reminders.find((reminder) => reminder.type === intervalReminderType)?.interval ?? '')
            : undefined
        }
        onSelect={(value) => {
          if (!intervalReminderType) {
            return;
          }
          setReminderInterval(intervalReminderType, Number(value));
          setIntervalReminderType(null);
        }}
        onClose={() => setIntervalReminderType(null)}
      />
    </ScrollView>
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
  title: {
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  timerWrap: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  timerLabel: {
    marginBottom: 4,
  },
  timerValue: {
    fontWeight: '800',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  helperText: {
    marginTop: 12,
  },
  sectionBlock: {
    gap: 12,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderTitle: {
    fontWeight: '700',
  },
  reminderMeta: {
    marginTop: 4,
  },
  reminderActions: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  successCard: {},
  successText: {},
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  summaryLabel: {},
  summaryValue: {
    fontWeight: '700',
  },
});
