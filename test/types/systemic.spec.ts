/* eslint-disable no-empty-pattern */
import { EmptyObject, Systemic } from '../../src/types';
import { DependsOn, IncompleteSystemic, SystemicWithInvalidDependency } from '../../src/types/systemic';
import { mockSystemic } from '../helpers/systemic-mock';
import { expectTypes } from '../helpers/type-matchers';

describe('systemic types', () => {
  it('is a systemic with a single component', () => {
    const system = mockSystemic().add('foo', { start: async ({}: EmptyObject) => ({ foo: 'bar' }) });

    type Registrations = { foo: { component: { foo: string }; scoped: false } };
    type Expected = Systemic<Registrations> & DependsOn<Registrations, 'foo', EmptyObject>;

    expectTypes<typeof system, Expected>().toBeEqual();
  });

  it('is a systemic with a single scoped component', () => {
    const system = mockSystemic().add('foo', { start: async ({}: EmptyObject) => ({ foo: 'bar' }) }, { scoped: true });

    type Registrations = { foo: { component: { foo: string }; scoped: true } };
    type Expected = Systemic<Registrations> & DependsOn<Registrations, 'foo', EmptyObject>;

    expectTypes<typeof system, Expected>().toBeEqual();
  });

  it('is a systemic with multiple components', () => {
    const system = mockSystemic()
      .add('foo', { start: async ({}: EmptyObject) => ({ foo: 'bar' }) })
      .add('bar', { start: async ({}: { foo: { foo: 'bar' } }) => 42 })
      .dependsOn('foo');

    type Registrations = { foo: { component: { foo: string }; scoped: false }; bar: { component: number; scoped: false } };
    type Expected = Systemic<Registrations> & DependsOn<Registrations, 'bar', EmptyObject>;

    expectTypes<typeof system, Expected>().toBeEqual();
  });

  it('is a systemic with a missing dependency', () => {
    const system = mockSystemic()
      .add('foo', { start: async ({}: EmptyObject) => ({ foo: 'bar' }) })
      .add('bar', { start: async ({}: { foo: { foo: 'bar' } }) => 42 });

    type Registrations = { foo: { component: { foo: string }; scoped: false }; bar: { component: number; scoped: false } };
    type Expected = IncompleteSystemic<'foo'> & DependsOn<Registrations, 'bar', { foo: { foo: 'bar' } }>;

    expectTypes<typeof system, Expected>().toBeEqual();
  });

  it('is a systemic with an invalid dependency', () => {
    const system = mockSystemic()
      .add('foo', { start: async ({}: EmptyObject) => ({ foo: 'bar' }) })
      .add('bar', { start: async ({}: { foo: { foo: number } }) => 42 })
      .dependsOn('foo');

    type Expected = SystemicWithInvalidDependency<['foo', { foo: number }, { foo: string }]>;

    expectTypes<typeof system, Expected>().toBeEqual();
    expectTypes<
      typeof system['start'],
      (
        error: 'Componenent "foo" in the system is not of the required type',
        expected: { foo: number },
        actual: { foo: string },
      ) => void
    >().toBeEqual();
  });
});
