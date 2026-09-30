import { describe, expect, it } from 'vitest';
import { canManipulateCard, clamp, faceRotation, orientationFromDrag, settleCardFace } from './cardOrientation';

describe('living card orientation', () => {
  it('limita valores ao intervalo informado', () => {
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(-2, 0, 10)).toBe(0);
    expect(clamp(4, 0, 10)).toBe(4);
  });

  it('mapeia deslocamento horizontal e vertical em orientação combinada', () => {
    const result = orientationFromDrag({ deltaX: 150, deltaY: -60, width: 600, height: 380, baseRotateY: 0 });
    expect(result.rotateY).toBeCloseTo(52.5);
    expect(result.rotateX).toBeGreaterThan(0);
    expect(result.lightX).toBeGreaterThan(50);
  });

  it('limita rotação e posição da luz em gestos extremos', () => {
    const result = orientationFromDrag({ deltaX: 9000, deltaY: 9000, width: 400, height: 250, baseRotateY: 0 });
    expect(result).toMatchObject({ rotateX: -18, rotateY: 204, lightX: 92, lightY: 76 });
  });

  it('escolhe frente ou verso considerando posição e velocidade', () => {
    expect(settleCardFace(70, 0)).toBe('front');
    expect(settleCardFace(70, 0.5)).toBe('back');
    expect(settleCardFace(130, -0.8)).toBe('front');
    expect(faceRotation('back')).toBe(180);
  });

  it('remove manipulação para bloqueado, essential e reduced motion', () => {
    expect(canManipulateCard('active', 'lite', false)).toBe(true);
    expect(canManipulateCard('locked', 'lite', false)).toBe(false);
    expect(canManipulateCard('active', 'essential', false)).toBe(false);
    expect(canManipulateCard('active', 'lite', true)).toBe(false);
  });
});
