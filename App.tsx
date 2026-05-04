import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
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
      <AppNavigator />
      <ToastHost />
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
