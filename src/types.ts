import type { EmptyObject } from 'type-fest';

type RequiredKeys<T> = {
  [K in keyof T]-?: EmptyObject extends Pick<T, K> ? never : K;
}[keyof T] &
  string;

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

/**
 * Systemic component that can be added to the systemic system.
 * @template TComponent The type of the component that will be exposed by the systemic system
 * @template TDependencies The type of the dependencies this component depends on
 */
export type Component<TComponent, TDependencies extends Record<string, unknown> = EmptyObject> = {
  /**
   * Starts this component
   * @param {TDependencies} dependencies The dependencies of this component
   * @returns A started component
   */
  start: (dependencies: TDependencies) => Promise<TComponent>;
  /**
   * Stops this component
   */
  stop?: () => Promise<void>;
};

/**
 * Systemic component that can be added to the systemic system.
 * @template TComponent The type of the component that will be exposed by the systemic system
 * @template TDependencies The type of the dependencies this component depends on
 */
export type CallbackComponent<TComponent, TDependencies extends Record<string, unknown> = EmptyObject> = {
  /**
   * Starts this component
   * @param {TDependencies} dependencies The dependencies of this component
   * @param callback Callback receives the component after it has been built
   */
  start: (dependencies: TDependencies, callback: (err: any, component: TComponent) => void) => void;
  /**
   * Stops this component
   * @param callback Callback is called when the component has been stopped
   */
  stop?: (callback: (err?: any) => void) => void;
};

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
type DependsOnOption<TDependencies, TSystemic> =
  | SimpleDependsOnOption<TSystemic>
  | MappingDependsOnOption<TDependencies, TSystemic>;

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
      ...ValidateDependency<TSystemic, TCurrent, TDependencies, First>,
      ...InvalidDependencies<TSystemic, TCurrent, TDependencies, Rest>,
    ]
  : [];

type ValidateDependency<
  TSystemic extends Record<string, Registration<unknown, boolean>>,
  TCurrent extends keyof TSystemic & string,
  TDependencies extends Record<string, unknown>,
  TOption extends DependsOnOption<TDependencies, TSystemic>,
> = TOption extends SimpleDependsOnOption<TSystemic>
  ? ValidateMappingDependency<TSystemic, TCurrent, TDependencies, { component: TOption; destination: TOption }>
  : TOption extends MappingDependsOnOption<keyof TDependencies, TSystemic>
  ? ValidateMappingDependency<TSystemic, TCurrent, TDependencies, OptionWithDestination<TOption>>
  : []; // Impossible situation

type OptionWithDestination<TOption extends MappingDependsOnOption<any, any>> = Omit<TOption, 'destination'> & {
  destination: DependencyDestinationOf<TOption>;
};

type ValidateMappingDependency<
  TSystemic extends Record<string, Registration<unknown, boolean>>,
  TCurrent extends keyof TSystemic & string,
  TDependencies extends Record<string, unknown>,
  TMapping extends { component: string; destination: string; source?: string },
> = DependencyDestinationOf<TMapping> extends keyof TDependencies
  ? [TSystemic[TMapping['component']]['component']] extends [
      DependencySourceOf<
        TDependencies[DependencyDestinationOf<TMapping>],
        OptionSource<TSystemic[TMapping['component']], TCurrent, TMapping['source']>
      >,
    ]
    ? [] // Correct dependency
    : [
        DependencyValidationError<
          DependencyDestinationOf<TMapping>,
          DependencySourceOf<
            TDependencies[DependencyDestinationOf<TMapping>],
            OptionSource<TSystemic[TMapping['component']], TCurrent, TMapping['source']>
          >,
          TSystemic[TMapping['component']]
        >,
      ] // Wrong type
  : []; // Undexpected dependency

type DependencyDestinationOf<TMapping extends MappingDependsOnOption<any, any>> = TMapping['destination'] extends string
  ? TMapping['destination']
  : TMapping['component'];

type OptionSource<
  TRegistration extends Registration<unknown, boolean>,
  TCurrent extends string,
  TGiven extends string | undefined,
> = TGiven extends string ? TGiven : TRegistration['scoped'] extends true ? TCurrent : undefined;

type DependencySourceOf<T, S> = S extends string
  ? S extends keyof T
    ? T[S]
    : S extends `${infer Key extends keyof T & string}.${infer Subkey}`
    ? DependencySourceOf<T[Key], Subkey>
    : never
  : T;

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

type IsComponent<T> = T extends Component<any, any> ? true : T extends CallbackComponent<any, any> ? true : false;
type ComponentTypeOf<T> = T extends Component<infer C, any> ? C : T extends CallbackComponent<infer CB, any> ? CB : never;
type DependenciesOf<T> = T extends Component<any, infer D> ? D : T extends CallbackComponent<any, infer D> ? D : EmptyObject;

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
  add: <S extends string, TComponent, Scoped extends boolean = false>(
    name: S extends keyof TSystem ? never : S, // We don't allow duplicate names
    component?: TComponent,
    options?: { scoped?: Scoped },
  ) => SystemicBuild<
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

  /**
   * Attempting to add the same component twice will result in an error, but sometimes you need to replace existing components with test doubles. Under such circumstances use set instead of add.
   * @param {string} name the name under which the component will be registered in the system
   * @param {Component} component the component to be added
   * @param options registration options
   */
  set: <S extends keyof TSystem, TComponent, Scoped extends boolean = false>(
    name: S,
    component: TComponent,
    options?: { scoped?: boolean },
  ) => SystemicBuild<
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
  configure: <TComponent>(component: TComponent) => SystemicBuild<
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
  remove: <S extends string>(name: S) => Systemic<Omit<TSystem, S>>;

  /**
   * Includes a subsystem into this systemic system
   */
  merge: <TSubSystem extends Record<string, Registration>>(subSystem: Systemic<TSubSystem>) => Systemic<TSystem & TSubSystem>;

  /**
   * Includes a subsystem into this systemic system
   */
  include: <TSubSystem extends Record<string, Registration>>(subSystem: Systemic<TSubSystem>) => Systemic<TSystem & TSubSystem>;

  /**
   * Starts the system and all of its components
   */
  start(callback: (error: Error | null, result?: TSystem) => void): void;
  start(): Promise<{ [C in keyof TSystem]: TSystem[C]['component'] }>;

  /**
   * Stops the system and all of its components
   */
  stop(callback: (error: Error | null) => void): void;
  stop(): Promise<void>;

  /**
   * Restarts the system and all of its components
   */
  restart(callback: (error: Error | null, result?: TSystem) => void): void;
  restart(): Promise<{ [C in keyof TSystem]: TSystem[C]['component'] }>;
}

interface Registration<Component = unknown, Scoped extends boolean = boolean> {
  component: Component;
  scoped: Scoped;
}
