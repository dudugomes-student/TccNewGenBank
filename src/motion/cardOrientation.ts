export type CardFace = 'front' | 'back';

export interface CardOrientation {
  rotateX: number;
  rotateY: number;
  lightX: number;
  lightY: number;
}

export interface DragOrientationInput {
  deltaX: number;
  deltaY: number;
  width: number;
  height: number;
  baseRotateY: number;
}

export const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export const orientationFromDrag = ({ deltaX, deltaY, width, height, baseRotateY }: DragOrientationInput): CardOrientation => {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const xRatio = clamp(deltaX / safeWidth, -1, 1);
  const yRatio = clamp(deltaY / safeHeight, -1, 1);
  return {
    rotateX: clamp(-yRatio * 28, -18, 18),
    rotateY: clamp(baseRotateY + xRatio * 210, -24, 204),
    lightX: clamp(50 + xRatio * 42, 8, 92),
    lightY: clamp(42 + yRatio * 34, 10, 82),
  };
};

export const settleCardFace = (rotateY: number, velocityX: number): CardFace => {
  const projected = rotateY + clamp(velocityX * 90, -42, 42);
  return projected >= 90 ? 'back' : 'front';
};

export const faceRotation = (face: CardFace) => face === 'back' ? 180 : 0;

export const canManipulateCard = (status: 'active' | 'locked', tier: 'lite' | 'essential', reducedMotion: boolean) =>
  status === 'active' && tier === 'lite' && !reducedMotion;
