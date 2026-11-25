import type { Frame, Lesson } from './curriculum';
import { example, frame, node } from './fixtures';

export type ArrayFrame = Frame & { values: (number | string)[]; active: number[]; excluded?: number[] };
export type ArraySettings = { values: number[]; argument: number };

export const arrayPresets: Record<string, ArraySettings> = {
  'two-pointers': { values: [1, 3, 5, 8, 12, 16], argument: 13 },
  'sliding-window': { values: [2, 1, 5, 1, 3, 2], argument: 3 },
  'binary-search': { values: [3, 5, 8, 13, 21, 34, 55], argument: 21 },
};

export function buildArrayTrace(id: string, { values, argument }: ArraySettings): ArrayFrame[] {
  const trace: ArrayFrame[] = [];
  if (id === 'binary-search' || id === 'two-pointers') {
    let left = 0;
    let right = values.length - 1;
    const binary = id === 'binary-search';
    while (binary ? left <= right : left < right) {
      const middle = left + Math.floor((right - left) / 2);
      const actual = binary ? values[middle] : values[left] + values[right];
      const found = actual === argument;
      const low = actual < argument;
      const active = binary ? [middle] : [left, right];
      trace.push({
        ...frame(found ? 'Found the target' : low ? 'Go right' : 'Go left',
          found ? 'This check matches the target.' : binary
            ? `${actual} is ${low ? 'below' : 'above'} ${argument}. Only the ${low ? 'right' : 'left'} half can still contain it.`
            : `The sum is ${actual}. Move the ${low ? 'left pointer right to raise' : 'right pointer left to lower'} the sum.`,
          found ? (binary ? 6 : 7) : (binary ? (low ? 7 : 8) : (low ? 8 : 9)),
          [node('Left index', String(left)), node('Right index', String(right)), node(binary ? 'Middle value' : 'Pair sum', String(actual), 'active')],
          found ? (binary ? String(middle) : `[${left}, ${right}]`) : undefined),
        values, active, excluded: values.map((_, index) => index).filter((index) => index < left || index > right),
      });
      if (found) return trace;
      if (low) left = binary ? middle + 1 : left + 1;
      else right = binary ? middle - 1 : right - 1;
    }
    trace.push({ ...frame('No match', binary ? 'The search interval is empty.' : 'Fewer than two candidates remain.', 11, [node('Target', String(argument), 'warn')], binary ? '-1' : '[]'), values, active: [], excluded: values.map((_, index) => index) });
    return trace;
  }

  let sum = values.slice(0, argument).reduce((total, value) => total + value, 0);
  let best = sum;
  for (let left = 0; left + argument <= values.length; left++) {
    const right = left + argument - 1;
    if (left > 0) sum += values[right] - values[left - 1];
    best = Math.max(best, sum);
    const last = right === values.length - 1;
    trace.push({
      ...frame(left ? 'Slide by one' : 'Fill the first window',
        left ? `Remove ${values[left - 1]} and add ${values[right]}. The running sum is ${sum}.` : `Start with ${argument} adjacent values. Their total is ${sum}.`,
        left ? 6 : 3, [node('Window sum', String(sum), 'active'), node('Best so far', String(best), 'done')],
        last ? String(best) : undefined),
      values, active: Array.from({ length: argument }, (_, index) => left + index),
    });
  }
  return trace;
}

function arrayLesson(lesson: Omit<Lesson, 'frames' | 'track'>): Lesson {
  return { ...lesson, track: 'dsa', frames: buildArrayTrace(lesson.id, arrayPresets[lesson.id]) };
}

