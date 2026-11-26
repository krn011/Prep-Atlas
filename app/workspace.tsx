'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useIconMotion } from './icon-motion';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Braces, Check, ChevronDown, ChevronRight, CircleHelp, CodeXml, Command, Compass, FlaskConical, Gauge, GraduationCap, Layers3, ListTree, Map, Menu, PanelLeft, Search, X } from 'lucide-react';
import { tracks, type Chapter, type Lesson, type TrackId } from '../content/curriculum';
import { workedExamples } from '../content/worked-examples';
import { lessons } from '../content/lessons';
import { TopicRuler } from './topic-ruler';
import { LiveExample } from './live-examples';
import { experimentCases } from '../content/experiments';
import { Interview } from './interview';
import { seniorCases } from '../content/senior-cases';
import { Blueprint } from './blueprint';
import { Compare, Lab, Practice } from './lab';
import { GrowthChart, JoinPlayground, RenderingGrid } from './visuals';

type View = { page: 'lesson' | 'track' | 'atlas' | 'roadmap' | 'blueprint' | 'interview'; id: string };
type Study = { complete: string[]; visited: string; roadmap: string[] };
type Tab = 'visual' | 'compare' | 'practice';

const initialStudy: Study = { complete: [], visited: 'scope', roadmap: [] };
const initialView: View = { page: 'lesson', id: 'scope' };
const storageKey = 'prep-atlas:study-v1';
const tabs: { id: Tab; title: string; icon: typeof Layers3 }[] = [
  { id: 'visual', title: 'Visual lesson', icon: Layers3 },
  { id: 'compare', title: 'Compare', icon: Braces },
  { id: 'practice', title: 'Practice', icon: FlaskConical },
];

function readView(): View {
  const [page, id = ''] = window.location.hash.slice(1).split('/');
  if (page === 'interview' || page === 'atlas' || page === 'roadmap' || page === 'blueprint') return { page, id };
  if (page === 'track' && tracks.some(track => track.id === id)) return { page, id };
  if (page === 'lesson' && lessons.some(lesson => lesson.id === id)) return { page, id };
  return initialView;
}

function href({ page, id }: View) {
  return `#${page}${id ? '/' + id : ''}`;
}

function BrandMark() {
  return <>
    <img className="brand-lockup" src="/brand/logo.png" width="139" alt="" />
    <svg className="brand-symbol" width="16" height="23" viewBox="0 0 17 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M2 0h13a2 2 0 0 1 2 2v2.4h-4.4v2H17v3.1H9.8v2H17v3.1H7.4v2H17v6.6a.8.8 0 0 1-1.2.7l-7.3-4.2-7.3 4.2a.8.8 0 0 1-1.2-.7V2a2 2 0 0 1 2-2Z" />
    </svg>
  </>;
}

function ScopeArtwork() {
  return <div className="scope-artwork" aria-hidden="true">
    <div className="art-grid" />
    <svg viewBox="0 0 390 240" fill="none" className="scope-diagram">
      <path d="M192 27 343 93 192 159 41 93 192 27Z" fill="#dedbd3" stroke="#454540" strokeWidth="1.2" />
      <path d="M192 57 307 107 192 157 77 107 192 57Z" fill="#a4a29b" stroke="#52524e" strokeWidth="1.35" />
      <path d="M192 85 261 115 192 145 123 115 192 85Z" fill="#363635" stroke="#181818" strokeWidth="1.6" />
      <path d="M192 159v56M343 93v54l-151 68-151-68V93" stroke="#87837c" strokeDasharray="4 5" />
      <path d="M192 145v40M261 115v40l-69 30-69-30v-40" stroke="#52524e" strokeOpacity=".55" />
      <path d="M50 52v14m-7-7h14M324 173v14m-7-7h14M290 37v12m-6-6h12" stroke="#777770" />
      <circle cx="308" cy="106" r="3" fill="#242424" />
      <circle cx="41" cy="93" r="3" fill="#242424" />
      <circle cx="192" cy="115" r="4" fill="#fffcf1" />
      <path d="M261 115h76M77 107H33M192 185v34h59" stroke="#827e76" strokeDasharray="3 4" />
      <text x="95" y="37">script</text><text x="281" y="76">function</text><text x="264" y="137">block</text>
    </svg>
  </div>;
}

