import type { Registration } from './definition';
import type { PropAt } from './util';

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

type DependencyDestinationOf<TOption> = TOption extends {
  component: infer Component;
  destination?: infer Destination;
}
  ? unknown extends Destination
    ? Component
    : Destination
  : TOption extends PropertyKey
  ? TOption
  : never;

export type DependencyDestinationsOf<TOptions> = TOptions extends [infer First, ...infer Rest]
  ? [DependencyDestinationOf<First>, ...DependencyDestinationsOf<Rest>]
  : [];

export type ToMappingDependsOnOption<TOption extends DependsOnOption<any, any>> = TOption extends SimpleDependsOnOption<any>
  ? { component: TOption; destination: TOption }
  : TOption extends MappingDependsOnOption<any, any>
  ? OptionWithDestination<TOption>
  : never; // Impossible situation

type OptionWithDestination<TOption extends MappingDependsOnOption<any, any>> = Omit<TOption, 'destination'> & {
  destination: DependencyDestinationOf<TOption>;
};

export type ValidateDependencies<
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
      ...ValidateDependencies<TSystemic, TCurrent, TDependencies, Rest>,
    ]
  : [];

type ValidateMappingDependency<
  TSystemic extends Record<string, Registration<unknown, boolean>>,
  TCurrent extends keyof TSystemic & string,
  TDependencies extends Record<string, unknown>,
  TMapping extends { component: string; destination: string; source?: string },
> = [PropAt<TDependencies, DependencyDestinationOf<TMapping>>] extends [never]
  ? [] // Unexpected dependency
  : [PropAt<TDependencies, DependencyDestinationOf<TMapping>>] extends [Injected<TSystemic, TCurrent, TMapping>]
  ? [] // Correct dependency
  : [
      DependencyValidationError<
        DependencyDestinationOf<TMapping>,
        PropAt<TDependencies, DependencyDestinationOf<TMapping>>,
        Injected<TSystemic, TCurrent, TMapping>
      >,
    ]; // Wrong type

export type Injected<
  TSystemic extends Record<string, Registration<unknown, boolean>>,
  TCurrent extends keyof TSystemic & string,
  TMapping extends { component: string; destination: string; source?: string },
> = PropAt<
  TSystemic[TMapping['component']]['component'],
  OptionSource<TSystemic[TMapping['component']], TCurrent, TMapping['source']>
>;

type OptionSource<
  TRegistration extends Registration<unknown, boolean>,
  TCurrent extends string,
  TGiven extends string | undefined,
> = TGiven extends string ? TGiven : TRegistration['scoped'] extends true ? TCurrent : undefined;

export type DependencyValidationError<TName extends string, TExpected, TActual> = [TName, TExpected, TActual];