const pointers = arrayLesson({
  id: 'two-pointers', title: 'Two pointers',
  summary: 'Find a target sum without trying every pair.',
  detail: 'In a sorted array, the smallest candidate is on the left and the largest is on the right. If their sum is too small, the left value cannot pair with any remaining value. If it is too large, the right value cannot pair with any remaining value. Each step eliminates one candidate, using O(n) time and O(1) extra space.',
  use: 'Search sorted scores or prices for two entries that hit a total.',
  mistake: 'Using the same left/right rule on unsorted data. If you sort first, decide how to preserve original indices.',
  code: 'function pair(a, target) {\n  let left = 0;\n  let right = a.length - 1;\n  while (left < right) {\n    const sum = a[left] + a[right];\n\n    if (sum === target) return [left, right];\n    if (sum < target) left++;\n    else right--;\n  }\n  return [];\n}',
  compare: [example('Try every pair', 'for (let i = 0; i < a.length; i++)\n  for (let j = i + 1; j < a.length; j++)\n    if (a[i] + a[j] === target) return [i, j];', 'O(n²) time'), example('Eliminate one end', 'if (sum < target) left++;\nelse if (sum > target) right--;', 'O(n) on sorted input')],
  question: { prompt: 'The pair sum is too large. Which pointer moves?', options: ['Left moves right', 'Right moves left', 'Both move inward'], answer: 1, why: 'Moving right to a smaller value can lower the sum.' },
  exercise: 'Use the visualizer to find a target of 8 in [1, 3, 5, 8, 12]. Then explain which values you eliminated.', solution: 'The pair is indices 1 and 2. The first two sums, 13 and 9, eliminate 12 and 8. A sum of 6 then eliminates 1.',
  source: ['USACO Guide · Two pointers', 'https://usaco.guide/silver/two-pointers'],
});

const windowLesson = arrayLesson({
  id: 'sliding-window', title: 'Sliding window',
  summary: 'Keep a running total as a group moves across an array.',
  detail: 'For a fixed-length window, the next group differs by one value on each end. Subtract the value that left and add the one that entered. This scans the array once using O(1) extra space.',
  use: 'Find the busiest three-hour stretch from hourly request counts.',
  mistake: 'Starting the best sum at zero when every valid window could have a negative sum.',
  code: 'function maxWindow(a, k) {\n  if (k < 1 || k > a.length) return null;\n  let sum = a.slice(0, k).reduce((s, v) => s + v, 0);\n  let best = sum;\n  for (let right = k; right < a.length; right++) {\n    sum += a[right] - a[right - k];\n    best = Math.max(best, sum);\n  }\n  return best;\n}',
  compare: [example('Sum every group from scratch', 'const sum = a.slice(i, i + k).reduce((s, v) => s + v, 0);', 'O(n × k) time'), example('Re-use the running sum', 'sum += a[right] - a[right - k];', 'O(n) time')],
  question: { prompt: 'After one slide, how many values need to change the running total?', options: ['Every value in the window', 'Two values', 'One value'], answer: 1, why: 'One value leaves and one value enters.' },
  exercise: 'Find the best two-item window in [-5, -2, -4, -1]. Why is zero the wrong answer?', solution: 'The sums are -7, -6, and -5. The best is -5, and no two adjacent values sum to zero.',
  source: ['USACO Guide · Sliding window', 'https://usaco.guide/silver/two-pointers'],
});

const binary = arrayLesson({
  id: 'binary-search', title: 'Binary search',
  summary: 'See half a sorted search space disappear at each step.',
  detail: 'Compare the target with the middle value of an ordered interval. If they differ, discard the middle and the half that cannot contain the target. The loop takes O(log n) time and O(1) extra space.',
  use: 'Find a timestamp in a sorted list or find the first threshold that satisfies a condition.',
  mistake: 'Keeping mid in the next interval after ruling it out, which can make the loop stall.',
  code: 'function search(a, target) {\n  let left = 0;\n  let right = a.length - 1;\n  while (left <= right) {\n    const mid = left + Math.floor((right - left) / 2);\n    if (a[mid] === target) return mid;\n    if (a[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n\n  return -1;\n}',
  compare: [example('Scan in order', 'a.findIndex(value => value === target);', 'O(n), any order'), example('Halve the interval', 'search(a, target);', 'O(log n), sorted input')],
  question: { prompt: 'The middle value is below the target. What can you discard?', options: ['Middle and everything left of it', 'Only the middle', 'Middle and everything right of it'], answer: 0, why: 'Every value to the left is at most the middle value, so none can match.' },
  exercise: 'Search for 20 in the preset values. Then write a variant that returns where 20 would be inserted.', solution: 'There is no match. For the insertion index, move right when a[mid] is smaller, otherwise move left, and return left after the loop. It gives index 4.',
  source: ['CP-Algorithms · Binary search', 'https://cp-algorithms.com/num_methods/binary_search.html'],
});