function Hero({ lesson, complete, onStart }: { lesson: Lesson; complete: boolean; onStart: () => void }) {
  const track = tracks.find(item => item.id === lesson.track)!;
  return <section className={`hero ${lesson.id === 'scope' ? 'hero-scope' : 'hero-standard'}`}>
    <div className="hero-copy">
      <div className="hero-eyebrow"><span className="hero-signal" /> {track.title} <span className="hero-separator" /> {complete ? 'Completed' : 'Visual lesson'}</div>
      <h1>{lesson.id === 'scope' ? <>Scope <em>&amp; visibility</em></> : lesson.title}</h1>
      <p>{lesson.summary}</p>
      <button className="button hero-button" data-icon-motion="down" onClick={onStart}>Explore the lab <ArrowDown size={16} aria-hidden="true" /></button>
    </div>
    {lesson.id === 'scope' ? <ScopeArtwork /> : <div className="hero-glyph" aria-hidden="true"><span>{track.glyph}</span><i /><i /></div>}
  </section>;
}

function LessonContent({ lesson, isComplete, onComplete, onNavigate }: {
  lesson: Lesson; isComplete: boolean; onComplete: () => void; onNavigate: (view: View) => void;
}) {
  const [tab, setTab] = useState<Tab>('visual');
  const panel = useRef<HTMLDivElement>(null);
  const whole = useRef<HTMLDivElement>(null);
  const trackLessons = lessons.filter(item => item.track === lesson.track);
  const position = trackLessons.indexOf(lesson);
  const next = trackLessons[position + 1];

  useLayoutEffect(() => {
    if (!whole.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const context = gsap.context(() => {
      gsap.fromTo('.hero-copy', { y: 8, opacity: 0.8 }, { y: 0, opacity: 1, duration: 0.38, ease: 'power2.out', clearProps: 'transform,opacity' });
      gsap.fromTo('.scope-diagram', { y: 10, opacity: 0.65 }, { y: 0, opacity: 1, duration: 0.58, ease: 'power3.out', clearProps: 'transform,opacity' });
    }, whole);
    return () => context.revert();
  }, []);

  function jumpToLab() {
    setTab('visual');
    requestAnimationFrame(() => {
      panel.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      panel.current?.focus({ preventScroll: true });
    });
  }

  return <div ref={whole}>
    <Hero lesson={lesson} complete={isComplete} onStart={jumpToLab} />
    <nav className="lesson-tabs" aria-label="Lesson sections">
      {tabs.map(({ id, title, icon: Icon }) => <button className={tab === id ? 'active' : ''} aria-pressed={tab === id} onClick={() => setTab(id)} key={id}><Icon size={17} aria-hidden="true" />{title}</button>)}
      <button type="button" aria-pressed={isComplete} className={`button completion ${isComplete ? 'is-complete' : ''}`} onClick={onComplete}><Check size={16} aria-hidden="true" />{isComplete ? 'Completed' : 'Mark complete'}</button>
    </nav>
    <div ref={panel} className="lesson-panel" tabIndex={-1}>
      <div hidden={tab !== 'visual'}><LiveExample id={lesson.id} />
        {!experimentCases.has(lesson.id) && <Lab lesson={lesson} />}
        {lesson.id === 'joins' && <JoinPlayground />}
        {lesson.id === 'next-cache' && <RenderingGrid />}
        {lesson.id === 'complexity' && <GrowthChart />}
      </div>
      {tab === 'compare' && <Compare lesson={lesson} />}
      {tab === 'practice' && <><Practice lesson={lesson} />{seniorCases.filter(item => item.lesson === lesson.id).map(item => <button className="button button-light" key={item.id} onClick={() => onNavigate({ page: 'interview', id: item.id })}>Senior challenge · {item.title} →</button>)}</>}
    </div>
    <section className="lesson-reading" aria-label={lesson.title + ' study notes'}>
      <div className="reading-main">
        <h2>{lesson.title}</h2>
        <p>{lesson.detail}</p>
        {workedExamples[lesson.id] && <div className="reading-example">
          <h3>{workedExamples[lesson.id][0]}</h3><p>{workedExamples[lesson.id][1]}</p>
        </div>}
      </div>
      <aside className="reading-aside">
        <h3>Where you’ll use this</h3><p>{lesson.use}</p>
        {lesson.source && <a href={lesson.source[1]} target="_blank" rel="noreferrer">{lesson.source[0]} <ArrowUpRight size={14} aria-hidden="true" /></a>}
        {lesson.id === 'debounce' && <a href="https://www.w3schools.com/js/js_timers.asp" target="_blank" rel="noreferrer">W3Schools · JavaScript timers <ArrowUpRight size={14} aria-hidden="true" /></a>}
      </aside>
    </section>
    <div className="lesson-footer">
      <button className="text-button" data-icon-motion="back" onClick={() => onNavigate({ page: 'track', id: lesson.track })}><ArrowLeft size={17} /> All lessons in this track</button>
      {next && <button className="button button-dark" data-icon-motion="forward" onClick={() => onNavigate({ page: 'lesson', id: next.id })}>{next.title} <ArrowRight size={16} /></button>}
    </div>
  </div>;
}

function TrackCatalog({ view, onNavigate, complete }: { view: View; onNavigate: (view: View) => void; complete: string[] }) {
  const track = tracks.find(item => item.id === view.id);
  return <>
    <section className="page-intro">
      <span className="intro-label"><Map size={15} /> {track ? 'STUDY TRACK' : 'CURRICULUM'}</span>
      <h1>{track?.title ?? 'Topic atlas'}</h1>
      <p>{track?.description ?? 'Pick a track to work through interactive lessons and find the matching blueprint notes.'}</p>
    </section>
    {track ? <>
      <div className="lesson-library">
        {lessons.filter(lesson => lesson.track === track.id).map(lesson => <a className="library-row" data-icon-motion="open" key={lesson.id}
          href={href({ page: 'lesson', id: lesson.id })} onClick={event => { event.preventDefault(); onNavigate({ page: 'lesson', id: lesson.id }); }}>
          <span className={`track-glyph ${track.color}`}><CodeXml size={18} aria-hidden="true" /></span>
          <div><h2>{lesson.title}</h2><p>{lesson.summary}</p></div>
          {complete.includes(lesson.id) && <span className="done-tag"><Check size={14} /> Completed</span>}
          <ArrowUpRight className="row-arrow" size={19} aria-hidden="true" />
        </a>)}
      </div>
      <button className="button button-light blueprint-link" data-icon-motion="forward" onClick={() => onNavigate({ page: 'blueprint', id: track.references[0].replace('.', '-') })}><BookOpen size={17} /> Read the matching blueprint chapters <ArrowRight size={16} /></button>
    </> : <div className="track-grid">
      {tracks.map(item => {
        const members = lessons.filter(lesson => lesson.track === item.id);
        const done = members.filter(lesson => complete.includes(lesson.id)).length;
        const target: View = { page: 'track', id: item.id };
        return <a href={href(target)} onClick={event => { event.preventDefault(); onNavigate(target); }} className="track-card" data-icon-motion="open" key={item.id}>
          <span className={`track-glyph ${item.color}`}>{item.glyph}</span><ArrowUpRight className="row-arrow" size={19} aria-hidden="true" />
          <h2>{item.title}</h2><p>{item.description}</p><span className="track-count">{done} / {members.length} complete</span>
        </a>;
      })}
    </div>}
  </>;
}

function Roadmap({ chapters, done, toggle }: { chapters: Chapter[]; done: string[]; toggle: (id: string) => void }) {
  const months = useMemo(() => {
    const source = chapters.find(chapter => chapter.number === '9')?.markdown ?? '';
    return source.split(/^## Month /m).slice(1).map((month, index) => {
      const lines = month.trim().split('\n');
      const date = lines[0].replace(/^\d+: /, '');
      const theme = lines.find(line => line.startsWith('Theme: '))?.slice(7).replace(/\.$/, '') ?? '';
      const tasks = month.split('### Focus')[1]?.split('### Expected Outcome')[0].match(/^- .+$/gm)?.map(line => line.slice(2)) ?? [];
      return { id: String(index + 1), date, theme, tasks };
    });
  }, [chapters]);
  const [monthId, setMonthId] = useState('1');
  const month = months.find(item => item.id === monthId);
  if (!month) return null;
  return <>
    <section className="page-intro"><span className="intro-label"><Compass size={15} /> NOV 2026–JUN 2027</span><h1>Your study roadmap</h1><p>Work one month at a time. Check off a focus area as you finish it.</p></section>
    <div className="roadmap-grid">
      <nav className="month-nav" aria-label="Roadmap months">{months.map(item => {
        const completed = item.tasks.filter((_, index) => done.includes(item.id + ':' + index)).length;
        return <button aria-pressed={item.id === monthId} onClick={() => setMonthId(item.id)} key={item.id}>
          <span>{String(item.id).padStart(2, '0')}</span><div><b>{item.date}</b><small>{completed} / {item.tasks.length} done</small></div><ChevronRight size={17} />
        </button>;
      })}</nav>
      <section key={month.id} className="lesson-card month-plan">
        <h2>{month.theme}</h2>
        <p>{month.date}</p>
        <ul>{month.tasks.map((task, index) => {
          const id = month.id + ':' + index;
          return <li key={id}><label><input type="checkbox" checked={done.includes(id)} onChange={() => toggle(id)} /><span>{task.replace(/\.$/, '')}</span></label></li>;
        })}</ul>
      </section>
    </div>
    <section className="note-card routine"><Gauge size={21} /><div><h2>Daily and weekly routine</h2><Blueprint markdown={chapters.filter(chapter => chapter.number === '10' || chapter.number.startsWith('10.')).map(chapter => chapter.number === '10' ? chapter.markdown : '### ' + chapter.title + '\n\n' + chapter.markdown).join('\n\n')} /></div></section>
  </>;
}

