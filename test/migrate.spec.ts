import { describe, it, expect, vi } from "vitest";

import { asCallbackSystem, promisifyComponent, upgradeSystem } from "../src/migrate";
import type { Systemic } from "../src";
import { expectType } from "./test-helpers/type-matchers";

describe("migrate", () => {
  describe("asCallbackSystem", () => {
    it("converts a systemic system to a callback system", () =>
      new Promise<void>((done) => {
        const system = {
          start: vi.fn().mockResolvedValue("started"),
          stop: vi.fn().mockResolvedValue("stopped"),
          restart: vi.fn().mockResolvedValue("restarted"),
        } as unknown as Systemic<any>;

        const callbackSystem = asCallbackSystem(system);

        callbackSystem.start((error, result) => {
          expect(error).toBeNull();
          expect(result).toBe("started");
          expect(system.start).toHaveBeenCalled();

          callbackSystem.stop((error) => {
            expect(error).toBeNull();
            expect(system.stop).toHaveBeenCalled();

            callbackSystem.restart((error, result) => {
              expect(error).toBeNull();
              expect(result).toBe("restarted");
              expect(system.restart).toHaveBeenCalled();

              done();
            });
          });
        });
      }));

    it("calls the callback with an error when starting the system fails", () =>
      new Promise<void>((done) => {
        const system = {
          start: vi.fn().mockRejectedValue(new Error("start error")),
          stop: vi.fn().mockResolvedValue("stopped"),
          restart: vi.fn().mockResolvedValue("restarted"),
        } as unknown as Systemic<any>;

        const callbackSystem = asCallbackSystem(system);

        callbackSystem.start((error, result) => {
          expect(error).toEqual(new Error("start error"));
          expect(result).toBeUndefined();
          expect(system.start).toHaveBeenCalled();

          done();
        });
      }));

    it("calls the callback with an error when stopping the system fails", () =>
      new Promise<void>((done) => {
        const system = {
          start: vi.fn().mockResolvedValue("started"),
          stop: vi.fn().mockRejectedValue(new Error("stop error")),
          restart: vi.fn().mockResolvedValue("restarted"),
        } as unknown as Systemic<any>;

        const callbackSystem = asCallbackSystem(system);

        callbackSystem.stop((error) => {
          expect(error).toEqual(new Error("stop error"));
          expect(system.stop).toHaveBeenCalled();

          done();
        });
      }));

    it("calls the callback with an error when restarting the system fails", () =>
      new Promise<void>((done) => {
        const system = {
          start: vi.fn().mockResolvedValue("started"),
          stop: vi.fn().mockResolvedValue("stopped"),
          restart: vi.fn().mockRejectedValue(new Error("restart error")),
        } as unknown as Systemic<any>;

        const callbackSystem = asCallbackSystem(system);

        callbackSystem.restart((error, result) => {
          expect(error).toEqual(new Error("restart error"));
          expect(result).toBeUndefined();
          expect(system.restart).toHaveBeenCalled();

          done();
        });
      }));
  });

  describe("promisifyComponent", () => {
    it("promisifies a callback component", async () => {
      const callbackComponent = {
        start: (
          dependencies: { foo: string },
          callback: (err: any, component: { foo: string; bar: string }) => void,
        ) => {
          callback(null, { foo: dependencies.foo, bar: "baz" });
        },
      };

      const component = promisifyComponent(callbackComponent);

      const result = await component.start({ foo: "bar" });

      expect(result).toEqual({ foo: "bar", bar: "baz" });
    });

    it("returns a rejected promise when starting the promisified component fails", async () => {
      const callbackComponent = {
        start: (
          dependencies: { foo: string },
          callback: (err: any, component: { foo: string; bar: string } | null) => void,
        ) => {
          callback(new Error("start error"), null);
        },
      };

      const component = promisifyComponent(callbackComponent);

      await expect(component.start({ foo: "bar" })).rejects.toThrow("start error");
    });

    it("promisifies a callback component with stop", async () => {
      let started = false;

      const callbackComponent = {
        start: (
          dependencies: { foo: string },
          callback: (err: any, component: { foo: string; bar: string }) => void,
        ) => {
          started = true;
          callback(null, { foo: dependencies.foo, bar: "baz" });
        },
        stop: (callback: (err?: any) => void) => {
          started = false;
          callback();
        },
      };

      const component = promisifyComponent(callbackComponent);

      const result = await component.start({ foo: "bar" });

      expect(result).toEqual({ foo: "bar", bar: "baz" });
      expect(started).toBe(true);

      await component.stop?.();
      expect(started).toBe(false);
    });

    it("returns a rejected promise when stopping the promisified component fails", async () => {
      const callbackComponent = {
        start: (
          dependencies: { foo: string },
          callback: (err: any, component: { foo: string; bar: string }) => void,
        ) => {
          callback(null, { foo: dependencies.foo, bar: "baz" });
        },
        stop: (callback: (err?: any) => void) => {
          callback(new Error("stop error"));
        },
      };

      const component = promisifyComponent(callbackComponent);

      const result = await component.start({ foo: "bar" });

      await expect(component.stop?.()).rejects.toThrow("stop error");
    });
  });

  describe("upgrade system", () => {
    it("converts a legacy systemic system to a systemic-ts system", async () => {
      const _definitions = {
        foo: { name: "foo", component: { start: async () => "foo" }, dependencies: [] },
        bar: {
          name: "bar",
          component: {
            start: (dep, cb) => {
              cb(null, `${dep.foo}-bar`);
            },
          },
          dependencies: [{ component: "foo", destination: "foo" }],
        },
        baz: {
          name: "baz",
          component: { start: async (dep) => `${dep.qux}-baz` },
          dependencies: [{ component: "bar", destination: "qux" }],
        },
      };

      const legacySystem = {
        name: "legacy",
        _definitions,
      } as unknown as { name: string; start(): Promise<Record<"foo" | "bar" | "baz", string>> };

      const system = upgradeSystem(legacySystem);
      type ExpectedSystem = {
        foo: { component: string; scoped: false };
        bar: { component: string; scoped: false };
        baz: { component: string; scoped: false };
      };
      expectType<typeof system extends Systemic<ExpectedSystem> ? true : false>().toBeTrue();

      const result = await system.start();
      expect(result).toEqual({ foo: "foo", bar: "foo-bar", baz: "foo-bar-baz" });
    });
  });
});
