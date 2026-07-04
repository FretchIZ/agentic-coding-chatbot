export const formatUtils = {
  number: {
    format: (value: number, decimals = 2): string => {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    },

    compact: (value: number): string => {
      if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
      return value.toString();
    },

    ordinal: (value: number): string => {
      const suffixes = ['th', 'st', 'nd', 'rd'];
      const v = value % 100;
      return `${value}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
    },

    percent: (value: number, decimals = 1): string => {
      return `${(value * 100).toFixed(decimals)}%`;
    },

    currency: (value: number, currency = 'USD'): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(value);
    },

    bytes: (bytes: number, decimals = 2): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
    },
  },

  date: {
    format: (date: Date, formatStr = 'YYYY-MM-DD'): string => {
      const map: Record<string, string> = {
        YYYY: date.getFullYear().toString(),
        MM: (date.getMonth() + 1).toString().padStart(2, '0'),
        DD: date.getDate().toString().padStart(2, '0'),
        HH: date.getHours().toString().padStart(2, '0'),
        mm: date.getMinutes().toString().padStart(2, '0'),
        ss: date.getSeconds().toString().padStart(2, '0'),
      };
      let result = formatStr;
      for (const [key, value] of Object.entries(map)) {
        result = result.replace(key, value);
      }
      return result;
    },

    relative: (date: Date): string => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 60) return 'just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      if (days < 30) return `${Math.floor(days / 7)}w ago`;
      if (days < 365) return `${Math.floor(days / 30)}mo ago`;
      return `${Math.floor(days / 365)}y ago`;
    },

    short: (date: Date): string => {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    },

    full: (date: Date): string => {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    },

    time: (date: Date): string => {
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    },

    duration: (ms: number): string => {
      if (ms < 1000) return `${ms}ms`;
      const seconds = Math.floor(ms / 1000);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
      const hours = Math.floor(minutes / 60);
      return `${hours}h ${minutes % 60}m`;
    },

    timeAgo: (date: Date): string => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / 86400000);
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days} days ago`;
      return formatUtils.date.short(date);
    },
  },

  text: {
    truncate: (text: string, maxLength: number, suffix = '...'): string => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - suffix.length) + suffix;
    },

    capitalize: (text: string): string => {
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    },

    titleCase: (text: string): string => {
      const smallWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'in', 'of'];
      return text.split(' ').map((word, index) => {
        if (index > 0 && smallWords.includes(word.toLowerCase())) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }).join(' ');
    },

    sentenceCase: (text: string): string => {
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    },

    slugify: (text: string): string => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    },

    pluralize: (count: number, singular: string, plural?: string): string => {
      return count === 1 ? singular : (plural || `${singular}s`);
    },

    wordCount: (text: string): number => {
      return text.trim().split(/\s+/).filter(Boolean).length;
    },

    readingTime: (text: string, wordsPerMinute = 200): string => {
      const words = formatUtils.text.wordCount(text);
      const minutes = Math.ceil(words / wordsPerMinute);
      return `${minutes} min read`;
    },

    stripHtml: (html: string): string => {
      return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    },
  },
};

export type FormatUtils = typeof formatUtils;