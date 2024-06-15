import type { Registration } from './definition';
import type { EmptyObject, SetNestedProp, UnionToTuple } from './util';

// Build the system type from the system definition
export type SystemOf<TSystem extends Record<string, Registration>> = BuildSystem<UnionToTuple<ComponentEntries<TSystem>>>;

type ComponentEntries<TSystem extends Record<string, Registration>> = keyof TSystem extends infer P
  ? P extends keyof TSystem & string
    ? [P, Required<TSystem>[P] extends never ? undefined : Required<TSystem>[P]['component']]
    : never
  : never;

type BuildSystem<TSystem extends unknown[], Acc extends Record<string, unknown> = EmptyObject> = TSystem extends [
  infer TEntry,
  ...infer Rest,
]
  ? TEntry extends [infer TName extends string, infer TComponent]
    ? BuildSystem<Rest, SetNestedProp<Acc, TName, TComponent>>
    : never
  : Acc;
