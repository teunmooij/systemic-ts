import type { Registration, SystemOf, Systemic } from "./types";
import type { CallbackComponent, Component } from "./types/component";
import { promisify } from "node:util";

/**
 * Turns a legacy callback-style component into a promise-style component.
 * @param component the legacy callback-style component
 * @returns a promise-style component, which can be used in the systemic system
 */
export function promisifyComponent<TComponent, TDependencies extends Record<string, unknown>>(
  component: CallbackComponent<TComponent, TDependencies>,
): Component<TComponent, TDependencies> {
  return {
    start: promisify(component.start),
    stop: component.stop && promisify(component.stop),
  };
}

/**
 * Turns a systemic system into a callback-style system, which can be used by legacy callback-style runners.
 * @param system the systemic system
 * @returns a callback-style system
 */
export function asCallbackSystem<TSystem extends Record<string, Registration>>(
  system: Systemic<TSystem>,
) {
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
