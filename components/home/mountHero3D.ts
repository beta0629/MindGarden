import type { RefObject } from 'react';

type MountHeroOptions = {
  panel: HTMLElement;
  canvas: HTMLCanvasElement;
  signal?: AbortSignal;
};

/**
 * Frustum margin around WingFold silhouette (~6% → 4–8% band).
 * Dolly along the poster ray only — never change the approved angle.
 */
const SPHERE_FIT_MARGIN = 1.04;
/** Samples across WingFold to capture max wing extent. */
const BOUNDS_SAMPLE_STEPS = 24;
/** Spec FOV from hero-IMPLEMENTATION.md §3. */
const HERO_FOV_DEG = 30;
/** Spec camera / lookAt — lock this pose (tilt only). */
const POSTER_LOOK_AT = { x: 0, y: 0.15, z: 0.06 } as const;
const POSTER_CAM = { x: 0.12, y: 1.5, z: 1.95 } as const;
/**
 * Yaw sway off — IMPLEMENTATION §3 is tilt-only at the locked poster pose.
 * (Addendum orbit foreshortened the flower bed into flat streaks.)
 */
const YAW_SWAY_DEG = 0;
const YAW_SWAY_PERIOD_S = 30;
/**
 * Pause at dense-subject BR: 82nd percentile of projected verts (not AABB max,
 * which parks the control on the canvas corner when a few petals spike maxX).
 */
const PAUSE_PCT = 0.82;
/** Mobile top-pack: push painted mesh maxY toward this NDC (less cream under CTA). */
const MOBILE_TOP_NDC = 0.9;
const MOBILE_TOP_MAX_WIDTH = 1023;

