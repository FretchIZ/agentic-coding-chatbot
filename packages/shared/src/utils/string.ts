declare const crypto: { randomUUID: () => string };

export const stringUtils = {
  generateId: (prefix = 'id'): string => 
    `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
  
  generateUUID: (): string => 
    globalThis.crypto.randomUUID(),
  
  slugify: (text: string): string =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, ''),
  
  truncate: (text: string, maxLength: number, suffix = '...'): string =>
    text.length <= maxLength ? text : text.slice(0, maxLength - suffix.length) + suffix,
  
  capitalize: (text: string): string =>
    text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
  
  camelCase: (text: string): string =>
    text
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+/g, ''),
  
  snakeCase: (text: string): string =>
    text
      .replace(/\s+/g, '_')
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, ''),
  
  kebabCase: (text: string): string =>
    text
      .replace(/\s+/g, '-')
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, ''),
  
  pascalCase: (text: string): string =>
    text
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
      .replace(/\s+/g, ''),
  
  escapeHtml: (text: string): string =>
    text
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#039;'),
  
  unescapeHtml: (text: string): string =>
    text
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/&#039;/g, "'"),
  
  stripHtml: (text: string): string =>
    text.replace(/<[^>]*>/g, ''),
  
  countWords: (text: string): number =>
    text.trim().split(/\s+/).filter(Boolean).length,
  
  countCharacters: (text: string, includeSpaces = true): number =>
    includeSpaces ? text.length : text.replace(/\s/g, '').length,
  
  extractUrls: (text: string): string[] => {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  },
  
  extractEmails: (text: string): string[] => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
  },
  
  maskEmail: (email: string): string => {
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : '*'.repeat(local.length);
    return `${maskedLocal}@${domain}`;
  },
  
  highlightTerms: (text: string, terms: string[], className = 'highlight'): string => {
    if (!terms.length) return text;
    const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
    return text.replace(regex, `<span class="${className}">$1</span>`);
  },
  
  parseQueryString: (queryString: string): Record<string, string | string[]> => {
    const params = new URLSearchParams(queryString);
    const result: Record<string, string | string[]> = {};
    for (const [key, value] of params.entries()) {
      if (result[key]) {
        if (Array.isArray(result[key])) {
          (result[key] as string[]).push(value);
        } else {
          result[key] = [result[key] as string, value];
        }
      } else {
        result[key] = value;
      }
    }
    return result;
  },
  
  buildQueryString: (params: Record<string, unknown>): string => {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)));
        } else {
          searchParams.set(key, String(value));
        }
      }
    }
    return searchParams.toString();
  },
  
  formatBytes: (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  },
  
  formatDuration: (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  },
  
  pluralize: (count: number, singular: string, plural?: string): string => 
    count === 1 ? singular : (plural || `${singular}s`),
  
  ordinal: (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  },
};

export type StringUtils = typeof stringUtils;