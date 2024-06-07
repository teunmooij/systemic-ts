import initDebug from 'debug';
import type { EmptyObject } from 'type-fest';

import { randomName } from './utils';
import { CallbackComponent, Component, Systemic, SystemicBuild } from './types';

export class System<T extends Record<string, unknown> = EmptyObject> implements Systemic<T> {
  public readonly name: string;
  private definitions = new Map<string, Definition>();

  constructor(options: { name?: string }) {
    this.name = options.name || randomName();
  }

  public add<S extends string, TComponent, TDependencies extends Record<string, unknown> = EmptyObject>(
    name: S extends keyof T ? never : S,
    component?: Component<TComponent, TDependencies> | CallbackComponent<TComponent, TDependencies> | TComponent,
    options?: { scoped?: boolean },
  ): SystemicBuild<
    {
      [G in keyof T | S]: G extends keyof T ? T[G] : TComponent;
    },
    TDependencies
  > {
    return this as any;
  }

  private _set(name: string);
}

interface Definition {
  scoped?: boolean;
  name: Component<any>;
  dependencies: string[];
}