const other: Lesson[] = [
  {
    id: 'hash-map', track: 'dsa', title: 'Hash maps & frequency counts',
    summary: 'Turn repeated searches into lookups by storing what you have seen.',
    detail: 'A Map links keys to values. A Set remembers membership only. For Two Sum, store each value and its original index. Before storing the current value, look for the difference between it and the target. With conventional constant-time average lookups, the scan is O(n) time and O(n) space.',
    use: 'Count duplicate records or find a matching pair in unsorted input.',
    mistake: 'Storing the current index before checking the complement. For [3] and target 6, that would match an element with itself.',
    code: 'function twoSum(a, target) {\n  const seen = new Map();\n  for (const [i, value] of a.entries()) {\n    const other = target - value;\n    if (seen.has(other)) return [seen.get(other), i];\n    seen.set(value, i);\n  }\n  return [];\n}\ntwoSum([4, 1, 6], 7);',
    frames: [
      frame('Read 4', 'Need 3. The map is empty, so save 4 at index 0.', 6, [node('Complement', '3'), node('Seen', '4 → 0', 'active')]),
      frame('Read 1', 'Need 6. Save 1 at index 1 for later.', 6, [node('Complement', '6'), node('Seen', '4 → 0, 1 → 1', 'active')]),
      frame('Read 6', 'Need 1. The map gives its index without scanning backward.', 5, [node('Complement', '1', 'active'), node('Matched index', '1', 'done')], '[1, 2]'),
    ],
    compare: [example('Remember membership', 'new Set(["a", "b", "a"]).size', '2'), example('Remember counts', 'const counts = new Map();\nfor (const ch of "aba")\n  counts.set(ch, (counts.get(ch) ?? 0) + 1);', 'a → 2, b → 1')],
    question: { prompt: 'Why use Map.has instead of if (Map.get(key))?', options: ['Index zero is falsy.', 'Map.get sorts the keys.', 'Map.has returns the index.'], answer: 0, why: 'A matching key might map to index zero. Check membership explicitly.' },
    exercise: 'Adapt the frequency example to check if two lowercase strings are anagrams.', solution: 'Count letters from the first string. Decrement counts for the second and reject if a count goes below zero. Equal lengths plus no negative count implies a match.',
  },
  {
    id: 'stack-queue', track: 'dsa', title: 'Stack & queue',
    summary: 'See why parentheses use a stack and level-order traversal uses a queue.',
    detail: 'A stack removes the newest item first. A queue removes the oldest item first. Matching brackets needs the most recent unmatched opening bracket. Breadth-first search needs nodes in the order they were discovered.',
    use: 'Use stacks for undo and parsing. Use queues when work should be handled in arrival order.',
    mistake: 'Forgetting to check for leftover opening brackets.',
    code: 'function balanced(input) {\n  const stack = [];\n  for (const ch of input) {\n    if (ch === "(") stack.push(ch);\n    if (ch === ")" && stack.pop() === undefined) return false;\n  }\n  return stack.length === 0;\n}\nbalanced("(())");',
    frames: [
      frame('Push both openings', 'Each opening waits for its closing bracket.', 4, [node('Bottom', 'first ( '), node('Top', 'second ( ', 'active')]),
      frame('Match from the top', 'The first closing bracket matches the most recent opening.', 5, [node('Stack', 'first ( ', 'active'), node('Matched', 'second ()', 'done')]),
      frame('Check what remains', 'The final closing bracket pops the last opening. The stack is empty.', 7, [node('Stack', 'empty', 'done')], 'true'),
    ],
    compare: [example('Newest first', 'const stack = [1, 2, 3];\nstack.pop();', '3'), example('Oldest first', 'const queue = [1, 2, 3];\nlet head = 0;\nqueue[head++];', '1')],
    question: { prompt: 'What does an empty stack on a closing bracket mean?', options: ['The input is balanced.', 'There is no opener to match it.', 'The next character will match it.'], answer: 1, why: 'Closing brackets must match earlier openings.' },
    exercise: 'Extend balanced to handle (), [], and {}.', solution: 'Push each opener. For a closer, look up its required opener and compare it to stack.pop(). Require an empty stack at the end.',
  },
  {
    id: 'linked-list', track: 'dsa', title: 'Reverse a linked list',
    summary: 'Move a link without losing the rest of the list.',
    detail: 'Maintain prev for the reversed prefix and current for the unprocessed suffix. Save current.next before rewriting it. Each node is visited once with constant extra storage.',
    use: 'Practice pointer ownership and in-place changes for interview questions.',
    mistake: 'Reassigning current.next before keeping the old link somewhere.',
    code: 'function reverse(head) {\n  let prev = null;\n  let current = head;\n  while (current) {\n    const next = current.next;\n    current.next = prev;\n    prev = current;\n    current = next;\n  }\n  return prev;\n}',
    frames: [
      frame('Save the next node', 'Keep B before redirecting A’s next link.', 5, [node('prev', 'null'), node('current', 'A → B → C', 'active'), node('next', 'B')]),
      frame('Flip and advance', 'A now ends the reversed list. Continue from the saved B.', 8, [node('prev', 'A → null', 'done'), node('current', 'B → C', 'active')]),
      frame('Finish at C', 'The prefix has become the whole list. Return its new head.', 10, [node('prev', 'C → B → A → null', 'done'), node('current', 'null')], 'C → B → A'),
    ],
    compare: [example('Before changing the link', 'const next = current.next;', 'Keeps the suffix reachable'), example('After saving the link', 'current.next = prev;', 'Adds current to the reversed prefix')],
    question: { prompt: 'What should reverse return?', options: ['The original head', 'prev', 'current'], answer: 1, why: 'current is null at the end. prev points to the new head.' },
    exercise: 'Trace the same function on an empty list and a one-node list.', solution: 'For empty input the loop never runs and returns null. For one node the loop runs once and returns that node.',
  },
  {
    id: 'merge-sort', track: 'dsa', title: 'Recursion & merge sort',
    summary: 'Split a list, reach the smallest case, then merge in order.',
    detail: 'Merge sort splits an array until each part has at most one item. Merging chooses the smaller head of two sorted halves. This implementation spends O(n log n) time and uses O(n) peak auxiliary space, with an O(log n) recursion stack.',
    use: 'Sort data predictably, including preserving the order of tied keys with a stable merge.',
    mistake: 'Using shift repeatedly in JavaScript arrays during a merge. Track indices to avoid moving array elements.',
    code: 'function sort(values) {\n  if (values.length < 2) return values;\n  const mid = Math.floor(values.length / 2);\n  const a = sort(values.slice(0, mid));\n  const b = sort(values.slice(mid));\n  const result = [];\n  let i = 0, j = 0;\n  while (i < a.length && j < b.length) {\n    result.push(a[i] <= b[j] ? a[i++] : b[j++]);\n  }\n  return result.concat(a.slice(i), b.slice(j));\n}',
    frames: [
      frame('Split [4, 1, 3, 2]', 'Halves keep their original relative order until we merge them.', 3, [node('Left half', '[4, 1]'), node('Right half', '[3, 2]')]),
      frame('Hit the base case', 'Each single value is already sorted. Merge each pair.', 2, [node('Left sorted', '[1, 4]', 'done'), node('Right sorted', '[2, 3]', 'done')]),
      frame('Merge the halves', 'Choose 1, then 2, then 3. Append the remaining 4.', 11, [node('Merged', '[1, 2, 3, 4]', 'done')], '[1, 2, 3, 4]'),
    ],
    compare: [example('Stop splitting', 'if (values.length < 2) return values;', 'One value or empty'), example('Break ties left first', 'a[i] <= b[j] ? a[i++] : b[j++]', 'Keeps original order of ties')],
    question: { prompt: 'What makes this merge stable?', options: ['Always taking ties from the left', 'Splitting at the middle', 'Using recursion'], answer: 0, why: 'The left half held the earlier item before splitting, and it wins ties.' },
    exercise: 'Trace how many times the merge compares two values for [1, 2] merged with [3, 4].', solution: 'Two comparisons select 1 and 2. Once the left side is empty, append the remaining [3, 4].',
  },
  {
    id: 'graph-traversal', track: 'dsa', title: 'Trees & graph traversal',
    summary: 'Watch breadth-first search reach each layer in order.',
    detail: 'Breadth-first search uses a queue. Mark a vertex as seen when it enters the queue so multiple incoming edges cannot add it again. On an unweighted graph, the first discovery gives a shortest path by number of edges. With adjacency lists the runtime is O(V + E).',
    use: 'Find degrees of separation and traverse a tree level by level.',
    mistake: 'Treating BFS as a shortest-path algorithm for arbitrary weighted edges.',
    code: 'function bfs(graph, start) {\n  const queue = [start];\n  const seen = new Set(queue);\n  for (let i = 0; i < queue.length; i++) {\n    for (const neighbor of graph[queue[i]] ?? []) {\n      if (seen.has(neighbor)) continue;\n      seen.add(neighbor);\n      queue.push(neighbor);\n    }\n  }\n  return queue;\n}',
    frames: [
      frame('Start with A', 'For A → B, C and B → D, C → D, start by discovering A.', 3, [node('Discovered', 'A', 'active'), node('Waiting', 'A')]),
      frame('Visit the first layer', 'A adds B and C in adjacency-list order.', 8, [node('Discovered', 'A, B, C'), node('Waiting', 'B, C', 'active')]),
      frame('Watch the shared neighbor', 'B adds D. When C checks D, it is already seen.', 6, [node('Waiting', 'D', 'active'), node('Seen', 'A, B, C, D')]),
      frame('Finish the walk', 'D has no outgoing neighbors. The discovery order is complete.', 11, [node('Waiting', 'empty'), node('Discovered', 'A, B, C, D', 'done')], '["A", "B", "C", "D"]'),
    ],
    compare: [example('Breadth-first', 'queue.push(neighbor);', 'Explore by distance in steps'), example('Depth-first', 'visit(neighbor); // recursive call', 'Explore one branch before backtracking')],
    question: { prompt: 'When should a node be marked seen?', options: ['As soon as it is enqueued', 'After every other node', 'Only if its queue position is zero'], answer: 0, why: 'A second incoming edge can arrive before the node’s turn to run.' },
    exercise: 'Add D → A. Predict whether the walk changes or loops forever.', solution: 'A was already seen. The walk skips the new edge and finishes in the same order.',
  },
  {
    id: 'dynamic-programming', track: 'dsa', title: 'Dynamic programming',
    summary: 'Solve a small subproblem once and use it again.',
    detail: 'With one- or two-step moves, every route to step i ends at i-1 or i-2 before its last move. Add those counts. The base cases are one way to stand at step zero and one way to reach step one.',
    use: 'Count ways or find an optimum when choices lead back to overlapping smaller problems.',
    mistake: 'Starting the base case at zero ways for step zero, which removes all routes that start there.',
    code: 'function climb(n) {\n  if (n < 2) return 1;\n  let prev2 = 1;\n  let prev1 = 1;\n  for (let step = 2; step <= n; step++) {\n    const ways = prev1 + prev2;\n    prev2 = prev1;\n    prev1 = ways;\n  }\n  return prev1;\n}\nclimb(4);',
    frames: [
      frame('Establish the base cases', 'There is one route with no moves and one route to step one.', 4, [node('Step 0', '1'), node('Step 1', '1')]),
      frame('Build step two', 'Arrive from step one or jump from step zero.', 6, [node('Step 0', '1'), node('Step 1', '1'), node('Step 2', '2', 'active')]),
      frame('Reuse the previous counts', 'Step three has 3 ways. Step four adds 3 and 2 to get 5.', 10, [node('Step 2', '2'), node('Step 3', '3'), node('Step 4', '5', 'done')], '5'),
    ],
    compare: [example('Plain recursive recurrence', 'return climb(n - 1) + climb(n - 2);', 'Repeats the same work'), example('Keep the last two answers', 'const ways = prev1 + prev2;', 'O(n) time, O(1) extra space')],
    question: { prompt: 'Which answers do you need to compute step five?', options: ['Steps four and three', 'Steps five and six', 'Only step zero'], answer: 0, why: 'The last move is either one step or two steps.' },
    exercise: 'Allow moves of 1, 2, or 3 steps. Compute the number of ways to reach step four.', solution: 'Use the last three counts. Steps 0 through 4 have 1, 1, 2, 4, and 7 ways.',
  },
];

export const algorithmLessons = [pointers, windowLesson, binary, ...other];
