import initDebug from "debug";

import type {
  AsRegistrations,
  Component,
  ComponentTypeOf,
  ComponentsOf,
  Definition,
  DependenciesOf,
  DependsOnOption,
  EmptyObject,
  IsComponent,
  Registration,
  SystemOf,
  Systemic,
  SystemicBuild,
} from "./types";
import { buildSystem, getDependencies, randomName, sortComponents } from "./util";
import type { FunctionComponent } from "./types/component";

const debug = initDebug("systemic:index");

const defaultComponent = {
  async start(dependencies: Record<string, unknown>) {
    return dependencies;
  },
};

export class System<TSystem extends Record<string, Registration> = EmptyObject>
  implements Systemic<TSystem>
{
  public readonly name: string;

  private currentDefinition: Definition | null = null;
  private readonly activeComponents: Record<string, unknown> = {};

  constructor(
    options?: { name?: string },
    protected definitions = new Map<string, Definition>(),
  ) {
    this.name = options?.name ?? randomName();
  }

  public add: Systemic<TSystem>["add"] = <
    S extends string,
    TComponent = unknown,
    Scoped extends boolean = false,
  >(
    name: S extends keyof TSystem ? never : S,
    component?: TComponent,
    options?: { scoped?: Scoped },
  ) => {
    debug(`Adding component ${name} to system ${this.name}`);

    if (this.definitions.has(name)) {
      throw new Error(`Component "${name}" is already registered`);
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
      [G in keyof TSystem]: G extends S
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
      : isFunctionComponent(component)
        ? { component: wrapFC(component), dependencies: [], scoped }
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
    "config",
    DependenciesOf<TComponent>
  > {
    debug(`Adding component config to system ${this.name}`);

    return this._set("config", component, true);
  }

  public remove<S extends string>(name: S): Systemic<Omit<TSystem, S>> {
    debug(`Removing component ${name} from system ${this.name}`);

    if (!this.definitions.has(name)) {
      throw new Error(`Component "${name}" is not registered`);
    }

    for (const [key, definition] of this.definitions.entries()) {
      if (definition.dependencies.some((dep) => dep.component === name)) {
        throw new Error(`Component "${name}" is a dependency of "${key}"`);
      }
    }

    this.definitions.delete(name);
    this.currentDefinition = null;
    return this as any;
  }

  public merge<TSubSystem extends Record<string, Registration<unknown, boolean>>>(
    subSystem: Systemic<TSubSystem>,
    { override = false } = { override: false },
  ): Systemic<TSystem & TSubSystem> {
    return this.include(subSystem, { override });
  }

  public include<TSubSystem extends Record<string, Registration<unknown, boolean>>>(
    subSystem: Systemic<TSubSystem>,
    { override = false } = { override: false },
  ): Systemic<TSystem & TSubSystem> {
    debug(`Including definitions from sub system ${subSystem.name} into system ${this.name}`);

    if (!override) {
      for (const name of subSystem._definitions.keys()) {
        if (this.definitions.has(name)) {
          throw new Error(`Component "${name}" is already registered`);
        }
      }
    }

    for (const [name, definition] of subSystem._definitions.entries()) {
      this.definitions.set(name, definition);
    }

    return this as any;
  }

  public dependsOn<TNames extends DependsOnOption<any>[]>(...dependencies: TNames) {
    if (!this.currentDefinition) {
      throw new Error("You must add a component before calling dependsOn");
    }

    this.currentDefinition.dependencies.push(
      ...dependencies.map((dependency) =>
        typeof dependency === "string"
          ? { component: dependency, destination: dependency, optional: false }
          : { destination: dependency.component, optional: false, ...dependency },
      ),
    );
    return this as any;
  }

  public async start(): Promise<SystemOf<TSystem>> {
    debug(`Starting system ${this.name}`);

    const sortedComponentNames = sortComponents(this.definitions, true);
    for (const name of sortedComponentNames) {
      if (name in this.activeComponents) {
        continue;
      }

      debug(`Starting component ${name}`);
      // biome-ignore lint/style/noNonNullAssertion: we know key exists, otherwise it wouldn't be in the sortedComponentNames
      const definition = this.definitions.get(name)!;
      const dependencies = getDependencies(name, this.definitions, this.activeComponents);
      const component = await definition.component.start(dependencies);
      this.activeComponents[name] = component;
      debug(`Component ${name} started`);
    }

    debug(`Building system ${this.name}`);
    const system = buildSystem(this.activeComponents as ComponentsOf<TSystem>);

    debug(`System ${this.name} started`);
    return system;
  }

  public async stop(): Promise<void> {
    debug(`Stopping system ${this.name}`);

    const sortedComponentNames = sortComponents(this.definitions, false);
    for (const name of sortedComponentNames) {
      if (!(name in this.activeComponents)) {
        continue;
      }

      debug(`Stopping component ${name}`);
      const component = this.definitions.get(name)?.component;
      if (component?.stop) {
        await component.stop();
      }
      delete this.activeComponents[name];
      debug(`Component ${name} stopped`);
    }
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
  return "start" in component;
}

function isFunctionComponent(component: any): component is FunctionComponent<any, any> {
  return typeof component === "function";
}

function wrap<TComponent>(component: TComponent): Component<TComponent> {
  return {
    start: () => component,
  };
}

function wrapFC<TComponent extends FunctionComponent<any, any>>(
  component: TComponent,
): TComponent extends FunctionComponent<infer C, infer D> ? Component<C, D> : never {
  return {
    start: component,
  } as any;
}

/**
 * Creates a system to which components for dependency injection can be added
 * @returns An empty systemic system
 */
export function systemic<TMaster extends Record<string, unknown> = EmptyObject>(options?: {
  name?: string;
}): Systemic<AsRegistrations<TMaster>> {
  return new System<AsRegistrations<TMaster>>(options);
}
