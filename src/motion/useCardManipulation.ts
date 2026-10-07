import { useSiteReducedMotion } from './MotionProvider';
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, RefObject } from 'react';
import {
  canManipulateCard,
  clamp,
  faceRotation,
  orientationFromAngles,
  orientationFromDrag,
  settleCardFace,
  type CardFace,
  type CardOrientation,
} from './cardOrientation';

interface CardManipulationOptions {
  face: CardFace;
  status: 'active' | 'locked';
  onFaceChange: (face: CardFace) => void;
}

interface PointerSample {
  x: number;
  y: number;
  time: number;
}

interface GestureState {
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  baseRotateX: number;
  baseRotateY: number;
  width: number;
  height: number;
  moved: boolean;
  intent: 'pending' | 'card' | 'scroll';
  samples: PointerSample[];
  holdTimer?: number;
  liftTimer?: number;
}

interface AngularVelocity {
  pitch: number;
  yaw: number;
}

const setOrientation = (element: HTMLElement, orientation: CardOrientation) => {
  const yaw = orientation.rotateY * Math.PI / 180;
  const pitch = orientation.rotateX * Math.PI / 180;
  const side = Math.abs(Math.sin(yaw));
  const facing = Math.abs(Math.cos(yaw));
  const pitchAmount = Math.sin(pitch);

  element.style.setProperty('--card-rotate-x', `${orientation.rotateX.toFixed(2)}deg`);
  element.style.setProperty('--card-rotate-y', `${orientation.rotateY.toFixed(2)}deg`);
  element.style.setProperty('--card-light-x', `${orientation.lightX.toFixed(1)}%`);
  element.style.setProperty('--card-light-y', `${orientation.lightY.toFixed(1)}%`);
  element.style.setProperty('--card-light-strength', `${(0.34 + facing * 0.44).toFixed(3)}`);
  element.style.setProperty('--card-sheen-opacity', `${((0.34 + facing * 0.44) * 0.72).toFixed(3)}`);
  element.style.setProperty('--card-sheen-angle', `${(112 - Math.sin(yaw) * 24 + pitchAmount * 12).toFixed(1)}deg`);
  element.style.setProperty('--card-shadow-x', `${(-Math.sin(yaw) * 26).toFixed(1)}px`);
  element.style.setProperty('--card-shadow-y', `${(17 + pitchAmount * 8).toFixed(1)}px`);
  element.style.setProperty('--card-shadow-scale', `${(0.94 - side * 0.31).toFixed(3)}`);
  element.style.setProperty('--card-shadow-depth', `${(0.72 + side * 0.1).toFixed(3)}`);
  element.style.setProperty('--card-edge-light', `${(38 + side * 34 + pitchAmount * 8).toFixed(1)}%`);
  element.style.setProperty('--card-edge-opacity', `${(0.58 + side * 0.38).toFixed(3)}`);
};

const sampleVelocity = (gesture: GestureState): AngularVelocity => {
  if (gesture.samples.length < 2) return { pitch: 0, yaw: 0 };
  const latest = gesture.samples[gesture.samples.length - 1];
  const earliest = gesture.samples.find((sample) => latest.time - sample.time <= 100) ?? gesture.samples[0];
  const elapsed = Math.max(16, latest.time - earliest.time) / 1000;
  return {
    yaw: clamp(((latest.x - earliest.x) / gesture.width) * 280 / elapsed, -720, 720),
    pitch: clamp(-((latest.y - earliest.y) / gesture.height) * 18 / elapsed, -160, 160),
  };
};

