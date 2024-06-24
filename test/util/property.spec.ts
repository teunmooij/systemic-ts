import { getProperty, hasProperty, setProperty } from "../../src/util/property";

describe("property", () => {
  describe("hasProperty", () => {
    it("returns true if the property exists in source", () => {
      const source = { a: { b: { c: 1 } } };
      const key = "a";

      const result = hasProperty(source, key);

      expect(result).toBe(true);
    });

    it("returns true if the nested property exists in source", () => {
      const source = { a: { b: { c: 1 } } };
      const key = "a.b";

      const result = hasProperty(source, key);

      expect(result).toBe(true);
    });

    it("returns false if the property does not exist in source", () => {
      const source = { a: { b: { c: 1 } } };
      const key = "b";

      const result = hasProperty(source, key);

      expect(result).toBe(false);
    });

    it("returns false if the nested property does not exist in source", () => {
      const source = { a: { b: { c: 1 } } };
      const key = "a.c";

      const result = hasProperty(source, key);

      expect(result).toBe(false);
    });
  });

  describe("getProperty", () => {
    it("returns the property if it exists in source", () => {
      const source = { a: { b: { c: 1 } } };
      const key = "a";

      const result = getProperty(source, key);

      expect(result).toEqual({ b: { c: 1 } });
    });

    it("returns the nested property if it exists in source", () => {
      const source = { a: { b: { c: 1 } } };
      const key = "a.b";

      const result = getProperty(source, key);

      expect(result).toEqual({ c: 1 });
    });

    it("returns undefined if the property does not exist in source", () => {
      const source = { a: { b: { c: 1 } } };
      const key = "b";

      const result = getProperty(source, key);

      expect(result).toBeUndefined();
    });

    it("returns undefined if the nested property does not exist in source", () => {
      const source = { a: { b: { c: 1 } } };
      const key = "a.c";

      const result = getProperty(source, key);

      expect(result).toBeUndefined();
    });
  });

  describe("setProperty", () => {
    it("sets the property if it does not exist in source", () => {
      const source = { a: { b: { c: 1 } } };
      const key = "b";
      const value = { d: 2 };

      setProperty(source, key, value);

      expect(source).toEqual({ a: { b: { c: 1 } }, b: { d: 2 } });
    });

    it("sets the nested property if it does not exist in source", () => {
      const source = { a: { b: { c: 1 } } };
      const key = "a.c";
      const value = 2;

      setProperty(source, key, value);

      expect(source).toEqual({ a: { b: { c: 1 }, c: 2 } });
    });

    it("updates the property if it exists in source", () => {
      const source = { a: { b: { c: 1 } } };
      const key = "a";
      const value = { d: 2 };

      setProperty(source, key, value);

      expect(source).toEqual({ a: { d: 2 } });
    });

    it("updates the nested property if it exists in source", () => {
      const source = { a: { b: { c: 1 } } };
      const key = "a.b";
      const value = 2;

      setProperty(source, key, value);

      expect(source).toEqual({ a: { b: 2 } });
    });
  });
});
