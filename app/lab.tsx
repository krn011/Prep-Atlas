'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowDown, ArrowRight, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, Code2, Crosshair, Layers3, Pause, Play, RotateCcw, Terminal } from 'lucide-react';
import type { Frame, Lesson } from '../content/curriculum';
import { arrayPresets, buildArrayTrace, type ArrayFrame, type ArraySettings } from '../content/algorithms';
import { lookups, scopes } from '../content/scope';

function Tokens({ line }: { line: string }) {
  const tokens = line.split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/.*$|\b(?:const|let|var|if|else|for|while|return|function|new|import|from|export|default|async|await|type|SELECT|FROM|JOIN|LEFT|ON|WHERE|BEGIN|UPDATE|ROLLBACK|CREATE|ALTER|FOR|USING|TRUE|ORDER|BY)\b|\b(?:true|false|null|undefined|\d+)\b)/g);
  return tokens.map((token, index) => {
    const name = index % 2 === 0 ? '' : token.startsWith('//') ? 'comment' : /^["']/.test(token) ? 'string' : /^(true|false|null|undefined|\d)/.test(token) ? 'literal' : 'keyword';
    return <span key={index} className={name || undefined}>{token}</span>;
  });
}

function CodePanel({ lesson, step, current, onLookup, selectedScope, onScope }: {
  lesson: Lesson;
  step: number;
  current: Frame;
  onLookup: (index: number) => void;
  selectedScope: string | null;
  onScope: (scope: string | null) => void;
}) {
  const isScope = lesson.id === 'scope';
  const lines = lesson.code.split('\n');
  const lookup = isScope ? lookups[step] : undefined;
  const declaration = selectedScope ? scopes.find(scope => scope.id === selectedScope)?.declaration : lookup?.declaration;
  return <div className="code-panel">
    <div className="code-header">
      <span className="file-name"><Code2 size={15} aria-hidden="true" />{lesson.file ?? lesson.id + '.js'}</span>
      <span className="code-language">{lesson.language ?? 'JavaScript'}</span>
    </div>
    {isScope && <div className="code-legend" aria-label="Highlight a scope">
      {scopes.map(scope => <button key={scope.id} className={`legend-item tone-${scope.id}`} aria-pressed={selectedScope === scope.id}
        onClick={() => onScope(selectedScope === scope.id ? null : scope.id)}><span />{scope.title.replace(' scope', '')}</button>)}
    </div>}
    <div className={`code-body ${isScope ? 'scope-code' : ''}`} tabIndex={0} aria-label={isScope ? 'JavaScript source with clickable lookup lines' : 'Source code'}>
      {lines.map((line, index) => {
        const number = index + 1;
        const lookupIndex = isScope ? lookups.findIndex(item => item.line === number) : -1;
        const active = number === current.line && !selectedScope;
        const marked = number === declaration;
        const regions = isScope ? scopes.filter(scope => number >= scope.from && number <= scope.to) : [];
        const focused = selectedScope && regions.some(scope => scope.id === selectedScope);
        const className = `code-line ${active ? 'line-active' : ''} ${marked ? 'line-declaration' : ''} ${focused ? 'line-focused' : ''}`;
        const content = <>
          <span className="line-number" aria-hidden="true">{String(number).padStart(2, '0')}</span>
          {isScope && <span className="scope-rails" aria-hidden="true">{scopes.map(scope =>
            <i className={`tone-${scope.id} ${regions.includes(scope) ? 'rail-in' : ''} ${selectedScope === scope.id || (!selectedScope && lookup?.path.includes(scope.id)) ? 'rail-strong' : ''}`} key={scope.id} />
          )}</span>}
          <code><Tokens line={line || ' '} /></code>
          {lookupIndex >= 0 && <Crosshair className="line-target" size={13} aria-hidden="true" />}
        </>;
        return lookupIndex >= 0
          ? <button type="button" className={className} key={number} aria-pressed={active} aria-label={`Line ${number}, look up ${lookups[lookupIndex].name}`} onClick={() => onLookup(lookupIndex)}>{content}</button>
          : <div className={className} key={number}>{content}</div>;
      })}
    </div>
  </div>;
}

function ScopeMap({ step, selected }: { step: number; selected: string | null }) {
  const lookup = lookups[step];
  const focused = scopes.find(scope => scope.id === selected);
  return <div className="scope-map">
    <div className="map-caption"><Layers3 size={14} aria-hidden="true" /> SCOPE MAP</div>
    <div className={`scope-box tone-global ${lookup.path.includes('global') ? 'searched' : ''}`} data-focus={selected === 'global' || (selected === null && lookup.declaration === 1)}>
      <div><span>Script</span><code>course</code></div>
      <div className={`scope-box tone-function ${lookup.path.includes('function') ? 'searched' : ''}`} data-focus={selected === 'function' || (selected === null && lookup.declaration === 4)}>
        <div><span>Function</span><code>topic</code></div>
        <div className={`scope-box tone-block ${lookup.path.includes('block') ? 'searched' : ''}`} data-focus={selected === 'block' || (selected === null && lookup.declaration === 7)}>
          <div><span>Block</span><code>note</code></div>
        </div>
      </div>
    </div>
    {focused
      ? <div className="path"><span>Lines {focused.from}–{focused.to}</span><ArrowRight size={13} /><code>{focused.variable}</code></div>
      : <div className="path"><span>Lookup</span>{lookup.path.map(part => <span className={`path-node tone-${part}`} key={part}><ArrowRight size={13} aria-hidden="true" /><b>{part === 'global' ? 'Script' : part}</b></span>)}</div>}
  </div>;
}

