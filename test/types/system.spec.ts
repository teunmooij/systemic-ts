import type { Registration, SystemOf } from '../../src/types';
import { expectTypes } from '../test-helpers/type-matchers';

describe('system types', () => {
  it('is the type of the system defined by the given definition', () => {
    type Definition = {
      foo: Registration<{ foo: string }>;
      bar: Registration<number>;
      'baz.qux': Registration<{ qux: boolean }>;
      'baz.quux': Registration<string>;
    };

    type System = SystemOf<Definition>;

    expectTypes<System, { foo: { foo: string }; bar: number; baz: { qux: { qux: boolean }; quux: string } }>().toBeEqual();
  });
});
