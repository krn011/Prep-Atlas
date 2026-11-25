'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import type { Chapter } from '../content/curriculum';

export function ChapterPicker({ chapters, value, onChange }: {
  chapters: Chapter[];
  value: string;
  onChange: (value: string) => void;
}) {
  const uid = useId();
  const anchor = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(value);
  const selected = chapters.find(chapter => chapter.id === value);
  const visible = chapters.filter(chapter => (chapter.number + ' ' + chapter.title).toLowerCase().includes(query.trim().toLowerCase()));
  const current = visible.findIndex(chapter => chapter.id === active);

  function close(restoreFocus: boolean) {
    popup.current?.hidePopover();
    setOpen(false);
    if (restoreFocus) anchor.current?.focus();
  }

  function choose(id: string) {
    onChange(id);
    close(true);
  }

  useLayoutEffect(() => {
    if (!open || !popup.current || !anchor.current) return;
    const panel = popup.current;
    function position() {
      if (!anchor.current) return;
      const bounds = anchor.current.getBoundingClientRect();
      const width = Math.min(360, window.innerWidth - 20);
      const below = window.innerHeight - bounds.bottom - 14;
      const above = bounds.top - 14;
      const useAbove = below < 220 && above > below;
      Object.assign(panel.style, {
        width: width + 'px',
        left: Math.max(10, Math.min(bounds.left, window.innerWidth - width - 10)) + 'px',
        top: useAbove ? 'auto' : bounds.bottom + 5 + 'px',
        bottom: useAbove ? window.innerHeight - bounds.top + 5 + 'px' : 'auto',
        maxHeight: Math.max(80, Math.min(365, useAbove ? above : below)) + 'px',
      });
    }
    position();
    panel.showPopover();
    search.current?.focus({ preventScroll: true });
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !panel.contains(event.target) && !anchor.current?.contains(event.target)) {
        close(false);
      }
    }
    window.addEventListener('resize', position);
    document.addEventListener('pointerdown', dismiss, true);
    return () => {
      window.removeEventListener('resize', position);
      document.removeEventListener('pointerdown', dismiss, true);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (open) document.getElementById(uid + active)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function toggle() {
    if (open) { close(true); return; }
    setQuery('');
    setActive(value);
    setOpen(true);
  }

  return <div className="chapter-picker">
    <button ref={anchor} type="button" className="chapter-trigger" aria-label={'Syllabus chapter: ' + selected?.title}
      aria-haspopup="dialog" aria-expanded={open} aria-controls={uid + 'panel'} onClick={toggle}
      onKeyDown={event => { if (event.key === 'ArrowDown' && !open) { event.preventDefault(); toggle(); } }}>
      <span>{selected?.number} · {selected?.title}</span><ChevronDown size={15} aria-hidden="true" />
    </button>
    <div ref={popup} id={uid + 'panel'} popover="manual" className="chapter-popup" role="dialog" aria-label="Choose a chapter"
      onToggle={event => { if (event.newState === 'closed') setOpen(false); }}
      onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== anchor.current) close(false); }}
      onKeyDown={event => {
        const { key } = event;
        if (key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
        if (key === 'ArrowDown' || key === 'ArrowUp') {
          event.preventDefault();
          const next = Math.max(0, Math.min(visible.length - 1, current + (key === 'ArrowDown' ? 1 : -1)));
          if (visible[next]) setActive(visible[next].id);
        }
        if (key === 'Enter' && current >= 0) { event.preventDefault(); choose(visible[current].id); }
      }}>
      <label className="chapter-search"><Search size={16} aria-hidden="true" /><input ref={search} role="combobox"
        aria-label="Find a chapter" aria-expanded={open} aria-controls={uid + 'list'} aria-autocomplete="list"
        aria-activedescendant={current >= 0 && open ? uid + active : undefined} placeholder="Find a chapter…" value={query}
        onChange={event => {
          const next = event.target.value;
          setQuery(next);
          setActive(chapters.find(c => (c.number + ' ' + c.title).toLowerCase().includes(next.trim().toLowerCase()))?.id ?? '');
        }} /></label>
      <div id={uid + 'list'} role="listbox" aria-label="Chapters" className="chapter-options">
        {visible.map(chapter => <div role="option" aria-selected={chapter.id === value} key={chapter.id} id={uid + chapter.id}
          data-active={chapter.id === active} className="chapter-option"
          onMouseDown={event => event.preventDefault()} onClick={() => choose(chapter.id)}>
          <small>{chapter.number}</small><span>{chapter.title}</span>{chapter.id === value && <Check size={15} aria-hidden="true" />}
        </div>)}
      </div>
      {!visible.length && <p role="status">No matching chapters</p>}
    </div>
  </div>;
}
