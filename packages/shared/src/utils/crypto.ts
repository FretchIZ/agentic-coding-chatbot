declare const crypto: { randomUUID: () => string; getRandomValues: (arr: Uint8Array) => void };

export const cryptoUtils = {
  generateUUID: (): string => crypto.randomUUID(),

  generateId: (length = 16, prefix = ''): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = prefix;
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  generateNumericCode: (length = 6): string => {
    const max = Math.pow(10, length);
    const code = Math.floor(Math.random() * max).toString().padStart(length, '0');
    return code;
  },

  generateApiKey: (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `sk_${result}`;
  },

  generateToken: (): string => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  hash: (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash;
  },

  mask: (str: string, start = 0, end = 0, maskChar = '*'): string => {
    if (str.length <= start + end) return str;
    const visibleStart = str.slice(0, start);
    const visibleEnd = str.slice(-end);
    const masked = maskChar.repeat(Math.min(str.length - start - end, str.length));
    return `${visibleStart}${masked}${visibleEnd}`;
  },
};

export type CryptoUtils = typeof cryptoUtils;