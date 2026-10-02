import { describe, expect, it } from 'vitest';
import { Quaternion, Vector3 } from 'three';
import { angularVelocityFromDelta, dampAngularVelocity, integrateAngularVelocity, pointerRotationDelta } from './cardPhysics';

describe('physical card quaternion physics', () => {
  it('combina yaw, pitch e roll em um gesto diagonal', () => {
    const delta = pointerRotationDelta({ deltaX: 70, deltaY: -42, relativeX: 120, relativeY: 60, width: 500, height: 315 });
    expect(Math.abs(delta.x)).toBeGreaterThan(0.01);
    expect(Math.abs(delta.y)).toBeGreaterThan(0.01);
    expect(Math.abs(delta.z)).toBeGreaterThan(0.01);
    expect(delta.length()).toBeCloseTo(1);
  });

  it('deriva velocidade angular e limita flicks numericamente absurdos', () => {
    const delta = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
    expect(angularVelocityFromDelta(delta, 0.1).length()).toBeCloseTo(11);
  });

  it('dissipa energia sem alterar a direção e integra sem snap', () => {
    const velocity = new Vector3(2, -4, 1);
    const before = velocity.clone().normalize();
    dampAngularVelocity(velocity, 0.25);
    expect(velocity.length()).toBeLessThan(new Vector3(2, -4, 1).length());
    expect(velocity.clone().normalize().dot(before)).toBeCloseTo(1);

    const orientation = integrateAngularVelocity(new Quaternion(), velocity, 0.1);
    expect(orientation.equals(new Quaternion())).toBe(false);
    expect(orientation.length()).toBeCloseTo(1);
  });
});
