import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTextInput } from '../components/AppTextInput';
import { EmptyState } from '../components/EmptyState';
import { SurfaceCard } from '../components/SurfaceCard';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import { radius, spacing, useThemeColors } from '../theme';
import { NoteSection } from '../types';
import { formatLocalizedDate } from '../utils/date';
import { getNoteSectionLabel, getNoteSectionOptions } from '../utils/notes';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Notes'>,
  NativeStackScreenProps<RootStackParamList>
>;

type FilterValue = 'all' | NoteSection;

export function NotesScreen({ navigation }: Props) {
  const { activeData } = useApp();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { language, scaleFont, scaleLineHeight, t } = useI18n();
  const [filter, setFilter] = useState<FilterValue>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const archivedNotesCount = activeData.notes.filter((note) => note.archivedAt).length;

  const filteredNotes = useMemo(() => {
    const notes = [...activeData.notes]
      .filter((note) => !note.archivedAt)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return notes.filter((note) => {
      if (filter !== 'all' && note.section !== filter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      const haystack = [note.title, note.content, note.personName].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [activeData.notes, filter, normalizedQuery]);

  const sectionOptions = useMemo(() => getNoteSectionOptions(t), [t]);

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
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(30) }]}>{t('notesTitle')}</Text>
            <Text
              style={[
                styles.subtitle,
                { color: colors.mutedText, fontSize: scaleFont(15), lineHeight: scaleLineHeight(22) },
              ]}
            >
              {t('notesSubtitle')}
            </Text>
          </View>
          <Pressable
            style={[styles.headerButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('NoteEditor')}
            accessibilityRole="button"
            accessibilityLabel={t('notesAdd')}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <FilterChip label={t('notesAll')} active={filter === 'all'} onPress={() => setFilter('all')} />
          {sectionOptions.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              active={filter === option.value}
              onPress={() => setFilter(option.value)}
            />
          ))}
        </ScrollView>

        <SurfaceCard style={styles.searchCard}>
          <AppTextInput value={searchQuery} onChangeText={setSearchQuery} placeholder={t('notesSearchPlaceholder')} />
        </SurfaceCard>

        <SurfaceCard style={[styles.infoCard, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }]}>
          <Text style={[styles.infoTitle, { color: colors.primary, fontSize: scaleFont(16) }]}>{t('notesHowToTitle')}</Text>
          <Text style={[styles.infoText, { color: colors.mutedText, fontSize: scaleFont(14), lineHeight: scaleLineHeight(20) }]}>
            {t('notesHowToText')}
          </Text>
          <Text style={[styles.archiveHint, { color: colors.primary, fontSize: scaleFont(13), lineHeight: scaleLineHeight(18) }]}>
            {t('notesArchiveHint', { count: archivedNotesCount })}
          </Text>
        </SurfaceCard>

        {filteredNotes.length ? (
          <View style={styles.list}>
            {filteredNotes.map((note) => (
              <Pressable
                key={note.id}
                style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigation.navigate('NoteEditor', { noteId: note.id })}
                accessibilityRole="button"
              >
                <View style={styles.noteHeader}>
                  <View style={[styles.noteBadge, { backgroundColor: colors.primarySoft }]}>
                    <Text style={[styles.noteBadgeText, { color: colors.primary, fontSize: scaleFont(12) }]}>
                      {getNoteSectionLabel(note.section, t)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
                </View>

                <Text style={[styles.noteTitle, { color: colors.text, fontSize: scaleFont(18) }]}>{note.title}</Text>
                {!!note.personName && (
                  <Text style={[styles.meta, { color: colors.mutedText, fontSize: scaleFont(13) }]}>
                    {t('notesPerson')}: {note.personName}
                  </Text>
                )}
                {!!note.reminderDate && (
                  <Text style={[styles.meta, { color: colors.mutedText, fontSize: scaleFont(13) }]}>
                    {t('notesReminder')}: {formatLocalizedDate(language, note.reminderDate, { day: 'numeric', month: 'long' })}
                  </Text>
                )}
                <Text
                  numberOfLines={4}
                  style={[styles.preview, { color: colors.mutedText, fontSize: scaleFont(14), lineHeight: scaleLineHeight(20) }]}
                >
                  {note.content || t('notesEmptyContent')}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <SurfaceCard>
            <EmptyState
              title={normalizedQuery ? t('commonNoResults') : t('notesEmptyTitle')}
              description={normalizedQuery ? t('notesSearchPlaceholder') : t('notesEmptyDescription')}
            />
          </SurfaceCard>
        )}
      </ScrollView>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const { scaleFont } = useI18n();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? colors.primarySoft : colors.surface,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={[styles.filterText, { color: active ? colors.primary : colors.mutedText, fontSize: scaleFont(14) }]}>
        {label}
      </Text>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  title: {
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    gap: 10,
  },
  filterChip: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontWeight: '700',
  },
  infoCard: {},
  searchCard: {},
  infoTitle: {
    fontWeight: '700',
  },
  infoText: {
    marginTop: 6,
  },
  archiveHint: {
    marginTop: 8,
    fontWeight: '600',
  },
  list: {
    gap: 12,
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    gap: 8,
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
    fontWeight: '800',
  },
  meta: {},
  preview: {},
});
