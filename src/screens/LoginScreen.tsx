import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTextInput } from '../components/AppTextInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { AppMode } from '../types';
import { radius, spacing, useThemeColors } from '../theme';

export function LoginScreen() {
  const { login } = useApp();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { scaleFont, t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AppMode>('demo');
  const [error, setError] = useState('');

  function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError(t('loginError'));
      return;
    }
    setError('');
    login(mode);
  }

  function handleDemo() {
    setError('');
    login('demo');
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 8) + spacing.md,
            paddingBottom: Math.max(insets.bottom, 12) + spacing.lg,
          },
        ]}
      >
        <View style={styles.hero}>
          <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark-circle-outline" size={44} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(34) }]}>{t('appName')}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText, fontSize: scaleFont(16) }]}>
            {t('loginTagline')}
          </Text>
        </View>

        <View style={[styles.modeSwitcher, { backgroundColor: colors.primarySoft }]}>
          {(['demo', 'personal'] as AppMode[]).map((option) => {
            const active = mode === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => setMode(option)}
                style={[
                  styles.modePill,
                  active ? [styles.modePillActive, { backgroundColor: colors.surface }] : null,
                ]}
              >
                <Text
                  style={[
                    styles.modeText,
                    { color: colors.mutedText, fontSize: scaleFont(14) },
                    active ? [styles.modeTextActive, { color: colors.primary }] : null,
                  ]}
                >
                  {option === 'demo' ? t('loginDemoMode') : t('loginPrivateMode')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.form}>
          <AppTextInput
            label={t('loginEmail')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder={t('loginEmailPlaceholder')}
          />
          <AppTextInput
            label={t('loginPassword')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder={t('loginPasswordPlaceholder')}
          />

          {error ? <Text style={[styles.error, { color: colors.dangerText, fontSize: scaleFont(13) }]}>{error}</Text> : null}

          <PrimaryButton title={t('loginSubmit')} onPress={handleLogin} />

          <Pressable style={styles.linkWrap} accessibilityRole="button">
            <Text style={[styles.link, { color: colors.primary, fontSize: scaleFont(14) }]}>{t('loginForgotPassword')}</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <PrimaryButton title={t('loginDemoEnter')} variant="secondary" onPress={handleDemo} />
          <Text style={[styles.footerText, { color: colors.mutedText, fontSize: scaleFont(14) }]}>
            {t('loginRegisterPrompt')}{' '}
            <Text style={[styles.footerLink, { color: colors.primary }]}>{t('loginRegisterAction')}</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  logoBox: {
    width: 92,
    height: 92,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
  },
  subtitle: {
    textAlign: 'center',
  },
  modeSwitcher: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    padding: 4,
    marginTop: 28,
  },
  modePill: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modePillActive: {},
  modeText: {
    fontWeight: '600',
  },
  modeTextActive: {},
  form: {
    gap: 16,
    marginTop: 28,
  },
  error: {
    marginTop: -6,
  },
  linkWrap: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    fontWeight: '600',
  },
  footer: {
    gap: 16,
  },
  footerText: {
    textAlign: 'center',
  },
  footerLink: {
    fontWeight: '700',
  },
});
