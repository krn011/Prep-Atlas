export const tracks = [
  { id: 'javascript', title: 'JavaScript', glyph: 'JS', color: 'mint', description: 'Follow names, values, and queued work through the runtime.', references: ['4.1'] },
  { id: 'typescript', title: 'TypeScript', glyph: 'TS', color: 'blue', description: 'Model the shapes your code expects and narrow them as you go.', references: ['4.2'] },
  { id: 'frontend', title: 'React & Next.js', glyph: '◉', color: 'lilac', description: 'Trace a state update, a page request, and a cache decision.', references: ['4.3', '4.4', '4.9'] },
  { id: 'backend', title: 'Backend & APIs', glyph: '↗', color: 'peach', description: 'Follow a request through the server, from middleware to storage.', references: ['4.5', '4.6', '4.10'] },
  { id: 'data', title: 'Databases', glyph: '▤', color: 'gold', description: 'See which rows match and what changes when a query runs.', references: ['4.7', '4.8', '4.11'] },
  { id: 'dsa', title: 'Data structures & algorithms', glyph: '⌘', color: 'mint', description: 'Watch pointers move, windows slide, and trees unfold.', references: ['5.'] },
  { id: 'design', title: 'System design', glyph: '◇', color: 'blue', description: 'Draw the parts of a system, then follow the work between them.', references: ['7', '4.12'] },
  { id: 'interview', title: 'Interview practice', glyph: '◎', color: 'peach', description: 'Explain decisions, practice project stories, and run mock interviews.', references: ['3', '6', '8'] },
] as const;

export type TrackId = typeof tracks[number]['id'];
export type Chapter = { id: string; number: string; title: string; markdown: string };
export type Node = { label: string; value: string; state?: 'active' | 'done' | 'muted' | 'warn' };
export type Frame = {
  title: string;
  note: string;
  line?: number;
  nodes?: Node[];
  output?: string;
};
export type Example = { label: string; code: string; result: string };
export type Question = { prompt: string; options: string[]; answer: number; why: string };
export type Lesson = {
  id: string;
  track: TrackId;
  title: string;
  summary: string;
  detail: string;
  use: string;
  mistake: string;
  code: string;
  language?: string;
  file?: string;
  frames: Frame[];
  compare: [Example, Example];
  question: Question;
  exercise: string;
  solution: string;
  source?: [string, string];
};