function TraceMap({ current }: { current: Frame | ArrayFrame }) {
  return <div className="trace-map">
    <div className="map-caption"><Layers3 size={14} aria-hidden="true" />{'values' in current ? 'ARRAY STATE' : 'WHAT CHANGED'}</div>
    {'values' in current && <div className="array-cells" aria-label="Array elements">
      {current.values.map((value, index) => <div key={index} className={`array-cell ${current.active.includes(index) ? 'array-active' : ''} ${current.excluded?.includes(index) ? 'array-excluded' : ''}`}>
        <span>{index}</span><b>{value}</b>
      </div>)}
    </div>}
    <ul className="trace-nodes">
      {current.nodes?.map((item) =>
        <li key={item.label} className={`node-${item.state ?? 'normal'}`}><span className="state-dot" aria-hidden="true" /><span>{item.label}</span><code>{item.value}</code></li>
      )}
    </ul>
  </div>;
}

export function Lab({ lesson }: { lesson: Lesson }) {
  const arrayPreset = arrayPresets[lesson.id];
  const [settings, setSettings] = useState<ArraySettings | undefined>(arrayPreset);
  const [rawArray, setRawArray] = useState(arrayPreset?.values.join(', ') ?? '');
  const [rawArgument, setRawArgument] = useState(String(arrayPreset?.argument ?? ''));
  const [validation, setValidation] = useState('');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedScope, setSelectedScope] = useState<string | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const frames = settings ? buildArrayTrace(lesson.id, settings) : lesson.frames;
  const current = frames[step];
  const isScope = lesson.id === 'scope';
  const isWindow = lesson.id === 'sliding-window';
  const scopeDetail = scopes.find(scope => scope.id === selectedScope);
  const output = isScope ? lookups.slice(0, step + 1).map(item => item.output).join('\n') : current.output;

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (step + 1 >= frames.length) setPlaying(false);
      else setStep(step + 1);
    }, 1250);
    return () => clearTimeout(timer);
  }, [playing, step, frames.length]);

  useLayoutEffect(() => {
    const element = stage.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const context = gsap.context(() => {
      gsap.fromTo('[data-step-copy]', { autoAlpha: 0.7, y: 5 }, { autoAlpha: 1, y: 0, duration: 0.24, ease: 'power2.out' });
      gsap.fromTo('.scope-box[data-focus="true"], .array-active, .node-active', { filter: 'brightness(1.2)' }, { filter: 'brightness(1)', duration: 0.48, ease: 'power2.out', clearProps: 'filter' });
    }, element);
    return () => context.revert();
  }, [step, selectedScope, settings]);

  function selectStep(index: number) {
    setStep(index);
    setPlaying(false);
    setSelectedScope(null);
  }

  function updateArray(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parts = rawArray.split(',').map(part => part.trim());
    const values = parts.map(Number);
    const argument = Number(rawArgument);
    if (values.length > 12 || parts.some(part => !/^-?\d+$/.test(part)) || values.some(value => !Number.isSafeInteger(value) || Math.abs(value) > 9999)) {
      setValidation('Use 1–12 comma-separated whole numbers from −9999 to 9999.');
      return;
    }
    if (!/^-?\d+$/.test(rawArgument.trim()) || !Number.isSafeInteger(argument) || (isWindow && (argument < 1 || argument > values.length))) {
      setValidation(isWindow ? 'Window size must be between 1 and the array length.' : 'Enter a whole number as the target.');
      return;
    }
    if (!isWindow && values.some((value, index) => index > 0 && value < values[index - 1])) {
      setValidation('Enter values in ascending order for this algorithm.');
      return;
    }
    setValidation('');
    setSettings({ values, argument });
    selectStep(0);
  }

  return <div className="lab-shell" ref={stage}>
    <div className="lab-heading">
      <span className="lab-heading-icon"><Terminal size={19} aria-hidden="true" /></span>
      <div><h2>{isScope ? 'Scope explorer' : 'Trace the example'}</h2><p>{isScope ? 'Select a log line to see where its variable comes from.' : 'Step through the example and watch the values change.'}</p></div>
      <span className="lab-count">{isScope ? 'VARIABLE LOOKUP' : 'STEP-BY-STEP'}</span>
    </div>
    {arrayPreset && <form className="array-form" onSubmit={updateArray}>
      <label>Array<input value={rawArray} onChange={event => setRawArray(event.target.value)} spellCheck={false} required /></label>
      <label>{isWindow ? 'Window size' : 'Target'}<input value={rawArgument} onChange={event => setRawArgument(event.target.value)} required inputMode="numeric" /></label>
      <button className="button button-light" type="submit">Update trace <ArrowRight size={15} /></button>
      {validation && <p role="alert" className="input-error">{validation}</p>}
    </form>}
    <div className="lab-grid">
      <CodePanel lesson={lesson} step={step} current={current} selectedScope={selectedScope} onLookup={selectStep} onScope={scope => { setSelectedScope(scope); setPlaying(false); }} />
      <div className="lab-inspector">
        {isScope ? <ScopeMap step={step} selected={selectedScope} /> : <TraceMap current={current} />}
        <div className="step-copy" data-step-copy aria-live="polite" aria-atomic="true">
          <span className="step-kicker">{scopeDetail ? 'SCOPE BOUNDARY' : `STEP ${String(step + 1).padStart(2, '0')} / ${String(frames.length).padStart(2, '0')}`}</span>
          <h3>{scopeDetail?.title ?? current.title}</h3>
          <p>{scopeDetail?.note ?? current.note}</p>
        </div>
        <div className="console">
          <span><Terminal size={13} aria-hidden="true" />{isScope ? 'CONSOLE' : 'RESULT'}</span>
          <pre aria-label={isScope ? 'Console output' : 'Step result'}>{output || 'Waiting for a result…'}</pre>
        </div>
      </div>
    </div>
    <div className="transport">
      <div className="transport-start">
        <button className="icon-button" type="button" data-icon-motion="reset" title="Reset trace" aria-label="Reset trace" onClick={() => selectStep(0)}><RotateCcw size={16} /></button>
        <button className="button run-button" type="button" onClick={() => {
          if (!playing) {
            setSelectedScope(null);
            if (step === frames.length - 1) setStep(0);
          }
          setPlaying(!playing);
        }}>{playing ? <Pause size={15} /> : <Play size={15} />} {playing ? 'Pause' : 'Play'}</button>
      </div>
      <div className="step-dots" aria-label="Trace steps">
        {frames.map((item, index) => <button key={index} className={index === step ? 'current' : ''} aria-current={index === step ? 'step' : undefined}
          aria-label={`Step ${index + 1}: ${item.title}`} title={item.title} onClick={() => selectStep(index)} />)}
      </div>
      <div className="transport-end">
        <button type="button" className="icon-button" data-icon-motion="back" title="Previous step" aria-label="Previous step" disabled={step === 0} onClick={() => selectStep(step - 1)}><ChevronLeft size={19} /></button>
        <button type="button" className="button next-button" data-icon-motion="forward" disabled={step === frames.length - 1} onClick={() => selectStep(step + 1)}>Next step <ChevronRight size={17} /></button>
      </div>
    </div>
  </div>;
}

