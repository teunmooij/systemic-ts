import type { EmptyObject } from './util';

/**
 * Systemic component that can be added to the systemic system.
 * @template TComponent The type of the component that will be exposed by the systemic system
 * @template TDependencies The type of the dependencies this component depends on
 */
export type Component<TComponent, TDependencies extends Record<string, unknown> = EmptyObject> = {
  /**
   * Starts this component
   * @param {TDependencies} dependencies The dependencies of this component
   * @returns A started component
   */
  start: (dependencies: TDependencies) => Promise<TComponent> | TComponent;
  /**
   * Stops this component
   */
  stop?: () => Promise<void> | void;
};

/**
 * @deprecated Please use `Component instead`.
 * Legacy callback based components can be converted to promise based components using the `promisifyComponent` function.
 */
export type CallbackComponent<TComponent, TDependencies extends Record<string, unknown> = EmptyObject> = {
  /**
   * Starts this component
   * @param {TDependencies} dependencies The dependencies of this component
   * @param callback Callback receives the component after it has been built
   */
  start: (dependencies: TDependencies, callback: (err: any, component: TComponent) => void) => void;
  /**
   * Stops this component
   * @param callback Callback is called when the component has been stopped
   */
  stop?: (callback: (err?: any) => void) => void;
};

export type IsComponent<T> = T extends Component<any, any> ? true : false;
export type ComponentTypeOf<T> = T extends Component<infer C, any> ? C : never;
export type DependenciesOf<T> = T extends Component<any, infer D> ? D : EmptyObject;
