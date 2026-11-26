export type InterviewCase = {
  id: string; title: string; topic: string; lesson: string; lessonTitle: string;
  brief: string; starter: string; tests: { label: string; body: string }[];
  hint: string; solution: string; explanation: string;
  incident: string; options: string[]; correct: number; diagnosis: string;
  design: string; walkthrough: string; projectQuestion: string; criteria: string[]; followup: string; answer: string;
};

export const seniorCases: InterviewCase[] = [
  {
    id: 'shared-requests', title: 'Deduplicate in-flight requests', topic: 'Frontend performance', lesson: 'cache-design', lessonTitle: 'Cache-aside',
    brief: 'Implement share(load). It returns a function that accepts a key and returns a promise. Overlapping calls for the same key should invoke load once. Different keys run independently. After settlement, the next call must load again, including after failure.',
    starter: 'function share(load) {\n  return key => load(key);\n}',
    tests: [
      { label: 'Concurrent callers receive the same result from one load', body: 'let calls = 0; const get = share(async () => ++calls); const pair = await Promise.all([get("a"), get("a")]); return calls === 1 && pair.every(v => v === 1);' },
      { label: 'Different keys keep independent results', body: 'const get = share(async key => key); const pair = await Promise.all([get("a"), get("b")]); return pair.join(",") === "a,b";' },
      { label: 'A settled key can refresh', body: 'let n = 0; const get = share(async () => ++n); return await get("a") === 1 && await get("a") === 2;' },
      { label: 'A failed load reaches both callers and can retry', body: 'let n = 0; const get = share(async () => { if (++n === 1) throw Error("offline"); return n; }); const pair = await Promise.allSettled([get("a"), get("a")]); return pair.every(v => v.status === "rejected") && await get("a") === 2;' },
    ],
    hint: 'Store the pending promise by key before the next caller can start another load.',
    solution: 'function share(load) {\n  const pending = new Map();\n  return key => {\n    if (!pending.has(key)) {\n      const task = Promise.resolve()\n        .then(() => load(key))\n        .finally(() => pending.delete(key));\n      pending.set(key, task);\n    }\n    return pending.get(key);\n  };\n}',
    explanation: 'Each caller observes the same pending work. Removing the entry on either outcome allows a fresh read or retry. Memory grows with distinct in-flight keys.',
    incident: 'Two agents open different offices in the same browser session. Both requests succeed, yet the second sees the first office’s cached listing page. Which change addresses the cause?',
    options: ['Shorten the cache lifetime to five seconds.', 'Include account, access scope, office and filters in the key. Enforce permissions on the server.', 'Increase the maximum number of cached pages.'], correct: 1,
    diagnosis: 'The requests collided under one key. A shorter lifetime still allows a wrong hit. A cache key scopes reuse, while the server authorizes each read.',
    design: 'A listing dashboard makes 50 requests on entry. Design a rollout that cuts load time while keeping permissions and saved edits correct.',
    walkthrough: 'Trace one cold visit and one repeat visit. If stakeholder lookups dominate, batch the visible IDs and compare the waterfall. Coalesce identical reads while in flight. Give longer-lived master data its own expiry. On a successful edit, invalidate list queries that could contain the row, including lists it has just entered. Compare error rates, wrong-office results and p95 load time against a control cohort.',
    projectQuestion: 'Describe a request you removed in a real project. What baseline did you collect, and how did you check that the page still showed fresh data?',
    criteria: ['Measure the request waterfall and p95 time to usable listings before changing code.', 'Batch related reads and define which requests may share a key.', 'Invalidate affected lists after a successful write and handle permission changes.', 'Roll out by cohort with latency, error and stale-data checks and a rollback switch.'],
    followup: 'A consumer closes its tab mid-request. Who owns cancellation?',
    answer: 'One subscriber leaving should not abort work another subscriber needs. Track consumers if cancellation is worthwhile, or let bounded reads finish. Compare the saved work with the bookkeeping cost.',
  },
  {
    id: 'search-race', title: 'Keep autocomplete results current', topic: 'React & async state', lesson: 'effects', lessonTitle: 'Effects & cleanup',
    brief: 'Implement latest(load, publish). The returned async function loads a query. Only the most recently started query may publish its result, even when two queries contain identical text. Return a promise that settles after handling that query.',
    starter: 'function latest(load, publish) {\n  return async query => {\n    publish(await load(query));\n  };\n}',
    tests: [
      { label: 'Publish a single successful query', body: 'const out = []; const ask = latest(async q => q.toUpperCase(), x => out.push(x)); await ask("a"); return out.join() === "A";' },
      ...['different', 'repeated'].map(kind => ({ label: kind === 'different' ? 'Ignore a slow response after a newer result' : 'Distinguish repeated text across requests', body: 'const out = [], gates = []; const ask = latest(() => new Promise(resolve => gates.push(resolve)), x => out.push(x)); const first = ask("a"); const second = ask("' + (kind === 'different' ? 'ab' : 'a') + '"); await Promise.resolve(); gates[1]("new"); await second; gates[0]("old"); await first; return out.join() === "new";' })),
    ],
    hint: 'Compare request identities when promises settle. Comparing search text fails if the user returns to an earlier query.',
    solution: 'function latest(load, publish) {\n  let sequence = 0;\n  return async query => {\n    const request = ++sequence;\n    const result = await load(query);\n    if (request === sequence) publish(result);\n  };\n}',
    explanation: 'A counter gives every call its own identity, using constant bookkeeping space. In React, keep the coordinator stable across renders and invalidate pending updates on cleanup.',
    incident: 'An interval in an effect with an empty dependency list calls setCount(count + 1). The counter reaches one and then stops advancing. What addresses the captured state while keeping one interval?',
    options: ['Wrap the component in memo.', 'Change the interval delay.', 'Use setCount(previous => previous + 1) and clear the interval on cleanup.'], correct: 2,
    diagnosis: 'The callback keeps the count from the render that installed it. A functional update receives the current queued value. Cleanup releases the interval when the effect ends.',
    design: 'Design a keyboard-accessible search box for 100,000 listings on a slow mobile network. Walk through typing, errors, selection and back navigation.',
    walkthrough: 'Keep the input controlled locally so a keystroke paints immediately. Debounce the network query, cancel obsolete work when possible and reject stale results by request ID. Limit the result set on the server. Keep focus in the input as the active suggestion changes. Preserve the last useful result on a recoverable failure, visibly label its state and offer retry. Test typing, backspacing and navigating back on a throttled device.',
    projectQuestion: 'Walk through a race condition you owned. How did you reproduce the ordering reliably, and which regression test did you keep?',
    criteria: ['Separate immediate input updates from debounced network work.', 'Handle late responses, loading, empty results and retry without losing the query.', 'Define arrow-key selection, Escape, focus and result announcements.', 'Measure keystroke-to-paint and result latency separately on slow devices.'],
    followup: 'If you already debounce requests, why track request identity?',
    answer: 'Debouncing reduces how often work starts. A slow earlier request can still finish after a later one. A generation check protects state even when cancellation arrives too late.',
  },
  {
    id: 'focus-list', title: 'Preserve focus in a changing list', topic: 'Accessibility & UI architecture', lesson: 'react-render', lessonTitle: 'React render & commit',
    brief: 'Implement nextFocus(ids, active, key) for a wrapping, single-select listbox. ids contains unique enabled option IDs. ArrowDown and ArrowUp move one position. If active is missing, start at the first or last respectively. Home and End jump to the boundaries. For other keys preserve a valid active ID, otherwise return null.',
    starter: 'function nextFocus(ids, active, key) {\n  return active;\n}',
    tests: [
      ['Wrap at both ends', 'return nextFocus(["a","b"],"b","ArrowDown") === "a" && nextFocus(["a","b"],"a","ArrowUp") === "b";'],
      ['Step to adjacent options', 'return nextFocus(["a","b","c"],"a","ArrowDown") === "b" && nextFocus(["a","b","c"],"c","ArrowUp") === "b";'],
      ['Recover after the active option disappears', 'return nextFocus(["b","c"],"a","ArrowDown") === "b" && nextFocus(["b","c"],"a","ArrowUp") === "c";'],
      ['Handle Home, End and an empty list', 'return nextFocus(["a","b"],"b","Home") === "a" && nextFocus(["a","b"],"a","End") === "b" && nextFocus([],null,"ArrowDown") === null;'],
      ['Leave unrelated keys alone', 'return nextFocus(["a"],"a","Tab") === "a" && nextFocus(["a"],"x","Tab") === null;'],
    ].map(([label, body]) => ({ label, body })),
    hint: 'Resolve the active ID against the current list each time. Handle missing IDs before calculating wraparound.',
    solution: 'function nextFocus(ids, active, key) {\n  const count = ids.length;\n  if (!count) return null;\n  const i = ids.indexOf(active);\n  if (key === "Home") return ids[0];\n  if (key === "End") return ids[count - 1];\n  if (key === "ArrowDown") return ids[(i + 1) % count];\n  if (key === "ArrowUp") return ids[i < 0 ? count - 1 : (i + count - 1) % count];\n  return i < 0 ? null : active;\n}',
    explanation: 'Stable IDs survive reordering. Looking up the current position costs O(n) per keypress. For very large lists, a position map can move that work to the point where options change.',
    incident: 'After sorting an editable table, an unsaved draft appears on another listing. Rows store draft state locally and use their array index as the React key. What would you change first?',
    options: ['Key each row by its stable listing ID and test sorting while editing.', 'Generate a fresh random key on every render.', 'Memoize the sorted array only.'], correct: 0,
    diagnosis: 'Index keys associate state with positions. A stable ID associates the draft with the listing. Random keys discard drafts by remounting rows.',
    design: 'An editable table has 20,000 rows. Design a faster experience that preserves keyboard access and unsaved edits when users sort or scroll.',
    walkthrough: 'Profile a keystroke while editing a row. If the whole table rerenders, isolate the editor before adding a virtualizer. Start with server-side pagination when users can work a page at a time. Keep drafts keyed by row ID and retain a failed save with a retry action. If continuous navigation is essential, render a small window, move it before focusing an offscreen row and verify focus after filtering.',
    projectQuestion: 'Describe a UI performance trade-off you negotiated. Which user workflow shaped your choice, and what evidence would make you revisit it?',
    criteria: ['Measure input delay and rendering cost before choosing pagination or virtualization.', 'Store edits by stable row ID outside rows that can unmount.', 'Define keyboard movement and keep the focused item mounted or restore focus explicitly.', 'Test sorting, filtering and failed saves with keyboard and assistive technology.'],
    followup: 'When would you choose pagination over virtualization?',
    answer: 'Choose pagination when bounded page sizes meet navigation needs and simplify focus, row counts and recovery. Virtualization helps continuous browsing, but requires explicit focus and draft ownership as rows unmount.',
  },
];
