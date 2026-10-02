import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import {
  ACESFilmicToneMapping,
  AmbientLight,
  CanvasTexture,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Quaternion,
  Scene,
  Shape,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { BankCard } from '../domain/models';
import { angularVelocityFromDelta, dampAngularVelocity, integrateAngularVelocity, pointerRotationDelta } from '../motion/cardPhysics';
import { useTheme } from '../theme/ThemeProvider';

interface NewGenCard3DProps {
  card: BankCard;
  visualScale?: number;
  renderOverscan?: number;
  flipped: boolean;
  revealSensitive: boolean;
  onFaceChange: (flipped: boolean) => void;
}

interface VelocitySample {
  velocity: Vector3;
  time: number;
}

interface Gesture {
  pointerId: number;
  pointerType: string;
  lastX: number;
  lastY: number;
  lastTime: number;
  intent: 'pending' | 'card' | 'scroll';
  bounds: DOMRect;
  samples: VelocitySample[];
}

interface CardScene {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  group: Group;
  frontTexture: CanvasTexture;
  backTexture: CanvasTexture;
  shadowTexture: CanvasTexture;
  bodyMaterial: MeshStandardMaterial;
  accentLight: PointLight;
  resizeObserver: ResizeObserver;
}

const CARD_WIDTH = 3.5;
const CARD_HEIGHT = CARD_WIDTH / 1.586;
const CARD_DEPTH = 0.19;
const CARD_TEXTURE_WIDTH = 1200;
const CARD_TEXTURE_HEIGHT = Math.round(CARD_TEXTURE_WIDTH / 1.586);
const CARD_TEXTURE_SCALE = 1.5;
const DEFAULT_RENDER_OVERSCAN = 2.25;
const BASE_CAMERA_DISTANCE = 6.4;

const roundedRect = (context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
};

const cssColorWithAlpha = (color: string, alpha: number) => {
  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const context = probe.getContext('2d', { willReadFrequently: true });
  if (!context) return `rgba(154, 230, 110, ${alpha})`;
  context.fillStyle = '#9ae66e';
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const drawCardTexture = (texture: CanvasTexture, card: BankCard, side: 'front' | 'back', revealSensitive: boolean, accent: string) => {
  const canvas = texture.image as HTMLCanvasElement;
  const context = canvas.getContext('2d');
  if (!context) return;
  const width = CARD_TEXTURE_WIDTH;
  const height = CARD_TEXTURE_HEIGHT;
  const pad = 72;
  context.save();
  context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
  context.clearRect(0, 0, width, height);
  roundedRect(context, 5, 5, width - 10, height - 10, 72);
  context.clip();

  const material = context.createLinearGradient(0, 0, width, height);
  material.addColorStop(0, '#171b19');
  material.addColorStop(.48, '#090b0a');
  material.addColorStop(1, '#111513');
  context.fillStyle = material;
  context.fillRect(0, 0, width, height);

  const light = context.createRadialGradient(width * .76, height * .18, 0, width * .76, height * .18, width * .72);
  light.addColorStop(0, cssColorWithAlpha(accent, .21));
  light.addColorStop(.42, cssColorWithAlpha(accent, .05));
  light.addColorStop(1, 'transparent');
  context.fillStyle = light;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = 'rgba(255,255,255,.14)';
  context.lineWidth = 3;
  roundedRect(context, 6, 6, width - 12, height - 12, 70);
  context.stroke();
  context.fillStyle = '#edf1ee';
  context.textBaseline = 'middle';

  if (side === 'front') {
    context.font = '700 29px Inter, Segoe UI, sans-serif';
    context.letterSpacing = '5px';
    context.fillText('NEWGEN', pad, 88);
    context.textAlign = 'right';
    context.fillText(card.network.toUpperCase(), width - pad, 88);
    context.textAlign = 'left';

    context.strokeStyle = 'rgba(255,255,255,.5)';
    context.lineWidth = 4;
    [20, 32, 46].forEach((radius, index) => {
      context.beginPath();
      context.arc(pad + 48 + index * 34, height * .48, radius, -.82, .82);
      context.stroke();
    });

    context.font = '500 31px ui-monospace, SFMono-Regular, Consolas, monospace';
    context.letterSpacing = '6px';
    context.fillText(`••••  ••••  ••••  ${card.lastFour}`, pad, height - 155);
    context.font = '650 23px Inter, Segoe UI, sans-serif';
    context.letterSpacing = '3px';
    context.fillText(card.holderName.toUpperCase(), pad, height - 72);
    context.textAlign = 'right';
    context.fillText(card.expiresAt, width - pad, height - 72);
    context.textAlign = 'left';
  } else {
    context.fillStyle = 'rgba(3,5,4,.88)';
    context.fillRect(0, 106, width, 96);
    context.fillStyle = '#edf1ee';
    context.font = '650 20px Inter, Segoe UI, sans-serif';
    context.letterSpacing = '4px';
    context.fillText('NÚMERO VIRTUAL', pad, 270);
    context.font = '500 29px ui-monospace, SFMono-Regular, Consolas, monospace';
    context.letterSpacing = '5px';
    const fullNumber = card.virtualNumber.replace(/(.{4})/g, '$1 ').trim();
    context.fillText(revealSensitive ? fullNumber : `•••• •••• •••• ${card.lastFour}`, pad, 326);
    context.font = '650 19px Inter, Segoe UI, sans-serif';
    context.letterSpacing = '3px';
    context.fillText(`VALIDADE  ${revealSensitive ? card.expiresAt : '••/••'}`, pad, 425);
    context.fillText(`CVV  ${revealSensitive ? card.virtualCvv : '•••'}`, width * .53, 425);
    context.fillStyle = 'rgba(237,241,238,.68)';
    context.font = '650 18px Inter, Segoe UI, sans-serif';
    context.fillText(card.onlinePurchasesEnabled ? 'COMPRAS ONLINE ATIVAS' : 'COMPRAS ONLINE DESATIVADAS', pad, height - 72);
  }

  context.fillStyle = card.status === 'active' ? accent : '#aab0ac';
  context.font = '750 18px Inter, Segoe UI, sans-serif';
  context.letterSpacing = '3px';
  context.textAlign = 'right';
  context.fillText(card.status === 'active' ? 'ATIVO' : 'BLOQUEADO', width - pad, side === 'front' ? 145 : height - 72);
  context.restore();
  texture.needsUpdate = true;
};

const createTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_TEXTURE_WIDTH * CARD_TEXTURE_SCALE;
  canvas.height = Math.round(CARD_TEXTURE_HEIGHT * CARD_TEXTURE_SCALE);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};

const createShadowTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 480;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(384, 250, 18, 384, 250, 350);
    gradient.addColorStop(0, 'rgba(0, 0, 0, .42)');
    gradient.addColorStop(.5, 'rgba(0, 0, 0, .2)');
    gradient.addColorStop(.82, 'rgba(0, 0, 0, .055)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

const createRoundedShape = () => {
  const shape = new Shape();
  const halfWidth = CARD_WIDTH / 2;
  const halfHeight = CARD_HEIGHT / 2;
  const radius = .18;
  shape.moveTo(-halfWidth + radius, -halfHeight);
  shape.lineTo(halfWidth - radius, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius);
  shape.lineTo(halfWidth, halfHeight - radius);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);
  shape.lineTo(-halfWidth + radius, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius);
  shape.lineTo(-halfWidth, -halfHeight + radius);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight);
  return shape;
};

