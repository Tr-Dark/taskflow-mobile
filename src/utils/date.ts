import { LanguagePreference, QuickAssign } from '../types';

export function pad(value: number) {
  return value.toString().padStart(2, '0');
}

export function toDateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayDateString() {
  return toDateString(new Date());
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function quickAssignToDate(quickAssign?: QuickAssign | null) {
  const now = new Date();
  if (quickAssign === 'tomorrow') {
    return toDateString(addDays(now, 1));
  }
  if (quickAssign === 'later') {
    return toDateString(addDays(now, 14));
  }
  return toDateString(now);
}

export function futureDateFromNow(days: number) {
  return toDateString(addDays(new Date(), days));
}

export function isTimeInPlannerRange(time: string | undefined, startHour: number, endHour: number) {
  if (!time) {
    return false;
  }
  const minutes = timeToMinutes(time);
  return minutes >= startHour * 60 && minutes < endHour * 60;
}

export function getLocale(language: LanguagePreference) {
  if (language === 'en') return 'en-GB';
  if (language === 'uk') return 'uk-UA';
  return 'pl-PL';
}

export function formatPolishDate(dateString: string, options?: Intl.DateTimeFormatOptions) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pl-PL', options);
}

export function formatLocalizedDate(
  language: LanguagePreference,
  dateString: string,
  options?: Intl.DateTimeFormatOptions,
) {
  const date = new Date(dateString);
  return date.toLocaleDateString(getLocale(language), options);
}

export function formatPolishDateTime(value: string) {
  return new Date(value).toLocaleString('pl-PL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatLocalizedDateTime(language: LanguagePreference, value: string) {
  return new Date(value).toLocaleString(getLocale(language), {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPolishHeaderDate(date: Date) {
  return date.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function addHoursToTime(value: string, hours: number) {
  const [startHour, startMinute] = value.split(':').map(Number);
  const next = new Date();
  next.setHours(startHour, startMinute, 0, 0);
  next.setMinutes(next.getMinutes() + Math.round(hours * 60));
  return `${pad(next.getHours())}:${pad(next.getMinutes())}`;
}

export function combineDateAndTime(dateString: string, timeString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function isFutureDateTime(date: Date) {
  return date.getTime() > Date.now() + 30 * 1000;
}

export function hasTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);
  return aStart < bEnd && bStart < aEnd;
}

export function getDatePart(iso: string) {
  return iso.slice(0, 10);
}

export function isToday(dateString?: string) {
  return !!dateString && dateString === todayDateString();
}

export function daysFromToday(dateString?: string) {
  if (!dateString) return null;
  const today = new Date(`${todayDateString()}T00:00:00`);
  const date = new Date(`${dateString}T00:00:00`);
  return Math.round((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

export function generateUpcomingDateOptions(count = 21) {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(today, index);
    return {
      value: toDateString(date),
      label:
        index === 0
          ? 'Dziś'
          : index === 1
            ? 'Jutro'
            : formatPolishDate(toDateString(date), {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              }),
    };
  });
}

export function generateUpcomingDateOptionsLocalized(
  language: LanguagePreference,
  labels: { today: string; tomorrow: string },
  count = 21,
) {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(today, index);
    return {
      value: toDateString(date),
      label:
        index === 0
          ? labels.today
          : index === 1
            ? labels.tomorrow
            : formatLocalizedDate(language, toDateString(date), {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              }),
    };
  });
}

export function generateTimeOptions(startHour = 6, endHour = 23) {
  const times: string[] = [];
  for (let hour = startHour; hour < endHour; hour += 1) {
    for (const minute of [0, 15, 30, 45]) {
      times.push(`${pad(hour)}:${pad(minute)}`);
    }
  }
  return times;
}
