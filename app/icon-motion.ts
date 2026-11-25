'use client';

import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';

const gestures = {
  open: { x: 3, y: -3 },
  forward: { x: 3 },
  back: { x: -3 },
  down: { y: 3 },
  reset: { rotation: -25 },
} as const;

export function useIconMotion(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const animated = new Set<Element>();
      let hovered: HTMLElement | null = null;
      let focused: HTMLElement | null = null;

      function control(target: EventTarget | null) {
        const item = target instanceof Element ? target.closest<HTMLElement>('[data-icon-motion]') : null;
        return item && container!.contains(item) && !item.matches(':disabled') ? item : null;
      }

      function update(item: HTMLElement | null) {
        if (!item) return;
        const icon = item.querySelector(':scope > svg:last-of-type');
        const gesture = gestures[item.dataset.iconMotion as keyof typeof gestures];
        if (!icon || !gesture) return;
        const active = hovered === item || focused === item;
        function move(target: Element, transform: gsap.TweenVars) {
          animated.add(target);
          gsap.to(target, {
            ...transform, transformOrigin: '50% 50%', duration: active ? 0.19 : 0.16,
            ease: 'power2.out', overwrite: true,
            onComplete() { if (!active) { gsap.set(target, { clearProps: 'transform,transformOrigin' }); animated.delete(target); } },
          });
        }
        move(icon, active ? gesture : { x: 0, y: 0, rotation: 0 });
        const glyph = item.querySelector('.track-glyph');
        if (glyph) move(glyph, { scale: active ? 1.055 : 1 });
      }

      function handle(event: Event) {
        const pointer = event instanceof PointerEvent;
        if (pointer && event.pointerType === 'touch') return;
        const entering = event.type === 'pointerover' || event.type === 'focusin';
        const other = (event as PointerEvent | FocusEvent).relatedTarget;
        const next = control(entering ? event.target : other);
        const previous = pointer ? hovered : focused;
        const current = !pointer && !next?.matches(':focus-visible') ? null : next;
        if (previous === current) return;
        if (pointer) hovered = current;
        else focused = current;
        update(previous);
        update(current);
      }

      const events = ['pointerover', 'pointerout', 'focusin', 'focusout'];
      events.forEach(type => container.addEventListener(type, handle));
      return () => {
        events.forEach(type => container.removeEventListener(type, handle));
        for (const target of animated) {
          gsap.killTweensOf(target);
          gsap.set(target, { clearProps: 'transform,transformOrigin' });
        }
      };
    });
    return () => media.revert();
  }, [root]);
}
