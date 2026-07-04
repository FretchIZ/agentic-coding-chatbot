export const arrayUtils = {
  chunk: <T>(array: T[], size: number): T[][] => {
    if (size <= 0) throw new Error('Chunk size must be positive');
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  },
  
  flatten: <T>(array: (T | T[])[]): T[] => 
    array.flat(Infinity),
  
  unique: <T>(array: T[]): T[] => 
    [...new Set(array)],
  
  uniqueBy: <T, K>(array: T[], keyFn: (item: T) => K): T[] => {
    const seen = new Set<K>();
    return array.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
  
  groupBy: <T, K extends string | number>(array: T[], keyFn: (item: T) => K): Record<K, T[]> => 
    array.reduce((groups, item) => {
      const key = keyFn(item);
      (groups[key] = groups[key] || []).push(item);
      return groups;
    }, {} as Record<K, T[]>),
  
  sortBy: <T>(array: T[], keyFn: (item: T) => string | number, direction: 'asc' | 'desc' = 'asc'): T[] => 
    [...array].sort((a, b) => {
      const aVal = keyFn(a);
      const bVal = keyFn(b);
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return direction === 'asc' ? comparison : -comparison;
    }),
  
  shuffle: <T>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },
  
  sample: <T>(array: T[], count = 1): T[] => {
    const shuffled = arrayUtils.shuffle(array);
    return shuffled.slice(0, Math.min(count, array.length));
  },
  
  intersection: <T>(...arrays: T[][]): T[] => {
    if (arrays.length === 0) return [];
    const sets = arrays.map(arr => new Set(arr));
    return [...sets[0]].filter(item => sets.every(set => set.has(item)));
  },
  
  difference: <T>(array: T[], ...toRemove: T[][]): T[] => {
    const removeSet = new Set(toRemove.flat());
    return array.filter(item => !removeSet.has(item));
  },
  
  zip: <T, U>(array1: T[], array2: U[]): [T, U][] => {
    const length = Math.min(array1.length, array2.length);
    const result: [T, U][] = [];
    for (let i = 0; i < length; i++) {
      result.push([array1[i], array2[i]]);
    }
    return result;
  },
  
  unzip: <T, U>(array: [T, U][]): [T[], U[]] => 
    array.reduce<[T[], U[]]>(([first, second], [a, b]) => {
      first.push(a);
      second.push(b);
      return [first, second];
    }, [[], []]),
  
  range: (start: number, end?: number, step = 1): number[] => {
    if (end === undefined) {
      end = start;
      start = 0;
    }
    const result: number[] = [];
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
    return result;
  },
  
  compact: <T>(array: (T | null | undefined | false | 0 | '')[]): T[] => 
    array.filter(Boolean) as T[],
  
  flattenDeep: <T>(array: unknown[]): T[] => 
    array.reduce<T[]>((acc, val) => 
      Array.isArray(val) ? acc.concat(arrayUtils.flattenDeep(val)) : acc.concat(val as T), []),
  
  take: <T>(array: T[], n: number): T[] => 
    array.slice(0, n),
  
  takeRight: <T>(array: T[], n: number): T[] => 
    array.slice(-n),
  
  drop: <T>(array: T[], n: number): T[] => 
    array.slice(n),
  
  dropRight: <T>(array: T[], n: number): T[] => 
    array.slice(0, -n),
  
  partition: <T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] => 
    array.reduce<[T[], T[]]>(([pass, fail], item) => 
      predicate(item) ? [...pass, item] : [pass, [...fail, item]], [[], []]),
  
  frequency: <T>(array: T[]): Map<T, number> => 
    array.reduce((map, item) => map.set(item, (map.get(item) || 0) + 1), new Map()),
  
  mode: <T>(array: T[]): T | null => {
    if (array.length === 0) return null;
    const freq = arrayUtils.frequency(array);
    return [...freq.entries()].reduce((a, b) => a[1] > b[1] ? a : b)[0];
  },
  
  sum: (array: number[]): number => 
    array.reduce((a, b) => a + b, 0),
  
  mean: (array: number[]): number => 
    array.length > 0 ? arrayUtils.sum(array) / array.length : 0,
  
  median: (array: number[]): number => {
    if (array.length === 0) return 0;
    const sorted = [...array].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },
  
  standardDeviation: (array: number[]): number => {
    if (array.length < 2) return 0;
    const m = arrayUtils.mean(array);
    const variance = arrayUtils.mean(array.map(x => Math.pow(x - m, 2)));
    return Math.sqrt(variance);
  },
};

export type ArrayUtils = typeof arrayUtils;