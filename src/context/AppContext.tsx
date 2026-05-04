import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createDefaultCategories, createDemoModeData, createEmptyModeData, createInitialRootState } from '../data/demoData';
import {
  configureNotificationChannelAsync,
  getNotificationPermissionStateAsync,
  NotificationPermissionState,
  requestNotificationPermissionAsync,
  syncScheduledNotificationsAsync,
} from '../services/notifications';
import { loadAppState, saveAppState } from '../storage/appStorage';
import {
  AppMode,
  ModeData,
  NoteDraft,
  PomodoroSession,
  QuickAssign,
  QuickTaskInput,
  ReminderType,
  RootState,
  SubtaskItem,
  Task,
  TaskDraft,
  TaskStatus,
  ToastState,
  ToastTone,
  UserSettings,
} from '../types';
import { addHoursToTime, hasTimeOverlap, quickAssignToDate, todayDateString } from '../utils/date';

interface AppContextValue {
  isReady: boolean;
  state: RootState;
  activeData: ModeData;
  toast: ToastState | null;
  notificationPermission: NotificationPermissionState;
  showToast: (message: string, tone?: ToastTone) => void;
  clearToast: () => void;
  requestNotificationPermissions: () => Promise<NotificationPermissionState>;
  login: (mode: AppMode) => void;
  logout: () => void;
  setActiveMode: (mode: AppMode) => void;
  updateSettings: (draft: Partial<UserSettings>) => void;
  setSyncEnabled: (enabled: boolean) => void;
  runFakeSync: () => Promise<void>;
  replaceStateFromImport: (input: unknown) => boolean;
  addCategory: (name: string) => void;
  deleteCategory: (categoryName: string) => void;
  updateCategoryColor: (categoryName: string, color: string) => void;
  resetDemoMode: () => void;
  resetPersonalMode: () => void;
  addQuickTask: (input: QuickTaskInput) => void;
  updateTask: (taskId: string, draft: TaskDraft) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskStatus: (taskId: string) => void;
  quickMoveTask: (taskId: string, action: QuickAssign | 'postpone') => void;
  assignTaskToSlot: (taskId: string, date: string, startTime: string, durationHours: number) => boolean;
  clearTaskSchedule: (taskId: string) => void;
  removeTimeBlock: (timeBlockId: string) => void;
  addNote: (draft: NoteDraft) => string | null;
  updateNote: (noteId: string, draft: NoteDraft) => void;
  deleteNote: (noteId: string) => void;
  setReminderEnabled: (type: ReminderType, enabled: boolean) => void;
  cycleReminderInterval: (type: ReminderType) => void;
  addWaterIntake: () => void;
  addMovementBreak: () => void;
  startPausePomodoro: () => void;
  resetPomodoro: () => void;
  switchPomodoroMode: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeRefined(task: Pick<Task, 'category' | 'priority' | 'dueDate' | 'plannedHours' | 'notes'>) {
  return Boolean(task.category || task.priority || task.dueDate || task.plannedHours || task.notes?.trim());
}

function normalizeSubtasks(input: unknown): SubtaskItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter(
      (item): item is SubtaskItem =>
        Boolean(
          item &&
            typeof item === 'object' &&
            'id' in item &&
            typeof item.id === 'string' &&
            'title' in item &&
            typeof item.title === 'string',
        ),
    )
    .map((item) => ({
      id: item.id,
      title: item.title,
      completed: Boolean(item.completed),
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    }));
}

function normalizeTask(task: Task): Task {
  return {
    ...task,
    subtasks: normalizeSubtasks(task.subtasks),
  };
}

function ensureModeShape(base: ModeData, current?: Partial<ModeData>): ModeData {
  return {
    ...base,
    ...current,
    tasks: Array.isArray(current?.tasks) ? current.tasks.map(normalizeTask) : base.tasks.map(normalizeTask),
    notes: Array.isArray(current?.notes) ? current.notes : base.notes,
    timeBlocks: Array.isArray(current?.timeBlocks) ? current.timeBlocks : base.timeBlocks,
    categories:
      Array.isArray(current?.categories) && current.categories.length ? current.categories : base.categories,
    reminders: Array.isArray(current?.reminders) ? current.reminders : base.reminders,
    pomodoro: {
      ...base.pomodoro,
      ...current?.pomodoro,
    },
    stats: {
      ...base.stats,
      ...current?.stats,
      pomodoroSessions: Array.isArray(current?.stats?.pomodoroSessions)
        ? current.stats.pomodoroSessions
        : base.stats.pomodoroSessions,
    },
  };
}

