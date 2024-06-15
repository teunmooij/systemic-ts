import initDebug from 'debug';

import { randomName } from './util';
import type {
  Component,
  ComponentTypeOf,
  Definition,
  DependenciesOf,
  DependsOnOption,
  EmptyObject,
  IsComponent,
  Registration,
  SystemOf,
  Systemic,
  SystemicBuild,
} from './types';

// TODO: function components
// TODO: sync components
// TODO: parallel component starting/stopping

const debug = initDebug('systemic:index');

const defaultComponent = {
  async start(dependencies: Record<string, unknown>) {
    return dependencies;
  },
};

export class System<TSystem extends Record<string, Registration> = EmptyObject> implements Systemic<TSystem> {
  public readonly name: string;

  private definitions = new Map<string, Definition>();
  private currentDefinition: Definition | null = null;

  constructor(options?: { name?: string }) {
    this.name = options?.name || randomName();
  }

  public add: Systemic<TSystem>['add'] = <S extends string, TComponent = unknown, Scoped extends boolean = false>(
    name: S extends keyof TSystem ? never : S,
    component?: TComponent,
    options?: { scoped?: Scoped },
  ) => {
    debug(`Adding component ${name} to system ${this.name}`);

    if (this.definitions.has(name)) {
      throw new Error(`Duplicate component: ${name}`);
    }

    if (!component) {
      return this.add(name, defaultComponent);
    }

    return this._set(name, component, options?.scoped);
  };

  public set<S extends keyof TSystem & string, TComponent, Scoped extends boolean = false>(
    name: S,
    component: TComponent,
    options?: { scoped?: Scoped },
  ): SystemicBuild<
    {
      [G in keyof TSystem]: G extends keyof S
        ? IsComponent<TComponent> extends true
          ? { component: ComponentTypeOf<TComponent>; scoped: Scoped }
          : { component: TComponent; scoped: Scoped }
        : TSystem[G];
    },
    S,
    DependenciesOf<TComponent>
  > {
    debug(`Setting component ${name} on system ${this.name}`);

    return this._set(name, component, options?.scoped);
  }

  private _set(name: string, component: unknown, scoped = false) {
    const definition = isComponent(component)
      ? { component, dependencies: [], scoped }
      : { component: wrap(component), dependencies: [], scoped };

    this.definitions.set(name, definition);
    this.currentDefinition = definition;

    return this as any;
  }

  public configure<TComponent>(component: TComponent): SystemicBuild<
    TSystem & {
      config: IsComponent<TComponent> extends true
        ? { component: ComponentTypeOf<TComponent>; scoped: true }
        : { component: TComponent; scoped: true };
    },
    'config',
    DependenciesOf<TComponent>
  > {
    debug(`Adding component config to system ${this.name}`);

    return this._set('config', component, true);
  }

  public remove<S extends string>(name: S): Systemic<Omit<TSystem, S>> {
    debug(`Removing component ${name} from system ${this.name}`);

    this.definitions.delete(name);
    return this as any;
  }

  public merge<TSubSystem extends Record<string, Registration<unknown, boolean>>>(
    subSystem: Systemic<TSubSystem>,
  ): Systemic<TSystem & TSubSystem> {
    return this.include(subSystem);
  }

  public include<TSubSystem extends Record<string, Registration<unknown, boolean>>>(
    subSystem: Systemic<TSubSystem>,
  ): Systemic<TSystem & TSubSystem> {
    debug(`Including definitions from sub system ${subSystem.name} into system ${this.name}`);

    for (const [name, definition] of subSystem._definitions.entries()) {
      this.definitions.set(name, definition);
    }

    return this as any;
  }

  public dependsOn<TNames extends DependsOnOption<any, any>[]>(...dependencies: TNames) {
    if (!this.currentDefinition) {
      throw new Error('You must add a component before calling dependsOn');
    }

    this.currentDefinition.dependencies.push(
      ...dependencies.map(dependency =>
        typeof dependency === 'string'
          ? { component: dependency, destination: dependency, optional: false }
          : { destination: dependency.component, optional: false, ...dependency },
      ),
    );
    return this as any;
  }

  public start(): Promise<SystemOf<TSystem>> {
    debug(`Starting system ${this.name}`);
    throw new Error('Method not implemented.');
  }

  public stop(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async restart(): Promise<SystemOf<TSystem>> {
    await this.stop();
    return this.start();
  }

  public get _definitions() {
    return this.definitions;
  }
}

function isComponent(component: any): component is { start: any } {
  return 'start' in component;
}

function wrap<TComponent>(component: TComponent): Component<TComponent> {
  return {
    start: async () => component,
  };
}
