import { ComponentTypeOf, DependenciesOf, IsComponent } from '../../src/types';
import { expectType, expectTypes } from '../test-helpers/type-matchers';

describe('component types', () => {
  it('is a component', () => {
    const component = { start: async () => ({}) };
    expectType<IsComponent<typeof component>>().toBeTrue();
  });

  it('is a synchronous component', () => {
    const component = { start: () => ({}) };
    expectType<IsComponent<typeof component>>().toBeTrue();
  });

  it('is a function component', () => {
    const component = () => ({});
    expectType<IsComponent<typeof component>>().toBeTrue();
  });

  it('is not a component', () => {
    const component = {};
    expectType<IsComponent<typeof component> | false>().toBeFalse();
  });

  it('is returning the type of a component', () => {
    const component = { start: async () => ({ foo: 5 }) };
    expectTypes<ComponentTypeOf<typeof component>, { foo: number }>().toBeEqual();
  });

  it('is the type of the dependencies of a given component', () => {
    const component = {
      start: async ({ foo }: { foo: number }) => ({ bar: foo }),
    };
    expectTypes<DependenciesOf<typeof component>, { foo: number }>().toBeEqual();
  });
});