export function NewGenCard3D({ card, visualScale = 1, renderOverscan = DEFAULT_RENDER_OVERSCAN, flipped, revealSensitive, onFaceChange }: NewGenCard3DProps) {
  const { accent: accentPreference } = useTheme();
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<CardScene | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const frameRef = useRef<number | null>(null);
  const orientationRef = useRef(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), flipped ? Math.PI : 0));
  const reducedMotionRef = useRef(false);
  const reportedFaceRef = useRef(false);
  const [webglFailed, setWebglFailed] = useState(false);

  const render = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.group.quaternion.copy(orientationRef.current);
    runtime.renderer.render(runtime.scene, runtime.camera);
  };

  const cancelMotion = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    rootRef.current?.removeAttribute('data-inertia');
  };

  const releaseLift = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.group.position.z = 0;
    runtime.group.scale.setScalar(1);
  };

  const faceFromOrientation = () => {
    const normal = new Vector3(0, 0, 1).applyQuaternion(orientationRef.current);
    return normal.z < 0;
  };

  const beginInertia = (initialVelocity: Vector3) => {
    cancelMotion();
    const runtime = runtimeRef.current;
    if (!runtime || reducedMotionRef.current || initialVelocity.length() < .16) {
      releaseLift();
      render();
      reportedFaceRef.current = true;
      onFaceChange(faceFromOrientation());
      return;
    }
    const velocity = initialVelocity.clone();
    let previous = performance.now();
    rootRef.current?.setAttribute('data-inertia', 'true');

    const tick = (now: number) => {
      const delta = Math.min(.032, Math.max(.001, (now - previous) / 1000));
      previous = now;
      integrateAngularVelocity(orientationRef.current, velocity, delta);
      dampAngularVelocity(velocity, delta);
      const progress = Math.min(1, delta * 8);
      runtime.group.position.z += (0 - runtime.group.position.z) * progress;
      runtime.group.scale.lerp(new Vector3(1, 1, 1), progress);
      render();

      if (velocity.length() < .025) {
        frameRef.current = null;
        releaseLift();
        rootRef.current?.removeAttribute('data-inertia');
        render();
        reportedFaceRef.current = true;
        onFaceChange(faceFromOrientation());
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = query.matches;
    const syncMotion = () => {
      reducedMotionRef.current = query.matches;
      if (query.matches) cancelMotion();
    };
    query.addEventListener('change', syncMotion);

    try {
      const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.shadowMap.enabled = true;

      const scene = new Scene();
      const camera = new PerspectiveCamera(34, 1, .1, 30);
      camera.position.set(0, 0, BASE_CAMERA_DISTANCE * renderOverscan / visualScale);
      const group = new Group();
      group.quaternion.copy(orientationRef.current);
      scene.add(group);

      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
        || getComputedStyle(document.documentElement).getPropertyValue('--money-in').trim()
        || '#9ae66e';
      const frontTexture = createTexture();
      const backTexture = createTexture();
      drawCardTexture(frontTexture, card, 'front', revealSensitive, accent);
      drawCardTexture(backTexture, card, 'back', revealSensitive, accent);

      const shape = createRoundedShape();
      const bodyGeometry = new ExtrudeGeometry(shape, { depth: CARD_DEPTH, bevelEnabled: true, bevelSegments: 5, bevelSize: .035, bevelThickness: .035, curveSegments: 18 });
      bodyGeometry.translate(0, 0, -CARD_DEPTH / 2);
      const bodyMaterial = new MeshStandardMaterial({ color: new Color('#111513'), roughness: .82, metalness: .12 });
      const body = new Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      group.add(body);

      const faceGeometry = new PlaneGeometry(CARD_WIDTH - .035, CARD_HEIGHT - .035);
      const front = new Mesh(faceGeometry, new MeshBasicMaterial({ map: frontTexture, transparent: true, alphaTest: .02, toneMapped: false }));
      front.position.z = CARD_DEPTH / 2 + .045;
      front.castShadow = true;
      group.add(front);
      const back = new Mesh(faceGeometry.clone(), new MeshBasicMaterial({ map: backTexture, transparent: true, alphaTest: .02, toneMapped: false }));
      back.position.z = -CARD_DEPTH / 2 - .045;
      back.rotation.y = Math.PI;
      back.castShadow = true;
      group.add(back);

      scene.add(new AmbientLight('#cbd2cd', 1.45));
      const key = new DirectionalLight('#f4f1e8', 3.7);
      key.position.set(-3.5, 4.2, 5.8);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      scene.add(key);
      const rim = new DirectionalLight('#82908a', 1.65);
      rim.position.set(4, -2, -3);
      scene.add(rim);
      const accentLight = new PointLight(accent, 5.2, 10, 2);
      accentLight.position.set(3.2, 1.4, 4);
      scene.add(accentLight);

      const shadowTexture = createShadowTexture();
      const shadow = new Mesh(new PlaneGeometry(5.4, 3.4), new MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, toneMapped: false }));
      shadow.position.set(.14, -.18, -.62);
      scene.add(shadow);

      const resize = () => {
        const bounds = root.getBoundingClientRect();
        const width = Math.max(1, bounds.width * renderOverscan);
        const height = Math.max(1, bounds.height * renderOverscan);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(root);
      runtimeRef.current = { renderer, scene, camera, group, frontTexture, backTexture, shadowTexture, bodyMaterial, accentLight, resizeObserver };
      resize();
    } catch (error) {
      console.error('NewGenCard3D initialization failed', error);
      setWebglFailed(true);
    }

    return () => {
      query.removeEventListener('change', syncMotion);
      cancelMotion();
      const runtime = runtimeRef.current;
      if (!runtime) return;
      runtime.resizeObserver.disconnect();
      runtime.frontTexture.dispose();
      runtime.backTexture.dispose();
      runtime.shadowTexture.dispose();
      runtime.scene.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      const gl = runtime.renderer.getContext();
      if (!gl.isContextLost()) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      }
      runtime.renderer.dispose();
      runtimeRef.current = null;
    };
  // Scene lifetime is intentionally tied to this card object, not its mutable financial fields.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
      || getComputedStyle(document.documentElement).getPropertyValue('--money-in').trim()
      || '#9ae66e';
    drawCardTexture(runtime.frontTexture, card, 'front', revealSensitive, accent);
    drawCardTexture(runtime.backTexture, card, 'back', revealSensitive, accent);
    runtime.bodyMaterial.color.set(card.status === 'active' ? '#111513' : '#242725');
    runtime.accentLight.color.set(accent);
    render();
  }, [card, revealSensitive, accentPreference]);

  useEffect(() => {
    if (reportedFaceRef.current) {
      reportedFaceRef.current = false;
      return;
    }
    cancelMotion();
    const target = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), flipped ? Math.PI : 0);
    orientationRef.current.copy(target);
    releaseLift();
    render();
  // This effect is reserved for the explicit accessible front/back control.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped]);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (card.status !== 'active' || event.button !== 0 || !runtimeRef.current) return;
    cancelMotion();
    event.currentTarget.setPointerCapture(event.pointerId);
    if (event.pointerType !== 'touch') event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    gestureRef.current = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: performance.now(),
      intent: event.pointerType === 'touch' ? 'pending' : 'card',
      bounds,
      samples: [],
    };
    event.currentTarget.setAttribute('data-grabbed', 'true');
    runtimeRef.current.group.position.z = .12;
    runtimeRef.current.group.scale.setScalar(1.008);
    render();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId || !runtimeRef.current) return;
    const deltaX = event.clientX - gesture.lastX;
    const deltaY = event.clientY - gesture.lastY;
    const distance = Math.hypot(deltaX, deltaY);
    if (gesture.intent === 'pending' && distance > 5) {
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.45) {
        gesture.intent = 'scroll';
        gestureRef.current = null;
        event.currentTarget.removeAttribute('data-grabbed');
        releaseLift();
        render();
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }
      gesture.intent = 'card';
    }
    if (gesture.intent !== 'card' || distance < .2) return;
    event.preventDefault();
    const now = performance.now();
    const delta = pointerRotationDelta({
      deltaX,
      deltaY,
      relativeX: event.clientX - (gesture.bounds.left + gesture.bounds.width / 2),
      relativeY: event.clientY - (gesture.bounds.top + gesture.bounds.height / 2),
      width: gesture.bounds.width,
      height: gesture.bounds.height,
    });
    orientationRef.current.premultiply(delta).normalize();
    const velocity = angularVelocityFromDelta(delta, (now - gesture.lastTime) / 1000);
    gesture.samples.push({ velocity, time: now });
    gesture.samples = gesture.samples.filter((sample) => now - sample.time <= 110).slice(-6);
    gesture.lastX = event.clientX;
    gesture.lastY = event.clientY;
    gesture.lastTime = now;
    render();
  };

  const finishGesture = (event: ReactPointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    event.currentTarget.removeAttribute('data-grabbed');
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (gesture.intent !== 'card') {
      releaseLift();
      render();
      return;
    }
    const now = performance.now();
    const recentSamples = gesture.samples.filter((sample) => now - sample.time <= 110);
    const velocity = recentSamples.length
      ? recentSamples.reduce((sum, sample, index) => sum.add(sample.velocity.clone().multiplyScalar(index + 1)), new Vector3())
        .divideScalar(recentSamples.reduce((sum, _, index) => sum + index + 1, 0))
      : new Vector3();
    beginInertia(velocity);
  };

  if (webglFailed) {
    return <article className="newgen-card-3d newgen-card-3d--failed" aria-label={`Cartão ${card.label}, final ${card.lastFour}`}>Representação 3D indisponível.</article>;
  }

  return (
    <article
      className={`newgen-card-3d newgen-card-3d--${card.status}`}
      ref={rootRef}
      style={{ '--card-render-overscan': renderOverscan } as CSSProperties}
      aria-label={`Cartão 3D ${card.label}, final ${card.lastFour}, ${card.status === 'active' ? 'ativo' : 'bloqueado'}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishGesture}
      onPointerCancel={finishGesture}
      onLostPointerCapture={finishGesture}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="sr-only">Objeto tridimensional manipulável. Use o controle adjacente para alternar entre frente e verso sem gesto.</span>
    </article>
  );
}
