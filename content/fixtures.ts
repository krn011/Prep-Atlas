import type { Example, Frame, Node } from './curriculum';

export function example(label: string, code: string, result: string): Example {
  return { label, code, result };
}

export function frame(title: string, note: string, line: number, nodes: Node[], output?: string): Frame {
  return { title, note, line, nodes, output };
}

export function node(label: string, value: string, state?: Node['state']): Node {
  return { label, value, state };
}

