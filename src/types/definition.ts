import type { Component } from './component';

export interface Definition {
  scoped?: boolean;
  component: Component<any>;
  dependencies: {
    component: string;
    destination: string;
    optional: boolean;
    source?: string;
  }[];
}

export interface Registration<Component = unknown, Scoped extends boolean = boolean> {
  component: Component;
  scoped: Scoped;
}
