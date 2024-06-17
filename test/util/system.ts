import { Definition } from '../../src/types';
import { buildSystem, getDepdendencies } from '../../src/util';

describe('system', () => {
  describe('buildSystem', () => {
    it('returns a system from the given components', () => {
      const components = {
        a: { component: 1 },
        b: { component: 2 },
        'c.d': { component: 3 },
        'c.e': { component: 4 },
      };

      const result = buildSystem(components);

      expect(result).toEqual({ a: 1, b: 2, c: { d: 3, e: 4 } });
    });
  });

  describe('getDepdendencies', () => {
    it('returns the dependencies for the given component', () => {
      const definitions = new Map<string, Definition>([
        [
          'a',
          {
            component: { start: async () => ({ a: 0 }) },
            dependencies: [
              { component: 'b', destination: 'b', optional: false },
              { component: 'c.d', destination: 'c.d', optional: false },
              { component: 'c.e', destination: 'c.f', optional: false },
              { component: 'd', destination: 'd', optional: true },
            ],
          },
        ],
        ['b', { component: { start: async () => ({ c: 1 }) }, dependencies: [] }],
        ['c.d', { component: { start: async () => 2 }, dependencies: [] }],
        ['c.e', { component: { start: async () => ({ foo: 'bar' }) }, dependencies: [] }],
      ]);
      const activeComponents = {
        'a': { a: 0 },
        'b': { c: 1 },
        'c.d': 2,
        'c.e': { foo: 'bar' },
      };

      const result = getDepdendencies('a', definitions, activeComponents);

      expect(result).toEqual({ b: { c: 1 }, c: { d: 2, e: { foo: 'bar' } } });
    });
  });
});