function BlueprintView({ chapters, initialId }: { chapters: Chapter[]; initialId: string }) {
  const [chapterId, line] = initialId.split('~');
  const groupFor = (key: string) => key.split('-')[0];
  const groups = chapters.filter(chapter => !chapter.number.includes('.'));
  const [group, setGroup] = useState(groupFor(chapterId) || '4');
  const selected = groups.find(item => item.id === group) ?? groups[0];
  const parts = chapters.filter(item => item.number.startsWith(selected.number + '.'));
  useEffect(() => {
    const container = document.getElementById('chapter-' + chapterId);
    const target = line === undefined ? container : container?.querySelector('[data-source-line="' + Number(line) + '"]');
    if (target) {
      if (line !== undefined) target.classList.add('ruler-selection');
      target.scrollIntoView({ block: line === undefined ? 'start' : 'center' });
    }
    return () => target?.classList.remove('ruler-selection');
  }, [chapterId, line]);
  return <>
    <section className="page-intro"><span className="intro-label"><BookOpen size={16} /> SOURCE NOTES</span><h1>Preparation blueprint</h1><p>Browse the original syllabus, interview questions, projects, routines, and career plan.</p></section>
    <div className="blueprint-layout">
      <nav className="blueprint-nav" aria-label="Blueprint chapters">
        {groups.map(chapter => <button aria-pressed={selected.id === chapter.id} key={chapter.id} onClick={() => setGroup(chapter.id)}><span>{chapter.number}</span>{chapter.title}</button>)}
      </nav>
      <section key={selected.id} className="lesson-card blueprint-panel">
        <div id={'chapter-' + selected.id}><h2>{selected.title}</h2><Blueprint markdown={selected.markdown} /></div>
        {parts.map(chapter => <details className="chapter" open={chapterId === chapter.id || undefined} key={chapter.id} id={'chapter-' + chapter.id}>
          <summary><span>{chapter.number}</span>{chapter.title}<ChevronDown size={17} aria-hidden="true" /></summary><Blueprint markdown={chapter.markdown} />
        </details>)}
      </section>
    </div>
  </>;
}

