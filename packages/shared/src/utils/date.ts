export const dateUtils = {
  now: (): Date => new Date(),

  isExpired: (date: Date): boolean => {
    return new Date() > date;
  },

  daysBetween: (start: Date, end: Date): number => {
    return Math.floor((end.getTime() - start.getTime()) / 86400000);
  },

  hoursBetween: (start: Date, end: Date): number => {
    return Math.floor((end.getTime() - start.getTime()) / 3600000);
  },

  minutesBetween: (start: Date, end: Date): number => {
    return Math.floor((end.getTime() - start.getTime()) / 60000);
  },

  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  addHours: (date: Date, hours: number): Date => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  },

  addMinutes: (date: Date, minutes: number): Date => {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  },

  subtractDays: (date: Date, days: number): Date => dateUtils.addDays(date, -days),
  subtractHours: (date: Date, hours: number): Date => dateUtils.addHours(date, -hours),
  subtractMinutes: (date: Date, minutes: number): Date => dateUtils.addMinutes(date, -minutes),

  startOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  endOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  },

  isToday: (date: Date): boolean => {
    return dateUtils.startOfDay(date).getTime() === dateUtils.startOfDay(new Date()).getTime();
  },

  isYesterday: (date: Date): boolean => {
    const yesterday = dateUtils.subtractDays(new Date(), 1);
    return dateUtils.startOfDay(date).getTime() === dateUtils.startOfDay(yesterday).getTime();
  },

  isTomorrow: (date: Date): boolean => {
    const tomorrow = dateUtils.addDays(new Date(), 1);
    return dateUtils.startOfDay(date).getTime() === dateUtils.startOfDay(tomorrow).getTime();
  },

  isSameDay: (date1: Date, date2: Date): boolean => {
    return dateUtils.startOfDay(date1).getTime() === dateUtils.startOfDay(date2).getTime();
  },

  isWeekend: (date: Date): boolean => {
    return date.getDay() === 0 || date.getDay() === 6;
  },

  daysInMonth: (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
  },

  firstDayOfMonth: (year: number, month: number): Date => {
    return new Date(year, month - 1, 1);
  },

  lastDayOfMonth: (year: number, month: number): Date => {
    return new Date(year, month, 0);
  },

  formatRelative: (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  },

  isValidDate: (value: unknown): boolean => {
    if (value instanceof Date) return !isNaN(value.getTime());
    if (typeof value === "string" || typeof value === "number") {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    return false;
  },

  isAfter: (date: Date, compareTo: Date): boolean => date > compareTo,
  isBefore: (date: Date, compareTo: Date): boolean => date < compareTo,
  isBetween: (date: Date, start: Date, end: Date): boolean => date >= start && date <= end,

  clamp: (date: Date, min: Date, max: Date): Date => {
    if (date < min) return min;
    if (date > max) return max;
    return date;
  },

  maxDate: (...dates: Date[]): Date => new Date(Math.max(...dates.map(d => d.getTime()))),
  minDate: (...dates: Date[]): Date => new Date(Math.min(...dates.map(d => d.getTime()))),

  age: (dateOfBirth: Date): number => {
    const now = new Date();
    let age = now.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = now.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    return age;
  },
};

export type DateUtils = typeof dateUtils;