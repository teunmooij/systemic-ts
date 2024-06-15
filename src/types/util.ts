// eslint-disable-next-line @typescript-eslint/ban-types
export type EmptyObject = {};

export type RequiredKeys<T> = {
  [K in keyof T]-?: EmptyObject extends Pick<T, K> ? never : K;
}[keyof T] &
  string;

export type UnionToTuple<T, L = LastOf<T>, N = [T] extends [never] ? true : false> = true extends N
  ? []
  : Push<UnionToTuple<Exclude<T, L>>, L>;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
type LastOf<T> = UnionToIntersection<T extends any ? () => T : never> extends () => infer R ? R : never;

type Push<T extends any[], V> = [...T, V];

export type PropAt<Source, Key> = Key extends string
  ? Key extends keyof Source
    ? Source[Key]
    : Key extends `${infer Key extends keyof Source & string}.${infer Subkey}`
    ? PropAt<Source[Key], Subkey>
    : never
  : Source;

export type SetNestedProp<Source, Key extends string, Value> = Key extends `${infer Prop}.${infer Rest}`
  ? {
      [P in Prop | keyof Source]: P extends Exclude<keyof Source, Prop>
        ? Source[P]
        : SetNestedProp<
            Source extends Record<string, unknown>
              ? Source[Prop] extends Record<string, unknown>
                ? Source[Prop]
                : EmptyObject
              : EmptyObject,
            Rest,
            Value
          >;
    }
  : {
      [P in Key | keyof Source]: P extends Exclude<keyof Source, Key> ? Source[P] : Value;
    };
