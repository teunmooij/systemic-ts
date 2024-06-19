import type { Definition, EmptyObject, Systemic } from "../../src/types";

/**
 * Creates a mock systemic instance, whithout any functionality. It can be used to test the types of the Systemic interface.
 * @returns the mock systemic
 */
export function mockSystemic(): Systemic<EmptyObject> {
  return {
    name: "mock-system",
    add() {
      return this;
    },
    set() {
      return this;
    },
    configure() {
      return this;
    },
    remove() {
      return this;
    },
    merge() {
      return this;
    },
    include() {
      return this;
    },
    async start() {
      return {};
    },
    async stop() {
      /* noop */
    },
    async restart() {
      return {};
    },
    dependsOn() {
      return this;
    },
    _definitions: new Map<string, Definition>(),
  } as unknown as Systemic<EmptyObject>;
}