function ensureStateShape(state: RootState): RootState {
  const fallback = createInitialRootState();

  return {
    ...fallback,
    ...state,
    isLoggedIn: Boolean(state?.isLoggedIn),
    activeMode: state?.activeMode === 'personal' ? 'personal' : 'demo',
    settings: {
      displayName: state?.settings?.displayName ?? fallback.settings.displayName,
      theme: state?.settings?.theme === 'dark' ? 'dark' : 'light',
      language: state?.settings?.language === 'en' ? 'en' : state?.settings?.language === 'uk' ? 'uk' : 'pl',
      fontSize:
        state?.settings?.fontSize === 'small'
          ? 'small'
          : state?.settings?.fontSize === 'large'
            ? 'large'
            : 'medium',
      syncEnabled: Boolean(state?.settings?.syncEnabled),
      lastSyncedAt: state?.settings?.lastSyncedAt,
    },
    datasets: {
      demo: ensureModeShape(createDemoModeData(), state?.datasets?.demo),
      personal: ensureModeShape(createEmptyModeData(), state?.datasets?.personal),
    },
  };
}

function syncTaskSchedule(current: ModeData, updatedTask: Task): ModeData {
  const cleanedBlocks = current.timeBlocks.filter((block) => block.taskId !== updatedTask.id);

  if (!updatedTask.dueDate || !updatedTask.scheduledStartTime || !updatedTask.plannedHours) {
    return {
      ...current,
      timeBlocks: cleanedBlocks,
    };
  }

  return {
    ...current,
    timeBlocks: [
      ...cleanedBlocks,
      {
        id: makeId('block'),
        taskId: updatedTask.id,
        date: updatedTask.dueDate,
        startTime: updatedTask.scheduledStartTime,
        endTime: addHoursToTime(updatedTask.scheduledStartTime, updatedTask.plannedHours),
      },
    ],
  };
}

