import { describe, it, expect } from "vitest";

import type {
  DependencyDestinationsOf,
  DependencyValidationError,
  Injected,
  ToMappingDependsOnOption,
  ValidateDependencies,
} from "../../src/types/dependencies";
import { expectTypes } from "../test-helpers/type-matchers";

describe("dependencies types", () => {
  describe("DependencyDestinationsOf", () => {
    it("is a dependency destination of a string dependency", () => {
      type Dependencies = ["foo"];

      type Result = DependencyDestinationsOf<Dependencies>;

      expectTypes<Result, ["foo"]>().toBeEqual();
    });

    it("is a dependency destination of a mapping dependency", () => {
      type Dependencies = [{ component: "foo"; destination: "bar" }];

      type Result = DependencyDestinationsOf<Dependencies>;

      expectTypes<Result, ["bar"]>().toBeEqual();
    });

    it("is a dependency destination of a mpaaing dependency without destination", () => {
      type Dependencies = [{ component: "foo" }];

      type Result = DependencyDestinationsOf<Dependencies>;

      expectTypes<Result, ["foo"]>().toBeEqual();
    });

    it("is a dependency destination of multiple dependencies", () => {
      type Dependencies = [
        "foo",
        { component: "bar"; destination: "baz" },
        { component: "qux" },
        { component: "quux"; destination: "corge"; optional: true; source: "grault" },
      ];

      type Result = DependencyDestinationsOf<Dependencies>;

      expectTypes<Result, ["foo", "baz", "qux", "corge"]>().toBeEqual();
    });
  });

  describe("ToMappingDependsOnOption", () => {
    it("is a mapping dependency option of a simple dependency", () => {
      type Option = "foo";

      type Result = ToMappingDependsOnOption<Option>;

      expectTypes<Result, { component: "foo"; destination: "foo" }>().toBeEqual();
    });

    it("is a mapping dependency option of a mapping dependency", () => {
      type Option = { component: "foo"; destination: "bar" };

      type Result = ToMappingDependsOnOption<Option>;

      expectTypes<Result, { component: "foo"; destination: "bar" }>().toBeEqual();
    });

    it("is a mapping dependency option of a mapping dependency without destination", () => {
      type Option = { component: "foo" };

      type Result = ToMappingDependsOnOption<Option>;

      expectTypes<Result, { component: "foo"; destination: "foo" }>().toBeEqual();
    });
  });

  describe("ValidateDependencies", () => {
    it("validates a valid simple dependency", () => {
      type Systemic = {
        foo: { component: { foo: string }; scoped: false };
      };

      type Dependencies = { foo: { foo: string } };

      type Given = ["foo"];

      type Result = ValidateDependencies<Systemic, "foo", Dependencies, Given>;

      expectTypes<Result, []>().toBeEqual();
    });

    it("validates an invalid simple dependency", () => {
      type Systemic = {
        foo: { component: { foo: string }; scoped: false };
      };

      type Dependencies = { foo: { bar: number } };

      type Given = ["foo"];

      type Result = ValidateDependencies<Systemic, "foo", Dependencies, Given>;

      expectTypes<
        Result,
        [DependencyValidationError<"foo", { bar: number }, { foo: string }>]
      >().toBeEqual();
    });

    it("validates a valid mapping dependency", () => {
      type Systemic = {
        foo: { component: { foo: string }; scoped: false };
        bar: { component: number; scoped: false };
      };

      type Dependencies = { baz: { foo: string } };

      type Given = [{ component: "foo"; destination: "baz" }];

      type Result = ValidateDependencies<Systemic, "bar", Dependencies, Given>;

      expectTypes<Result, []>().toBeEqual();
    });

    it("validates an invalid mapping dependency", () => {
      type Systemic = {
        foo: { component: { foo: string }; scoped: false };
        bar: { component: number; scoped: false };
      };

      type Dependencies = { baz: { foo: number } };

      type Given = [{ component: "foo"; destination: "baz" }];

      type Result = ValidateDependencies<Systemic, "bar", Dependencies, Given>;

      expectTypes<
        Result,
        [DependencyValidationError<"baz", { foo: number }, { foo: string }>]
      >().toBeEqual();
    });

    it("validates an unexpected mapping dependency", () => {
      type Systemic = {
        foo: { component: { foo: string }; scoped: false };
        bar: { component: number; scoped: false };
        qux: { component: { foo: string }; scoped: false };
      };

      type Dependencies = { baz: { foo: string } };

      type Given = [{ component: "qux"; destination: "baz" }];

      type Result = ValidateDependencies<Systemic, "bar", Dependencies, Given>;

      expectTypes<Result, []>().toBeEqual();
    });

    it("validates a valid mapping dependency with source", () => {
      type Systemic = {
        foo: { component: { foo: string }; scoped: false };
        bar: { component: number; scoped: false };
      };

      type Dependencies = { baz: string };

      type Given = [{ component: "foo"; destination: "baz"; source: "foo" }];

      type Result = ValidateDependencies<Systemic, "bar", Dependencies, Given>;

      expectTypes<Result, []>().toBeEqual();
    });

    it("validates an invalid mapping dependency with source", () => {
      type Systemic = {
        foo: { component: { foo: string }; scoped: false };
        bar: { component: number; scoped: false };
      };

      type Dependencies = { baz: number };

      type Given = [{ component: "foo"; destination: "baz"; source: "foo" }];

      type Result = ValidateDependencies<Systemic, "bar", Dependencies, Given>;

      expectTypes<Result, [DependencyValidationError<"baz", number, string>]>().toBeEqual();
    });

    it('regards a mapping dependency invalid if the destination is "string"', () => {
      type Systemic = {
        foo: { component: { foo: string }; scoped: false };
        bar: { component: number; scoped: false };
      };

      type Dependencies = { baz: string };

      type Given = [{ component: "foo"; destination: string }];

      type Result = ValidateDependencies<Systemic, "bar", Dependencies, Given>;

      expectTypes<Result, [DependencyValidationError<string, unknown, unknown>]>().toBeEqual();
    });

    it('regards a mapping dependency invalid if the source is "string"', () => {
      type Systemic = {
        foo: { component: { foo: string }; scoped: false };
        bar: { component: number; scoped: false };
      };

      type Dependencies = { baz: string };

      type Given = [{ component: "foo"; destination: "baz"; source: string }];

      type Result = ValidateDependencies<Systemic, "bar", Dependencies, Given>;

      expectTypes<Result, [DependencyValidationError<string, unknown, unknown>]>().toBeEqual();
    });

    it("is valid when the injected dependency extends the expected dependency", () => {
      type Systemic = {
        foo: { component: { foo: "bar" | "baz" }; scoped: false };
      };

      type Dependencies = { foo: { foo: string } };

      type Given = ["foo"];

      type Result = ValidateDependencies<Systemic, "foo", Dependencies, Given>;

      expectTypes<Result, []>().toBeEqual();
    });
  });

  describe("injected", () => {
    it("is an injected dependency without source", () => {
      type Systemic = {
        foo: { component: { foo: string }; scoped: false };
      };

      type Mapping = { component: "foo"; destination: "foo" };

      type Result = Injected<Systemic, "foo", Mapping>;

      expectTypes<Result, { foo: string }>().toBeEqual();
    });

    it("is an injected dependency with source", () => {
      type Systemic = {
        foo: { component: { foo: string }; scoped: false };
      };

      type Mapping = { component: "foo"; destination: "foo"; source: "foo" };

      type Result = Injected<Systemic, "foo", Mapping>;

      expectTypes<Result, string>().toBeEqual();
    });

    it("is an injected scoped dependency", () => {
      type Systemic = {
        foo: { component: { foo: string }; scoped: true };
      };

      type Mapping = { component: "foo"; destination: "foo" };

      type Result = Injected<Systemic, "foo", Mapping>;

      expectTypes<Result, string>().toBeEqual();
    });

    it("is an injected nested dependency", () => {
      type Systemic = {
        "foo.bar": { component: { baz: string }; scoped: false };
        baz: { component: { baz: string }; scoped: false };
      };

      type Mapping = { component: "foo.bar"; destination: "foo.bar" };

      type Result = Injected<Systemic, "baz", Mapping>;

      expectTypes<Result, { baz: string }>().toBeEqual();
    });
  });
});
