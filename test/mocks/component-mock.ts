import type { Component } from '../../src';
import { EmptyObject } from '../../src/types';

interface State {
  numberOfStarts: number;
  isActive: boolean;
  dependencies: any;
}

export function mockComponent<TDependencies extends Record<string, unknown> = EmptyObject>(
  name: string,
): jest.Mocked<Component<string, TDependencies>> & { state: State } {
  const state: State = { numberOfStarts: 0, isActive: false, dependencies: undefined };
  return {
    start: jest.fn().mockImplementation((dependencies: any) => {
      state.numberOfStarts++;
      state.isActive = true;
      state.dependencies = dependencies;
      return name;
    }),
    stop: jest.fn().mockImplementation(() => {
      state.isActive = false;
    }),
    state,
  };
}
