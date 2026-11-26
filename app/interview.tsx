'use client';

import { useEffect, useRef, useState } from 'react';
import { seniorCases, type InterviewCase } from '../content/senior-cases';
import { runChecks, type TestResult } from './challenge-runner';

type Stage = 'practice' | 'mock' | 'review';
type Session = { stage: Stage; end: number; code: string; choice: number; design: string; results: TestResult[]; checks: number[]; graded: boolean };
type RecordEntry = { session: Session; due?: number; gaps?: string[] };
const day = 86400000;
const key = (id: string) => 'prep-atlas:interview-v1:' + id;
function fresh(item: InterviewCase, stage: Stage): Session {
  return { stage, end: stage === 'mock' ? Date.now() + 30 * 60000 : 0, code: item.starter, choice: -1, design: '', results: [], checks: [], graded: false };
}
function read(item: InterviewCase): RecordEntry {
  try {
    const entry = JSON.parse(localStorage.getItem(key(item.id)) || 'null');
    if (entry?.session && typeof entry.session.code === 'string' && Array.isArray(entry.session.results) && Array.isArray(entry.session.checks)) return entry;
  } catch { /* Start a fresh session when storage is unavailable. */ }
  return { session: fresh(item, 'practice') };
}
function save(item: InterviewCase, entry: RecordEntry) {
  try { localStorage.setItem(key(item.id), JSON.stringify(entry)); } catch { /* Keep session state in memory. */ }
}
export function Interview({ id, open }: { id: string; open: (id: string) => void }) {
  const item = seniorCases.find(c => c.id === id);
  if (item) return <Round key={id} item={item} back={() => open('')} />;
  const now = Date.now();
  const entries = seniorCases.map(item => ({ item, ...read(item) }));
  const queue = entries.filter(e => e.due === undefined || e.due <= now)
    .sort((a, b) => (b.gaps?.length || 0) - (a.gaps?.length || 0) || (a.due ?? Infinity) - (b.due ?? Infinity)).slice(0, 2);
  return <div className="interview">
    <section className="page-intro"><h1>Senior interview studio</h1><p>Write and run JavaScript, diagnose a production issue, then explain your design. Each case also has a 30-minute mock interview.</p></section>
    <section className="iv-panel"><h2>Today’s revision</h2>
      {queue.length ? queue.map(e => <button className="iv-queue" key={e.item.id} onClick={() => open(e.item.id)}><strong>{e.item.title}</strong><span>{e.gaps?.join(' · ') || (e.due ? 'Recall practice' : 'First attempt')} →</span></button>) : <p>You’re caught up. Your next review is due {new Date(Math.min(...entries.map(e => e.due!))).toLocaleDateString()}.</p>}
    </section>
    <h2>Interview cases</h2><div className="track-grid">{entries.map(({ item, session }) => <button key={item.id} className="track-card iv-case" onClick={() => open(item.id)}><small>{item.topic}</small><h3>{item.title}</h3><p>{item.design}</p><strong>{session.stage === 'mock' ? 'Resume mock' : session.stage === 'review' ? 'View scorecard' : 'Open case'} →</strong></button>)}</div>
  </div>;
}

