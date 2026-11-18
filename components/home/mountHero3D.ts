import type { RefObject } from 'react';

type MountHeroOptions = {
  panel: HTMLElement;
  canvas: HTMLCanvasElement;
  signal?: AbortSignal;
};

/** Addendum B: one full azimuth orbit + radius zoom cycle (seconds). */
const ORBIT_PERIOD_S = 30;
/** Peak zoom amp — kept modest so the subject never leaves a tight fill. */
const ZOOM_AMP = 0.08;
/**
 * Framing pad around the GLB bounds (lower = tighter crop).
 * Target: subject fills ~80–90% of the square stage with wings near the top.
 */
const FRAME_PAD = 0.4;

/**
 * Live three.js hero mount (IMPLEMENTATION.md §3 + Addendum B).
 * Lazy-imported after the poster paints so LCP stays on the poster image.
 * Mounts on all viewports when motion is allowed; rejects on GLB/WebGL failure
 * so HeroMedia can fall back to vivid orbit video / poster.
 */
export async function mountHero3D({
  panel,
  canvas,
  signal,
}: MountHeroOptions): Promise<() => void> {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) {
    return () => undefined;
  }

  const THREE = await import('three');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const { DRACOLoader } = await import(
    'three/examples/jsm/loaders/DRACOLoader.js'
  );
  const { RoomEnvironment } = await import(
    'three/examples/jsm/environments/RoomEnvironment.js'
  );

  if (signal?.aborted) {
    return () => undefined;
  }

  let renderer: InstanceType<typeof THREE.WebGLRenderer>;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    throw err instanceof Error
      ? err
      : new Error('WebGLRenderer failed to initialize');
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.setClearAlpha(0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  // Punchier than the 0.95 design note — env wash is dialed down separately.
  renderer.toneMappingExposure = 1.55;
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = null;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  // Low env intensity — RoomEnvironment otherwise flattens pastel wing color.
  scene.environmentIntensity = 0.35;

  scene.add(new THREE.HemisphereLight(0xfff7ee, 0xd9cfbd, 0.28));
  const key = new THREE.DirectionalLight(0xfff8f0, 2.4);
  key.position.set(-1.0, 3.6, 1.0);
  key.castShadow = false;
  scene.add(key);
  // Small warm fill opposite the key — keeps underside from going muddy grey.
  const fill = new THREE.DirectionalLight(0xffe8d6, 0.45);
  fill.position.set(1.4, 1.2, -0.8);
  scene.add(fill);

  const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 50);

  const draco = new DRACOLoader().setDecoderPath('/vendor/draco/gltf/');
  const loader = new GLTFLoader().setDRACOLoader(draco);
  let gltf;
  try {
    gltf = await loader.loadAsync('/assets/hero/hero-butterfly.glb');
  } catch (err) {
    draco.dispose();
    pmrem.dispose();
    renderer.dispose();
    throw err;
  }

  if (signal?.aborted) {
    draco.dispose();
    pmrem.dispose();
    renderer.dispose();
    return () => undefined;
  }

  // No realtime shadows and no ground/contact disc — transparent clear + page cream only.
  // Slightly lower roughness / envMap so pastel albedos stay punchy under NeutralToneMapping.
  gltf.scene.traverse((obj) => {
    if (!(obj as { isMesh?: boolean }).isMesh) return;
    const mesh = obj as unknown as {
      castShadow: boolean;
      receiveShadow: boolean;
      material: unknown;
    };
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    const mats = (
      Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    ) as Array<{ roughness?: number; envMapIntensity?: number }>;
    for (const mat of mats) {
      if (typeof mat.roughness === 'number') {
        mat.roughness = Math.min(mat.roughness, 0.5);
      }
      if (typeof mat.envMapIntensity === 'number') {
        mat.envMapIntensity = 0.25;
      }
      const color = (mat as { color?: { getHSL: (t: { h: number; s: number; l: number }) => void; setHSL: (h: number, s: number, l: number) => void } }).color;
      if (color && typeof color.getHSL === 'function') {
        const hsl = { h: 0, s: 0, l: 0 };
        color.getHSL(hsl);
        // Punch pastel albedos without shifting hue.
        color.setHSL(hsl.h, Math.min(1, hsl.s * 1.35), hsl.l);
      }
    }
  });

  // Model stays put; camera orbits (Addendum B). Pointer tilt rides on a local group.
  const tilt = new THREE.Group();
  tilt.add(gltf.scene);
  scene.add(tilt);

  const box = new THREE.Box3().setFromObject(gltf.scene);
  const bounds = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Bias lookAt below center so wings sit near the top without hard-cropping.
  const lookAt = new THREE.Vector3(
    center.x,
    center.y - bounds.y * 0.32,
    center.z,
  );
  // Height-led fit: ~85% stage fill; modest width crop at orbit extremes only.
  const fitDim = Math.max(bounds.y * 1.05, Math.max(bounds.x, bounds.z) * 0.58);
  const fitDist =
    (fitDim * 0.5 * FRAME_PAD) /
    Math.tan(THREE.MathUtils.degToRad(cam.fov * 0.5));
  const orbitRadius = Math.max(fitDist, fitDim * 0.7);
  const cameraY = lookAt.y + orbitRadius * 0.4;

  const mixer = new THREE.AnimationMixer(gltf.scene);
  const clip = THREE.AnimationClip.findByName(gltf.animations, 'WingFold');
  if (clip) {
    mixer.clipAction(clip).play();
  }

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const MAX = THREE.MathUtils.degToRad(7);
  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;

  const onMove = (e: PointerEvent) => {
    if (!finePointer.matches) return;
    const r = panel.getBoundingClientRect();
    ty = ((e.clientX - r.left) / r.width) * 2 - 1;
    tx = ((e.clientY - r.top) / r.height) * 2 - 1;
    ty *= MAX;
    tx *= MAX * 0.6;
  };
  const onLeave = () => {
    tx = 0;
    ty = 0;
  };
  panel.addEventListener('pointermove', onMove);
  panel.addEventListener('pointerleave', onLeave);

  const size = () => {
    const { width, height } = panel.getBoundingClientRect();
    renderer.setSize(width, height, false);
    cam.aspect = width / Math.max(height, 1);
    cam.updateProjectionMatrix();
  };
  size();
  const ro = new ResizeObserver(size);
  ro.observe(panel);

  let visible = true;
  const io = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
  });
  io.observe(panel);

  let last = performance.now();
  let orbitT = 0;
  let running = true;
  const onReduce = (e: MediaQueryListEvent) => {
    if (e.matches) {
      running = false;
      renderer.setAnimationLoop(null);
      panel.classList.remove('is-3d');
    }
  };
  reduce.addEventListener('change', onReduce);

  const placeCamera = (t: number) => {
    const phase = (t % ORBIT_PERIOD_S) / ORBIT_PERIOD_S;
    const theta = phase * Math.PI * 2;
    // Modest zoom so framing stays tight through the full 30s orbit.
    const zoom =
      1 + (ZOOM_AMP * (1 - Math.cos(phase * Math.PI * 2))) / 2;
    const radius = orbitRadius / zoom;
    const horizontal = Math.sqrt(
      Math.max(radius * radius - (cameraY - lookAt.y) ** 2, 0.01),
    );
    cam.position.set(
      lookAt.x + Math.sin(theta) * horizontal,
      cameraY,
      lookAt.z + Math.cos(theta) * horizontal,
    );
    cam.lookAt(lookAt);
  };
  placeCamera(0);
  renderer.render(scene, cam);

  renderer.setAnimationLoop(() => {
    if (!running) return;
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!visible || document.hidden || panel.classList.contains('is-paused')) {
      return;
    }
    orbitT += dt;
    placeCamera(orbitT);
    if (finePointer.matches) {
      const k = 1 - Math.exp(-dt * 4);
      cx += (tx - cx) * k;
      cy += (ty - cy) * k;
      tilt.rotation.set(
        THREE.MathUtils.clamp(cx, -MAX, MAX),
        THREE.MathUtils.clamp(cy, -MAX, MAX),
        0,
      );
    } else {
      tilt.rotation.set(0, 0, 0);
    }
    mixer.update(dt);
    renderer.render(scene, cam);
  });

  panel.classList.add('is-3d');

  return () => {
    running = false;
    reduce.removeEventListener('change', onReduce);
    panel.removeEventListener('pointermove', onMove);
    panel.removeEventListener('pointerleave', onLeave);
    ro.disconnect();
    io.disconnect();
    renderer.setAnimationLoop(null);
    panel.classList.remove('is-3d');
    draco.dispose();
    pmrem.dispose();
    renderer.dispose();
  };
}

export type HeroPanelRef = RefObject<HTMLElement | null>;
