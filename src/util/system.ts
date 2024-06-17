import initDebug from 'debug';
import { ComponentsOf, Definition, Registration, SystemOf } from '../types';
import { getProperty, setProperty } from './property';

const debug = initDebug('systemic:system');

export function buildSystem<TSystem extends Record<string, Registration>>(components: ComponentsOf<TSystem>): SystemOf<TSystem> {
  return Object.entries(components).reduce(
    (acc, [name, component]) => setProperty(acc, name, component),
    {} as SystemOf<TSystem>,
  );
}

export function getDepdendencies(name: string, definitions: Map<string, Definition>, activeComponents: Record<string, unknown>) {
  const dependencies = definitions.get(name)?.dependencies || [];
  return dependencies.reduce<Record<string, any>>((acc, { component: componentName, destination, source, optional }) => {
    const component = activeComponents[componentName];
    if (component) {
      const propertyName = source || (definitions.get(componentName)?.scoped ? name : undefined);
      const property = propertyName ? getProperty(component, propertyName) : component;
      setProperty(acc, destination, property);
    } else {
      if (optional) {
        debug(`Component ${name} has an unsatisfied optional dependency on ${componentName}`);
      } else {
        throw new Error(`Component ${name} has an unsatisfied dependency on ${componentName}`);
      }
    }

    return acc;
  }, {});
}
