import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTextInput } from '../components/AppTextInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { SurfaceCard } from '../components/SurfaceCard';
import { useApp } from '../context/AppContext';
import { getFontSizeLabel, getLanguageLabel, useI18n } from '../i18n';
import { RootStackParamList } from '../navigation/AppNavigator';
import { isNotificationsLimitedInExpoGo } from '../services/notifications';
import { FontSizePreference, LanguagePreference, ThemePreference } from '../types';
import { radius, spacing, useThemeColors } from '../theme';
import { formatPolishDateTime } from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const themeOptions: { value: ThemePreference; labelKey: 'themeLight' | 'themeDark' }[] = [
  { value: 'light', labelKey: 'themeLight' },
  { value: 'dark', labelKey: 'themeDark' },
];

const languageOptions: LanguagePreference[] = ['pl', 'en', 'uk'];
const fontSizeOptions: FontSizePreference[] = ['small', 'medium', 'large'];
const plannerStartOptions = [5, 6, 7, 8, 9, 10];
const plannerEndOptions = [18, 19, 20, 21, 22, 23, 24];
const categoryPalette = ['#E8EDFF', '#FFEAD9', '#EAF8EE', '#FFE7EC', '#FFF4CC', '#EEE8FF', '#DDF5F1', '#D9E8FF'];

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