export function AppProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<RootState>(createInitialRootState);
  const [isReady, setIsReady] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionState>('undetermined');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearToast() {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }

  function showToast(message: string, tone: ToastTone = 'info') {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({
      id: makeId('toast'),
      message,
      tone,
    });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2600);
  }

  useEffect(() => () => clearToast(), []);

  useEffect(() => {
    configureNotificationChannelAsync().catch(() => undefined);
    getNotificationPermissionStateAsync()
      .then(setNotificationPermission)
      .catch(() => setNotificationPermission('undetermined'));
  }, []);

  useEffect(() => {
    loadAppState()
      .then((saved) => {
        if (saved) {
          setState(ensureStateShape(saved));
        }
      })
      .finally(() => setIsReady(true));
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    saveAppState(state).catch(() => undefined);
  }, [state, isReady]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const interval = setInterval(() => {
      setState((prev) => {
        const dataset = prev.datasets[prev.activeMode];
        const pomodoro = dataset.pomodoro;
        if (!pomodoro.isRunning) {
          return prev;
        }

        if (pomodoro.remainingSeconds > 1) {
          return {
            ...prev,
            datasets: {
              ...prev.datasets,
              [prev.activeMode]: {
                ...dataset,
                pomodoro: {
                  ...pomodoro,
                  remainingSeconds: pomodoro.remainingSeconds - 1,
                },
              },
            },
          };
        }

        const completedFocus = pomodoro.mode === 'focus';
        const nextMode = completedFocus ? 'break' : 'focus';
        const nextDuration = completedFocus ? pomodoro.breakDurationSeconds : pomodoro.focusDurationSeconds;
        const session: PomodoroSession | null = completedFocus
          ? {
              id: makeId('pomodoro'),
              completedAt: new Date().toISOString(),
              durationSeconds: pomodoro.focusDurationSeconds,
            }
          : null;

        return {
          ...prev,
          datasets: {
            ...prev.datasets,
            [prev.activeMode]: {
              ...dataset,
              pomodoro: {
                ...pomodoro,
                mode: nextMode,
                remainingSeconds: nextDuration,
                isRunning: false,
                lastStartedAt: undefined,
              },
              stats: {
                ...dataset.stats,
                pomodoroSessions: session
                  ? [session, ...dataset.stats.pomodoroSessions]
                  : dataset.stats.pomodoroSessions,
              },
            },
          },
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isReady]);

  const activeData = state.datasets[state.activeMode];
  const notificationSyncKey = JSON.stringify({
    mode: state.activeMode,
    tasks: activeData.tasks.map((task) => ({
      id: task.id,
      status: task.status,
      dueDate: task.dueDate,
      scheduledStartTime: task.scheduledStartTime,
      title: task.title,
    })),
    notes: activeData.notes.map((note) => ({
      id: note.id,
      section: note.section,
      title: note.title,
      reminderDate: note.reminderDate,
      reminderEnabled: note.reminderEnabled,
      personName: note.personName,
    })),
    reminders: activeData.reminders.map((reminder) => ({
      id: reminder.id,
      type: reminder.type,
      enabled: reminder.enabled,
      interval: reminder.interval,
    })),
  });

  useEffect(() => {
    if (!isReady || notificationPermission !== 'granted') {
      return;
    }

    syncScheduledNotificationsAsync(state).catch(() => undefined);
  }, [isReady, notificationPermission, notificationSyncKey]);

  function updateActiveDataset(updater: (current: ModeData) => ModeData) {
    setState((prev) => ({
      ...prev,
      datasets: {
        ...prev.datasets,
        [prev.activeMode]: updater(prev.datasets[prev.activeMode]),
      },
    }));
  }

  const value = useMemo<AppContextValue>(
    () => ({
      isReady,
      state,
      activeData,
      toast,
      notificationPermission,
      showToast,
      clearToast,
      requestNotificationPermissions: async () => {
        const nextState = await requestNotificationPermissionAsync();
        setNotificationPermission(nextState);

        if (nextState === 'granted') {
          await syncScheduledNotificationsAsync(state).catch(() => undefined);
          showToast('Włączono lokalne powiadomienia.', 'success');
        } else if (nextState === 'denied') {
          showToast('Powiadomienia są zablokowane na urządzeniu.', 'warning');
        }

        return nextState;
      },
      login: (mode) => {
        setState((prev) => ({
          ...prev,
          isLoggedIn: true,
          activeMode: mode,
        }));
        showToast(mode === 'demo' ? 'Uruchomiono tryb demo.' : 'Uruchomiono tryb prywatny.', 'success');
      },
      logout: () => {
        setState((prev) => ({
          ...prev,
          isLoggedIn: false,
        }));
        showToast('Wylogowano z aplikacji.', 'info');
      },
      setActiveMode: (mode) => {
        setState((prev) => ({
          ...prev,
          activeMode: mode,
        }));
        showToast(mode === 'demo' ? 'Przełączono na dane demo.' : 'Przełączono na dane prywatne.', 'success');
      },
      updateSettings: (draft) => {
        setState((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            ...draft,
          },
        }));
      },
      setSyncEnabled: (enabled) => {
        setState((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            syncEnabled: enabled,
          },
        }));
        showToast(
          enabled ? 'Włączono demonstracyjną synchronizację.' : 'Wyłączono demonstracyjną synchronizację.',
          'success',
        );
      },
      runFakeSync: async () => {
        await wait(900);
        setState((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            lastSyncedAt: new Date().toISOString(),
          },
        }));
        showToast('Dane zsynchronizowano w trybie demonstracyjnym.', 'success');
      },
      replaceStateFromImport: (input) => {
        try {
          if (!input || typeof input !== 'object' || !('datasets' in input) || !('settings' in input)) {
            showToast('Plik nie wygląda jak kopia TaskFlow.', 'warning');
            return false;
          }

          const nextState = ensureStateShape(input as RootState);
          setState({
            ...nextState,
            isLoggedIn: true,
          });
          showToast('Dane zostały zaimportowane.', 'success');
          return true;
        } catch {
          showToast('Nie udało się zaimportować danych.', 'warning');
          return false;
        }
      },
      addCategory: (name) => {
        const trimmed = name.trim();
        if (!trimmed) {
          return;
        }

        updateActiveDataset((current) => {
          if (current.categories.some((category) => category.name.toLowerCase() === trimmed.toLowerCase())) {
            showToast('Taka kategoria już istnieje.', 'warning');
            return current;
          }

          const palette = ['#E8EDFF', '#FFEAD9', '#EAF8EE', '#FFE7EC', '#FFF4CC', '#EEE8FF'];
          showToast(`Dodano kategorię "${trimmed}".`, 'success');
          return {
            ...current,
            categories: [
              ...current.categories,
              {
                id: makeId('category'),
                name: trimmed,
                color: palette[current.categories.length % palette.length],
              },
            ],
          };
        });
      },
      deleteCategory: (categoryName) => {
        updateActiveDataset((current) => ({
          ...current,
          categories: current.categories.filter((category) => !(category.name === categoryName && !category.builtIn)),
          tasks: current.tasks.map((task) =>
            task.category === categoryName
              ? {
                  ...task,
                  category: undefined,
                  isRefined: computeRefined({
                    category: undefined,
                    priority: task.priority,
                    dueDate: task.dueDate,
                    plannedHours: task.plannedHours,
                    notes: task.notes,
                  }),
                }
              : task,
          ),
        }));
        showToast(`Usunięto kategorię "${categoryName}".`, 'success');
      },
      updateCategoryColor: (categoryName, color) => {
        updateActiveDataset((current) => ({
          ...current,
          categories: current.categories.map((category) =>
            category.name === categoryName
              ? {
                  ...category,
                  color,
                }
              : category,
          ),
        }));
        showToast(`Zmieniono kolor kategorii "${categoryName}".`, 'success');
      },
      resetDemoMode: () => {
        setState((prev) => ({
          ...prev,
          datasets: {
            ...prev.datasets,
            demo: createDemoModeData(),
          },
        }));
        showToast('Zresetowano dane demo.', 'success');
      },
      resetPersonalMode: () => {
        setState((prev) => ({
          ...prev,
          datasets: {
            ...prev.datasets,
            personal: createEmptyModeData(),
          },
        }));
        showToast('Wyczyszczono dane prywatne.', 'success');
      },
      addQuickTask: ({ title, quickAssign }) => {
        if (!title.trim()) {
          return;
        }

        const now = new Date().toISOString();
        const normalizedQuickAssign = quickAssign ?? 'today';
        const task: Task = {
          id: makeId('task'),
          title: title.trim(),
          status: 'active',
          isRefined: false,
          quickAssign: normalizedQuickAssign,
          dueDate: quickAssignToDate(normalizedQuickAssign),
          subtasks: [],
          createdAt: now,
          updatedAt: now,
        };

        updateActiveDataset((current) => ({
          ...current,
          tasks: [task, ...current.tasks],
        }));
        showToast('Dodano nowe zadanie.', 'success');
      },
      updateTask: (taskId, draft) => {
        updateActiveDataset((current) => {
          let updatedTask: Task | null = null;
          const nextTasks = current.tasks.map((task) => {
            if (task.id !== taskId) {
              return task;
            }

            const nextStatus = draft.status ?? task.status;
            updatedTask = {
              ...task,
              ...draft,
              subtasks: draft.subtasks ?? task.subtasks ?? [],
              status: nextStatus,
              isRefined: computeRefined({
                category: draft.category ?? task.category,
                priority: draft.priority ?? task.priority,
                dueDate: draft.dueDate ?? task.dueDate,
                plannedHours: draft.plannedHours ?? task.plannedHours,
                notes: draft.notes ?? task.notes,
              }),
              updatedAt: new Date().toISOString(),
              completedAt:
                nextStatus === 'completed'
                  ? task.completedAt ?? new Date().toISOString()
                  : nextStatus === 'active' || nextStatus === 'postponed'
                    ? undefined
                    : task.completedAt,
            };
            return updatedTask;
          });

          if (!updatedTask) {
            return current;
          }

          return syncTaskSchedule(
            {
              ...current,
              tasks: nextTasks,
            },
            updatedTask,
          );
        });
        showToast('Zapisano zmiany zadania.', 'success');
      },
      deleteTask: (taskId) => {
        updateActiveDataset((current) => ({
          ...current,
          tasks: current.tasks.filter((task) => task.id !== taskId),
          timeBlocks: current.timeBlocks.filter((block) => block.taskId !== taskId),
        }));
        showToast('Usunięto zadanie.', 'success');
      },
      toggleTaskStatus: (taskId) => {
        const target = activeData.tasks.find((task) => task.id === taskId);
        updateActiveDataset((current) => ({
          ...current,
          tasks: current.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: task.status === 'completed' ? 'active' : 'completed',
                  completedAt: task.status === 'completed' ? undefined : new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : task,
          ),
        }));
        showToast(
          target?.status === 'completed' ? 'Przywrócono zadanie do aktywnych.' : 'Zadanie oznaczono jako wykonane.',
          'success',
        );
      },
      quickMoveTask: (taskId, action) => {
        updateActiveDataset((current) => {
          const nextTasks = current.tasks.map((task) => {
            if (task.id !== taskId) {
              return task;
            }

            if (action === 'postpone') {
              return {
                ...task,
                status: 'postponed' as TaskStatus,
                quickAssign: 'later' as QuickAssign,
                dueDate: undefined,
                scheduledStartTime: undefined,
                updatedAt: new Date().toISOString(),
              };
            }

            return {
              ...task,
              status: 'active' as TaskStatus,
              quickAssign: action,
              dueDate: quickAssignToDate(action),
              scheduledStartTime: undefined,
              updatedAt: new Date().toISOString(),
            };
          });

          return {
            ...current,
            tasks: nextTasks,
            timeBlocks: current.timeBlocks.filter((block) => block.taskId !== taskId),
          };
        });
        showToast('Przeniesiono zadanie.', 'success');
      },
      assignTaskToSlot: (taskId, date, startTime, durationHours) => {
        const endTime = addHoursToTime(startTime, durationHours);
        const hasConflict = activeData.timeBlocks.some(
          (block) =>
            block.taskId !== taskId &&
            block.date === date &&
            hasTimeOverlap(startTime, endTime, block.startTime, block.endTime),
        );

        if (hasConflict) {
          showToast('Ten przedział czasu nachodzi na inne zadanie.', 'warning');
          return false;
        }

        updateActiveDataset((current) => {
          const nextTasks = current.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  dueDate: date,
                  quickAssign: undefined,
                  scheduledStartTime: startTime,
                  plannedHours: durationHours,
                  updatedAt: new Date().toISOString(),
                }
              : task,
          );

          return {
            ...current,
            tasks: nextTasks,
            timeBlocks: [
              ...current.timeBlocks.filter((block) => block.taskId !== taskId),
              {
                id: makeId('block'),
                taskId,
                date,
                startTime,
                endTime,
              },
            ],
          };
        });
        showToast('Dodano zadanie do planera.', 'success');
        return true;
      },
      clearTaskSchedule: (taskId) => {
        updateActiveDataset((current) => ({
          ...current,
          tasks: current.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  scheduledStartTime: undefined,
                  updatedAt: new Date().toISOString(),
                }
              : task,
          ),
          timeBlocks: current.timeBlocks.filter((block) => block.taskId !== taskId),
        }));
        showToast('Usunięto zadanie z planera.', 'success');
      },
      removeTimeBlock: (timeBlockId) => {
        updateActiveDataset((current) => {
          const removed = current.timeBlocks.find((block) => block.id === timeBlockId);
          return {
            ...current,
            tasks: removed
              ? current.tasks.map((task) =>
                  task.id === removed.taskId
                    ? { ...task, scheduledStartTime: undefined, updatedAt: new Date().toISOString() }
                    : task,
                )
              : current.tasks,
            timeBlocks: current.timeBlocks.filter((block) => block.id !== timeBlockId),
          };
        });
        showToast('Usunięto blok z planera.', 'success');
      },
      addNote: (draft) => {
        if (!draft.title.trim()) {
          showToast('Podaj tytuł notatki.', 'warning');
          return null;
        }

        const noteId = makeId('note');
        const now = new Date().toISOString();
        updateActiveDataset((current) => ({
          ...current,
          notes: [
            {
              id: noteId,
              title: draft.title.trim(),
              content: draft.content,
              section: draft.section,
              personName: draft.personName?.trim() || undefined,
              reminderDate: draft.reminderDate,
              reminderEnabled: draft.reminderEnabled,
              createdAt: now,
              updatedAt: now,
            },
            ...current.notes,
          ],
        }));
        showToast('Dodano notatkę.', 'success');
        return noteId;
      },
      updateNote: (noteId, draft) => {
        updateActiveDataset((current) => ({
          ...current,
          notes: current.notes.map((note) =>
            note.id === noteId
              ? {
                  ...note,
                  title: draft.title.trim(),
                  content: draft.content,
                  section: draft.section,
                  personName: draft.personName?.trim() || undefined,
                  reminderDate: draft.reminderDate,
                  reminderEnabled: draft.reminderEnabled,
                  updatedAt: new Date().toISOString(),
                }
              : note,
          ),
        }));
        showToast('Zapisano notatkę.', 'success');
      },
      deleteNote: (noteId) => {
        updateActiveDataset((current) => ({
          ...current,
          notes: current.notes.filter((note) => note.id !== noteId),
        }));
        showToast('Usunięto notatkę.', 'success');
      },
      setReminderEnabled: (type, enabled) => {
        updateActiveDataset((current) => ({
          ...current,
          reminders: current.reminders.map((reminder) =>
            reminder.type === type ? { ...reminder, enabled } : reminder,
          ),
        }));
        showToast(enabled ? 'Włączono przypomnienie.' : 'Wyłączono przypomnienie.', 'success');
      },
      cycleReminderInterval: (type) => {
        const options = [30, 60, 90, 120];
        updateActiveDataset((current) => ({
          ...current,
          reminders: current.reminders.map((reminder) => {
            if (reminder.type !== type) {
              return reminder;
            }
            const index = options.indexOf(reminder.interval);
            return { ...reminder, interval: options[(index + 1) % options.length] };
          }),
        }));
        showToast('Zmieniono interwał przypomnienia.', 'success');
      },
      addWaterIntake: () => {
        updateActiveDataset((current) => ({
          ...current,
          stats: {
            ...current.stats,
            waterIntake: current.stats.waterIntake + 1,
          },
        }));
        showToast('Dodano szklankę wody.', 'success');
      },
      addMovementBreak: () => {
        updateActiveDataset((current) => ({
          ...current,
          stats: {
            ...current.stats,
            movementBreaks: current.stats.movementBreaks + 1,
          },
        }));
        showToast('Dodano przerwę ruchową.', 'success');
      },
      startPausePomodoro: () => {
        updateActiveDataset((current) => ({
          ...current,
          pomodoro: {
            ...current.pomodoro,
            isRunning: !current.pomodoro.isRunning,
            lastStartedAt: !current.pomodoro.isRunning ? new Date().toISOString() : undefined,
          },
        }));
        showToast(activeData.pomodoro.isRunning ? 'Pomodoro wstrzymane.' : 'Pomodoro uruchomione.', 'success');
      },
      resetPomodoro: () => {
        updateActiveDataset((current) => ({
          ...current,
          pomodoro: {
            ...current.pomodoro,
            isRunning: false,
            remainingSeconds:
              current.pomodoro.mode === 'focus'
                ? current.pomodoro.focusDurationSeconds
                : current.pomodoro.breakDurationSeconds,
            lastStartedAt: undefined,
          },
        }));
        showToast('Zresetowano timer Pomodoro.', 'success');
      },
      switchPomodoroMode: () => {
        updateActiveDataset((current) => {
          const nextMode = current.pomodoro.mode === 'focus' ? 'break' : 'focus';
          return {
            ...current,
            pomodoro: {
              ...current.pomodoro,
              mode: nextMode,
              isRunning: false,
              remainingSeconds:
                nextMode === 'focus'
                  ? current.pomodoro.focusDurationSeconds
                  : current.pomodoro.breakDurationSeconds,
              lastStartedAt: undefined,
            },
          };
        });
        showToast('Zmieniono tryb Pomodoro.', 'success');
      },
    }),
    [activeData, isReady, notificationPermission, state, toast],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return context;
}

export function useTodayTasks() {
  const { activeData } = useApp();
  const today = todayDateString();
  return activeData.tasks.filter((task) => task.status !== 'completed' && (task.dueDate ?? today) === today);
}