function Round({ item, back }: { item: InterviewCase; back: () => void }) {
  const [entry, setEntry] = useState(() => read(item));
  const state = entry.session;
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now);
  const [hint, setHint] = useState(false);
  const [solution, setSolution] = useState(false);
  const locking = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  function commit(next: RecordEntry) { save(item, next); setEntry(next); }
  function update(patch: Partial<Session>) { commit({ ...entry, session: { ...state, ...patch } }); }
  const mock = state.stage === 'mock';
  const review = state.stage === 'review';
  const expired = mock && now >= state.end;
  const locked = busy || expired || review;
  const remaining = Math.max(0, Math.ceil((state.end - now) / 1000));

  async function grade(submit: boolean) {
    if (locking.current) return;
    locking.current = true;
    setBusy(true);
    const results = await runChecks(item, state.code);
    if (!alive.current) return;
    const finish = submit || (mock && Date.now() >= state.end);
    if (finish) {
      const gaps = [];
      if (results.some(r => !r.passed)) gaps.push('Coding');
      if (state.choice !== item.correct) gaps.push('Debugging');
      gaps.push('Design review');
      commit({ ...entry, gaps, due: Date.now(), session: { ...state, results, stage: 'review' } });
    } else update({ results });
    setBusy(false);
    locking.current = false;
  }
  useEffect(() => {
    if (!mock) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [mock]);
  useEffect(() => { if (expired && !busy) void grade(true); }, [expired, busy]);

  function begin(stage: Stage) {
    setHint(false); setSolution(false); setNow(Date.now());
    commit({ ...entry, session: fresh(item, stage) });
  }
  function assess() {
    const gaps = [];
    if (state.results.some(r => !r.passed)) gaps.push('Coding');
    if (state.choice !== item.correct) gaps.push('Debugging');
    if (state.checks.length < item.criteria.length) gaps.push('Design');
    commit({ session: { ...state, graded: true }, gaps, due: Date.now() + (gaps.length ? 1 : 7) * day });
  }
  return <div className="interview">
    <button className="text-button" onClick={back}>← All interview cases</button>
    <section className="page-intro"><span className="intro-label">{item.topic}</span><h1>{item.title}</h1>
      {mock ? <p><b>Timed mock · {Math.floor(remaining / 60)}m {remaining % 60}s left</b> · Your answers submit when time runs out.</p> : <p>{review ? 'Scorecard' : 'Untimed practice'} · Coding, debugging and system design</p>}
    </section>
    {!mock && <div className="iv-actions">
      <button className="button button-dark" disabled={busy} onClick={() => { if (review || (state.code === item.starter && state.choice === -1 && !state.design) || window.confirm('Replace your current practice draft with a fresh timed mock?')) begin('mock'); }}>Start 30-minute mock</button>
      {review && <button className="button button-light" onClick={() => begin('practice')}>Retry in practice</button>}
      <a href={'#lesson/' + item.lesson}>{item.lessonTitle} lesson ↗</a>
    </div>}
    {review && <section className="iv-panel"><h2>Your scorecard</h2><p><b>Coding</b> · {state.results.filter(r => r.passed).length}/{state.results.length} checks passed<br/><b>Debugging</b> · {state.choice === item.correct ? 'Correct diagnosis' : 'Review the diagnosis below'}<br/><b>Design</b> · {state.graded ? state.checks.length + '/' + item.criteria.length + ' criteria met (self-assessed)' : 'Assess your answer below'}</p>
    {state.graded && <p>{entry.gaps?.length ? 'Review focus · ' + entry.gaps.join(', ') : 'All criteria met.'} Next review · {new Date(entry.due!).toLocaleDateString()}.</p>}</section>}
    <section className="iv-panel"><h2>1. Coding challenge</h2><p>{item.brief}</p>
      <label>JavaScript solution<textarea className="iv-editor" spellCheck={false} readOnly={locked} value={state.code} onChange={e => update({ code: e.target.value, results: [] })}/></label>
      {!review && <button className="button button-light" disabled={locked} onClick={() => void grade(false)}>{busy ? 'Checking…' : 'Run checks'}</button>}
      <ul aria-live="polite">{item.tests.map((test, i) => <li key={test.label}>{state.results[i] && <b>{state.results[i].passed ? 'Passed · ' : 'Failed · '}</b>}{test.label}{state.results[i]?.detail && <small> — {state.results[i].detail}</small>}</li>)}</ul>
      {!mock && <><button className="text-button" aria-expanded={hint} onClick={() => setHint(!hint)}>{hint ? 'Hide hint' : 'Show hint'}</button>{hint && <p>{item.hint}</p>}
      <button className="text-button" aria-expanded={solution} onClick={() => setSolution(!solution)}>{solution ? 'Hide worked solution' : 'Show worked solution'}</button>{solution && <><pre>{item.solution}</pre><p>{item.explanation}</p></>}</>}
    </section>
    <section className="iv-panel"><h2>2. Debug the incident</h2><fieldset disabled={locked}><legend>{item.incident}</legend>{item.options.map((option, i) => <label className="iv-option" key={option}><input type="radio" name="diagnosis" checked={state.choice === i} onChange={() => update({ choice: i })}/>{option}</label>)}</fieldset>
      {review && <p><b>Diagnosis</b> · {item.diagnosis}</p>}
    </section>
    <section className="iv-panel"><h2>3. Design discussion</h2><p>{item.design}</p><p><b>Follow-up</b> · {item.followup}</p>
      <label>Your design and trade-offs<textarea readOnly={locked} value={state.design} placeholder="State your assumptions, compare two approaches and describe how you would verify the result." onChange={e => update({ design: e.target.value })}/></label>
      {review && <><h3>Review your reasoning</h3><p>Check each point you addressed in your original answer.</p>
      {item.criteria.map((point, i) => <label key={point} className="iv-option"><input type="checkbox" disabled={state.graded || !state.design.trim()} checked={state.checks.includes(i)} onChange={e => update({ checks: e.target.checked ? [...state.checks, i] : state.checks.filter(x => x !== i) })}/>{point}</label>)}
      <h3>One defensible design</h3><p>{item.walkthrough}</p><p><b>From your experience</b> · {item.projectQuestion}</p><p><b>Worked follow-up</b> · {item.answer}</p>
      {!state.graded && <button className="button button-dark" onClick={assess}>Save assessment and schedule revision</button>}</>}
    </section>
    {!review && <button className="button button-dark" disabled={locked} onClick={() => void grade(true)}>Finish {mock ? 'mock' : 'practice'} and see scorecard</button>}
  </div>;
}
