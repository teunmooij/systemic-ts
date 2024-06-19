import { type Mocked, vi } from "vitest";
import type { Component } from "../../src";
import type { EmptyObject } from "../../src/types";

interface State {
  numberOfStarts: number;
  isActive: boolean;
  dependencies: any;
}

export function mockComponent<TDependencies extends Record<string, unknown> = EmptyObject>(
  name: string,
): Mocked<Required<Component<string, TDependencies>>> & { state: State } {
  const state: State = { numberOfStarts: 0, isActive: false, dependencies: undefined };
  return {
    start: vi.fn().mockImplementation((dependencies: any) => {
      state.numberOfStarts++;
      state.isActive = true;
      state.dependencies = dependencies;
      return name;
    }),
    stop: vi.fn().mockImplementation(() => {
      state.isActive = false;
    }),
    state,
  };
}
