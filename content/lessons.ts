import type { Lesson } from './curriculum';
import { scopeLesson } from './scope';
import { algorithmLessons } from './algorithms';
import { appliedLessons } from './applied';
import { experimentLessons } from './experiments';
import { extensions } from './extended';

import { example, frame, node } from './fixtures';

const fundamentals: Lesson[] = [
  {
    id: 'bindings', track: 'javascript', title: 'Values & references',
    summary: 'See what gets copied when you assign a number or an object.',
    detail: 'Every assignment copies a value. For an object, that value identifies the same object. A spread creates a new outer object but copies each property value as it is, so a nested object can still be shared.',
    use: 'When updating application state, copy each object along the path you intend to change.',
    mistake: 'Expecting const to freeze an object or expecting a spread to copy nested objects.',
    code: 'let count = 1;\nlet copy = count;\ncopy += 1;\nconst a = { count: 1 };\nconst b = a;\nb.count += 1;\nconsole.log(count, a.count);',
    frames: [
      frame('A separate number', 'copy receives the number 1. Changing copy leaves count at 1.', 3, [node('count', '1'), node('copy', '2', 'active')]),
      frame('One shared object', 'Both names lead to the same object. Updating b.count changes that object.', 6, [node('a & b', 'same object'), node('object.count', '2', 'active')]),
      frame('Compare the results', 'The original number is still 1. The shared object’s property is now 2.', 7, [node('count', '1'), node('a.count', '2')], '1 2'),
    ],
    compare: [example('Reuse the object', 'const b = a;', 'a and b share updates'), example('Copy the outer object', 'const b = { ...a };', 'Top-level writes stay separate')],
    question: { prompt: 'What does const prevent?', options: ['Writing an object property', 'Reassigning the variable', 'Other names pointing to the object'], answer: 1, why: 'The binding is constant. The object itself may still be mutable.' },
    exercise: 'Copy an object with a nested address and update the copy’s city without changing the original.', solution: 'Copy both levels with { ...user, address: { ...user.address, city: "Pune" } }.',
  },
  {
    id: 'hoisting', track: 'javascript', title: 'Hoisting & the TDZ',
    summary: 'See what exists before the first line of a function runs.',
    detail: 'JavaScript sets up bindings before executing statements. A function declaration is already callable. A var binding starts as undefined. A let or const binding cannot be read until its declaration is evaluated. The time before that evaluation is the temporal dead zone.',
    use: 'Put declarations close to their first use so readers can follow initialization in order.',
    mistake: 'Treating a let binding in the TDZ as if it held undefined.',
    code: 'console.log(total);\nvar total = 5;\nconsole.log(double(total));\nfunction double(n) { return n * 2; }\nconsole.log(rate);\nlet rate = 2;',
    frames: [
      frame('Before line one', 'total already exists as undefined. The function is ready. rate is uninitialized.', 1, [node('total', 'undefined'), node('double', 'callable'), node('rate', 'TDZ', 'warn')], 'undefined'),
      frame('Call the declaration', 'The function was available before its declaration line. total now holds 5.', 3, [node('total', '5'), node('double(5)', '10', 'active')], 'undefined\n10'),
      frame('Read too early', 'rate exists but has no initialized value. This read stops the script.', 5, [node('rate', 'TDZ', 'warn')], 'undefined\n10\nReferenceError'),
    ],
    compare: [example('Read var early', 'console.log(x);\nvar x = 1;', 'undefined'), example('Read let early', 'console.log(x);\nlet x = 1;', 'ReferenceError')],
    question: { prompt: 'Which declaration is callable before its line runs?', options: ['A function declaration', 'An arrow stored in const', 'Both'], answer: 0, why: 'An arrow stored in const depends on that constant being initialized first.' },
    exercise: 'Rewrite double as a const arrow function. Predict what will happen if you leave the call on line 3.', solution: 'The access hits the temporal dead zone. Move the const declaration above the call.',
  },
  {
    id: 'closures', track: 'javascript', title: 'Closures',
    summary: 'Watch a function keep access to a variable after its parent returns.',
    detail: 'A closure is a function together with access to the lexical bindings from where it was created. Each call to makeCounter creates a different count binding. The returned function keeps access to its own binding.',
    use: 'Keep a bit of state private in an event handler, memoizer, or factory function.',
    mistake: 'Assuming a closure freezes a snapshot of a binding. Later reads see its current value.',
    code: 'function makeCounter() {\n  let count = 0;\n  return () => ++count;\n}\nconst next = makeCounter();\nconsole.log(next());\nconsole.log(next());',
    frames: [
      frame('Create one counter', 'The call creates a local count. The returned function keeps a reference to that binding.', 5, [node('next()', 'retained function'), node('count', '0', 'active')]),
      frame('First call', 'next increases the same private count to 1.', 6, [node('next()', 'running', 'active'), node('count', '1', 'done')], '1'),
      frame('Second call', 'The binding still holds 1 from the previous call, so the next value is 2.', 7, [node('next()', 'running', 'active'), node('count', '2', 'done')], '1\n2'),
    ],
    compare: [example('One instance', 'const a = makeCounter();\na(); a();', '1, then 2'), example('Two instances', 'const a = makeCounter();\nconst b = makeCounter();\na(); b();', '1, then 1')],
    question: { prompt: 'Why do two counters start at 1?', options: ['The first call resets all counters.', 'Each factory call creates a new count.', 'JavaScript copies the returned code twice.'], answer: 1, why: 'Each invocation has its own local binding and the returned function can still reach it.' },
    exercise: 'Make a counter accept a starting value and keep its state private.', solution: 'Use function makeCounter(start = 0) { let count = start; return () => ++count; }.',
    source: ['MDN · Closures', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures'],
  },
  {
    id: 'event-loop', track: 'javascript', title: 'The browser event loop',
    summary: 'Predict the order of synchronous logs, promises, and timers.',
    detail: 'A task runs JavaScript until the stack is empty. The browser then drains the microtask queue before it can run the next task. A zero-delay timeout schedules a future task when eligible.',
    use: 'Work out why a promise handler can update an interface before a queued timer callback.',
    mistake: 'Reading a zero-delay timeout as a promise to run immediately.',
    code: 'console.log("start");\nsetTimeout(() => console.log("timer"), 0);\nPromise.resolve().then(() => console.log("promise"));\nconsole.log("end");',
    frames: [
      frame('Run the first statement', 'The script is already running on the stack. The first log runs immediately.', 1, [node('Stack', 'script', 'active'), node('Microtasks', 'empty'), node('Tasks', 'empty')], 'start'),
      frame('Schedule the timer', 'The callback becomes eligible for a later task. The script keeps running.', 2, [node('Stack', 'script'), node('Microtasks', 'empty'), node('Tasks', 'timer when eligible', 'active')], 'start'),
      frame('Queue the promise handler', 'The settled promise queues its handler as a microtask.', 3, [node('Stack', 'script'), node('Microtasks', 'promise', 'active'), node('Tasks', 'timer')], 'start'),
      frame('Finish the script', 'end is printed before the script leaves the stack.', 4, [node('Stack', 'empty'), node('Microtasks', 'promise'), node('Tasks', 'timer')], 'start\nend'),
      frame('Drain microtasks', 'The promise handler runs before the next task.', 3, [node('Stack', 'promise handler', 'active'), node('Microtasks', 'empty'), node('Tasks', 'timer')], 'start\nend\npromise'),
      frame('Take the next task', 'The eligible timer callback reaches the stack.', 2, [node('Stack', 'timer callback', 'active'), node('Microtasks', 'empty'), node('Tasks', 'empty')], 'start\nend\npromise\ntimer'),
    ],
    compare: [example('Microtask', 'queueMicrotask(update);', 'Runs at the next microtask checkpoint'), example('Timer task', 'setTimeout(update, 0);', 'Runs in a later task when eligible')],
    question: { prompt: 'What prints right after end?', options: ['timer', 'promise', 'start'], answer: 1, why: 'The browser drains the microtask queue before moving on to the timer task.' },
    exercise: 'Add a queueMicrotask directly after the Promise line and predict the full sequence.', solution: 'The sequence is start, end, promise, your microtask, timer. Both microtasks were queued in that order.',
    source: ['MDN · JavaScript execution model', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model'],
  },
  {
    id: 'this', track: 'javascript', title: 'How this gets its value',
    summary: 'Follow the receiver when a method is called or handed off.',
    detail: 'For an ordinary function call such as obj.fn(), this comes from the receiver obj. Assigning the method to a variable loses that receiver. An arrow reads this from its surrounding scope instead of getting a receiver from its own call.',
    use: 'Bind a class method when passing it to a callback API that calls it without its object.',
    mistake: 'Expecting a regular method to remember the object it came from.',
    code: '"use strict";\nconst user = { name: "Mira", greet() { return this.name; } };\nconsole.log(user.greet());\nconst greet = user.greet;\nconst bound = greet.bind(user);\nconsole.log(bound());\nconsole.log(greet());',
    frames: [
      frame('Method call', 'The call puts user to the left of the dot, so this is user.', 3, [node('Receiver', 'user', 'active'), node('this.name', 'Mira')], 'Mira'),
      frame('Bound call', 'bind makes a new function with user fixed as this.', 6, [node('Bound this', 'user', 'active'), node('this.name', 'Mira')], 'Mira\nMira'),
      frame('Detached call', 'A plain strict-mode call has undefined as this.', 7, [node('Receiver', 'none'), node('this', 'undefined', 'warn')], 'Mira\nMira\nTypeError'),
    ],
    compare: [example('Pass arguments directly', 'greet.call(user, "hi");', 'One call with user as this'), example('Set it for later', 'const bound = greet.bind(user);', 'A new callable function')],
    question: { prompt: 'What sets this inside a regular method?', options: ['The file where it was declared', 'How it is called', 'Its return value'], answer: 1, why: 'A regular method gets its this from the method call, explicit binding, or constructor call.' },
    exercise: 'Give greet a prefix parameter. Call it once with call and once with apply.', solution: 'Use greet.call(user, "Hi") and greet.apply(user, ["Hi"]).',
  },
  {
    id: 'promises', track: 'javascript', title: 'Promise combinators',
    summary: 'Compare what happens when one of several requests fails.',
    detail: 'Promise.all fulfills with values in input order or rejects on the first rejection. Promise.allSettled waits for each outcome. Promise.race settles with the first settlement. Promise.any fulfills on the first fulfillment and rejects with AggregateError if every input rejects.',
    use: 'Load independent widgets together and render the ones that succeed.',
    mistake: 'Assuming that a rejection from Promise.all automatically stops the other work.',
    code: 'const profile = Promise.resolve("profile");\nconst feed = Promise.reject(new Error("offline"));\nconst jobs = [profile, feed];\nconst results = await Promise.allSettled(jobs);\nconsole.log(results.map(result => result.status));',
    frames: [
      frame('Gather two jobs', 'One promise holds a value. The other holds a rejection reason.', 3, [node('profile', 'fulfilled', 'done'), node('feed', 'rejected', 'warn')]),
      frame('Keep both outcomes', 'allSettled fulfills with a record for each input. The feed failure is included.', 4, [node('results[0]', 'fulfilled → profile'), node('results[1]', 'rejected → Error', 'warn')]),
      frame('Read the statuses', 'You can now decide what each widget should display.', 5, [node('Profile widget', 'render', 'done'), node('Feed widget', 'offer retry', 'active')], '["fulfilled", "rejected"]'),
    ],
    compare: [example('Both are required', 'await Promise.all(jobs);', 'Rejects with Error: offline'), example('Show partial results', 'await Promise.allSettled(jobs);', 'Fulfills with both statuses')],
    question: { prompt: 'Which combinator waits for every success or failure?', options: ['Promise.race', 'Promise.any', 'Promise.allSettled'], answer: 2, why: 'allSettled returns the outcome of each input, even if they all reject.' },
    exercise: 'Choose a combinator for two mirrors where any successful response is enough.', solution: 'Choose Promise.any. Add request cancellation separately if you need to stop the slower request.',
  },
  {
    id: 'collections', track: 'javascript', title: 'Arrays, objects & prototypes',
    summary: 'Separate a value on an object from one it inherits.',
    detail: 'When a property is absent on an object, JavaScript checks its prototype, then the prototype’s prototype, until it finds the property or reaches null. Array methods such as map and filter normally come from Array.prototype.',
    use: 'Distinguish properties from an API payload from inherited helper methods.',
    mistake: 'Using the in operator to check whether a property belongs directly to an object.',
    code: 'const defaults = { theme: "light" };\nconst settings = Object.create(defaults);\nconsole.log(settings.theme);\nsettings.theme = "dark";\nconsole.log(settings.theme);\nconsole.log(Object.hasOwn(settings, "theme"));',
    frames: [
      frame('Follow the prototype', 'settings has no theme, so lookup moves to defaults.', 3, [node('settings', 'no own theme'), node('defaults.theme', 'light', 'active')], 'light'),
      frame('Set an own property', 'The write gives settings its own theme. defaults keeps its value.', 4, [node('settings.theme', 'dark', 'active'), node('defaults.theme', 'light')], 'light'),
      frame('Stop at the first match', 'The next read and the ownership check see the value on settings.', 6, [node('settings.theme', 'dark', 'done'), node('hasOwn', 'true')], 'light\ndark\ntrue'),
    ],
    compare: [example('Inspect the chain', '"theme" in settings', 'true before or after assignment'), example('Inspect only the object', 'Object.hasOwn(settings, "theme")', 'false before assignment')],
    question: { prompt: 'What will deleting settings.theme reveal?', options: ['undefined', 'light from defaults', 'dark from defaults'], answer: 1, why: 'Deleting the own property leaves the prototype in place.' },
    exercise: 'Use map to make an array of theme names from three settings objects. Check whether map is an own property on that array.', solution: 'Use list.map(setting => setting.theme). Object.hasOwn(list, "map") is normally false.',
  },
];

export const lessons = [scopeLesson, ...fundamentals, ...appliedLessons, ...extensions, ...algorithmLessons, ...experimentLessons];
