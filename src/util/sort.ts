import { Definition } from '../types';
import toposort from 'toposort';

export function sortComponents(definitions: Record<string, Definition>, ascending: boolean): string[] {
  const nodes = Object.keys(definitions);
  const edges: [string, string][] = Object.entries(definitions).reduce<[string, string][]>((acc, [name, { dependencies }]) => {
    return acc.concat(dependencies.map(dep => [dep.component, name]));
  }, []);
  const sorted = toposort.array(nodes, edges);

  if (ascending) {
    return sorted;
  }

  return sorted.reverse();
}
