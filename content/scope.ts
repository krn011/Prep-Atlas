import type { Lesson } from './curriculum';

export const scopeLines = [
  'const course = "JavaScript";',
  '',
  'function study() {',
  '  const topic = "Scope";',
  '',
  '  if (true) {',
  '    const note = "Block scope";',
  '    console.log(note);',
  '    console.log(topic);',
  '    console.log(course);',
  '  }',
  '',
  '  console.log(note); // ReferenceError',
  '}',
  '',
  'study();',
];

export const scopes = [
  { id: 'global', title: 'Script scope', variable: 'course', from: 1, to: 16, declaration: 1, level: 0, note: 'Names declared at the top level of this classic script can be read inside its nested scopes.' },
  { id: 'function', title: 'Function scope', variable: 'topic', from: 3, to: 14, declaration: 4, level: 1, note: 'A function body has its own local names. Its nested blocks can still read them.' },
  { id: 'block', title: 'Block scope', variable: 'note', from: 6, to: 11, declaration: 7, level: 2, note: 'A const or let declared inside braces belongs to that block.' },
] as const;

export const lookups = [
  { line: 8, name: 'note', title: 'Found in the block', path: ['block'], declaration: 7, output: 'Block scope', text: 'JavaScript starts in the closest scope. note lives in the same block, so the search stops here.' },
  { line: 9, name: 'topic', title: 'Look one level out', path: ['block', 'function'], declaration: 4, output: 'Scope', text: 'The block has no topic. JavaScript checks the surrounding function and finds it there.' },
  { line: 10, name: 'course', title: 'Follow the whole chain', path: ['block', 'function', 'global'], declaration: 1, output: 'JavaScript', text: 'Neither the block nor the function declares course. The outer script does.' },
  { line: 13, name: 'note', title: 'Outside the block', path: ['function', 'global'], declaration: 0, output: 'ReferenceError: note is not defined', text: 'The function can check itself and its outer script. It cannot look inside the block it already left.' },
];

export const scopeLesson: Lesson = {
  id: 'scope', track: 'javascript', title: 'Scope & visibility',
  summary: 'See where a variable lives and how JavaScript finds it.',
  detail: 'Scope is the part of a program that can use a name. JavaScript looks in the nearest scope first and then moves outward. Braces around an if statement create a block scope for let and const. In an ES module, top-level declarations belong to the module. This example uses a classic script.',
  use: 'Keep a temporary value, such as a calculated discount or an event handler variable, close to the code that uses it.',
  mistake: 'Expecting a function to look inside a finished block, or assuming var follows the same block rules as let.',
  code: scopeLines.join('\n'), file: 'scope.js',
  frames: lookups.map((item) => ({ title: item.title, note: item.text, line: item.line, output: item.output })),
  compare: [
    { label: 'Block-scoped let', code: '{\n  let total = 5;\n}\nconsole.log(total);', result: 'ReferenceError' },
    { label: 'Function-scoped var', code: '{\n  var total = 5;\n}\nconsole.log(total);', result: '5' },
  ],
  question: { prompt: 'Why can the inner block read topic?', options: ['The block and the function share all variables.', 'The lookup can move outward to the function.', 'The console makes topic global.'], answer: 1, why: 'Lexical lookup follows the scopes surrounding the line. The function is directly outside this block.' },
  exercise: 'Add const topic = "Blocks" inside the if block. Predict what lines 9 and 13 do before running the code.',
  solution: 'Line 9 prints Blocks because the inner declaration shadows the outer topic. Line 13 still throws ReferenceError because it cannot reach the block’s note.',
  source: ['MDN · let and block scope', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let'],
};
