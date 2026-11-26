import type { InterviewCase } from '../content/senior-cases';

export type TestResult = { label: string; passed: boolean; detail?: string };

export function runChecks(item: InterviewCase, code: string): Promise<TestResult[]> {
  const cases = item.tests.map(test => 'async () => {\n' + test.body + '\n}');
  const source = `(async () => {
    ${code}
    const checks = [${cases.join(',')}];
    for (const [index, check] of checks.entries()) {
      try { self.postMessage({ index, passed: (await check()) === true }); }
      catch (e) { self.postMessage({ index, passed: false, detail: String(e) }); }
    }
  })().catch(e => { throw e; });`;
  return new Promise(resolve => {
    const results = item.tests.map(({ label }): TestResult => ({ label, passed: false }));
    const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    let worker: Worker;
    let timer: ReturnType<typeof setTimeout>;
    const completed = new Set<number>();
    function finish(detail?: string) {
      clearTimeout(timer);
      worker?.terminate();
      URL.revokeObjectURL(url);
      resolve(results.map((row, i) => completed.has(i) ? row : { ...row, detail }));
    }
    try {
      worker = new Worker(url);
      timer = setTimeout(() => finish('Time limit reached. Check for an infinite loop or unresolved promise.'), 3000);
      worker.onerror = event => { event.preventDefault(); finish(event.message || 'The code could not run.'); };
      worker.onmessage = ({ data }) => {
        if (!data || !Number.isInteger(data.index) || !results[data.index]) return;
        results[data.index] = { ...results[data.index], passed: data.passed === true, detail: data.detail };
        completed.add(data.index);
        if (completed.size === results.length) finish();
      };
    } catch { finish('The browser could not start the code runner.'); }
  });
}
