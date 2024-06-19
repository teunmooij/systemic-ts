import { describe, it, expect, vi } from "vitest";

import { asCallbackSystem, promisifyComponent } from "../src";
import type { Systemic } from "../src";

describe("promisify", () => {
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
});