export function SettingsScreen({ navigation }: Props) {
  const {
    state,
    activeData,
    notificationPermission,
    requestNotificationPermissions,
    updateSettings,
    setSyncEnabled,
    runFakeSync,
    replaceStateFromImport,
    addCategory,
    deleteCategory,
    updateCategoryColor,
    setActiveMode,
    resetDemoMode,
    resetPersonalMode,
    logout,
    showToast,
  } = useApp();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { scaleFont, scaleLineHeight, t } = useI18n();
  const [displayName, setDisplayName] = useState(state.settings.displayName);
  const [categoryName, setCategoryName] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRequestingNotifications, setIsRequestingNotifications] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | undefined>(
    activeData.categories[0]?.name,
  );

  const expoGoLimited = isNotificationsLimitedInExpoGo();
  const selectedCategory = useMemo(
    () => activeData.categories.find((category) => category.name === selectedCategoryName) ?? activeData.categories[0],
    [activeData.categories, selectedCategoryName],
  );

  function handleSaveProfile() {
    updateSettings({ displayName: displayName.trim() || 'Mój profil' });
    showToast('Zapisano profil użytkownika.', 'success');
  }

  function handleAddCategory() {
    if (!categoryName.trim()) {
      return;
    }
    addCategory(categoryName);
    setCategoryName('');
  }

  async function handleFakeSync() {
    setIsSyncing(true);
    try {
      await runFakeSync();
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!directory) {
        showToast('Nie udało się przygotować pliku eksportu.', 'warning');
        return;
      }

      const fileUri = `${directory}taskflow-backup-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(state, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Eksport danych TaskFlow',
        });
      } else {
        showToast('Plik backupu zapisano lokalnie.', 'success');
      }
    } catch {
      showToast('Nie udało się wyeksportować danych.', 'warning');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport() {
    setIsImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets.length) {
        return;
      }

      const raw = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = JSON.parse(raw);
      replaceStateFromImport(parsed);
    } catch {
      showToast('Nie udało się odczytać pliku backupu.', 'warning');
    } finally {
      setIsImporting(false);
    }
  }

  async function handleEnableNotifications() {
    if (expoGoLimited) {
      showToast('W Expo Go pełne testy powiadomień wymagają development build.', 'warning');
      return;
    }

    setIsRequestingNotifications(true);
    try {
      await requestNotificationPermissions();
    } finally {
      setIsRequestingNotifications(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
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
            {t('commonSettings')}
          </Text>
          <View style={{ width: 42 }} />
        </View>

        <View>
          <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(30) }]}>{t('settingsHeading')}</Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.mutedText, fontSize: scaleFont(15), lineHeight: scaleLineHeight(22) },
            ]}
          >
            {t('settingsSubtitle')}
          </Text>
        </View>

        <SurfaceCard>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{t('settingsProfile')}</Text>
          <View style={{ marginTop: 16, gap: 14 }}>
            <AppTextInput
              label={t('settingsDisplayName')}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t('settingsDisplayNamePlaceholder')}
            />
            <PrimaryButton title={t('settingsSaveProfile')} onPress={handleSaveProfile} />
          </View>
        </SurfaceCard>

        <SurfaceCard>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{t('settingsTheme')}</Text>
          <Text style={[styles.helper, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('settingsThemeHint')}</Text>
          <View style={styles.chipRow}>
            {themeOptions.map((option) => {
              const active = state.settings.theme === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  style={[
                    styles.selectChip,
                    {
                      backgroundColor: active ? colors.primarySoft : colors.surfaceMuted,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => updateSettings({ theme: option.value })}
                >
                  <Text style={{ color: active ? colors.primary : colors.mutedText, fontWeight: '700', fontSize: scaleFont(14) }}>
                    {t(option.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SurfaceCard>

        <SurfaceCard>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{t('settingsLanguage')}</Text>
          <Text style={[styles.helper, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('settingsLanguageHint')}</Text>
          <View style={styles.optionColumn}>
            {languageOptions.map((language) => {
              const active = state.settings.language === language;
              return (
                <Pressable
                  key={language}
                  accessibilityRole="button"
                  onPress={() => updateSettings({ language })}
                  style={[
                    styles.optionRow,
                    { borderColor: colors.border, backgroundColor: colors.surfaceMuted },
                    active ? { borderColor: colors.primary, backgroundColor: colors.primarySoft } : null,
                  ]}
                >
                  <View>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: scaleFont(15) }}>
                      {getLanguageLabel(language, t)}
                    </Text>
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </SurfaceCard>

        <SurfaceCard>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{t('settingsFontSize')}</Text>
          <Text style={[styles.helper, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('settingsFontSizeHint')}</Text>
          <View style={styles.optionColumn}>
            {fontSizeOptions.map((fontSize) => {
              const active = state.settings.fontSize === fontSize;
              return (
                <Pressable
                  key={fontSize}
                  accessibilityRole="button"
                  onPress={() => updateSettings({ fontSize })}
                  style={[
                    styles.optionRow,
                    { borderColor: colors.border, backgroundColor: colors.surfaceMuted },
                    active ? { borderColor: colors.primary, backgroundColor: colors.primarySoft } : null,
                  ]}
                >
                  <View>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: scaleFont(15) }}>
                      {getFontSizeLabel(fontSize, t)}
                    </Text>
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </SurfaceCard>

        <SurfaceCard>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{t('settingsPlannerHours')}</Text>
          <Text style={[styles.helper, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('settingsPlannerHoursHint')}</Text>

          <View style={styles.plannerRangeWrap}>
            <View style={{ flex: 1, gap: 10 }}>
              <Text style={[styles.label, { color: colors.text, fontSize: scaleFont(14) }]}>{t('settingsPlannerStart')}</Text>
              <View style={styles.hourChipWrap}>
                {plannerStartOptions.map((hour) => {
                  const active = state.settings.plannerStartHour === hour;
                  return (
                    <Pressable
                      key={`start-${hour}`}
                      accessibilityRole="button"
                      onPress={() =>
                        updateSettings({
                          plannerStartHour: hour,
                          plannerEndHour: Math.max(hour + 1, state.settings.plannerEndHour),
                        })
                      }
                      style={[
                        styles.hourChip,
                        {
                          backgroundColor: active ? colors.primarySoft : colors.surfaceMuted,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: active ? colors.primary : colors.mutedText, fontWeight: '700', fontSize: scaleFont(14) }}>
                        {`${hour}:00`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ flex: 1, gap: 10 }}>
              <Text style={[styles.label, { color: colors.text, fontSize: scaleFont(14) }]}>{t('settingsPlannerEnd')}</Text>
              <View style={styles.hourChipWrap}>
                {plannerEndOptions.map((hour) => {
                  const active = state.settings.plannerEndHour === hour;
                  const disabled = hour <= state.settings.plannerStartHour;
                  return (
                    <Pressable
                      key={`end-${hour}`}
                      accessibilityRole="button"
                      disabled={disabled}
                      onPress={() => updateSettings({ plannerEndHour: hour })}
                      style={[
                        styles.hourChip,
                        {
                          backgroundColor: active ? colors.primarySoft : colors.surfaceMuted,
                          borderColor: active ? colors.primary : colors.border,
                          opacity: disabled ? 0.45 : 1,
                        },
                      ]}
                    >
                      <Text style={{ color: active ? colors.primary : colors.mutedText, fontWeight: '700', fontSize: scaleFont(14) }}>
                        {hour === 24 ? '24:00' : `${hour}:00`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </SurfaceCard>

        <SurfaceCard>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{t('settingsHelp')}</Text>
          <Text style={[styles.helper, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('settingsHelpHint')}</Text>
          <PrimaryButton title={t('settingsOpenFaq')} variant="secondary" onPress={() => navigation.navigate('Faq')} style={{ marginTop: 16 }} />
        </SurfaceCard>

        <SurfaceCard>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{t('settingsNotifications')}</Text>
          <Text style={[styles.helper, { color: colors.mutedText, fontSize: scaleFont(14) }]}>
            {t('settingsNotificationStatus')}: {notificationPermission === 'granted' ? t('notificationsStatusGranted') : notificationPermission === 'denied' ? t('notificationsStatusDenied') : t('notificationsStatusUndetermined')}
          </Text>
          <Text style={[styles.helper, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('settingsNotificationsHint')}</Text>
          {expoGoLimited ? (
            <View style={[styles.warningBox, { backgroundColor: colors.warningSoft, borderColor: '#F3D88D' }]}>
              <Ionicons name="warning-outline" size={18} color={colors.warningText} />
              <Text style={[styles.warningBoxText, { color: colors.warningText, fontSize: scaleFont(13) }]}>
                {t('settingsNotificationsExpoGo')}
              </Text>
            </View>
          ) : null}
          <PrimaryButton
            title={t('settingsNotificationsEnable')}
            onPress={handleEnableNotifications}
            loading={isRequestingNotifications}
            style={{ marginTop: 16 }}
          />
        </SurfaceCard>

        <SurfaceCard>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{t('settingsFakeSyncTitle')}</Text>
          <View style={[styles.switchRow, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.switchTitle, { color: colors.text, fontSize: scaleFont(16) }]}>{t('settingsSyncToggle')}</Text>
              <Text
                style={[
                  styles.switchText,
                  { color: colors.mutedText, fontSize: scaleFont(14), lineHeight: scaleLineHeight(20) },
                ]}
              >
                {t('settingsSyncHint')}
              </Text>
            </View>
            <Switch
              value={state.settings.syncEnabled}
              onValueChange={setSyncEnabled}
              trackColor={{ true: colors.primarySoft, false: colors.border }}
              thumbColor={state.settings.syncEnabled ? colors.primary : colors.surface}
            />
          </View>
          <Text style={[styles.helper, { color: colors.mutedText, fontSize: scaleFont(14) }]}>
            {state.settings.lastSyncedAt
              ? `${t('settingsSyncLast')}: ${formatPolishDateTime(state.settings.lastSyncedAt)}`
              : t('settingsSyncNever')}
          </Text>
          <PrimaryButton
            title={t('settingsSyncRun')}
            onPress={handleFakeSync}
            loading={isSyncing}
            disabled={!state.settings.syncEnabled}
            style={{ marginTop: 16 }}
          />
        </SurfaceCard>

        <SurfaceCard>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{t('settingsBackup')}</Text>
          <Text style={[styles.helper, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('settingsBackupHint')}</Text>
          <View style={styles.buttonRow}>
            <PrimaryButton
              title={t('settingsExportJson')}
              variant="secondary"
              onPress={handleExport}
              loading={isExporting}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              title={t('settingsImportJson')}
              variant="ghost"
              onPress={handleImport}
              loading={isImporting}
              style={{ flex: 1 }}
            />
          </View>
        </SurfaceCard>

        <SurfaceCard>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{t('settingsModeTitle')}</Text>
          <Text style={[styles.helper, { color: colors.mutedText, fontSize: scaleFont(14) }]}>
            {t('settingsCurrentMode')}: {state.activeMode === 'demo' ? t('settingsDemoMode') : t('settingsPrivateMode')}
          </Text>
          <View style={styles.buttonRow}>
            <PrimaryButton
              title={state.activeMode === 'demo' ? t('settingsSwitchToPrivate') : t('settingsSwitchToDemo')}
              variant="secondary"
              onPress={() => setActiveMode(state.activeMode === 'demo' ? 'personal' : 'demo')}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              title={state.activeMode === 'demo' ? t('settingsResetDemo') : t('settingsClearPrivate')}
              variant="ghost"
              onPress={state.activeMode === 'demo' ? resetDemoMode : resetPersonalMode}
              style={{ flex: 1 }}
            />
          </View>
        </SurfaceCard>

        <SurfaceCard>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{t('settingsCategories')}</Text>
          <Text style={[styles.helper, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('settingsCategoryHint')}</Text>

          <View style={{ marginTop: 16, gap: 14 }}>
            <AppTextInput
              label={t('settingsNewCategory')}
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder={t('settingsNewCategoryPlaceholder')}
            />
            <PrimaryButton title={t('settingsAddCategory')} onPress={handleAddCategory} disabled={!categoryName.trim()} />
          </View>

          <View style={styles.categoryWrap}>
            {activeData.categories.map((category) => {
              const selected = selectedCategory?.name === category.name;
              const textColor = getReadableTextColor(category.color);
              return (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  onPress={() => setSelectedCategoryName(category.name)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: category.color,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <View style={styles.categoryLabelRow}>
                    {selected ? <Ionicons name="checkmark-circle" size={16} color={textColor} /> : null}
                    <Text style={[styles.categoryText, { color: textColor, fontSize: scaleFont(14) }]}>{category.name}</Text>
                  </View>
                  {!category.builtIn ? (
                    <Pressable
                      hitSlop={8}
                      accessibilityRole="button"
                      onPress={() =>
                        Alert.alert(
                          t('settingsCategoryDeleteTitle'),
                          t('settingsCategoryDeleteBody', { name: category.name }),
                          [
                            { text: t('commonCancel'), style: 'cancel' },
                            {
                              text: t('commonDelete'),
                              style: 'destructive',
                              onPress: () => deleteCategory(category.name),
                            },
                          ],
                        )
                      }
                    >
                      <Ionicons name="close" size={16} color={textColor} />
                    </Pressable>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {selectedCategory ? (
            <View style={styles.colorEditor}>
              <Text style={[styles.label, { color: colors.text, fontSize: scaleFont(14) }]}>
                {t('settingsCategoryColor')}: {selectedCategory.name}
              </Text>
              <View style={styles.paletteWrap}>
                {categoryPalette.map((color) => {
                  const active = selectedCategory.color === color;
                  const textColor = getReadableTextColor(color);
                  return (
                    <Pressable
                      key={color}
                      accessibilityRole="button"
                      onPress={() => updateCategoryColor(selectedCategory.name, color)}
                      style={[
                        styles.paletteSwatch,
                        { backgroundColor: color, borderColor: active ? colors.primary : colors.border },
                      ]}
                    >
                      {active ? <Ionicons name="checkmark" size={18} color={textColor} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </SurfaceCard>

        <SurfaceCard>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(22) }]}>{t('settingsAccount')}</Text>
          <Text style={[styles.helper, { color: colors.mutedText, fontSize: scaleFont(14) }]}>{t('settingsAccountHint')}</Text>
          <PrimaryButton title={t('settingsLogout')} variant="danger" onPress={logout} style={{ marginTop: 16 }} />
        </SurfaceCard>
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
  sectionTitle: {
    fontWeight: '700',
  },
  helper: {
    marginTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  plannerRangeWrap: {
    gap: 18,
    marginTop: 16,
  },
  hourChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  hourChip: {
    minWidth: 76,
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  selectChip: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionColumn: {
    gap: 10,
    marginTop: 16,
  },
  optionRow: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warningBox: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  warningBoxText: {
    flex: 1,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  switchRow: {
    marginTop: 16,
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
  label: {
    fontWeight: '600',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  categoryChip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
  },
  categoryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryText: {
    fontWeight: '700',
  },
  colorEditor: {
    marginTop: 18,
    gap: 12,
  },
  paletteWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paletteSwatch: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
