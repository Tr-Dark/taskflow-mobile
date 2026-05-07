import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { useThemeColors } from '../theme';
import { ExtrasScreen } from '../screens/ExtrasScreen';
import { FaqScreen } from '../screens/FaqScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { NoteEditorScreen } from '../screens/NoteEditorScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { PlannerScreen } from '../screens/PlannerScreen';
import { QueueScreen } from '../screens/QueueScreen';
import { QuickAddScreen } from '../screens/QuickAddScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TaskDetailsScreen } from '../screens/TaskDetailsScreen';
import { TodayScreen } from '../screens/TodayScreen';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  QuickAdd: undefined;
  TaskDetails: { taskId: string };
  NoteEditor: { noteId?: string } | undefined;
  History: undefined;
  Settings: undefined;
  Faq: undefined;
};

export type MainTabParamList = {
  Today: undefined;
  Queue: undefined;
  Planner: undefined;
  Notes: undefined;
  Extras: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          height: 68 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'Today'
              ? 'home-outline'
              : route.name === 'Queue'
                ? 'list-outline'
                : route.name === 'Planner'
                  ? 'calendar-outline'
                  : route.name === 'Notes'
                    ? 'document-text-outline'
                    : 'sparkles-outline';
          return <Ionicons name={iconName} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} options={{ title: t('todayTitle') }} />
      <Tab.Screen name="Queue" component={QueueScreen} options={{ title: t('queueTitle') }} />
      <Tab.Screen name="Planner" component={PlannerScreen} options={{ title: t('plannerTitle') }} />
      <Tab.Screen name="Notes" component={NotesScreen} options={{ title: t('notesTitle') }} />
      <Tab.Screen name="Extras" component={ExtrasScreen} options={{ title: t('extrasTitle') }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { state } = useApp();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {state.isLoggedIn ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="QuickAdd"
            component={QuickAddScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} />
          <Stack.Screen name="NoteEditor" component={NoteEditorScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Faq" component={FaqScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
