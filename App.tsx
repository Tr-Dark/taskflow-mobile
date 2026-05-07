import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastHost } from './src/components/ToastHost';
import { AppProvider, useApp } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { setupNotificationsInRuntimeAsync } from './src/services/notifications';
import { palettes } from './src/theme';

function Root() {
  const { isReady, state } = useApp();
  useEffect(() => {
    setupNotificationsInRuntimeAsync().catch(() => undefined);
  }, []);
  if (!isReady) {
    return null;
  }

  const currentColors = palettes[state.settings.theme];
  const isWeb = Platform.OS === 'web';
  const navigationTheme = {
    ...DefaultTheme,
    dark: state.settings.theme === 'dark',
    colors: {
      ...DefaultTheme.colors,
      background: currentColors.background,
      card: currentColors.surface,
      text: currentColors.text,
      border: currentColors.border,
      primary: currentColors.primary,
      notification: currentColors.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={state.settings.theme === 'dark' ? 'light' : 'dark'} />
      <View
        style={[
          styles.viewport,
          isWeb
            ? {
                backgroundColor: state.settings.theme === 'dark' ? '#0B0C13' : '#EEF1F8',
              }
            : null,
        ]}
      >
        <View
          style={[
            styles.appShell,
            isWeb
              ? {
                  backgroundColor: currentColors.background,
                  borderColor: currentColors.border,
                  shadowColor: currentColors.cardShadow,
                }
              : styles.appShellMobile,
          ]}
        >
          <AppNavigator />
          <ToastHost />
        </View>
      </View>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <Root />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appShell: {
    flex: 1,
    width: '100%',
    maxWidth: 460,
    maxHeight: '100%',
    overflow: 'hidden',
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderRadius: Platform.OS === 'web' ? 28 : 0,
    shadowOpacity: Platform.OS === 'web' ? 0.16 : 0,
    shadowRadius: Platform.OS === 'web' ? 24 : 0,
    shadowOffset: Platform.OS === 'web' ? { width: 0, height: 16 } : { width: 0, height: 0 },
    elevation: Platform.OS === 'web' ? 0 : 0,
  },
  appShellMobile: {
    maxWidth: '100%',
    borderRadius: 0,
    borderWidth: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
});
