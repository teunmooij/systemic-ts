import type { AsRegistrations } from "../../src/types";
import { expectTypes } from "../test-helpers/type-matchers";

describe("definition types", () => {
  it("defines the registrations of the given system", () => {
    type System = {
      foo: { component: { foo: string }; scoped: false };
      bar: number;
      baz: { baz: boolean };
      "qux.quux": { component: { qux: boolean }; scoped: false };
      corge: { component: { corge: string }; scoped: true };
    };

    type Expected = {
      foo: { component: { foo: string }; scoped: false };
      bar: { component: number; scoped: false };
      baz: { component: { baz: boolean }; scoped: false };
      "qux.quux": { component: { qux: boolean }; scoped: false };
      corge: { component: { corge: string }; scoped: true };
    };

    expectTypes<AsRegistrations<System>, Expected>().toBeEqual();
  });
});
