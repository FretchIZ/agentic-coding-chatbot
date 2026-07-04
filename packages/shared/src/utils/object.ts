export const objectUtils = {
  pick: <T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) result[key] = obj[key];
    });
    return result;
  },

  omit: <T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj } as T;
    keys.forEach(key => delete result[key]);
    return result;
  },

  merge: <T extends Record<string, unknown>>(...objects: T[]): T => {
    return objects.reduce((acc, obj) => ({ ...acc, ...obj }), {} as T);
  },

  deepMerge: <T extends Record<string, unknown>>(target: T, source: Partial<T>): T => {
    const output = { ...target };
    for (const key in source) {
      if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
        (output as Record<string, unknown>)[key] = objectUtils.deepMerge(
          target[key] as Record<string, unknown>,
          source[key] as Record<string, unknown>
        );
      } else {
        (output as Record<string, unknown>)[key] = source[key];
      }
    }
    return output;
  },

  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as T;
    if (obj instanceof Array) return obj.map(item => objectUtils.deepClone(item)) as T;
    if (typeof obj === 'object') {
      const cloned: Record<string, unknown> = {};
      for (const key in obj) {
        cloned[key] = objectUtils.deepClone(obj[key]);
      }
      return cloned as T;
    }
    return obj;
  },

  isEqual: <T>(obj1: T, obj2: T): boolean => {
    if (obj1 === obj2) return true;
    if (obj1 === null || obj2 === null || typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
    if (obj1 instanceof Date && obj2 instanceof Date) return obj1.getTime() === obj2.getTime();
    if (obj1.constructor !== obj2.constructor) return false;
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    return keys1.every(key => keys2.includes(key) && objectUtils.isEqual((obj1 as Record<string, unknown>)[key], (obj2 as Record<string, unknown>)[key]));
  },

  mapKeys: <T>(obj: Record<string, T>, fn: (key: string) => string): Record<string, T> => {
    const result: Record<string, T> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[fn(key)] = value;
    }
    return result;
  },

  mapValues: <T, U>(obj: Record<string, T>, fn: (value: T, key: string) => U): Record<string, U> => {
    const result: Record<string, U> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = fn(value, key);
    }
    return result;
  },

  filterKeys: <T>(obj: Record<string, T>, fn: (key: string) => boolean): Record<string, T> => {
    const result: Record<string, T> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (fn(key)) result[key] = value;
    }
    return result;
  },

  filterValues: <T>(obj: Record<string, T>, fn: (value: T) => boolean): Record<string, T> => {
    const result: Record<string, T> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (fn(value)) result[key] = value;
    }
    return result;
  },

  invert: <K extends string | number | symbol, V extends string | number | symbol>(obj: Record<K, V>): Record<V, K> => {
    const result = {} as Record<V, K>;
    for (const [key, value] of Object.entries(obj)) {
      result[value as V] = key as K;
    }
    return result;
  },

  entries: <K extends string, V>(obj: Record<K, V>): [K, V][] => {
    return Object.entries(obj) as [K, V][];
  },

  fromEntries: <K extends string, V>(entries: [K, V][]): Record<K, V> => {
    return Object.fromEntries(entries) as Record<K, V>;
  },

  isEmptyObject: (obj: Record<string, unknown>): boolean => {
    return Object.keys(obj).length === 0;
  },

  getNestedValue: <T>(obj: Record<string, unknown>, path: string): T | undefined => {
    const keys = path.split('.');
    let current: unknown = obj;
    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[key];
    }
    return current as T;
  },

  setNestedValue: <T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T => {
    const keys = path.split('.');
    const result = objectUtils.deepClone(obj);
    let current: Record<string, unknown> = result;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) current[keys[i]] = {};
      current = current[keys[i]] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = value;
    return result;
  },

  flattenObject: (obj: Record<string, unknown>, prefix = ''): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, objectUtils.flattenObject(value as Record<string, unknown>, newKey));
      } else {
        result[newKey] = value;
      }
    }
    return result;
  },

  unflattenObject: (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const keys = key.split('.');
      let current = result;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) current[keys[i]] = {};
        current = current[keys[i]] as Record<string, unknown>;
      }
      current[keys[keys.length - 1]] = value;
    }
    return result;
  },
};

export type ObjectUtils = typeof objectUtils;