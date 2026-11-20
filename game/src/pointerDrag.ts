/**
 * Pointer-event drag helpers for iPad + mouse.
 * One press-and-drag: setPointerCapture, touch-action:none, hit-test via getBoundingClientRect.
 */

import type { PointerEvent as ReactPointerEvent } from 'react';

export type Point = { x: number; y: number };

/** Convert client coords to % of a container's content box. */
export function clientToPercent(
  container: HTMLElement,
  clientX: number,
  clientY: number,
): Point {
  const rect = container.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * 100,
    y: ((clientY - rect.top) / rect.height) * 100,
  };
}

/**
 * True if (clientX, clientY) falls inside target's bounding rect expanded by paddingPx.
 */
export function hitTestRect(
  target: Element | null,
  clientX: number,
  clientY: number,
  paddingPx = 40,
): boolean {
  if (!target) return false;
  const r = target.getBoundingClientRect();
  return (
    clientX >= r.left - paddingPx &&
    clientX <= r.right + paddingPx &&
    clientY >= r.top - paddingPx &&
    clientY <= r.bottom + paddingPx
  );
}

/** Centre of an element's bounding rect in client coords. */
export function elementCenter(el: Element): Point {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * Attach pointerdown → move → up with setPointerCapture.
 */
export function startPointerDrag(
  e: ReactPointerEvent,
  handlers: {
    onMove: (clientX: number, clientY: number) => void;
    onEnd: (clientX: number, clientY: number, wasTap: boolean) => void;
    tapThresholdPx?: number;
  },
): void {
  e.preventDefault();
  e.stopPropagation();
  const el = e.currentTarget as HTMLElement;
  const pointerId = e.pointerId;
  const startX = e.clientX;
  const startY = e.clientY;
  const threshold = handlers.tapThresholdPx ?? 12;
  let moved = false;

  try {
    el.setPointerCapture(pointerId);
  } catch {
    /* ignore if capture fails */
  }

  const onMove = (ev: PointerEvent) => {
    if (ev.pointerId !== pointerId) return;
    ev.preventDefault();
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    if (Math.hypot(dx, dy) > threshold) moved = true;
    handlers.onMove(ev.clientX, ev.clientY);
  };

  const onEnd = (ev: PointerEvent) => {
    if (ev.pointerId !== pointerId) return;
    ev.preventDefault();
    cleanup();
    handlers.onEnd(ev.clientX, ev.clientY, !moved);
  };

  const cleanup = () => {
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onEnd);
    el.removeEventListener('pointercancel', onEnd);
    try {
      if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
    } catch {
      /* ignore */
    }
  };

  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onEnd);
  el.addEventListener('pointercancel', onEnd);
}
