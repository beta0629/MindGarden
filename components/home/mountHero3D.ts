import type { RefObject } from 'react';

type MountHeroOptions = {
  panel: HTMLElement;
  canvas: HTMLCanvasElement;
  signal?: AbortSignal;
};

/**
 * Desktop-only three.js hero mount (IMPLEMENTATION.md §3).
 * Lazy-imported after the poster paints so LCP stays on the poster image.
 */
export async function mountHero3D({
  panel,
  canvas,
  signal,
}: MountHeroOptions): Promise<() => void> {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia(
    '(min-width: 1024px) and (hover: hover) and (pointer: fine)',
  );
  if (reduce.matches || !desktop.matches) {
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

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;

  scene.add(new THREE.HemisphereLight(0xfff7ee, 0xd9cfbd, 0.6));
  const key = new THREE.DirectionalLight(0xfff3e6, 1.6);
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

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.ShadowMaterial({ opacity: 0.16 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const cam = new THREE.PerspectiveCamera(30, 81 / 47, 0.1, 50);
  cam.position.set(0.12, 1.5, 1.95);
  cam.lookAt(0, 0.15, 0.06);

  const draco = new DRACOLoader().setDecoderPath('/vendor/draco/gltf/');
  const gltf = await new GLTFLoader()
    .setDRACOLoader(draco)
    .loadAsync('/assets/hero/hero-butterfly.glb');

  if (signal?.aborted) {
    draco.dispose();
    renderer.dispose();
    return () => undefined;
  }

  gltf.scene.traverse((obj) => {
    if ((obj as { isMesh?: boolean }).isMesh) {
      (obj as { castShadow: boolean }).castShadow = true;
    }
  });

  const tilt = new THREE.Group();
  tilt.add(gltf.scene);
  scene.add(tilt);

  const mixer = new THREE.AnimationMixer(gltf.scene);
  const clip = THREE.AnimationClip.findByName(gltf.animations, 'WingFold');
  if (clip) {
    mixer.clipAction(clip).play();
  }

  const MAX = THREE.MathUtils.degToRad(7);
  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;

  const onMove = (e: PointerEvent) => {
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
  let running = true;
  const onReduce = (e: MediaQueryListEvent) => {
    if (e.matches) {
      running = false;
      renderer.setAnimationLoop(null);
      panel.classList.remove('is-3d');
    }
  };
  reduce.addEventListener('change', onReduce);

  renderer.setAnimationLoop(() => {
    if (!running) return;
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!visible || document.hidden || panel.classList.contains('is-paused')) {
      return;
    }
    const k = 1 - Math.exp(-dt * 4);
    cx += (tx - cx) * k;
    cy += (ty - cy) * k;
    tilt.rotation.set(
      THREE.MathUtils.clamp(cx, -MAX, MAX),
      THREE.MathUtils.clamp(cy, -MAX, MAX),
      0,
    );
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
