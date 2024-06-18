import { PropAt } from '../types/util';

function hasOwnProperty<T>(source: T, key: PropertyKey): key is keyof T {
  if (!source) return false;
  return key in (source as any);
}

export function hasProperty(source: any, key: string): boolean {
  if (hasOwnProperty(source, key) as boolean) {
    return true;
  }

  if (source && key.includes('.')) {
    const keyParts = key.split('.');
    return hasProperty(source[key.split('.')[0]], keyParts.slice(1).join('.'));
  }

  return false;
}

export function getProperty<T, K extends string>(source: T, key: K): PropAt<T, K> {
  if (hasOwnProperty(source, key)) return source[key] as PropAt<T, K>;
  if (source && key.includes('.')) {
    const keyParts = key.split('.');
    return getProperty(source[keyParts[0] as keyof T], keyParts.slice(1).join('.')) as PropAt<T, K>;
  }

  return undefined as PropAt<T, K>;
}

export function setProperty(source: any, key: string, value: any) {
  if (!source) return source;

  if (key.includes('.')) {
    const keyParts = key.split('.');
    if (!source[keyParts[0]]) {
      source[keyParts[0]] = {};
    }

    setProperty(source[keyParts[0]], keyParts.slice(1).join('.'), value);
  } else {
    source[key] = value;
  }

  return source;
}
