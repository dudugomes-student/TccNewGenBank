import { describe, expect, it } from 'vitest';
import { canManipulateCard, clamp, faceRotation, orientationFromAngles, orientationFromDrag, settleCardFace } from './cardOrientation';

describe('living card orientation', () => {
  it('limita valores ao intervalo informado', () => {
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(-2, 0, 10)).toBe(0);
    expect(clamp(4, 0, 10)).toBe(4);
  });

  it('mapeia deslocamento horizontal e vertical em orientação combinada', () => {
    const result = orientationFromDrag({ deltaX: 150, deltaY: -60, width: 600, height: 380, baseRotateY: 0 });
    expect(result.rotateY).toBeCloseTo(70);
    expect(result.rotateX).toBeGreaterThan(0);
    expect(result.lightX).toBeLessThan(50);
  });

  it('limita rotação e posição da luz em gestos extremos', () => {
    const result = orientationFromDrag({ deltaX: 9000, deltaY: 9000, width: 400, height: 250, baseRotateY: 0 });
    expect(result.rotateX).toBe(-18);
    expect(result.rotateY).toBe(206);
    expect(result.lightX).toBeGreaterThan(60);
    expect(result.lightY).toBeLessThan(40);
  });

  it('escolhe frente ou verso considerando posição e velocidade', () => {
    expect(settleCardFace(70, 0)).toBe('front');
    expect(settleCardFace(70, 300)).toBe('back');
    expect(settleCardFace(130, -400)).toBe('front');
    expect(faceRotation('back')).toBe(180);
  });

  it('deriva a luz da orientacao do objeto, inclusive na lateral', () => {
    expect(orientationFromAngles(0, 0).lightX).toBe(50);
    expect(orientationFromAngles(0, 90).lightX).toBe(16);
    expect(orientationFromAngles(0, 180).lightX).toBeCloseTo(50);
  });

  it('remove manipulação para bloqueado e reduced motion', () => {
    expect(canManipulateCard('active', false)).toBe(true);
    expect(canManipulateCard('locked', false)).toBe(false);
    expect(canManipulateCard('active', true)).toBe(false);
  });
});
