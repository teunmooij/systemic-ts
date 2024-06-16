import type {
  DeepRequiredOnly,
  DeleteProp,
  DeleteProps,
  EmptyObject,
  PropAt,
  RequiredKeys,
  SetNestedProp,
  StripEmptyObjectsRecursively,
  UnionToTuple,
} from '../../src/types/util';
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

  it('is a deep required version of the given object', () => {
    type Test = {
      a?: string;
      b: string;
      c: { d?: string };
    };

    type Result = DeepRequiredOnly<Test>;

    expectTypes<Result, { b: string; c: EmptyObject }>().toBeEqual();
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

  it('strips empty objects recursively', () => {
    type Source = {
      a: {
        b: {
          c: string;
          d: EmptyObject;
        };
        e: EmptyObject;
      };
      f: EmptyObject;
      g: { h: { i: EmptyObject } };
    };

    type Result = StripEmptyObjectsRecursively<Source>;

    expectTypes<Result, { a: { b: { c: string } } }>().toBeEqual();
  });

  it('deletes a property at the given key', () => {
    type Source = {
      a: {
        b: {
          c: string;
          d: string;
        };
      };
      e: number;
    };

    type Result1 = DeleteProp<Source, 'a.b.c'>;
    type Result2 = DeleteProp<Source, 'a.b'>;
    type Result3 = DeleteProp<Source, 'a'>;
    type Result4 = DeleteProp<Source, 'e'>;
    type Result5 = DeleteProp<Source, 'f'>;
    type Result6 = DeleteProp<Result1, 'a.b.d'>;

    expectTypes<Result1, { a: { b: { d: string } }; e: number }>().toBeEqual();
    expectTypes<Result2, { a: EmptyObject; e: number }>().toBeEqual();
    expectTypes<Result3, { e: number }>().toBeEqual();
    expectTypes<Result4, { a: { b: { c: string; d: string } } }>().toBeEqual();
    expectTypes<Result5, Source>().toBeEqual();
    expectTypes<Result6, { a: { b: EmptyObject }; e: number }>().toBeEqual();

    expectTypes<StripEmptyObjectsRecursively<Result2>, { e: number }>().toBeEqual();
    expectTypes<StripEmptyObjectsRecursively<Result6>, { e: number }>().toBeEqual();
  });

  it('deletes multiple properties at the given keys', () => {
    type Source = {
      a: {
        b: {
          c: string;
          d: string;
        };
      };
      e: number;
      f: string;
    };

    type Result = DeleteProps<Source, ['a.b.c', 'e']>;

    expectTypes<Result, { a: { b: { d: string } }; f: string }>().toBeEqual();
  });
});
