import { Category, ModeData, NoteItem, ReminderSetting, RootState, Task, TimeBlock } from '../types';
import { addDays, toDateString, todayDateString } from '../utils/date';

function nowIso() {
  return new Date().toISOString();
}

export function createDefaultCategories(): Category[] {
  return [
    { id: 'cat-work', name: 'Praca', color: '#E8EDFF', builtIn: true },
    { id: 'cat-personal', name: 'Osobiste', color: '#FCE8F1', builtIn: true },
    { id: 'cat-health', name: 'Zdrowie', color: '#E8F8EE', builtIn: true },
    { id: 'cat-shopping', name: 'Zakupy', color: '#FFF1D6', builtIn: true },
    { id: 'cat-family', name: 'Rodzina', color: '#FFE7EC', builtIn: true },
    { id: 'cat-home', name: 'Dom', color: '#EAF8EE', builtIn: true },
    { id: 'cat-study', name: 'Nauka', color: '#EEF0FF', builtIn: true },
    { id: 'cat-extra', name: 'Dodatkowa praca', color: '#ECE7FF', builtIn: true },
    { id: 'cat-other', name: 'Inne', color: '#F2F3F7', builtIn: true },
  ];
}

function buildReminders(): ReminderSetting[] {
  return [
    { id: 'water', type: 'water', interval: 60, enabled: true },
    { id: 'movement', type: 'movement', interval: 90, enabled: true },
    { id: 'break', type: 'break', interval: 120, enabled: false },
  ];
}

export function createDemoTasks(): Task[] {
  const now = new Date();
  const today = todayDateString();
  const tomorrow = toDateString(addDays(now, 1));
  const closerLater = toDateString(addDays(now, 4));
  const fartherLater = toDateString(addDays(now, 12));
  const yesterdayIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'task-1',
      title: 'Przygotować prezentację dla klienta',
      status: 'active',
      isRefined: true,
      quickAssign: 'today',
      category: 'Praca',
      priority: 'high',
      dueDate: today,
      plannedHours: 3,
      scheduledStartTime: '14:00',
      notes: 'Uwzględnić ostatnie metryki i wyniki kwartalne.',
      subtasks: [
        { id: 'subtask-1-1', title: 'Zebrać najnowsze metryki', completed: true, createdAt: yesterdayIso },
        { id: 'subtask-1-2', title: 'Dodać slajd z wynikami kwartalnymi', completed: false, createdAt: nowIso() },
        { id: 'subtask-1-3', title: 'Sprawdzić końcowe CTA', completed: false, createdAt: nowIso() },
      ],
      createdAt: yesterdayIso,
      updatedAt: nowIso(),
    },
    {
      id: 'task-2',
      title: 'Kupić produkty',
      status: 'active',
      isRefined: false,
      quickAssign: 'today',
      dueDate: today,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 'task-3',
      title: 'Posprzątać mieszkanie',
      status: 'active',
      isRefined: false,
      quickAssign: 'today',
      dueDate: today,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 'task-4',
      title: 'Przejrzeć kod kolegów',
      status: 'active',
      isRefined: true,
      quickAssign: 'today',
      category: 'Praca',
      priority: 'medium',
      dueDate: today,
      plannedHours: 1,
      scheduledStartTime: '10:00',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 'task-5',
      title: 'Opłacić rachunki',
      status: 'active',
      isRefined: false,
      quickAssign: 'today',
      dueDate: today,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 'task-6',
      title: 'Napisać raport',
      status: 'completed',
      isRefined: true,
      quickAssign: 'today',
      category: 'Praca',
      priority: 'high',
      dueDate: today,
      plannedHours: 2,
      createdAt: yesterdayIso,
      updatedAt: nowIso(),
      completedAt: nowIso(),
    },
    {
      id: 'task-7',
      title: 'Zadzwonić do lekarza',
      status: 'active',
      isRefined: true,
      quickAssign: 'tomorrow',
      category: 'Inne',
      priority: 'medium',
      dueDate: tomorrow,
      plannedHours: 0.5,
      notes: 'Umówić termin wizyty kontrolnej.',
      subtasks: [
        { id: 'subtask-7-1', title: 'Sprawdzić godziny pracy przychodni', completed: false, createdAt: nowIso() },
      ],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 'task-8',
      title: 'Zaplanować urlop',
      status: 'postponed',
      isRefined: true,
      quickAssign: 'later',
      category: 'Osobiste',
      priority: 'low',
      dueDate: fartherLater,
      plannedHours: 1,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 'task-9',
      title: 'Zamówić książkę do nauki',
      status: 'active',
      isRefined: true,
      quickAssign: 'later',
      category: 'Nauka',
      priority: 'low',
      dueDate: closerLater,
      plannedHours: 0.25,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ];
}

export function createDemoNotes(): NoteItem[] {
  const now = nowIso();
  return [
    {
      id: 'note-1',
      title: 'Pomysły na filmy',
      content: 'Dune 2\nPerfect Days\nPast Lives',
      section: 'watch-later',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'note-2',
      title: 'Książki do przeczytania',
      content: 'Atomic Habits\nDeep Work\nEssentialism',
      section: 'read-later',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'note-3',
      title: 'Urodziny Ani',
      content: 'Prezent: coś do czytania albo voucher na masaż.',
      section: 'birthdays',
      personName: 'Ania',
      reminderDate: toDateString(addDays(new Date(), 18)),
      reminderEnabled: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'note-4',
      title: 'Co można mi podarować',
      content: 'Dobre słuchawki, notes premium, karta podarunkowa do księgarni.',
      section: 'my-wishes',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'note-5',
      title: 'Prezenty dla Tomka',
      content: 'Lubi LEGO Technic i kawę specialty.',
      section: 'other-wishes',
      personName: 'Tomek',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function createDemoTimeBlocks(): TimeBlock[] {
  const today = todayDateString();
  return [
    { id: 'block-1', taskId: 'task-4', date: today, startTime: '10:00', endTime: '11:00' },
    { id: 'block-2', taskId: 'task-1', date: today, startTime: '14:00', endTime: '17:00' },
  ];
}

export function createEmptyModeData(): ModeData {
  return {
    tasks: [],
    notes: [],
    timeBlocks: [],
    categories: createDefaultCategories(),
    reminders: buildReminders(),
    pomodoro: {
      isRunning: false,
      mode: 'focus',
      remainingSeconds: 25 * 60,
      focusDurationSeconds: 25 * 60,
      breakDurationSeconds: 5 * 60,
    },
    stats: {
      waterIntake: 0,
      movementBreaks: 0,
      pomodoroSessions: [],
    },
  };
}

export function createDemoModeData(): ModeData {
  return {
    ...createEmptyModeData(),
    tasks: createDemoTasks(),
    notes: createDemoNotes(),
    timeBlocks: createDemoTimeBlocks(),
  };
}

export function createInitialRootState(): RootState {
  return {
    isLoggedIn: false,
    activeMode: 'demo',
    settings: {
      displayName: 'Mój profil',
      theme: 'light',
      language: 'pl',
      fontSize: 'medium',
      syncEnabled: false,
    },
    datasets: {
      demo: createDemoModeData(),
      personal: createEmptyModeData(),
    },
  };
}
