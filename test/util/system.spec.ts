import type { Definition } from "../../src/types";
import { buildSystem, getDependencies } from "../../src/util";

describe("system", () => {
  describe("buildSystem", () => {
    it("returns a system from the given components", () => {
      const components = {
        a: 1,
        b: 2,
        "c.d": 3,
        "c.e": 4,
      };

      const result = buildSystem(components);

      expect(result).toEqual({ a: 1, b: 2, c: { d: 3, e: 4 } });
    });
  });

  describe("getDepdendencies", () => {
    it("returns the dependencies for the given component", () => {
      const definitions = new Map<string, Definition>([
        [
          "a",
          {
            component: { start: async () => ({ a: 0 }) },
            dependencies: [
              { component: "b", destination: "b", optional: false },
              { component: "c.d", destination: "c.d", optional: false },
              { component: "c.e", destination: "c.f", optional: false },
              { component: "d", destination: "d", optional: true },
              { component: "e", destination: "e", optional: false },
            ],
          },
        ],
        ["b", { component: { start: async () => ({ c: 1 }) }, dependencies: [] }],
        ["c.d", { component: { start: async () => 2 }, dependencies: [] }],
        ["c.e", { component: { start: async () => ({ foo: "bar" }) }, dependencies: [] }],
        ["e", { component: { start: async () => void 0 }, dependencies: [] }],
      ]);
      const activeComponents = {
        a: { a: 0 },
        b: { c: 1 },
        "c.d": 2,
        "c.e": { foo: "bar" },
        e: void 0,
      };

      const result = getDependencies("a", definitions, activeComponents);

      expect(result).toEqual({ b: { c: 1 }, c: { d: 2, f: { foo: "bar" } } });
    });
  });
});
