import { TranslationKey } from '../i18n';
import { NoteSection } from '../types';

const sectionKeyMap: Record<NoteSection, TranslationKey> = {
  general: 'noteSectionGeneral',
  'watch-later': 'noteSectionWatchLater',
  'read-later': 'noteSectionReadLater',
  birthdays: 'noteSectionBirthdays',
  'my-wishes': 'noteSectionMyWishes',
  'other-wishes': 'noteSectionOtherWishes',
};

export function getNoteSectionLabel(
  section: NoteSection,
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string,
) {
  return t(sectionKeyMap[section]);
}

export function getNoteSectionOptions(
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string,
) {
  return (Object.keys(sectionKeyMap) as NoteSection[]).map((value) => ({
    value,
    label: t(sectionKeyMap[value]),
  }));
}
