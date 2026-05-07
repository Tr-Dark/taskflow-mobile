import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTextInput } from '../components/AppTextInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { RootStackParamList } from '../navigation/AppNavigator';
import { radius, spacing, useThemeColors } from '../theme';
import { QuickAssign } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'QuickAdd'>;

export function QuickAddScreen({ navigation }: Props) {
  const { addQuickTask } = useApp();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { scaleFont, t } = useI18n();
  const [title, setTitle] = useState('');
  const [quickAssign, setQuickAssign] = useState<QuickAssign>('today');

  const options: { value: QuickAssign; label: string }[] = [
    { value: 'today', label: t('optionToday') },
    { value: 'tomorrow', label: t('optionTomorrow') },
    { value: 'later', label: t('optionLater') },
  ];

  function handleSubmit() {
    if (!title.trim()) {
      return;
    }
    addQuickTask({ title, quickAssign });
    navigation.goBack();
  }

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <KeyboardAvoidingView
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, spacing.xl),
          },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            style={[styles.iconButton, { backgroundColor: colors.surfaceMuted }]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel={t('commonClose')}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: scaleFont(20) }]}>
            {t('quickAddTitle')}
          </Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="flash-outline" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text, fontSize: scaleFont(28) }]}>
            {t('quickAddHeading')}
          </Text>
          <Text style={[styles.heroText, { color: colors.mutedText, fontSize: scaleFont(15) }]}>
            {t('quickAddHint')}
          </Text>
        </View>

        <View style={styles.form}>
          <AppTextInput
            label={t('quickAddWhat')}
            value={title}
            onChangeText={setTitle}
            placeholder="Na przykład: Kupić mleko"
            autoFocus
          />

          <View style={{ gap: 12 }}>
            <Text style={[styles.label, { color: colors.text, fontSize: scaleFont(14) }]}>
              {t('quickAddWhen')}
            </Text>
            <View style={styles.optionRow}>
              {options.map((option) => {
                const active = quickAssign === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    onPress={() => setQuickAssign(option.value)}
                    style={[
                      styles.option,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                      active
                        ? [styles.optionActive, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: colors.mutedText, fontSize: scaleFont(14) },
                        active ? [styles.optionTextActive, { color: colors.primary }] : null,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <PrimaryButton title={t('quickAddSubmit')} onPress={handleSubmit} disabled={!title.trim()} />
          <Text style={[styles.helper, { color: colors.mutedText, fontSize: scaleFont(13) }]}>
            {t('quickAddLaterHint')}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '700',
  },
  spacer: {
    width: 40,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
    marginTop: 38,
    marginBottom: 32,
  },
  heroIcon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontWeight: '800',
  },
  heroText: {
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  form: {
    gap: 22,
  },
  label: {
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {},
  optionText: {
    fontWeight: '600',
  },
  optionTextActive: {},
  helper: {
    textAlign: 'center',
  },
});