function SearchDialog({ open, close, navigate, chapters }: { open: boolean; close: () => void; navigate: (view: View) => void; chapters: Chapter[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState('');
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      input.current?.focus();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);
  const clean = query.toLowerCase().trim();
  const tokens = clean.split(/\s+/);
  const matches = (haystack: string) => tokens.every(token => haystack.toLowerCase().includes(token));
  const results = [
    ...(clean ? seniorCases.filter(item => matches('senior interview mock ' + item.title + ' ' + item.topic + ' ' + item.design)).map(item => ({ title: item.title, caption: 'Senior interview case', target: { page: 'interview', id: item.id } as View })) : []),
    ...lessons.filter(item => matches(item.title + ' ' + item.summary + ' ' + item.track)).slice(0, clean ? 8 : 5).map(item => ({ title: item.title, caption: tracks.find(track => track.id === item.track)?.title ?? '', target: { page: 'lesson', id: item.id } as View })),
    ...(clean ? chapters.filter(item => matches(item.title + ' ' + item.markdown)).slice(0, 6).map(item => ({ title: item.title, caption: 'Blueprint · ' + item.number, target: { page: 'blueprint', id: item.id } as View })) : []),
  ];
  function moveResult(direction: number) {
    if (!results.length) return;
    const next = (activeIndex + direction + results.length) % results.length;
    setActiveIndex(next);
    document.getElementById('atlas-result-' + next)?.scrollIntoView({ block: 'nearest' });
  }
  return <dialog ref={dialog} className="search-dialog" aria-label="Search the atlas" onClose={() => { close(); setQuery(''); setActiveIndex(0); }}
    onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="finder">
      <form className="finder-bar" onSubmit={event => { event.preventDefault(); if (results[activeIndex]) navigate(results[activeIndex].target); }}>
        <Search size={21} aria-hidden="true" />
        <input ref={input} role="combobox" type="text" autoComplete="off" placeholder="Search lessons and notes…"
          aria-label="Search lessons and notes" aria-autocomplete="list" aria-controls="atlas-results" aria-expanded={open}
          aria-activedescendant={results[activeIndex] ? 'atlas-result-' + activeIndex : undefined}
          value={query} onChange={event => { setQuery(event.target.value); setActiveIndex(0); }}
          onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); moveResult(event.key === 'ArrowDown' ? 1 : -1); } }} />
        <button type="button" className="finder-close" onClick={close} aria-label="Close search">Esc</button>
      </form>
      <p className="finder-label" role="status">{clean ? (results.length ? 'Search results' : 'No matches') : 'Suggested lessons'}</p>
      <div className="finder-list" role="listbox" id="atlas-results" aria-label="Search results">
        {results.map((item, index) => <div role="option" id={'atlas-result-' + index} aria-selected={activeIndex === index}
          key={href(item.target)} onMouseDown={event => event.preventDefault()} onPointerMove={event => { if (event.pointerType === 'mouse') setActiveIndex(index); }}
          onClick={() => navigate(item.target)}>
          <span className="finder-symbol">{item.target.page === 'lesson' ? <FlaskConical size={16} /> : <BookOpen size={16} />}</span>
          <div><b>{item.title}</b><small>{item.caption}</small></div><ChevronRight size={15} aria-hidden="true" />
        </div>)}
      </div>
      {!results.length && <p className="finder-empty">Try a shorter topic name, such as “scope” or “SQL”.</p>}
      <footer className="finder-keys"><span><kbd>↑</kbd><kbd>↓</kbd> Move</span><span><kbd>↵</kbd> Open</span></footer>
    </div>
  </dialog>;
}

