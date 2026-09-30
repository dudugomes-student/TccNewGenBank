import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { canManipulateCard, clamp, faceRotation, orientationFromDrag, settleCardFace, type CardFace, type CardOrientation } from './cardOrientation';

interface CardManipulationOptions {
  face: CardFace;
  status: 'active' | 'locked';
  tier: 'lite' | 'essential';
  onFaceChange: (face: CardFace) => void;
}

interface GestureState {
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  velocityX: number;
  baseRotateY: number;
  width: number;
  height: number;
  moved: boolean;
  intent: 'pending' | 'card' | 'scroll';
  holdTimer?: number;
}

const setOrientation = (element: HTMLElement, orientation: CardOrientation) => {
  element.style.setProperty('--card-rotate-x', `${orientation.rotateX.toFixed(2)}deg`);
  element.style.setProperty('--card-rotate-y', `${orientation.rotateY.toFixed(2)}deg`);
  element.style.setProperty('--card-light-x', `${orientation.lightX.toFixed(1)}%`);
  element.style.setProperty('--card-light-y', `${orientation.lightY.toFixed(1)}%`);
};

export function useCardManipulation({ face, status, tier, onFaceChange }: CardManipulationOptions) {
  const cardRef = useRef<HTMLElement>(null);
  const gesture = useRef<GestureState | null>(null);
  const frame = useRef<number | null>(null);
  const settleTimers = useRef<number[]>([]);
  const orientation = useRef<CardOrientation>({ rotateX: 0, rotateY: faceRotation(face), lightX: 50, lightY: 42 });
  const dragged = useRef(false);
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const enabled = canManipulateCard(status, tier, reducedMotion);

  const clearSettle = () => {
    settleTimers.current.forEach(window.clearTimeout);
    settleTimers.current = [];
  };
  const render = (next: CardOrientation) => {
    orientation.current = next;
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      if (cardRef.current) setOrientation(cardRef.current, orientation.current);
    });
  };
  const settle = (velocityX = 0) => {
    const element = cardRef.current;
    if (!element) return;
    clearSettle();
    const nextFace = settleCardFace(orientation.current.rotateY, velocityX);
    const targetY = faceRotation(nextFace);
    element.classList.remove('newgen-card--grabbed');
    element.classList.add('newgen-card--inertia');
    const projectedY = clamp(orientation.current.rotateY + velocityX * 22, -18, 198);
    render({ ...orientation.current, rotateY: projectedY });
    settleTimers.current.push(window.setTimeout(() => {
      element.classList.remove('newgen-card--inertia');
      element.classList.add('newgen-card--settling');
      render({ rotateX: 0, rotateY: targetY, lightX: 50, lightY: 42 });
      onFaceChange(nextFace);
      settleTimers.current.push(window.setTimeout(() => element.classList.remove('newgen-card--settling'), 340));
    }, 70));
  };

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    if (!enabled && gesture.current) {
      const pointerId = gesture.current.pointerId;
      if (gesture.current.holdTimer) window.clearTimeout(gesture.current.holdTimer);
      if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
      gesture.current = null;
      element.classList.remove('newgen-card--grabbed', 'newgen-card--inertia', 'newgen-card--settling');
    }
    if (gesture.current) return;
    const targetRotation = faceRotation(face);
    if (Math.abs(orientation.current.rotateY - targetRotation) > 0.1) clearSettle();
    const next = { rotateX: 0, rotateY: targetRotation, lightX: 50, lightY: 42 };
    orientation.current = next;
    setOrientation(element, next);
  }, [face, enabled]);

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    if (gesture.current?.holdTimer) window.clearTimeout(gesture.current.holdTimer);
    clearSettle();
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || event.button !== 0) return;
    clearSettle();
    const bounds = event.currentTarget.getBoundingClientRect();
    const now = performance.now();
    const nextGesture: GestureState = {
      pointerId: event.pointerId, pointerType: event.pointerType, startX: event.clientX, startY: event.clientY,
      lastX: event.clientX, lastTime: now, velocityX: 0, baseRotateY: faceRotation(face), width: bounds.width,
      height: bounds.height, moved: false, intent: event.pointerType === 'touch' ? 'pending' : 'card',
    };
    gesture.current = nextGesture;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (event.pointerType !== 'touch') event.currentTarget.classList.add('newgen-card--grabbed');
    else nextGesture.holdTimer = window.setTimeout(() => {
      if (gesture.current !== nextGesture || nextGesture.intent !== 'pending') return;
      nextGesture.intent = 'card';
      event.currentTarget.classList.add('newgen-card--grabbed');
      event.currentTarget.style.touchAction = 'none';
    }, 180);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId || !enabled) return;
    const deltaX = event.clientX - current.startX;
    const deltaY = event.clientY - current.startY;
    if (current.intent === 'pending' && Math.hypot(deltaX, deltaY) >= 8) {
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.35) {
        if (current.holdTimer) window.clearTimeout(current.holdTimer);
        current.intent = 'scroll';
        event.currentTarget.releasePointerCapture(event.pointerId);
        gesture.current = null;
        return;
      }
      current.intent = 'card';
      if (current.holdTimer) window.clearTimeout(current.holdTimer);
      event.currentTarget.classList.add('newgen-card--grabbed');
    }
    if (current.intent !== 'card') return;
    event.preventDefault();
    const now = performance.now();
    const elapsed = Math.max(8, now - current.lastTime);
    current.velocityX = clamp(((event.clientX - current.lastX) / elapsed / current.width) * 1000, -1.2, 1.2);
    current.lastX = event.clientX;
    current.lastTime = now;
    current.moved ||= Math.hypot(deltaX, deltaY) > 6;
    dragged.current ||= current.moved;
    render(orientationFromDrag({ deltaX, deltaY, width: current.width, height: current.height, baseRotateY: current.baseRotateY }));
  };
  const finish = (event: ReactPointerEvent<HTMLElement>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (current.holdTimer) window.clearTimeout(current.holdTimer);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    gesture.current = null;
    event.currentTarget.style.removeProperty('touch-action');
    if (current.intent === 'card') settle(current.velocityX);
    window.setTimeout(() => { dragged.current = false; }, 240);
  };
  const onClickCapture = (event: ReactPointerEvent<HTMLElement>) => {
    if (!dragged.current) return;
    event.preventDefault();
    event.stopPropagation();
    window.setTimeout(() => { dragged.current = false; }, 0);
  };

  return {
    cardRef: cardRef as RefObject<HTMLElement>, enabled,
    handlers: { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: finish, onClickCapture },
  };
}
