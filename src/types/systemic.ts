import type { ComponentTypeOf, DependenciesOf, IsComponent } from './component';
import type { Definition, Registration } from './definition';
import type { SystemOf } from './system';
import type { EmptyObject, PropAt, RequiredKeys } from './util';

type NameToDestination<TOption> = TOption extends {
  component: infer Component;
  destination?: infer Destination;
}
  ? unknown extends Destination
    ? Component
    : Destination
  : TOption extends string | number | symbol
  ? TOption
  : never;

type MissingDependencies<TDependencies extends Record<string, unknown>, TNames extends unknown[]> = TNames extends [
  infer Name,
  ...infer Rest,
]
  ? NameToDestination<Name> extends keyof TDependencies
    ? MissingDependencies<Omit<TDependencies, NameToDestination<Name>>, Rest>
    : MissingDependencies<TDependencies, Rest>
  : TDependencies;

type SimpleDependsOnOption<TSystemic> = keyof TSystemic & string;
type MappingDependsOnOption<TDependencyKeys, TSystemic> = TDependencyKeys extends keyof TSystemic
  ? {
      component: keyof TSystemic & string;
      destination?: TDependencyKeys & string;
      optional?: boolean;
      source?: string;
    }
  : {
      component: keyof TSystemic & string;
      destination: TDependencyKeys & string;
      optional?: boolean;
      source?: string;
    };
export type DependsOnOption<TDependencies, TSystemic> =
  | SimpleDependsOnOption<TSystemic>
  | MappingDependsOnOption<keyof TDependencies, TSystemic>;

type DependsOn<
  TSystemic extends Record<string, Registration<unknown, boolean>>,
  TCurrent extends keyof TSystemic & string,
  TDependencies extends Record<string, unknown>,
> = {
  /**
   * Specifies which other components the last added components depends on.
   * When name and type of the dependencies match those available in the system, the dependency can be added by name.
   * When a dependency is named differently in the system or only part of a component is required as a dependency, a MappingDependsOnOption can be used.
   */
  dependsOn: <TNames extends DependsOnOption<TDependencies, TSystemic>[]>(
    ...names: TNames
  ) => InvalidDependencies<TSystemic, TCurrent, TDependencies, TNames> extends [
    infer First extends DependencyValidationError<any, any, any>,
    ...any[],
  ]
    ? SystemicWithInvalidDependency<First>
    : SystemicBuild<TSystemic, TCurrent, MissingDependencies<TDependencies, TNames>>;
};

type InvalidDependencies<
  TSystemic extends Record<string, Registration<unknown, boolean>>,
  TCurrent extends keyof TSystemic & string,
  TDependencies extends Record<string, unknown>,
  TGiven extends DependsOnOption<TDependencies, TSystemic>[],
> = TGiven extends [
  infer First extends DependsOnOption<TDependencies, TSystemic>,
  ...infer Rest extends DependsOnOption<TDependencies, TSystemic>[],
]
  ? [
      ...ValidateMappingDependency<TSystemic, TCurrent, TDependencies, ToMappingDependsOnOption<First>>,
      ...InvalidDependencies<TSystemic, TCurrent, TDependencies, Rest>,
    ]
  : [];

type ToMappingDependsOnOption<TOption extends DependsOnOption<any, any>> = TOption extends SimpleDependsOnOption<any>
  ? { component: TOption; destination: TOption }
  : TOption extends MappingDependsOnOption<any, any>
  ? OptionWithDestination<TOption>
  : never; // Impossible situation

type OptionWithDestination<TOption extends MappingDependsOnOption<any, any>> = Omit<TOption, 'destination'> & {
  destination: DependencyDestinationOf<TOption>;
};

type ValidateMappingDependency<
  TSystemic extends Record<string, Registration<unknown, boolean>>,
  TCurrent extends keyof TSystemic & string,
  TDependencies extends Record<string, unknown>,
  TMapping extends { component: string; destination: string; source?: string },
> = DependencyDestinationOf<TMapping> extends keyof TDependencies
  ? [TDependencies[DependencyDestinationOf<TMapping>]] extends [Injected<TSystemic, TCurrent, TMapping>]
    ? [] // Correct dependency
    : [
        DependencyValidationError<
          DependencyDestinationOf<TMapping>,
          Injected<TSystemic, TCurrent, TMapping>,
          TDependencies[DependencyDestinationOf<TMapping>]
        >,
      ] // Wrong type
  : []; // Undexpected dependency

type Injected<
  TSystemic extends Record<string, Registration<unknown, boolean>>,
  TCurrent extends keyof TSystemic & string,
  TMapping extends { component: string; destination: string; source?: string },
> = PropAt<
  TSystemic[TMapping['component']]['component'],
  OptionSource<TSystemic[TMapping['component']], TCurrent, TMapping['source']>
>;

type DependencyDestinationOf<TMapping extends MappingDependsOnOption<any, any>> = TMapping['destination'] extends string
  ? TMapping['destination']
  : TMapping['component'];

type OptionSource<
  TRegistration extends Registration<unknown, boolean>,
  TCurrent extends string,
  TGiven extends string | undefined,
> = TGiven extends string ? TGiven : TRegistration['scoped'] extends true ? TCurrent : undefined;

type DependencyValidationError<TName extends string, TExpected, TActual> = [TName, TExpected, TActual];

type IncompleteSystemic<TMissing extends string> = {
  [X in keyof Systemic<any>]: (error: `Please add missing dependency ${TMissing}`) => void;
};

