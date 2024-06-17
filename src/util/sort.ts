import { Definition } from '../types';
import toposort from 'toposort';

export function sortComponents(definitions: Map<string, Definition>, ascending: boolean): string[] {
  const nodes = Array.from(definitions.keys());
  const edges: [string, string][] = Array.from(definitions.entries()).reduce<[string, string][]>(
    (acc, [name, { dependencies }]) => {
      return acc.concat(dependencies.filter(dep => definitions.has(dep.component)).map(dep => [dep.component, name]));
    },
    [],
  );
  const sorted = toposort.array(nodes, edges);

  if (ascending) {
    return sorted;
  }

  return sorted.reverse();
}
