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
  baseRotateX?: number;
  baseRotateY: number;
}

export const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export const orientationFromAngles = (rotateX: number, rotateY: number): CardOrientation => {
  const yaw = rotateY * Math.PI / 180;
  const pitch = rotateX * Math.PI / 180;
  return {
    rotateX,
    rotateY,
    lightX: clamp(50 - Math.sin(yaw) * 34, 12, 88),
    lightY: clamp(40 + Math.sin(pitch) * 44, 18, 68),
  };
};

export const orientationFromDrag = ({ deltaX, deltaY, width, height, baseRotateX = 0, baseRotateY }: DragOrientationInput): CardOrientation => {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const xRatio = clamp(deltaX / safeWidth, -1.15, 1.15);
  const yRatio = clamp(deltaY / safeHeight, -1, 1);
  return orientationFromAngles(
    clamp(baseRotateX - yRatio * 18, -18, 18),
    clamp(baseRotateY + xRatio * 280, -26, 206),
  );
};

export const settleCardFace = (rotateY: number, velocityY: number): CardFace => {
  const projected = rotateY + clamp(velocityY * 0.12, -54, 54);
  return projected >= 90 ? 'back' : 'front';
};

export const faceRotation = (face: CardFace) => face === 'back' ? 180 : 0;

export const canManipulateCard = (status: 'active' | 'locked', reducedMotion: boolean) =>
  status === 'active' && !reducedMotion;
