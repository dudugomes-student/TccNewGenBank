import { Quaternion, Vector3 } from 'three';

export interface PointerRotationInput {
  deltaX: number;
  deltaY: number;
  relativeX: number;
  relativeY: number;
  width: number;
  height: number;
}

export const clampMagnitude = (vector: Vector3, maximum: number) => {
  if (vector.lengthSq() > maximum * maximum) vector.setLength(maximum);
  return vector;
};

export const pointerRotationDelta = ({ deltaX, deltaY, relativeX, relativeY, width, height }: PointerRotationInput) => {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const yaw = deltaX / safeWidth * Math.PI * 1.72;
  const pitch = -deltaY / safeHeight * Math.PI * 1.18;
  const tangent = (relativeX * deltaY - relativeY * deltaX) / (safeWidth * safeHeight);
  const roll = tangent * Math.PI * 2.4;

  const yawRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw);
  const pitchRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitch);
  const rollRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), roll);
  return yawRotation.multiply(pitchRotation).multiply(rollRotation).normalize();
};

export const angularVelocityFromDelta = (delta: Quaternion, elapsedSeconds: number) => {
  const normalized = delta.clone().normalize();
  if (normalized.w < 0) normalized.set(-normalized.x, -normalized.y, -normalized.z, -normalized.w);
  const angle = 2 * Math.acos(Math.min(1, Math.max(-1, normalized.w)));
  const sine = Math.sqrt(Math.max(0, 1 - normalized.w * normalized.w));
  if (sine < 0.0001 || angle < 0.0001) return new Vector3();
  return clampMagnitude(
    new Vector3(normalized.x / sine, normalized.y / sine, normalized.z / sine)
      .multiplyScalar(angle / Math.max(0.001, elapsedSeconds)),
    11,
  );
};

export const dampAngularVelocity = (velocity: Vector3, deltaSeconds: number, damping = 2.35) =>
  velocity.multiplyScalar(Math.exp(-damping * Math.max(0, deltaSeconds)));

export const integrateAngularVelocity = (orientation: Quaternion, velocity: Vector3, deltaSeconds: number) => {
  const speed = velocity.length();
  if (speed < 0.0001) return orientation;
  const delta = new Quaternion().setFromAxisAngle(velocity.clone().normalize(), speed * deltaSeconds);
  return orientation.premultiply(delta).normalize();
};
