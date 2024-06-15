import { CallbackComponent, Component, Registration, SystemOf, Systemic } from '../types';
import { promisify } from 'node:util';

export function randomName() {
  return `Z-${Math.floor(Math.random() * 100000000) + 1}`;
}

export function isFunction(func: any) {
  return func && typeof func === 'function';
}

export function arraysIntersection(...arrays: any[]) {
  const verifiedArrays: any[][] = arrays.filter(value => Array.isArray(value));
  if (arrays.length === 0) return arrays;
  return verifiedArrays.reduce((acc, currentArray) => {
    currentArray.forEach(currentValue => {
      if (acc.indexOf(currentValue) === -1) {
        if (verifiedArrays.filter(obj => obj.indexOf(currentValue) === -1).length === 0) {
          acc.push(currentValue);
        }
      }
    });
    return acc;
  }, []);
}

function hasOwnProperty(obj: any, key: string) {
  if (!obj) return false;
  return key in obj;
}

export function hasProp(obj: any, key: string): boolean {
  if (hasOwnProperty(obj, key)) return true; // Some properties with '.' could fail, so we do a quick check
  const keyParts = key.split('.');
  return !!obj && (keyParts.length > 1 ? hasProp(obj[key.split('.')[0]], keyParts.slice(1).join('.')) : hasOwnProperty(obj, key));
}

export function getProp(obj: any, key: string) {
  if (hasOwnProperty(obj, key)) return obj[key]; // Some properties with '.' could fail, so we do a quick check
  if (obj && key.includes('.')) {
    const keyParts = key.split('.');
    return getProp(obj[keyParts[0]], keyParts.slice(1).join('.'));
  }

  return undefined;
}

export function setProp(obj: any, key: string, value: any) {
  if (!key.includes('.')) {
    obj[key] = value;
    return;
  }
  const keyParts = key.split('.');
  if (!obj[keyParts[0]]) obj[keyParts[0]] = {};
  setProp(obj[keyParts[0]], keyParts.slice(1).join('.'), value);
}

export function promisifyComponent<TComponent, TDependencies extends Record<string, unknown>>(
  component: CallbackComponent<TComponent, TDependencies>,
): Component<TComponent, TDependencies> {
  return {
    start: promisify(component.start),
    stop: component.stop && promisify(component.stop),
  };
}

export function asCallbackSystem<TSystem extends Record<string, Registration>>(system: Systemic<TSystem>) {
  return {
    ...system,
    start: (callback: (error: Error | null, result?: SystemOf<TSystem>) => void) => {
      system.start().then(immediateCallback(callback)).catch(immediateError(callback));
    },
    stop: (callback: (error: Error | null) => void) => {
      system.stop().then(immediateCallback(callback)).catch(immediateError(callback));
    },
    restart: (callback: (error: Error | null, result?: SystemOf<TSystem>) => void) => {
      system.restart().then(immediateCallback(callback)).catch(immediateError(callback));
    },
  };
}

function immediateCallback<T>(cb: (error: Error | null, result?: T) => void) {
  return (resolved: T) => {
    setImmediate(() => {
      cb(null, resolved);
    });
  };
}

function immediateError(cb: (error: Error | null) => void) {
  return (err: any) => {
    setImmediate(() => {
      cb(err);
    });
  };
}