export default function Workspace({ chapters }: { chapters: Chapter[] }) {
  const [view, setView] = useState<View>(initialView);
  const [study, setStudy] = useState<Study>(initialStudy);
  const [search, setSearch] = useState(false);
  const [menu, setMenu] = useState(false);
  const [compact, setCompact] = useState(false);
  const [flyout, setFlyout] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const main = useRef<HTMLElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  useIconMotion(shell);

  useEffect(() => {
    setView(readView());
    try {
      setCompact(localStorage.getItem('prep-atlas:compact') === 'true');
      const stored: Partial<Study> = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}');
      setStudy({
        complete: Array.isArray(stored.complete) ? stored.complete.filter(id => lessons.some(lesson => lesson.id === id)) : [],
        visited: lessons.some(lesson => lesson.id === stored.visited) ? stored.visited! : 'scope',
        roadmap: Array.isArray(stored.roadmap) ? stored.roadmap.filter(value => typeof value === 'string') : [],
      });
    } catch { /* Study remains available for this visit. */ }
    setReady(true);
    const sync = () => setView(readView());
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearch(value => !value);
      }
      if (event.ctrlKey && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'b' && !event.repeat &&
          !(event.target instanceof HTMLElement && (event.target.isContentEditable || event.target.closest('input,textarea,select')))) {
        event.preventDefault();
        setFlyout(null);
        if (window.matchMedia('(min-width: 901px)').matches) setCompact(value => !value);
        else setMenu(value => !value);
      }
      if (event.key === 'Escape') { setMenu(false); setFlyout(null); }
    };
    window.addEventListener('hashchange', sync);
    window.addEventListener('keydown', shortcut);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('keydown', shortcut);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(study)); } catch { /* Keep the current session working. */ }
  }, [ready, study]);

  useEffect(() => {
    if (ready && view.page === 'lesson') setStudy(previous => previous.visited === view.id ? previous : { ...previous, visited: view.id });
  }, [ready, view]);

  useEffect(() => {
    if (ready) try { localStorage.setItem('prep-atlas:compact', String(compact)); } catch { /* Session only. */ }
  }, [compact, ready]);

  function navigate(next: View) {
    setFlyout(null);
    setView(next);
    setSearch(false);
    setMenu(false);
    if (window.location.hash !== href(next)) window.history.pushState(null, '', href(next));
    window.scrollTo({ top: 0, behavior: 'instant' });
    main.current?.focus({ preventScroll: true });
  }

  function toggle(field: 'complete' | 'roadmap', value: string) {
    setStudy(previous => ({ ...previous, [field]: previous[field].includes(value) ? previous[field].filter(item => item !== value) : [...previous[field], value] }));
  }

  function go(event: React.MouseEvent<HTMLAnchorElement>, next: View) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(next);
  }

  const lesson = view.page === 'lesson' ? lessons.find(item => item.id === view.id) : undefined;
  const track = tracks.find(item => item.id === (lesson?.track ?? view.id));
  const title = view.page === 'interview' ? 'Senior interview studio' : view.page === 'atlas' ? 'Topic atlas' : view.page === 'roadmap' ? 'Study roadmap' : view.page === 'blueprint' ? 'Preparation blueprint' : track?.title ?? 'Visual lab';
  const percent = Math.round(study.complete.length / lessons.length * 100);

  const railItems = [
    { label: 'Visual lab', icon: FlaskConical, page: 'lesson', links: lessons.map(item => ({ label: item.title, page: 'lesson', id: item.id } as const)) },
    { label: 'Topic atlas', icon: Map, page: 'atlas', links: [{ label: 'All tracks', page: 'atlas', id: '' } as const, ...tracks.map(item => ({ label: item.title, page: 'track', id: item.id } as const))] },
    { label: 'Senior interview studio', icon: GraduationCap, page: 'interview', links: [{ label: 'All cases and revision', page: 'interview', id: '' } as const, ...seniorCases.map(item => ({ label: item.title, page: 'interview', id: item.id } as const))] },
    { label: 'Study roadmap', icon: ListTree, page: 'roadmap', links: [{ label: 'Open study roadmap', page: 'roadmap', id: '' } as const] },
    { label: 'Blueprint', icon: BookOpen, page: 'blueprint', links: chapters.filter(c => !c.number.includes('.')).map(c => ({ label: c.title, page: 'blueprint', id: c.id } as const)) },
  ];
  return <div className={`app-shell ${compact ? 'compact' : ''}`} ref={shell}>
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); main.current?.focus(); }}>Skip to lesson</a>
    <aside id="workspace-menu" className={`sidebar ${menu ? 'sidebar-open' : ''}`}>
      <a aria-label="Prep Atlas home" className="brand" href="#atlas" onClick={event => go(event, { page: 'atlas', id: '' })}><BrandMark /><small>Interview workspace</small></a>
      {compact && <nav className="icon-rail" aria-label="Workspace shortcuts">
        {railItems.map(({ label, icon: Icon, links, page }) => <div className="rail-group" key={label}
          onMouseEnter={() => setFlyout(label)} onMouseLeave={() => setFlyout(null)}
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFlyout(null); }}
          onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.querySelector('button')?.focus(); setFlyout(null); } }}>
          <button type="button" aria-label={label} aria-expanded={flyout === label} className={view.page === page || (page === 'atlas' && view.page === 'track') ? 'current' : ''}
            onFocus={() => setFlyout(label)} onClick={() => setFlyout(label)}><Icon size={19} /></button>
          {flyout === label && <div className="rail-pop"><strong>{label}</strong><div>{links.map(link =>
            <a key={link.page + link.id} href={href(link)} onClick={event => go(event, link)}>{link.label}</a>)}</div></div>}
        </div>)}
      </nav>}
      <nav className="sidebar-nav"  aria-label="Study workspace">
        <div className="sidebar-section">
          <p>WORKSPACE</p>
          <a href={`#lesson/${study.visited}`} className={`side-item ${view.page === 'lesson' ? 'active' : ''}`} aria-current={view.page === 'lesson' ? 'page' : undefined} onClick={event => go(event, { page: 'lesson', id: study.visited })}><FlaskConical size={17} /> Visual lab</a>
          <a href="#atlas" className={`side-item ${view.page === 'atlas' ? 'active' : ''}`} aria-current={view.page === 'atlas' ? 'page' : undefined} onClick={event => go(event, { page: 'atlas', id: '' })}><Map size={17} /> Topic atlas</a>
          <a href="#interview" className={`side-item ${view.page === 'interview' ? 'active' : ''}`} aria-current={view.page === 'interview' ? 'page' : undefined} onClick={event => go(event, { page: 'interview', id: '' })}><GraduationCap size={17} /> Senior interview studio</a>
          <a href="#roadmap" className={`side-item ${view.page === 'roadmap' ? 'active' : ''}`} aria-current={view.page === 'roadmap' ? 'page' : undefined} onClick={event => go(event, { page: 'roadmap', id: '' })}><ListTree size={17} /> Study roadmap</a>
          <a href="#blueprint" className={`side-item ${view.page === 'blueprint' ? 'active' : ''}`} aria-current={view.page === 'blueprint' ? 'page' : undefined} onClick={event => go(event, { page: 'blueprint', id: '' })}><BookOpen size={17} /> Blueprint</a>
        </div>
      </nav>
      <TopicRuler chapters={chapters} page={view.page} id={view.id} complete={study.complete} navigate={navigate} />
      <div className="sidebar-bottom">
        <div className="progress-label"><span><GraduationCap size={18} aria-hidden="true" /> Lab progress</span><b>{percent}%</b></div>
        <progress aria-label="Lesson completion" value={study.complete.length} max={lessons.length} />
        <p>{study.complete.length} of {lessons.length} lessons complete</p>
      </div>
    </aside>
    {menu && <button className="menu-scrim" aria-label="Close navigation" onClick={() => setMenu(false)} />}
    <div className="main-column">
      <header className="top-bar">
        <div className="breadcrumbs">
          <button className="icon-button rail-toggle" aria-label={compact ? 'Expand sidebar' : 'Collapse sidebar'} title={compact ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'} aria-keyshortcuts="Control+B" aria-controls="workspace-menu" aria-expanded={!compact} onClick={() => { setCompact(value => !value); setFlyout(null); }}><PanelLeft size={15} /></button>
          <button className="icon-button menu-toggle"  aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} aria-controls="workspace-menu" onClick={() => setMenu(!menu)}>{menu ? <X size={22} /> : <Menu size={22} />}</button>
          <a href="#atlas" className="crumb-home" onClick={event => go(event, { page: 'atlas', id: '' })}><Compass size={17} aria-hidden="true" /><span>Workspace</span></a>
          <ChevronRight size={14} className="crumb-arrow" aria-hidden="true" />
          {lesson && track ? <><a className="crumb-track" href={`#track/${track.id}`} onClick={event => go(event, { page: 'track', id: track.id })}>{track.title}</a><ChevronRight size={14} className="crumb-arrow" aria-hidden="true" /><b>{lesson.title}</b></> : <b>{title}</b>}
        </div>
        <button className="search-trigger" onClick={() => setSearch(true)} aria-label="Search topics"><Search size={18} aria-hidden="true" /><span>Search topics</span><kbd><Command size={11} /> K</kbd></button>
      </header>
      <main className="main-content" id="main-content" ref={main} tabIndex={-1}>
        <div key={href(view)} className="view-content">
        {lesson && <LessonContent key={lesson.id} lesson={lesson} isComplete={study.complete.includes(lesson.id)} onComplete={() => toggle('complete', lesson.id)} onNavigate={navigate} />}
        {(view.page === 'atlas' || view.page === 'track') && <TrackCatalog view={view} complete={study.complete} onNavigate={navigate} />}
        {view.page === 'interview' && <Interview id={view.id} open={id => navigate({ page: 'interview', id })} />}
        {view.page === 'roadmap' && <Roadmap chapters={chapters} done={study.roadmap} toggle={id => toggle('roadmap', id)} />}
        {view.page === 'blueprint' && <BlueprintView key={view.id} chapters={chapters} initialId={view.id} />}
        </div>
        <footer className="footer"><span>Prep Atlas</span><span><CircleHelp size={14} aria-hidden="true" /> Progress is saved on this device.</span></footer>
      </main>
    </div>
    <SearchDialog open={search} close={() => setSearch(false)} navigate={navigate} chapters={chapters} />
  </div>;
}
