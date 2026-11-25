import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Workspace from './workspace';
import type { Chapter } from '../content/curriculum';

export default function Page() {
  const source = readFileSync(join(process.cwd(), 'content/blueprint.md'), 'utf8');
  const sections = source.split(/^(?=#{1,2} (?:\d|END OF PREPARATION))/m);
  const chapters: Chapter[] = sections.flatMap((section) => {
    const lines = section.trim().split('\n');
    const heading = lines.shift() ?? '';
    const match = heading.match(/^#{1,2} (\d+(?:\.\d+)?)[. ]+(.+)$/);
    if (!match) return [];
    const [, number, title] = match;
    return [{ id: number.replace('.', '-'), number, title, markdown: lines.join('\n').trim() }];
  });

  return <Workspace chapters={chapters} />;
}
