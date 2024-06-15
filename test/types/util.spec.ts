import type { EmptyObject, PropAt, RequiredKeys, SetNestedProp, UnionToTuple } from '../../src/types/util';
import { expectTypes } from '../helpers/type-matchers';

describe('util types', () => {
  it('EmptyObject is an empty object type', () => {
    type Result = EmptyObject;

    // eslint-disable-next-line @typescript-eslint/ban-types
    expectTypes<Result, {}>().toBeEqual();
  });

  it('is the set of keys that are required in a given object', () => {
    type Test = {
      a?: string;
      b: string;
      c: { d?: string };
    };

    type Result = RequiredKeys<Test>;

    expectTypes<Result, 'b' | 'c'>().toBeEqual();
  });

  it('is a tuple of the given union', () => {
    type Test = 'a' | 'b' | 'c';

    type Result = UnionToTuple<Test>;

    // test might be unstable as the order of the tuple is not guaranteed
    expectTypes<Result, ['a', 'b', 'c']>().toBeEqual();
  });

  it('is a property at the given key', () => {
    type Source = {
      a: {
        b: {
          c: string;
        };
      };
      d: number;
    };

    expectTypes<PropAt<Source, undefined>, Source>().toBeEqual();
    expectTypes<PropAt<Source, 'a'>, { b: { c: string } }>().toBeEqual();
    expectTypes<PropAt<Source, 'a.b'>, { c: string }>().toBeEqual();
    expectTypes<PropAt<Source, 'a.b.c'>, string>().toBeEqual();
    expectTypes<PropAt<Source, 'd'>, number>().toBeEqual();
    expectTypes<PropAt<Source, 'e'>, never>().toBeEqual();
    expectTypes<PropAt<Source, 'a.b.c.d'>, never>().toBeEqual();
  });

  it('sets a nested property at the given key', () => {
    type Source = {
      a: {
        b: {
          c: string;
        };
      };
      d: number;
    };

    type Result1 = SetNestedProp<Source, 'a.b.c', number>;
    type Result2 = SetNestedProp<Source, 'a.b.d', number>;
    type Result3 = SetNestedProp<Source, 'a.b', number>;
    type Result4 = SetNestedProp<Source, 'a.b.c.d', number>;

    expectTypes<Result1, { a: { b: { c: number } }; d: number }>().toBeEqual();
    expectTypes<Result2, { a: { b: { c: string; d: number } }; d: number }>().toBeEqual();
    expectTypes<Result3, { a: { b: number }; d: number }>().toBeEqual();
    expectTypes<Result4, { a: { b: { c: { d: number } } }; d: number }>().toBeEqual();
  });
});
