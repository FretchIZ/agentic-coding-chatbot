export const validationUtils = {
  isEmail: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  isPhone: (value: string): boolean => {
    const phoneRegex = /^\+?[\d\s-()]{7,15}$/;
    return phoneRegex.test(value);
  },

  isURL: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  isUUID: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  isHexColor: (value: string): boolean => {
    const hexRegex = /^#([\dA-Fa-f]{3}|[\dA-Fa-f]{4}|[\dA-Fa-f]{6}|[\dA-Fa-f]{8})$/;
    return hexRegex.test(value);
  },

  isStrongPassword: (value: string): { valid: boolean; message: string } => {
    if (value.length < 8) return { valid: false, message: "Must be at least 8 characters" };
    if (!/[A-Z]/.test(value)) return { valid: false, message: "Must contain uppercase letter" };
    if (!/[a-z]/.test(value)) return { valid: false, message: "Must contain lowercase letter" };
    if (!/\d/.test(value)) return { valid: false, message: "Must contain a number" };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return { valid: false, message: "Must contain special character" };
    return { valid: true, message: "Strong password" };
  },

  isNumeric: (value: unknown): boolean => {
    return !isNaN(Number(value)) && value !== null && value !== '';
  },

  isInteger: (value: unknown): boolean => {
    return Number.isInteger(value);
  },

  isPositive: (value: number): boolean => value > 0,
  isNegative: (value: number): boolean => value < 0,
  isInRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },

  isNotEmpty: (value: string | unknown[] | Record<string, unknown> | null | undefined): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  },

  isIn: <T>(value: T, allowedValues: T[]): boolean => {
    return allowedValues.includes(value);
  },

  matchesPattern: (value: string, pattern: RegExp | string): boolean => {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return regex.test(value);
  },

  minLength: (value: string, min: number): boolean => value.length >= min,
  maxLength: (value: string, max: number): boolean => value.length <= max,
  exactLength: (value: string, length: number): boolean => value.length === length,

  minArraySize: <T>(value: T[], min: number): boolean => value.length >= min,
  maxArraySize: <T>(value: T[], max: number): boolean => value.length <= max,

  minValue: (value: number, min: number): boolean => value >= min,
  maxValue: (value: number, max: number): boolean => value <= max,

  isValidDate: (value: string | number | Date): boolean => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  },

  isFutureDate: (date: Date): boolean => date > new Date(),
  isPastDate: (date: Date): boolean => date < new Date(),

  isDateInRange: (date: Date, start: Date, end: Date): boolean => {
    return date >= start && date <= end;
  },

  isIBAN: (value: string): boolean => {
    const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;
    return ibanRegex.test(value.replace(/\s/g, ''));
  },

  isCreditCard: (value: string): boolean => {
    const sanitized = value.replace(/\D/g, '');
    if (sanitized.length < 13 || sanitized.length > 19) return false;
    let sum = 0;
    let alternate = false;
    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized[i], 10);
      if (alternate) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      alternate = !alternate;
    }
    return sum % 10 === 0;
  },

  isJSON: (value: string): boolean => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },

  isFileSizeWithinLimit: (sizeInBytes: number, maxSizeInBytes: number): boolean => {
    return sizeInBytes <= maxSizeInBytes;
  },

  isAllowedMimeType: (mimeType: string, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(mimeType);
  },

  isValidISODate: (value: string): boolean => {
    const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
    return isoRegex.test(value);
  },

  isAlphanumeric: (value: string): boolean => {
    return /^[a-zA-Z0-9]+$/.test(value);
  },

  isASCII: (value: string): boolean => {
    return /^[\x00-\x7F]*$/.test(value);
  },

  isBase64: (value: string): boolean => {
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    return base64Regex.test(value);
  },

  isPalindrome: (value: string): boolean => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleaned === cleaned.split('').reverse().join('');
  },
};

export type ValidationUtils = typeof validationUtils;