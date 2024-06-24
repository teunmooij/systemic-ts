import { asCallbackSystem, promisifyComponent, upgradeSystem } from "../src/migrate";
import { systemic, type Systemic } from "../src";
import { expectType } from "./test-helpers/type-matchers";

describe("migrate", () => {
  describe("asCallbackSystem", () => {
    it("converts a systemic system to a callback system", () =>
      new Promise<void>((done) => {
        const system = {
          start: jest.fn().mockResolvedValue("started"),
          stop: jest.fn().mockResolvedValue("stopped"),
          restart: jest.fn().mockResolvedValue("restarted"),
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
          start: jest.fn().mockRejectedValue(new Error("start error")),
          stop: jest.fn().mockResolvedValue("stopped"),
          restart: jest.fn().mockResolvedValue("restarted"),
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
          start: jest.fn().mockResolvedValue("started"),
          stop: jest.fn().mockRejectedValue(new Error("stop error")),
          restart: jest.fn().mockResolvedValue("restarted"),
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
          start: jest.fn().mockResolvedValue("started"),
          stop: jest.fn().mockResolvedValue("stopped"),
          restart: jest.fn().mockRejectedValue(new Error("restart error")),
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
      const foo = {
        start: jest.fn().mockResolvedValue("foo"),
        stop: jest.fn().mockReturnValue(Promise.resolve()),
      };
      const bar = {
        start: jest.fn().mockImplementation((dep, cb) => {
          cb(null, `${dep.foo}-bar`);
        }),
        stop: jest.fn().mockImplementation((cb) => {
          cb();
        }),
      };

      const _definitions = {
        foo: { name: "foo", component: foo, dependencies: [] },
        bar: {
          name: "bar",
          component: bar,
          dependencies: [{ component: "foo", destination: "foo" }],
        },
        baz: {
          name: "baz",
          component: { start: async (dep: { qux: string }) => `${dep.qux}-baz` },
          dependencies: [{ component: "bar", destination: "qux" }],
        },
        corge: {
          name: "corge",
          component: "corge",
          dependencies: [],
        },
      };

      const legacySystem = {
        name: "legacy",
        _definitions,
      } as unknown as {
        name: string;
        start(): Promise<Record<"foo" | "bar" | "baz" | "corge", string>>;
      };

      const system = upgradeSystem(legacySystem);
      type ExpectedSystem = {
        foo: { component: string; scoped: false };
        bar: { component: string; scoped: false };
        baz: { component: string; scoped: false };
        corge: { component: string; scoped: false };
      };
      expectType<typeof system extends Systemic<ExpectedSystem> ? true : false>().toBeTrue();

      const result = await system.start();
      expect(result).toEqual({ foo: "foo", bar: "foo-bar", baz: "foo-bar-baz", corge: "corge" });

      await system.stop();
      expect(foo.start).toHaveBeenCalledTimes(1);
      expect(foo.stop).toHaveBeenCalledTimes(1);
      expect(bar.start).toHaveBeenCalledTimes(1);
      expect(bar.stop).toHaveBeenCalledTimes(1);
    });

    it("throws an error when the legacy system is not a valid legacy systemic system", () => {
      const legacySystem = systemic();
      expect(() => upgradeSystem(legacySystem)).toThrowError(
        "The system does not have the expected internal structure",
      );
    });

    it("throws an error when component in upgraded system fails to start", async () => {
      const foo = { start: jest.fn().mockRejectedValue(new Error("foo error")) };
      const _definitions = {
        foo: { name: "foo", component: foo, dependencies: [] },
      };

      const legacySystem = {
        name: "legacy",
        _definitions,
      } as unknown as { name: string; start(): Promise<Record<"foo", string>> };

      const system = upgradeSystem(legacySystem);
      await expect(system.start()).rejects.toThrow("foo error");
    });

    it("throws an error when callback component in upgraded system fails to start", async () => {
      const foo = { start: jest.fn().mockImplementation((dep, cb) => cb(new Error("foo error"))) };
      const _definitions = {
        foo: { name: "foo", component: foo, dependencies: [] },
      };

      const legacySystem = {
        name: "legacy",
        _definitions,
      } as unknown as { name: string; start(): Promise<Record<"foo", string>> };

      const system = upgradeSystem(legacySystem);
      await expect(system.start()).rejects.toThrow("foo error");
    });

    it("throws an error when component in upgraded system fails to stop", async () => {
      const foo = {
        start: jest.fn().mockResolvedValue("foo"),
        stop: jest.fn().mockRejectedValue(new Error("foo error")),
      };
      const _definitions = {
        foo: { name: "foo", component: foo, dependencies: [] },
      };

      const legacySystem = {
        name: "legacy",
        _definitions,
      } as unknown as { name: string; start(): Promise<Record<"foo", string>> };

      const system = upgradeSystem(legacySystem);
      await system.start();

      await expect(system.stop()).rejects.toThrow("foo error");
    });

    it("throws an error when callback component in upgraded system fails to stop", async () => {
      const foo = {
        start: jest.fn().mockImplementation((dep, cb) => cb(null, "foo")),
        stop: jest.fn().mockImplementation((cb) => cb(new Error("foo error"))),
      };
      const _definitions = {
        foo: { name: "foo", component: foo, dependencies: [] },
      };

      const legacySystem = {
        name: "legacy",
        _definitions,
      } as unknown as { name: string; start(): Promise<Record<"foo", string>> };

      const system = upgradeSystem(legacySystem);
      await system.start();

      await expect(system.stop()).rejects.toThrow("foo error");
    });
  });
});
