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
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTextInput } from '../components/AppTextInput';
import { OptionPickerModal } from '../components/OptionPickerModal';
import { PrimaryButton } from '../components/PrimaryButton';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { RootStackParamList } from '../navigation/AppNavigator';
import { radius, spacing, useThemeColors } from '../theme';
import { NoteDraft } from '../types';
import { formatLocalizedDate, generateUpcomingDateOptionsLocalized } from '../utils/date';
import { getNoteSectionLabel, getNoteSectionOptions } from '../utils/notes';

type Props = NativeStackScreenProps<RootStackParamList, 'NoteEditor'>;

export function NoteEditorScreen({ route, navigation }: Props) {
  const { activeData, addNote, updateNote, deleteNote } = useApp();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { language, scaleFont, scaleLineHeight, t } = useI18n();
  const note = useMemo(
    () => activeData.notes.find((item) => item.id === route.params?.noteId),
    [activeData.notes, route.params?.noteId],
  );

  const reminderDateOptions = useMemo(
    () =>
      generateUpcomingDateOptionsLocalized(
        language,
        { today: t('optionToday'), tomorrow: t('optionTomorrow') },
        365,
      ),
    [language, t],
  );
  const noteSectionOptions = useMemo(() => getNoteSectionOptions(t), [t]);

  const [sectionModalVisible, setSectionModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [draft, setDraft] = useState<NoteDraft>(() => ({
    title: note?.title ?? '',
    content: note?.content ?? '',
    section: note?.section ?? 'general',
    personName: note?.personName,
    reminderDate: note?.reminderDate,
    reminderEnabled: note?.reminderEnabled ?? false,
  }));

  const isBirthday = draft.section === 'birthdays';
  const isPersonSection = draft.section === 'other-wishes' || draft.section === 'birthdays';

  function handleSave() {
    if (!draft.title.trim()) {
      Alert.alert(t('noteEditorMissingTitle'), t('noteEditorMissingBody'));
      return;
    }

    if (note) {
      updateNote(note.id, draft);
    } else {
      addNote(draft);
    }
    navigation.goBack();
  }

  function handleDelete() {
    if (!note) {
      navigation.goBack();
      return;
    }
    Alert.alert(t('noteEditorDeleteTitle'), t('noteEditorDeleteBody'), [
      { text: t('commonCancel'), style: 'cancel' },
      {
        text: t('commonDelete'),
        style: 'destructive',
        onPress: () => {
          deleteNote(note.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
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
          {note ? t('noteEditorEdit') : t('noteEditorNew')}
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
        <AppTextInput
          label={t('noteEditorTitle')}
          value={draft.title}
          onChangeText={(title) => setDraft((prev) => ({ ...prev, title }))}
          placeholder={t('noteEditorTitlePlaceholder')}
        />

        <SelectField
          label={t('noteEditorSection')}
          value={getNoteSectionLabel(draft.section, t)}
          onPress={() => setSectionModalVisible(true)}
        />

        {isPersonSection ? (
          <AppTextInput
            label={draft.section === 'birthdays' ? t('noteEditorPersonName') : t('noteEditorPerson')}
            value={draft.personName ?? ''}
            onChangeText={(personName) => setDraft((prev) => ({ ...prev, personName }))}
            placeholder={t('noteEditorPersonPlaceholder')}
          />
        ) : null}

        {isBirthday ? (
          <>
            <SelectField
              label={t('noteEditorReminderDate')}
              value={
                draft.reminderDate
                  ? reminderDateOptions.find((option) => option.value === draft.reminderDate)?.label ?? draft.reminderDate
                  : t('noteEditorNoDate')
              }
              onPress={() => setDateModalVisible(true)}
            />
            <View style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchTitle, { color: colors.text, fontSize: scaleFont(16) }]}>{t('noteEditorReminderToggle')}</Text>
                <Text
                  style={[
                    styles.switchText,
                    { color: colors.mutedText, fontSize: scaleFont(14), lineHeight: scaleLineHeight(20) },
                  ]}
                >
                  {t('noteEditorReminderHint')}
                </Text>
              </View>
              <Switch
                value={draft.reminderEnabled ?? false}
                onValueChange={(reminderEnabled) => setDraft((prev) => ({ ...prev, reminderEnabled }))}
                trackColor={{ true: colors.primarySoft, false: colors.border }}
                thumbColor={draft.reminderEnabled ? colors.primary : colors.surface}
              />
            </View>
          </>
        ) : null}

        <AppTextInput
          label={t('noteEditorContent')}
          value={draft.content}
          onChangeText={(content) => setDraft((prev) => ({ ...prev, content }))}
          multiline
          placeholder={t('noteEditorContentPlaceholder')}
          helperText={t('noteEditorContentHelper')}
        />
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
        <PrimaryButton title={t('noteEditorSave')} onPress={handleSave} />
      </View>

      <OptionPickerModal
        visible={sectionModalVisible}
        title={t('noteEditorSelectSection')}
        options={noteSectionOptions}
        selectedValue={draft.section}
        onSelect={(section) => {
          setDraft((prev) => ({
            ...prev,
            section,
            personName: section === 'other-wishes' || section === 'birthdays' ? prev.personName : undefined,
            reminderDate: section === 'birthdays' ? prev.reminderDate : undefined,
            reminderEnabled: section === 'birthdays' ? prev.reminderEnabled : false,
          }));
        }}
        onClose={() => setSectionModalVisible(false)}
      />

      <OptionPickerModal
        visible={dateModalVisible}
        title={t('noteEditorSelectReminderDate')}
        options={reminderDateOptions}
        selectedValue={draft.reminderDate}
        onSelect={(reminderDate) => setDraft((prev) => ({ ...prev, reminderDate }))}
        allowClear
        clearLabel={t('noteEditorClearDate')}
        onClear={() => setDraft((prev) => ({ ...prev, reminderDate: undefined }))}
        onClose={() => setDateModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

function SelectField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const { scaleFont } = useI18n();

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  group: {
    gap: 12,
  },
  label: {
    fontWeight: '600',
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
  switchRow: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  switchTitle: {
    fontWeight: '700',
  },
  switchText: {
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
});
