import { promisify } from "node:util";
import { System } from "./systemic";
import type { Definition, Registration, SystemOf, Systemic } from "./types";
import type { CallbackComponent, Component } from "./types/component";

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

const legacyModificationKeys = [
  "add",
  "set",
  "configure",
  "remove",
  "merge",
  "include",
  "bootstrap",
] as const;

/**
 * Turns a systemic system into a callback-style system, which can be used by legacy callback-style runners.
 * @param system the systemic system
 * @returns a callback-style system
 */
export function asCallbackSystem<TSystem extends Record<string, Registration>>(
  system: Systemic<TSystem>,
): Record<(typeof legacyModificationKeys)[number] | "name", any> & {
  start(callback: (error: Error | null, result?: SystemOf<TSystem>) => void): void;
  start(): Promise<SystemOf<TSystem>>;
  stop(callback: (error: Error | null) => void): void;
  stop(): Promise<void>;
  restart(callback: (error: Error | null, result?: SystemOf<TSystem>) => void): void;
  restart(): Promise<SystemOf<TSystem>>;
} {
  return {
    ...legacyModificationKeys.reduce(
      (acc, key) => {
        acc[key] = () => {
          throw new Error("Please make your modifications on the original system.");
        };
        return acc;
      },
      {} as Record<(typeof legacyModificationKeys)[number], any>,
    ),
    name: system.name,
    start(callback?: (error: Error | null, result?: SystemOf<TSystem>) => void) {
      const p = system.start();
      if (callback) {
        p.then(immediateCallback(callback)).catch(immediateError(callback));
      }
      return p;
    },
    stop(callback?: (error: Error | null) => void) {
      const p = system.stop();
      if (callback) {
        p.then(immediateCallback(callback)).catch(immediateError(callback));
      }
      return p;
    },
    restart(callback?: (error: Error | null, result?: SystemOf<TSystem>) => void) {
      const p = system.restart();
      if (callback) {
        p.then(immediateCallback(callback)).catch(immediateError(callback));
      }
      return p;
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

/**
 * Upgrades a legacy systemic (sub-)system to a systemic-ts system.
 * Since it's not possible to infer from the type of the legacy system whether components are scoped or not,
 * all components are assumed to be non-scoped, unless specified otherwise by passing in a type argument to this function.
 * @param legacySystem the legacy systemic (sub-)system to upgrade
 * @returns a systemic-ts system
 */
export function upgradeSystem<
  T extends Record<string, unknown>,
  TUpgrade extends Record<string, Registration> = {
    [K in keyof T]: { component: T[K]; scoped: false };
  },
>(legacySystem: LegacySystem<T>) {
  ensureLegacySystem(legacySystem);
  const definitions = new Map<string, Definition>(
    Object.entries(legacySystem._definitions).map(([key, value]) => [
      key,
      {
        scoped: value.scoped ?? false,
        component:
          typeof value.component === "object" && "start" in value.component
            ? toFlexComponent(value.component as any)
            : { start: () => value.component },
        dependencies: value.dependencies.map((dependency) => ({ optional: false, ...dependency })),
      },
    ]),
  );
  return new System<TUpgrade>({ name: legacySystem.name }, definitions);
}

function ensureLegacySystem<T extends Record<string, unknown>>(
  system: LegacySystem<T>,
): asserts system is LegacySystem<T> & LegacySystemInternals {
  if (!("_definitions" in system) || system._definitions instanceof Map) {
    throw new Error("The system does not have the expected internal structure");
  }
}

function toFlexComponent(component: {
  start: (dependencies?: any, callback?: (error: Error | null, result?: any) => void) => any;
  stop?: (callback?: (error: Error | null) => void) => any;
}) {
  return {
    start: (dependencies: any) =>
      new Promise((resolve, reject) => {
        const result = component.start(dependencies, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });

        if (result?.then) {
          result.then(resolve).catch(reject);
        }
      }),
    stop: () =>
      new Promise((resolve, reject) => {
        if (!component.stop) {
          return resolve();
        }

        const result = component.stop((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });

        if (result?.then) {
          result.then(resolve).catch(reject);
        }
      }),
  } as Component<any, any>;
}

interface LegacySystem<T extends Record<string, unknown>> {
  name: string;
  start(): Promise<T>;
}

interface LegacySystemInternals {
  _definitions: Record<
    string,
    {
      scoped?: boolean;
      name: string;
      component: Component<any, any> | CallbackComponent<any, any>;
      dependencies: {
        component: string;
        destination: string;
        source?: string;
        optional?: boolean;
      }[];
    }
  >;
}
