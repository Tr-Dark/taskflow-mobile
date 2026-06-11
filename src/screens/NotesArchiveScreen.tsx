import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { SurfaceCard } from '../components/SurfaceCard';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { RootStackParamList } from '../navigation/AppNavigator';
import { radius, spacing, useThemeColors } from '../theme';
import { formatLocalizedDate } from '../utils/date';
import { getNoteSectionLabel } from '../utils/notes';

type Props = NativeStackScreenProps<RootStackParamList, 'NotesArchive'>;

export function NotesArchiveScreen({ navigation }: Props) {
  const { activeData, restoreNote } = useApp();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { language, scaleFont, scaleLineHeight, t } = useI18n();

  const archivedNotes = [...activeData.notes]
    .filter((note) => note.archivedAt)
    .sort((a, b) => (b.archivedAt ?? '').localeCompare(a.archivedAt ?? ''));

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
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: scaleFont(20) }]}>
            {t('notesArchiveTitle')}
          </Text>
          <View style={{ width: 42 }} />
        </View>

        <View>
          <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(30) }]}>{t('notesArchiveHeading')}</Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.mutedText, fontSize: scaleFont(15), lineHeight: scaleLineHeight(22) },
            ]}
          >
            {t('notesArchiveSubtitle')}
          </Text>
        </View>

        {archivedNotes.length ? (
          <View style={styles.list}>
            {archivedNotes.map((note) => (
              <SurfaceCard key={note.id} style={styles.noteCard}>
                <Pressable onPress={() => navigation.navigate('NoteEditor', { noteId: note.id })} accessibilityRole="button">
                  <View style={styles.noteHeader}>
                    <View style={[styles.noteBadge, { backgroundColor: colors.primarySoft }]}>
                      <Text style={[styles.noteBadgeText, { color: colors.primary, fontSize: scaleFont(12) }]}>
                        {getNoteSectionLabel(note.section, t)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
                  </View>

                  <Text style={[styles.noteTitle, { color: colors.text, fontSize: scaleFont(18) }]}>{note.title}</Text>
                  <Text style={[styles.meta, { color: colors.mutedText, fontSize: scaleFont(13) }]}>
                    {t('notesArchiveArchivedAt')}:{' '}
                    {note.archivedAt ? formatLocalizedDate(language, note.archivedAt.slice(0, 10), { day: 'numeric', month: 'long' }) : '-'}
                  </Text>
                  <Text
                    numberOfLines={3}
                    style={[styles.preview, { color: colors.mutedText, fontSize: scaleFont(14), lineHeight: scaleLineHeight(20) }]}
                  >
                    {note.content || t('notesEmptyContent')}
                  </Text>
                </Pressable>

                <PrimaryButton
                  title={t('notesArchiveRestoreAction')}
                  variant="secondary"
                  onPress={() => restoreNote(note.id)}
                />
              </SurfaceCard>
            ))}
          </View>
        ) : (
          <SurfaceCard>
            <EmptyState title={t('notesArchiveEmptyTitle')} description={t('notesArchiveEmptyDescription')} />
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
  list: {
    gap: 12,
  },
  noteCard: {
    gap: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  noteBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  noteBadgeText: {
    fontWeight: '800',
  },
  noteTitle: {
    marginTop: 8,
    fontWeight: '700',
  },
  meta: {
    marginTop: 6,
  },
  preview: {
    marginTop: 8,
  },
});