type SystemicWithInvalidDependency<TError extends DependencyValidationError<any, any, any>> = {
  [X in keyof Systemic<any>]: (
    error: `Componenent "${TError[0]}" in the system is not of the required type`,
    expected: TError[1],
    actual: TError[2],
  ) => void;
};

export type SystemicBuild<
  TSystemic extends Record<string, Registration<unknown, boolean>>,
  TCurrent extends keyof TSystemic & string,
  TDependencies extends Record<string, unknown>,
> = [RequiredKeys<TDependencies>] extends [never]
  ? Systemic<TSystemic> & DependsOn<TSystemic, TCurrent, TDependencies>
  : DependsOn<TSystemic, TCurrent, TDependencies> & IncompleteSystemic<RequiredKeys<TDependencies>>;

export type SystemicBuildDefaultComponent<
  TSystemic extends Record<string, Registration<unknown, boolean>>,
  TCurrent extends keyof TSystemic & string,
> = Systemic<TSystemic> & {
  /**
   * Specifies which other components the last added components depends on.
   * When name and type of the dependencies match those available in the system, the dependency can be added by name.
   * When a dependency is named differently in the system or only part of a component is required as a dependency, a MappingDependsOnOption can be used.
   */
  dependsOn: <TNames extends DependsOnOption<EmptyObject, TSystemic>[]>(
    ...names: TNames
  ) => SystemicBuildDefaultComponent<
    {
      [G in keyof TSystemic]: G extends TCurrent
        ? {
            component: MergeIntoDefaultComponent<TSystemic, TCurrent, TNames, TSystemic[TCurrent]['component']>;
            scoped: false;
          }
        : TSystemic[G];
    },
    TCurrent
  >;
};

type MergeIntoDefaultComponent<
  TSystemic extends Record<string, Registration<unknown, boolean>>,
  TCurrent extends keyof TSystemic & string,
  TNames extends DependsOnOption<EmptyObject, TSystemic>[],
  TComponent,
> = TNames extends [
  infer First extends DependsOnOption<EmptyObject, TSystemic>,
  ...infer Rest extends DependsOnOption<EmptyObject, TSystemic>[],
]
  ? MergeIntoDefaultComponent<
      TSystemic,
      TCurrent,
      Rest,
      {
        [K in keyof TComponent | ToMappingDependsOnOption<First>['destination']]: K extends keyof TComponent
          ? TComponent[K]
          : Injected<TSystemic, TCurrent, ToMappingDependsOnOption<First>>;
      }
    >
  : TComponent;

/**
 * Systemic system.
 */
export interface Systemic<TSystem extends Record<string, Registration>> {
  /**
   * The name of the system
   */
  name: string;

  /**
   * Adds a component to the system
   * @param {string} name the name under which the component will be registered in the system
   * @param {Component} component the component to be added
   * @param options registration options
   */
  add<S extends string, TComponent = unknown, Scoped extends boolean = false>(
    name: S extends keyof TSystem ? never : S, // We don't allow duplicate names
    component: TComponent,
    options?: { scoped?: Scoped },
  ): SystemicBuild<
    {
      [G in keyof TSystem | S]: G extends keyof TSystem
        ? TSystem[G]
        : IsComponent<TComponent> extends true
        ? { component: ComponentTypeOf<TComponent>; scoped: Scoped }
        : { component: TComponent; scoped: Scoped };
    },
    S,
    DependenciesOf<TComponent>
  >;
  add<S extends string>(
    name: S extends keyof TSystem ? never : S, // We don't allow duplicate names,
  ): SystemicBuildDefaultComponent<
    {
      [G in keyof TSystem | S]: G extends keyof TSystem ? TSystem[G] : { component: EmptyObject; scoped: false };
    },
    S
  >;

  /**
   * Attempting to add the same component twice will result in an error, but sometimes you need to replace existing components with test doubles. Under such circumstances use set instead of add.
   * @param {string} name the name under which the component will be registered in the system
   * @param {Component} component the component to be added
   * @param options registration options
   */
  set<S extends keyof TSystem & string, TComponent, Scoped extends boolean = false>(
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
  >;

  /**
   * Adds a configuration to the system, which will be available as a scoped dependency named 'config'
   */
  configure<TComponent>(component: TComponent): SystemicBuild<
    TSystem & {
      config: IsComponent<TComponent> extends true
        ? { component: ComponentTypeOf<TComponent>; scoped: true }
        : { component: TComponent; scoped: true };
    },
    'config',
    DependenciesOf<TComponent>
  >;

  /**
   * Removes a component from the system.
   * Removing components during tests can decrease startup time.
   */
  remove<S extends string>(name: S): Systemic<Omit<TSystem, S>>;

  /**
   * Includes a subsystem into this systemic system
   */
  merge<TSubSystem extends Record<string, Registration>>(subSystem: Systemic<TSubSystem>): Systemic<TSystem & TSubSystem>;

  /**
   * Includes a subsystem into this systemic system
   */
  include<TSubSystem extends Record<string, Registration>>(subSystem: Systemic<TSubSystem>): Systemic<TSystem & TSubSystem>;

  /**
   * Starts the system and all of its components
   */
  start(): Promise<SystemOf<TSystem>>;

  /**
   * Stops the system and all of its components
   */
  stop(): Promise<void>;

  /**
   * Restarts the system and all of its components
   */
  restart(): Promise<SystemOf<TSystem>>;

  readonly _definitions: Map<string, Definition>;
}