export function Compare({ lesson }: { lesson: Lesson }) {
  return <section className="lesson-card">
    <div className="section-heading"><h2>Compare two cases</h2><p>Read both examples and predict their outputs before looking at the results.</p></div>
    <div className="compare-grid">{lesson.compare.map(item =>
      <article className="compare-example" key={item.label}>
        <h3>{item.label}</h3><pre><code>{item.code.split('\n').map((line, index) => <span className="standalone-line" key={index}><Tokens line={line} /></span>)}</code></pre>
        <div className="compare-result"><ArrowDown size={15} aria-hidden="true" /><span>{item.result}</span></div>
      </article>
    )}</div>
    <div className="mistake"><CircleAlert size={20} aria-hidden="true" /><div><h3>Common mistake</h3><p>{lesson.mistake}</p></div></div>
  </section>;
}

export function Practice({ lesson }: { lesson: Lesson }) {
  const [choice, setChoice] = useState<number>();
  const [solution, setSolution] = useState(false);
  const hasAnswer = choice !== undefined;
  const correct = choice === lesson.question.answer;
  return <section className="lesson-card">
    <div className="section-heading"><h2>Check your understanding</h2><p>Pick an answer, then explain why you chose it.</p></div>
    <fieldset className="quiz">
      <legend>{lesson.question.prompt}</legend>
      {lesson.question.options.map((option, index) => <button type="button" className={`quiz-option ${choice === index ? (correct ? 'correct' : 'incorrect') : ''}`}
        aria-pressed={choice === index} onClick={() => setChoice(index)} key={option}>
        <span className="option-letter">{String.fromCharCode(65 + index)}</span>{option}
        {choice === index && (correct ? <CircleCheck size={19} /> : <CircleAlert size={19} />)}
      </button>)}
    </fieldset>
    {hasAnswer && <p className={`feedback ${correct ? 'correct' : 'incorrect'}`} role="status">{correct ? lesson.question.why : 'Try again. Think about what the example actually does.'}</p>}
    <div className="exercise"><h3>Try it yourself</h3><p>{lesson.exercise}</p>
      <button className="button button-light" type="button" aria-expanded={solution} onClick={() => setSolution(!solution)}>{solution ? 'Hide solution' : 'Reveal solution'}</button>
      {solution && <p className="solution">{lesson.solution}</p>}
    </div>
  </section>;
}
