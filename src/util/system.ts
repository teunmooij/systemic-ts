import initDebug from "debug";
import type { ComponentsOf, Definition, Registration, SystemOf } from "../types";
import { getProperty, hasProperty, setProperty } from "./property";

const debug = initDebug("systemic:system");

export function buildSystem<TSystem extends Record<string, Registration>>(
  components: ComponentsOf<TSystem>,
): SystemOf<TSystem> {
  return Object.entries(components).reduce(
    (acc, [name, component]) => setProperty(acc, name, component),
    {} as SystemOf<TSystem>,
  );
}

export function getDependencies(
  name: string,
  definitions: Map<string, Definition>,
  activeComponents: Record<string, unknown>,
) {
  const dependencies = definitions.get(name)?.dependencies || [];
  return dependencies.reduce<Record<string, any>>(
    (acc, { component: componentName, destination, source, optional }) => {
      const component = activeComponents[componentName];
      if (component) {
        const sourceProperty =
          source || (definitions.get(componentName)?.scoped ? name : undefined);
        const property = sourceProperty ? getProperty(component, sourceProperty) : component;
        setProperty(acc, destination, property);
      } else if (!hasProperty(activeComponents, componentName)) {
        if (optional) {
          debug(`Component ${name} has an unsatisfied optional dependency on ${componentName}`);
        } else {
          throw new Error(`Component ${name} has an unsatisfied dependency on ${componentName}`);
        }
      }

      return acc;
    },
    {},
  );
}
