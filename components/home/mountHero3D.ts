import type { RefObject } from 'react';

type MountHeroOptions = {
  panel: HTMLElement;
  canvas: HTMLCanvasElement;
  signal?: AbortSignal;
};

/** Addendum B: one full azimuth orbit + radius zoom cycle (seconds). */
const ORBIT_PERIOD_S = 30;
/** Peak zoom: radius shrinks by 15% via sine ease-in-out. */
const ZOOM_AMP = 0.15;
/**
 * Framing scale around the GLB bounds.
 * Flower bed is wider than tall — use a tight pad so vertical empty cream collapses.
 */
const FRAME_PAD = 0.42;

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
  renderer.toneMapping = THREE.NeutralToneMapping;
  // Above the 0.95 design note so pastel materials stay vivid on page cream.
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 1.0;

  scene.add(new THREE.HemisphereLight(0xfff7ee, 0xd9cfbd, 0.55));
  const key = new THREE.DirectionalLight(0xfff3e6, 1.85);
  key.position.set(-1.2, 3.4, 0.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -1.5,
    right: 1.5,
    top: 1.5,
    bottom: -1.5,
  });
  scene.add(key);

  // Soft contact shadow under flowers only — small plane + low opacity, no grey disc.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 2.4),
    new THREE.ShadowMaterial({ opacity: 0.12 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 50);

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

  gltf.scene.traverse((obj) => {
    if ((obj as { isMesh?: boolean }).isMesh) {
      (obj as { castShadow: boolean }).castShadow = true;
    }
  });

  // Model stays put; camera orbits (Addendum B). Pointer tilt rides on a local group.
  const tilt = new THREE.Group();
  tilt.add(gltf.scene);
  scene.add(tilt);

  // Fit orbit to the GLB bounds so the subject fills a square stage (top-weighted).
  const box = new THREE.Box3().setFromObject(gltf.scene);
  const bounds = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  // Strong downward lookAt bias → subject rides the top of the square stage.
  const lookAt = new THREE.Vector3(center.x, center.y - bounds.y * 0.55, center.z);
  // Prefer height fit on a square stage; width may crop outer flowers slightly.
  const fitDim = Math.max(bounds.y * 1.05, Math.max(bounds.x, bounds.z) * 0.58);
  const fitDist =
    (fitDim * 0.5 * FRAME_PAD) /
    Math.tan(THREE.MathUtils.degToRad(cam.fov * 0.5));
  const orbitRadius = Math.max(fitDist, fitDim * 0.7);
  const cameraY = lookAt.y + orbitRadius * 0.38;

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
    const aspect = width / Math.max(height, 1);
    cam.aspect = aspect;
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
    // r(t) = R / (1 + 0.15·(1−cos(2πt/T))/2) — closest at mid-orbit (Addendum B).
    const zoom =
      1 + (ZOOM_AMP * (1 - Math.cos(phase * Math.PI * 2))) / 2;
    const radius = orbitRadius / zoom;
    const horizontal = Math.sqrt(Math.max(radius * radius - (cameraY - lookAt.y) ** 2, 0.01));
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