export function useCardManipulation({ face, status, onFaceChange }: CardManipulationOptions) {
  const cardRef = useRef<HTMLElement>(null);
  const gesture = useRef<GestureState | null>(null);
  const renderFrame = useRef<number | null>(null);
  const motionFrame = useRef<number | null>(null);
  const clickTimer = useRef<number | null>(null);
  const orientation = useRef<CardOrientation>(orientationFromAngles(0, faceRotation(face)));
  const dragged = useRef(false);
  const initialized = useRef(false);
  const onFaceChangeRef = useRef(onFaceChange);
  const reducedMotion = useSiteReducedMotion();
  const enabled = canManipulateCard(status, reducedMotion);
  onFaceChangeRef.current = onFaceChange;

  const render = (next: CardOrientation) => {
    orientation.current = next;
    if (renderFrame.current !== null) return;
    renderFrame.current = requestAnimationFrame(() => {
      renderFrame.current = null;
      if (cardRef.current) setOrientation(cardRef.current, orientation.current);
    });
  };

  const cancelMotion = () => {
    if (motionFrame.current !== null) cancelAnimationFrame(motionFrame.current);
    motionFrame.current = null;
    const element = cardRef.current;
    element?.classList.remove('newgen-card--inertia', 'newgen-card--settling');
  };

  const animateToFace = (nextFace: CardFace, velocity: AngularVelocity, notify: boolean) => {
    const element = cardRef.current;
    if (!element) return;
    cancelMotion();
    const targetY = faceRotation(nextFace);
    let rotateX = orientation.current.rotateX;
    let rotateY = orientation.current.rotateY;
    let velocityX = clamp(velocity.pitch, -140, 140);
    let velocityY = clamp(velocity.yaw, -620, 620);
    let previousTime = performance.now();
    const startTime = previousTime;
    let isSettling = false;

    element.classList.remove('newgen-card--captured', 'newgen-card--grabbed', 'newgen-card--settling');
    element.classList.add('newgen-card--inertia');

    const tick = (now: number) => {
      const delta = Math.min(0.032, Math.max(0.001, (now - previousTime) / 1000));
      previousTime = now;

      const yawAcceleration = -132 * (rotateY - targetY) - 23.5 * velocityY;
      const pitchAcceleration = -178 * rotateX - 27 * velocityX;
      velocityY += yawAcceleration * delta;
      velocityX += pitchAcceleration * delta;
      rotateY += velocityY * delta;
      rotateX += velocityX * delta;

      const next = orientationFromAngles(rotateX, rotateY);
      orientation.current = next;
      setOrientation(element, next);

      if (!isSettling && now - startTime >= 135) {
        isSettling = true;
        element.classList.remove('newgen-card--inertia');
        element.classList.add('newgen-card--settling');
      }

      const atRest = Math.abs(rotateY - targetY) < 0.18
        && Math.abs(rotateX) < 0.1
        && Math.abs(velocityY) < 1.5
        && Math.abs(velocityX) < 0.9;
      if (atRest || now - startTime > 900) {
        const settled = orientationFromAngles(0, targetY);
        orientation.current = settled;
        setOrientation(element, settled);
        element.classList.remove('newgen-card--inertia', 'newgen-card--settling');
        motionFrame.current = null;
        if (notify) onFaceChangeRef.current(nextFace);
        return;
      }
      motionFrame.current = requestAnimationFrame(tick);
    };

    motionFrame.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    const target = orientationFromAngles(0, faceRotation(face));

    if (!initialized.current) {
      initialized.current = true;
      orientation.current = target;
      setOrientation(element, target);
      return;
    }
    if (!enabled && gesture.current) {
      const current = gesture.current;
      if (current.holdTimer) window.clearTimeout(current.holdTimer);
      if (current.liftTimer) window.clearTimeout(current.liftTimer);
      gesture.current = null;
      if (element.hasPointerCapture(current.pointerId)) element.releasePointerCapture(current.pointerId);
      element.style.removeProperty('touch-action');
      element.classList.remove('newgen-card--captured', 'newgen-card--grabbed');
    }
    if (gesture.current) return;
    if (!enabled) {
      cancelMotion();
      orientation.current = target;
      setOrientation(element, target);
      return;
    }
    if (Math.abs(orientation.current.rotateY - target.rotateY) > 0.1 || Math.abs(orientation.current.rotateX) > 0.1) {
      animateToFace(face, { pitch: 0, yaw: 0 }, false);
    }
  }, [face, enabled]);

  useEffect(() => () => {
    if (renderFrame.current !== null) cancelAnimationFrame(renderFrame.current);
    if (motionFrame.current !== null) cancelAnimationFrame(motionFrame.current);
    if (clickTimer.current !== null) window.clearTimeout(clickTimer.current);
    if (gesture.current?.holdTimer) window.clearTimeout(gesture.current.holdTimer);
    if (gesture.current?.liftTimer) window.clearTimeout(gesture.current.liftTimer);
  }, []);

  const captureCard = (element: HTMLElement, current: GestureState) => {
    cancelMotion();
    element.classList.add('newgen-card--captured');
    current.liftTimer = window.setTimeout(() => {
      if (gesture.current !== current || current.intent !== 'card') return;
      element.classList.remove('newgen-card--captured');
      element.classList.add('newgen-card--grabbed');
      current.liftTimer = undefined;
    }, 72);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || event.button !== 0) return;
    cancelMotion();
    dragged.current = false;
    const bounds = event.currentTarget.getBoundingClientRect();
    const now = performance.now();
    const nextGesture: GestureState = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      baseRotateX: orientation.current.rotateX,
      baseRotateY: orientation.current.rotateY,
      width: Math.max(1, bounds.width),
      height: Math.max(1, bounds.height),
      moved: false,
      intent: event.pointerType === 'touch' ? 'pending' : 'card',
      samples: [{ x: event.clientX, y: event.clientY, time: now }],
    };
    gesture.current = nextGesture;
    event.currentTarget.setPointerCapture(event.pointerId);

    if (event.pointerType !== 'touch') {
      captureCard(event.currentTarget, nextGesture);
    } else {
      nextGesture.holdTimer = window.setTimeout(() => {
        if (gesture.current !== nextGesture || nextGesture.intent !== 'pending') return;
        nextGesture.intent = 'card';
        event.currentTarget.style.touchAction = 'none';
        captureCard(event.currentTarget, nextGesture);
      }, 135);
    }
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
        gesture.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }
      current.intent = 'card';
      if (current.holdTimer) window.clearTimeout(current.holdTimer);
      event.currentTarget.style.touchAction = 'none';
      captureCard(event.currentTarget, current);
    }
    if (current.intent !== 'card') return;

    event.preventDefault();
    const now = performance.now();
    current.samples.push({ x: event.clientX, y: event.clientY, time: now });
    current.samples = current.samples.filter((sample) => now - sample.time <= 130).slice(-7);
    current.moved ||= Math.hypot(deltaX, deltaY) > 6;
    dragged.current ||= current.moved;
    render(orientationFromDrag({
      deltaX,
      deltaY,
      width: current.width,
      height: current.height,
      baseRotateX: current.baseRotateX,
      baseRotateY: current.baseRotateY,
    }));
  };

  const finish = (event: ReactPointerEvent<HTMLElement>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (current.holdTimer) window.clearTimeout(current.holdTimer);
    if (current.liftTimer) window.clearTimeout(current.liftTimer);
    if (current.intent === 'card' && event.type === 'pointerup') {
      current.samples.push({ x: event.clientX, y: event.clientY, time: performance.now() });
    }
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    event.currentTarget.style.removeProperty('touch-action');
    event.currentTarget.classList.remove('newgen-card--captured', 'newgen-card--grabbed');

    if (current.intent === 'card') {
      const velocity = current.moved ? sampleVelocity(current) : { pitch: 0, yaw: 0 };
      const nextFace = settleCardFace(orientation.current.rotateY, velocity.yaw);
      animateToFace(nextFace, velocity, true);
    }
    if (clickTimer.current !== null) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => { dragged.current = false; }, 260);
  };

  const onClickCapture = (event: ReactMouseEvent<HTMLElement>) => {
    if (!dragged.current) return;
    event.preventDefault();
    event.stopPropagation();
  };

  return {
    cardRef: cardRef as RefObject<HTMLElement>,
    enabled,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
      onLostPointerCapture: finish,
      onClickCapture,
    },
  };
}
