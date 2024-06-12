import { sortComponents } from '../../src/helpers/sort';
import { Definition } from '../../src/types';

const component = { start: async () => ({}) };

describe('sort', () => {
  it('sorts the components based on their dependencies (for start)', () => {
    const definitions: Record<string, Definition> = {
      a: { component, dependencies: [{ component: 'b', destination: 'b', optional: false }] },
      c: { component, dependencies: [] },
      b: { component, dependencies: [{ component: 'c', destination: 'c', optional: false }] },
    };
    const sorted = sortComponents(definitions, true);
    expect(sorted).toEqual(['c', 'b', 'a']);
  });

  it('reverse sorts the components based on their dependencies (for stop)', () => {
    const definitions: Record<string, Definition> = {
      a: { component, dependencies: [{ component: 'b', destination: 'b', optional: false }] },
      c: { component, dependencies: [] },
      b: { component, dependencies: [{ component: 'c', destination: 'c', optional: false }] },
    };
    const sorted = sortComponents(definitions, false);
    expect(sorted).toEqual(['a', 'b', 'c']);
  });

  it('throws an error if there is a circular dependency', () => {
    const definitions: Record<string, Definition> = {
      a: { component, dependencies: [{ component: 'b', destination: 'b', optional: false }] },
      b: { component, dependencies: [{ component: 'a', destination: 'a', optional: false }] },
    };
    expect(() => sortComponents(definitions, true)).toThrowError('Cyclic dependency, node was:"b"');
  });
});
