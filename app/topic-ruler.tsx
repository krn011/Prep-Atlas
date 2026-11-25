'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ChapterPicker } from './chapter-picker';
import { Check, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { tracks, type Chapter } from '../content/curriculum';
import { lessons } from '../content/lessons';

type Destination = { page: 'lesson' | 'blueprint'; id: string };
type Entry = Destination & { title: string; group: string };
type Mode = 'labs' | 'syllabus';

function syllabusEntries(chapters: Chapter[]): Entry[] {
  return chapters.flatMap(chapter => {
    const base = { page: 'blueprint' as const, group: chapter.title };
    const entries: Entry[] = [{ ...base, id: chapter.id, title: chapter.title }];
    let fenced = false;
    chapter.markdown.split('\n').forEach((line, index) => {
      if (line.startsWith('```')) fenced = !fenced;
      if (fenced) return;
      const title = line.match(/^(?:#{2,4} |\d+\. |[-*] |\*\*\d+\. )(.+)/)?.[1];
      if (title) entries.push({ ...base, id: chapter.id + '~' + index, title: title.replace(/\*\*|`/g, '').replace(/\.$/, '') });
    });
    return entries;
  });
}

function useTicks() {
  const [enabled, setEnabled] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const last = useRef(0);
  useEffect(() => {
    try { setEnabled(localStorage.getItem('prep-atlas:ticks') === 'on'); } catch {}
    return () => { if (audio.current) void audio.current.close().catch(() => {}); };
  }, []);
  const play = useCallback(() => {
    const context = audio.current;
    if (!context || context.state !== 'running' || performance.now() - last.current < 65) return;
    last.current = performance.now();
    const now = context.currentTime;
    const pulse = context.createOscillator();
    const gain = context.createGain();
    pulse.type = 'sine';
    pulse.frequency.setValueAtTime(1050, now);
    pulse.frequency.exponentialRampToValueAtTime(540, now + 0.02);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.025, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.026);
    pulse.connect(gain).connect(context.destination);
    pulse.onended = () => { pulse.disconnect(); gain.disconnect(); };
    pulse.start(now);
    pulse.stop(now + 0.028);
  }, []);
  const unlock = useCallback(async () => {
    try {
      audio.current ??= new AudioContext();
      if (audio.current.state === 'suspended') await audio.current.resume();
    } catch { /* The ruler also works on devices without Web Audio. */ }
  }, []);
  function toggle() {
    const next = !enabled;
    setEnabled(next);
    try { localStorage.setItem('prep-atlas:ticks', next ? 'on' : 'off'); } catch {}
    if (next) void unlock().then(play);
  }
  return { enabled, play, unlock, toggle };
}

export function TopicRuler({ chapters, page, id, complete, navigate }: {
  chapters: Chapter[]; page: string; id: string; complete: string[]; navigate: (to: Destination) => void;
}) {
  const [mode, setMode] = useState<Mode>('labs');
  const [chapterId, setChapterId] = useState('4-1');
  const [expanded, setExpanded] = useState<string | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const touched = useRef<number[]>([]);
  const center = useRef(-1);
  const scrollDivision = useRef(0);
  const ticks = useTicks();
  const rows = useMemo(() => tracks.flatMap(track => lessons.filter(lesson => lesson.track === track.id)
    .map(lesson => ({ page: 'lesson' as const, title: lesson.title, group: track.title, id: lesson.id }))), []);
  const syllabus = useMemo(() => syllabusEntries(chapters), [chapters]);
  const entries = useMemo(() => mode === 'labs' ? rows.filter(row => row.group === expanded) : syllabus.filter(entry => entry.id.split('~')[0] === chapterId), [mode, rows, syllabus, chapterId, expanded]);

  useEffect(() => {
    if (page === 'lesson' || page === 'track' || page === 'atlas') {
      setMode('labs');
      const trackId = page === 'lesson' ? lessons.find(lesson => lesson.id === id)?.track : id;
      setExpanded(tracks.find(track => track.id === trackId)?.title ?? null);
    }
    if (page === 'blueprint') {
      setMode('syllabus');
      if (id) setChapterId(id.split('~')[0]);
    }
  }, [id, page]);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    center.current = -1;
    touched.current = [];
    const selected = el.querySelector<HTMLElement>('[aria-current="page"]');
    if (selected) {
      const top = selected.offsetTop - el.clientHeight / 2 + selected.offsetHeight / 2;
      el.scrollTop = Math.max(0, top);
    } else if (mode === 'syllabus') el.scrollTop = 0;
    scrollDivision.current = Math.floor(el.scrollTop / 36);
    return () => {
      const marks = el.querySelectorAll('.ruler-ink, .ruler-mark');
      if (marks.length) {
        gsap.killTweensOf(marks);
        gsap.set(marks, { clearProps: 'transform' });
      }
      el.querySelectorAll('[data-lens]').forEach(row => row.removeAttribute('data-lens'));
    };
  }, [entries, id, page, mode]);

  function focusBand(index: number) {
    if (center.current === index || !list.current) return;
    center.current = index;
    if (index >= 0 && ticks.enabled) ticks.play();
    const next = index < 0 ? [] : [-2, -1, 0, 1, 2].map(offset => index + offset).filter(i => i >= 0 && i < entries.length);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const i of new Set([...touched.current, ...next])) {
      const row = list.current.querySelector<HTMLElement>('[data-index="' + i + '"]');
      if (!row) continue;
      const distance = index === -1 ? 9 : Math.abs(i - index);
      const weight = [1, 0.47, 0.16][distance] ?? 0;
      row.dataset.lens = distance === 0 ? 'center' : '';
      const config = { duration: reduced ? 0 : 0.16, overwrite: true, ease: 'power2.out' };
      gsap.to(row.querySelector('.ruler-ink'), { ...config, x: reduced ? 0 : 2 * weight, scale: reduced ? 1 : 1 + 0.09 * weight });
      gsap.to(row.querySelector('.ruler-mark'), { ...config, scaleX: reduced ? 1 : 1 + 0.9 * weight });
    }
    touched.current = next;
  }

  function atPointer(x: number, y: number) {
    const target = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-index]');
    focusBand(target && list.current?.contains(target) ? Number(target.dataset.index) : -1);
  }

  function keyMove(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const current = (event.target as HTMLElement).closest<HTMLElement>('[data-index]');
    if (!current || !list.current) return;
    event.preventDefault();
    const index = Number(current.dataset.index);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? entries.length - 1 : index + (event.key === 'ArrowDown' ? 1 : -1);
    list.current.querySelector<HTMLElement>('[data-index="' + Math.min(Math.max(next, 0), entries.length - 1) + '"]')?.focus();
  }

  function renderEntry(entry: Entry, index: number) {
    const active = entry.page === page && entry.id === id;
    return <a key={entry.id} className="ruler-row" data-index={index} href={'#' + entry.page + '/' + entry.id} aria-current={active ? 'page' : undefined}
            onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate({ page: entry.page, id: entry.id }); }}>
            <span className="ruler-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <span className="ruler-ink">{entry.title}{entry.page === 'lesson' && complete.includes(entry.id) && <Check size={11} aria-label="Completed" />}</span>
            <span className="ruler-mark" aria-hidden="true" />
          </a>;
  }

  return <section className="topic-ruler"  aria-label="Table of contents">
    <header className="ruler-head"><h2>Contents</h2>
      <button type="button" onClick={ticks.toggle} className="ruler-audio" aria-label="Scrolling tick sound" aria-pressed={ticks.enabled} title={ticks.enabled ? 'Mute scrolling ticks' : 'Enable scrolling ticks'}>{ticks.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
    </header>
    <div className="ruler-modes" aria-label="Contents view">
      <button aria-pressed={mode === 'labs'} onClick={() => setMode('labs')}>Visual labs</button>
      <button aria-pressed={mode === 'syllabus'} onClick={() => setMode('syllabus')}>Full syllabus</button>
    </div>
    {mode === 'syllabus' && <ChapterPicker chapters={chapters} value={chapterId} onChange={setChapterId} />}
    <div className="ruler-scroll" ref={list} key={mode + chapterId}
      onPointerMove={event => { if (event.pointerType === 'mouse' || event.pointerType === 'pen') { pointer.current = { x: event.clientX, y: event.clientY }; atPointer(event.clientX, event.clientY); } }}
      onPointerLeave={() => { pointer.current = null; focusBand(-1); }}
      onPointerDown={() => { if (ticks.enabled) void ticks.unlock(); }}
      onScroll={event => {
        const division = Math.floor(event.currentTarget.scrollTop / 36);
        if (ticks.enabled && division !== scrollDivision.current) ticks.play();
        scrollDivision.current = division;
        if (pointer.current) atPointer(pointer.current.x, pointer.current.y);
      }}
      onFocus={event => { const row = event.target.closest<HTMLElement>('[data-index]'); if (row) focusBand(Number(row.dataset.index)); }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) focusBand(-1); }}
      onKeyDown={keyMove}>
      {mode === 'syllabus' ? entries.map(renderEntry) : tracks.map(track => {
        const shown = expanded === track.title;
        return <div key={track.id} className="contents-track">
          <button className="contents-track-toggle" aria-expanded={shown} aria-controls={'contents-' + track.id}
            onClick={() => setExpanded(shown ? null : track.title)}>
            <span>{track.title}</span><ChevronRight size={14} aria-hidden="true" />
          </button>
          <div id={'contents-' + track.id} className="contents-track-items" hidden={!shown}>
            {shown && entries.map(renderEntry)}
          </div>
        </div>;
      })}
    </div>
  </section>;
}
