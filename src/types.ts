export type AppMode = 'demo' | 'personal';

export type TaskStatus = 'active' | 'completed' | 'postponed';

export type TaskPriority = 'low' | 'medium' | 'high';

export type QuickAssign = 'today' | 'tomorrow' | 'later';

export type ReminderType = 'water' | 'movement' | 'break';

export type ThemePreference = 'light' | 'dark';
export type LanguagePreference = 'pl' | 'en' | 'uk';
export type FontSizePreference = 'small' | 'medium' | 'large';

export type NoteSection =
  | 'general'
  | 'watch-later'
  | 'read-later'
  | 'birthdays'
  | 'my-wishes'
  | 'other-wishes';

export interface Category {
  id: string;
  name: string;
  color: string;
  builtIn?: boolean;
}

export interface UserSettings {
  displayName: string;
  theme: ThemePreference;
  language: LanguagePreference;
  fontSize: FontSizePreference;
  plannerStartHour: number;
  plannerEndHour: number;
  syncEnabled: boolean;
  lastSyncedAt?: string;
}

export interface SubtaskItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  isRefined: boolean;
  quickAssign?: QuickAssign;
  category?: string;
  priority?: TaskPriority;
  dueDate?: string;
  plannedHours?: number;
  scheduledStartTime?: string;
  notes?: string;
  subtasks?: SubtaskItem[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  section: NoteSection;
  personName?: string;
  reminderDate?: string;
  reminderEnabled?: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeBlock {
  id: string;
  taskId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface ReminderSetting {
  id: string;
  type: ReminderType;
  interval: number;
  enabled: boolean;
  lastTriggeredAt?: string;
}

export interface PomodoroSession {
  id: string;
  completedAt: string;
  durationSeconds: number;
}

export interface PomodoroState {
  isRunning: boolean;
  mode: 'focus' | 'break';
  remainingSeconds: number;
  focusDurationSeconds: number;
  breakDurationSeconds: number;
  lastStartedAt?: string;
}

export interface WellnessStats {
  waterIntake: number;
  movementBreaks: number;
  pomodoroSessions: PomodoroSession[];
}

export interface ModeData {
  tasks: Task[];
  notes: NoteItem[];
  timeBlocks: TimeBlock[];
  categories: Category[];
  reminders: ReminderSetting[];
  pomodoro: PomodoroState;
  stats: WellnessStats;
}

export interface RootState {
  isLoggedIn: boolean;
  activeMode: AppMode;
  settings: UserSettings;
  datasets: Record<AppMode, ModeData>;
}

export interface QuickTaskInput {
  title: string;
  quickAssign?: QuickAssign | null;
}

export interface TaskDraft {
  title: string;
  category?: string;
  priority?: TaskPriority;
  dueDate?: string;
  plannedHours?: number;
  scheduledStartTime?: string;
  notes?: string;
  status?: TaskStatus;
  subtasks?: SubtaskItem[];
}

export interface NoteDraft {
  title: string;
  content: string;
  section: NoteSection;
  personName?: string;
  reminderDate?: string;
  reminderEnabled?: boolean;
}

export type ToastTone = 'info' | 'success' | 'warning';

export interface ToastState {
  id: string;
  message: string;
  tone: ToastTone;
}