/**
 * Live three.js hero mount (IMPLEMENTATION.md §3).
 * Locked poster camera + pointer tilt (±7°). Lazy-imported after poster LCP.
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

  // Spec lighting (IMPLEMENTATION.md §3) — punchy enough without muddy edges.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.setClearAlpha(0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = null;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;

  scene.add(new THREE.HemisphereLight(0xfff7ee, 0xd9cfbd, 0.6));
  const key = new THREE.DirectionalLight(0xfff3e6, 1.6);
  key.position.set(-1.2, 3.4, 0.6);
  key.castShadow = false;
  scene.add(key);

  const cam = new THREE.PerspectiveCamera(HERO_FOV_DEG, 81 / 47, 0.1, 50);
  const lookAt = new THREE.Vector3(
    POSTER_LOOK_AT.x,
    POSTER_LOOK_AT.y,
    POSTER_LOOK_AT.z,
  );
  const posterOffset = new THREE.Vector3(
    POSTER_CAM.x - POSTER_LOOK_AT.x,
    POSTER_CAM.y - POSTER_LOOK_AT.y,
    POSTER_CAM.z - POSTER_LOOK_AT.z,
  );
  let camDist = posterOffset.length();
  const posterDir = posterOffset.clone().normalize();

  const placePosterCam = (dist: number, yawRad = 0) => {
    // Dolly along poster ray; optional micro-yaw around Y through lookAt.
    const offset = posterDir.clone().multiplyScalar(dist);
    if (yawRad !== 0) {
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRad);
    }
    cam.position.copy(lookAt).add(offset);
    cam.lookAt(lookAt);
    cam.updateMatrixWorld(true);
  };
  placePosterCam(camDist);

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

  // Keep materials close to authored albedo — mild roughness floor only.
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
        mat.roughness = Math.min(mat.roughness, 0.65);
      }
    }
  });

  const tilt = new THREE.Group();
  tilt.add(gltf.scene);
  scene.add(tilt);

  const mixer = new THREE.AnimationMixer(gltf.scene);
  const clip = THREE.AnimationClip.findByName(gltf.animations, 'WingFold');
  const wingAction = clip ? mixer.clipAction(clip) : null;
  if (wingAction) {
    wingAction.play();
  }

  const _skipBoundsName = /antenna/i;
  const proj = new THREE.Vector3();

  type NdcExtents = { halfX: number; halfY: number; minY: number; maxY: number };
  const measureNdcMesh = (): NdcExtents => {
    tilt.updateMatrixWorld(true);
    const into = {
      halfX: 0,
      halfY: 0,
      minY: 1,
      maxY: -1,
      any: false,
    };
    tilt.traverse((obj) => {
      if (_skipBoundsName.test(obj.name || '')) return;
      const mesh = obj as unknown as {
        isMesh?: boolean;
        geometry?: {
          attributes?: {
            position?: {
              count: number;
              getX: (i: number) => number;
              getY: (i: number) => number;
              getZ: (i: number) => number;
            };
          };
        };
        matrixWorld: InstanceType<typeof THREE.Matrix4>;
      };
      if (!mesh.isMesh || !mesh.geometry?.attributes?.position) return;
      const pos = mesh.geometry.attributes.position;
      const step = Math.max(1, Math.floor(pos.count / 4000));
      for (let i = 0; i < pos.count; i += step) {
        proj.set(pos.getX(i), pos.getY(i), pos.getZ(i));
        proj.applyMatrix4(mesh.matrixWorld).project(cam);
        if (
          !Number.isFinite(proj.x) ||
          !Number.isFinite(proj.y) ||
          !Number.isFinite(proj.z)
        ) {
          continue;
        }
        if (proj.z < -1.05 || proj.z > 1.05) continue;
        if (Math.abs(proj.x) > 4 || Math.abs(proj.y) > 4) continue;
        into.halfX = Math.max(into.halfX, Math.abs(proj.x));
        into.halfY = Math.max(into.halfY, Math.abs(proj.y));
        into.minY = Math.min(into.minY, proj.y);
        into.maxY = Math.max(into.maxY, proj.y);
        into.any = true;
      }
    });
    if (!into.any) {
      return { halfX: 0.5, halfY: 0.5, minY: -0.5, maxY: 0.5 };
    }
    return {
      halfX: into.halfX,
      halfY: into.halfY,
      minY: into.minY,
      maxY: into.maxY,
    };
  };

  const size = () => {
    const rect = panel.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height || width * (47 / 81), 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    cam.aspect = width / height;
    cam.updateProjectionMatrix();
  };
  panel.classList.add('is-3d');
  panel.classList.remove('is-cropped');
  panel.style.removeProperty('--hero-gl-h');
  panel.style.removeProperty('--hero-gl-offset-y');
  panel.style.removeProperty('--hero-crop-h');
  size();

  /*
   * Dolly-fit at the locked poster angle across WingFold (+ tiny yaw extremes).
   * Canvas size is CSS-owned — we only move along the poster ray.
   */
  {
    const fitTarget = 1 / SPHERE_FIT_MARGIN;
    const animSteps = clip ? 8 : 0;
    const duration = clip ? Math.max(clip.duration, 0.001) : 1;
    const yawMax = THREE.MathUtils.degToRad(YAW_SWAY_DEG);

    const measureFitHalf = (): number => {
      let half = 0;
      for (const yaw of [0, -yawMax, yawMax]) {
        placePosterCam(camDist, yaw);
        for (let s = 0; s <= animSteps; s += 1) {
          if (clip && wingAction) {
            mixer.setTime((duration * s) / Math.max(animSteps, 1));
          }
          const ext = measureNdcMesh();
          half = Math.max(half, ext.halfX, ext.halfY);
        }
      }
      if (clip && wingAction) mixer.setTime(0);
      return Math.max(half, 0.05);
    };

    placePosterCam(camDist);
    for (let i = 0; i < 4; i += 1) {
      const half = measureFitHalf();
      camDist = Math.max(0.4, camDist * (half / fitTarget));
    }
    placePosterCam(camDist);
    if (clip && wingAction) mixer.setTime(0);

    /*
     * Mobile only: slight lookAt drop so mesh rises in NDC (less empty cream
     * under the CTA). Re-dolly if horizontal half exceeds fitTarget so width %
     * does not shrink.
     */
    if (window.innerWidth <= MOBILE_TOP_MAX_WIDTH) {
      const worldPerNdcY = () => {
        const dist = Math.max(cam.position.distanceTo(lookAt), 0.01);
        return dist * Math.tan(THREE.MathUtils.degToRad(cam.fov * 0.5));
      };
      const before = measureNdcMesh();
      const shift = (MOBILE_TOP_NDC - before.maxY) * worldPerNdcY();
      // Cap shift so we keep poster-ish framing (no extreme pitch change).
      lookAt.y -= Math.max(-camDist * 0.12, Math.min(camDist * 0.22, shift));
      placePosterCam(camDist);
      const after = measureNdcMesh();
      const half = Math.max(after.halfX, after.halfY, 0.05);
      if (half > fitTarget) {
        camDist = Math.max(0.4, camDist * (half / fitTarget));
        placePosterCam(camDist);
      }
      if (clip && wingAction) mixer.setTime(0);
    }

    const packed = measureNdcMesh();
    panel.dataset.heroFit = [
      packed.minY.toFixed(3),
      packed.maxY.toFixed(3),
      camDist.toFixed(2),
      Math.max(packed.halfX, packed.halfY).toFixed(3),
    ].join(',');
    panel.dataset.heroCam = 'poster-locked';
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

  size();
  const ro = new ResizeObserver(size);
  ro.observe(panel);

  let visible = true;
  const io = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
  });
  io.observe(panel);

  let last = performance.now();
  let swayT = 0;
  let running = true;
  const onReduce = (e: MediaQueryListEvent) => {
    if (e.matches) {
      running = false;
      renderer.setAnimationLoop(null);
      panel.classList.remove('is-3d');
    }
  };
  reduce.addEventListener('change', onReduce);

  const percentile = (sorted: number[], p: number): number => {
    if (sorted.length === 0) return 0.5;
    const i = Math.min(
      sorted.length - 1,
      Math.max(0, Math.floor(p * (sorted.length - 1))),
    );
    return sorted[i];
  };

  const updateSubjectCssVars = () => {
    const { width, height } = panel.getBoundingClientRect();
    if (width < 1 || height < 1) return;

    tilt.updateMatrixWorld(true);
    const xs: number[] = [];
    const ys: number[] = [];
    tilt.traverse((obj) => {
      if (_skipBoundsName.test(obj.name || '')) return;
      const m = obj as unknown as {
        isMesh?: boolean;
        geometry?: {
          attributes?: {
            position?: {
              count: number;
              getX: (i: number) => number;
              getY: (i: number) => number;
              getZ: (i: number) => number;
            };
          };
        };
        matrixWorld: InstanceType<typeof THREE.Matrix4>;
      };
      if (!m.isMesh || !m.geometry?.attributes?.position) return;
      const pos = m.geometry.attributes.position;
      const step = Math.max(1, Math.floor(pos.count / 2000));
      for (let i = 0; i < pos.count; i += step) {
        proj.set(pos.getX(i), pos.getY(i), pos.getZ(i));
        proj.applyMatrix4(m.matrixWorld).project(cam);
        if (
          !Number.isFinite(proj.x) ||
          !Number.isFinite(proj.y) ||
          !Number.isFinite(proj.z)
        ) {
          continue;
        }
        if (proj.z < -1.05 || proj.z > 1.05) continue;
        if (Math.abs(proj.x) > 4 || Math.abs(proj.y) > 4) continue;
        const px = proj.x * 0.5 + 0.5;
        const py = -proj.y * 0.5 + 0.5;
        if (px < -0.05 || px > 1.05 || py < -0.05 || py > 1.05) continue;
        xs.push(Math.min(1, Math.max(0, px)));
        ys.push(Math.min(1, Math.max(0, py)));
      }
    });
    if (xs.length < 8) return;

    xs.sort((a, b) => a - b);
    ys.sort((a, b) => a - b);
    const minX = xs[0];
    const maxX = xs[xs.length - 1];
    const minY = ys[0];
    const maxY = ys[ys.length - 1];
    // Dense core (ignore petal/wing tip outliers).
    const denseR = percentile(xs, PAUSE_PCT);
    const denseB = percentile(ys, PAUSE_PCT);

    panel.style.setProperty('--hero-subj-left', `${(minX * 100).toFixed(2)}%`);
    panel.style.setProperty('--hero-subj-top', `${(minY * 100).toFixed(2)}%`);
    panel.style.setProperty('--hero-subj-right', `${(maxX * 100).toFixed(2)}%`);
    panel.style.setProperty('--hero-subj-bottom', `${(maxY * 100).toFixed(2)}%`);

    /*
     * Pause OUTSIDE the subject AABB — prefer BELOW the painted subject
     * (y ≥ maxY + 12–20px). Media often bleeds past .hero, so AABB-right can
     * sit off-container; keep X inside the visible hero overlap (~≤88%) and
     * put Y just under the panel when the mesh owns the lower edge.
     */
    const gapY = 18 / Math.max(height, 1);
    // Visible BR of the panel inside .hero (media may bleed past container).
    const visibleRight = 0.88;
    let pauseX = Math.min(visibleRight, Math.max(0.78, denseR + 0.06));
    /*
     * Desktop (viewport ≥1024): sit just below the media box — subject fills
     * the stage BR so in-panel corners still hit petals.
     * Mobile: media margin-bottom collapses hero height — keep the control
     * inside the panel, below AABB on the in-panel cream under the subject.
     */
    const mobile = window.innerWidth <= 1023;
    let pauseY = mobile
      ? Math.min(0.95, Math.max(maxY + gapY * 1.35, maxY + 20 / Math.max(height, 1)))
      : Math.max(1 + gapY, maxY + 14 / Math.max(height, 1));
    if (!mobile) {
      pauseY = Math.min(1 + 28 / Math.max(height, 1), pauseY);
    } else {
      pauseY = Math.min(0.96, pauseY);
    }
    panel.style.setProperty('--hero-pause-x', `${(pauseX * 100).toFixed(2)}%`);
    panel.style.setProperty('--hero-pause-y', `${(pauseY * 100).toFixed(2)}%`);
  };

  const yawMax = THREE.MathUtils.degToRad(YAW_SWAY_DEG);
  placePosterCam(camDist, 0);
  updateSubjectCssVars();
  renderer.render(scene, cam);

  renderer.setAnimationLoop(() => {
    if (!running) return;
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!visible || document.hidden || panel.classList.contains('is-paused')) {
      return;
    }
    swayT += dt;
    const phase = (swayT % YAW_SWAY_PERIOD_S) / YAW_SWAY_PERIOD_S;
    const yaw = Math.sin(phase * Math.PI * 2) * yawMax;
    placePosterCam(camDist, yaw);

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
    updateSubjectCssVars();
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
    panel.classList.remove('is-cropped');
    panel.style.removeProperty('--hero-subj-left');
    panel.style.removeProperty('--hero-subj-top');
    panel.style.removeProperty('--hero-subj-right');
    panel.style.removeProperty('--hero-subj-bottom');
    panel.style.removeProperty('--hero-pause-x');
    panel.style.removeProperty('--hero-pause-y');
    panel.style.removeProperty('--hero-gl-h');
    panel.style.removeProperty('--hero-gl-offset-y');
    panel.style.removeProperty('--hero-crop-h');
    delete panel.dataset.heroFit;
    delete panel.dataset.heroCam;
    delete panel.dataset.heroFitLog;
    draco.dispose();
    pmrem.dispose();
    renderer.dispose();
  };
}

export type HeroPanelRef = RefObject<HTMLElement | null>;
