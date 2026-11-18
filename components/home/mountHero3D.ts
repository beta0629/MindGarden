import type { RefObject } from 'react';

type MountHeroOptions = {
  panel: HTMLElement;
  canvas: HTMLCanvasElement;
  signal?: AbortSignal;
};

/** Addendum B: one full azimuth orbit + radius zoom cycle (seconds). */
const ORBIT_PERIOD_S = 30;
/** Peak zoom amp — kept modest; orbit radius accounts for it so the sphere still fits. */
const ZOOM_AMP = 0.08;
/** Extra sphere radius margin so wings/flowers never touch the frustum edge. */
const SPHERE_FIT_MARGIN = 1.08;
/** Samples across WingFold to capture max wing extent. */
const BOUNDS_SAMPLE_STEPS = 24;
/**
 * Downward lookAt bias (fraction of radius). Wide subjects are width-limited
 * in a square stage — bias + a gentle NDC top park shifts vertical slack
 * under the subject so CTA→paint ≈ grid gap without hard-cropping wings.
 */
const LOOK_AT_DOWN_BIAS = 0.12;
/** Target NDC Y for the top of framed content after size fit (1 = top). */
const SUBJECT_TOP_NDC = 0.8;

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
      const color = (
        mat as {
          color?: {
            getHSL: (t: { h: number; s: number; l: number }) => void;
            setHSL: (h: number, s: number, l: number) => void;
          };
        }
      ).color;
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

  const mixer = new THREE.AnimationMixer(gltf.scene);
  const clip = THREE.AnimationClip.findByName(gltf.animations, 'WingFold');
  const wingAction = clip ? mixer.clipAction(clip) : null;
  if (wingAction) {
    wingAction.play();
  }

  /*
   * Bounding sphere over WingFold: per-frame max-extent half-sizes around a
   * shared center (avoids the huge circumscribed sphere of a union AABB, which
   * left a large empty cream band above the painted subject).
   */
  const sampleBox = new THREE.Box3();
  const sampleSize = new THREE.Vector3();
  const sampleCenter = new THREE.Vector3();
  const frameCenters: InstanceType<typeof THREE.Vector3>[] = [];
  const frameRadii: number[] = [];
  const _skipFrameName = /cream|antenna/i;
  /** Cream petals blend into page cream; antenna tips inflate empty framing. */
  const expandVisibleBounds = (target: InstanceType<typeof THREE.Box3>) => {
    target.makeEmpty();
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((obj) => {
      const name = obj.name || '';
      if (_skipFrameName.test(name)) return;
      const mesh = obj as unknown as {
        isMesh?: boolean;
        geometry?: { computeBoundingBox?: () => void; boundingBox?: InstanceType<typeof THREE.Box3> | null };
        matrixWorld: InstanceType<typeof THREE.Matrix4>;
      };
      if (!mesh.isMesh || !mesh.geometry) return;
      if (!mesh.geometry.boundingBox && mesh.geometry.computeBoundingBox) {
        mesh.geometry.computeBoundingBox();
      }
      if (!mesh.geometry.boundingBox) return;
      const b = mesh.geometry.boundingBox.clone();
      b.applyMatrix4(mesh.matrixWorld);
      target.union(b);
    });
  };

  const samplePose = () => {
    expandVisibleBounds(sampleBox);
    if (sampleBox.isEmpty()) {
      sampleBox.setFromObject(gltf.scene);
    }
    if (sampleBox.isEmpty()) return;
    sampleBox.getCenter(sampleCenter);
    sampleBox.getSize(sampleSize);
    /*
     * Silhouette sphere: cover the front-facing AABB rectangle (height ×
     * dominant horizontal). Ignores shallow depth so a flat GLB does not get
     * the oversized circumscribed-AABB sphere that left a huge cream band.
     */
    const radius =
      0.5 *
      Math.hypot(Math.max(sampleSize.x, sampleSize.z), sampleSize.y);
    frameCenters.push(sampleCenter.clone());
    frameRadii.push(radius);
  };
  samplePose();
  if (clip && wingAction) {
    const duration = Math.max(clip.duration, 0.001);
    for (let i = 0; i <= BOUNDS_SAMPLE_STEPS; i += 1) {
      mixer.setTime((duration * i) / BOUNDS_SAMPLE_STEPS);
      samplePose();
    }
    mixer.setTime(0);
  }

  const sphere = new THREE.Sphere();
  if (frameCenters.length === 0) {
    sampleBox.setFromObject(gltf.scene);
    sampleBox.getBoundingSphere(sphere);
  } else {
    sphere.center.set(0, 0, 0);
    for (const c of frameCenters) sphere.center.add(c);
    sphere.center.multiplyScalar(1 / frameCenters.length);
    sphere.radius = 0;
    for (let i = 0; i < frameCenters.length; i += 1) {
      const r = sphere.center.distanceTo(frameCenters[i]) + frameRadii[i];
      if (r > sphere.radius) sphere.radius = r;
    }
  }
  if (!Number.isFinite(sphere.radius) || sphere.radius <= 0) {
    sampleBox.setFromObject(gltf.scene);
    sampleBox.getBoundingSphere(sphere);
  }

  const lookAt = sphere.center.clone();
  lookAt.y -= sphere.radius * LOOK_AT_DOWN_BIAS;

  const size = () => {
    const { width, height } = panel.getBoundingClientRect();
    renderer.setSize(width, height, false);
    cam.aspect = width / Math.max(height, 1);
    cam.updateProjectionMatrix();
  };
  /*
   * Apply is-3d before measuring the panel so CSS aspect-ratio (wider stage)
   * is active when we size the camera / fit the sphere.
   */
  panel.classList.add('is-3d');
  size();

  const fitDist =
    (sphere.radius * SPHERE_FIT_MARGIN) /
    Math.tan(THREE.MathUtils.degToRad(cam.fov * 0.5));
  // Keep the sphere inside the frustum at peak zoom (orbitRadius / zoomMin).
  let orbitRadius = fitDist * (1 + ZOOM_AMP);
  // Near-frontal elevation so the bed+butterfly read taller in the stage.
  let cameraY = lookAt.y + orbitRadius * 0.08;

  const proj = new THREE.Vector3();
  type NdcExtents = { half: number; minY: number; maxY: number };
  /** NDC extents of framed meshes (skip cream/antenna); 98th-pct half resists outliers. */
  const measureNdc = (): NdcExtents => {
    tilt.updateMatrixWorld(true);
    const halves: number[] = [];
    const ys: number[] = [];
    tilt.traverse((obj) => {
      if (_skipFrameName.test(obj.name || '')) return;
      const mesh = obj as unknown as {
        isMesh?: boolean;
        geometry?: {
          attributes?: { position?: { count: number; getX: (i: number) => number; getY: (i: number) => number; getZ: (i: number) => number } };
        };
        matrixWorld: InstanceType<typeof THREE.Matrix4>;
      };
      if (!mesh.isMesh || !mesh.geometry?.attributes?.position) return;
      const pos = mesh.geometry.attributes.position;
      const step = Math.max(1, Math.floor(pos.count / 1500));
      for (let i = 0; i < pos.count; i += step) {
        proj.set(pos.getX(i), pos.getY(i), pos.getZ(i));
        proj.applyMatrix4(mesh.matrixWorld).project(cam);
        if (proj.z < -1 || proj.z > 1) continue;
        halves.push(Math.max(Math.abs(proj.x), Math.abs(proj.y)));
        ys.push(proj.y);
      }
    });
    if (halves.length === 0) return { half: 0, minY: 0, maxY: 0 };
    halves.sort((a, b) => a - b);
    ys.sort((a, b) => a - b);
    const at = (arr: number[], p: number) =>
      arr[Math.min(arr.length - 1, Math.max(0, Math.floor(arr.length * p)))];
    return {
      // Max half avoids orbit hard-crop; y percentiles keep lift stable.
      half: halves[halves.length - 1],
      minY: at(ys, 0.02),
      maxY: at(ys, 0.98),
    };
  };
  const measureNdcHalf = (): number => measureNdc().half;

  /*
   * AABB/silhouette spheres overestimate empty volume on this GLB. Refine the
   * orbit radius so the projected vertex hull + 8% margin fills the frustum
   * across a few orbit angles and WingFold samples — no CSS hard-crop needed.
   */
  {
    let maxHalf = 0;
    const angles = 8;
    const animSteps = clip ? 6 : 0;
    const duration = clip ? Math.max(clip.duration, 0.001) : 1;
    for (let a = 0; a < angles; a += 1) {
      const theta = (a / angles) * Math.PI * 2;
      const horizontal = Math.sqrt(
        Math.max(orbitRadius * orbitRadius - (cameraY - lookAt.y) ** 2, 0.01),
      );
      cam.position.set(
        lookAt.x + Math.sin(theta) * horizontal,
        cameraY,
        lookAt.z + Math.cos(theta) * horizontal,
      );
      cam.lookAt(lookAt);
      cam.updateMatrixWorld(true);
      for (let s = 0; s <= animSteps; s += 1) {
        if (clip && wingAction) {
          mixer.setTime((duration * s) / Math.max(animSteps, 1));
        }
        maxHalf = Math.max(maxHalf, measureNdcHalf());
      }
    }
    if (clip && wingAction) mixer.setTime(0);
    if (maxHalf > 1e-4) {
      // Closer when maxHalf < 1; SPHERE_FIT_MARGIN keeps ~8% edge slack.
      orbitRadius *= maxHalf * SPHERE_FIT_MARGIN;
      cameraY = lookAt.y + orbitRadius * 0.08;
    }

    /*
     * Soft top park without a second zoom-out (re-fitting after lift was
     * shrinking the subject into a thin top strip). Bias already in lookAt;
     * only nudge if the top is still far from the target and the lift is small.
     */
    {
      const horizontal = Math.sqrt(
        Math.max(orbitRadius * orbitRadius - (cameraY - lookAt.y) ** 2, 0.01),
      );
      cam.position.set(lookAt.x, cameraY, lookAt.z + horizontal);
      cam.lookAt(lookAt);
      cam.updateMatrixWorld(true);
      if (clip && wingAction) mixer.setTime(0);
      const ext = measureNdc();
      if (ext.maxY < SUBJECT_TOP_NDC - 0.05) {
        const dist = cam.position.distanceTo(lookAt);
        const worldPerNdc =
          dist * Math.tan(THREE.MathUtils.degToRad(cam.fov * 0.5));
        const lift = Math.min(
          (SUBJECT_TOP_NDC - ext.maxY) * worldPerNdc,
          sphere.radius * 0.12,
        );
        lookAt.y -= lift;
        cameraY = lookAt.y + orbitRadius * 0.08;
      }
      void angles;
      void animSteps;
      void duration;
    }
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

  /** Project non-cream mesh verts to panel % — pause sits on subject BR, not flowers-only sky. */
  const updateSubjectCssVars = () => {
    const { width, height } = panel.getBoundingClientRect();
    if (width < 1 || height < 1) return;

    tilt.updateMatrixWorld(true);
    let minX = 1;
    let minY = 1;
    let maxX = 0;
    let maxY = 0;
    let any = false;
    tilt.traverse((obj) => {
      if (_skipFrameName.test(obj.name || '')) return;
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
      const step = Math.max(1, Math.floor(pos.count / 800));
      for (let i = 0; i < pos.count; i += step) {
        proj.set(pos.getX(i), pos.getY(i), pos.getZ(i));
        proj.applyMatrix4(mesh.matrixWorld).project(cam);
        if (proj.z < -1 || proj.z > 1) continue;
        const px = proj.x * 0.5 + 0.5;
        const py = -proj.y * 0.5 + 0.5;
        minX = Math.min(minX, px);
        maxX = Math.max(maxX, px);
        minY = Math.min(minY, py);
        maxY = Math.max(maxY, py);
        any = true;
      }
    });
    if (!any) return;
    minX = Math.min(1, Math.max(0, minX));
    maxX = Math.min(1, Math.max(0, maxX));
    minY = Math.min(1, Math.max(0, minY));
    maxY = Math.min(1, Math.max(0, maxY));

    panel.style.setProperty('--hero-subj-left', `${(minX * 100).toFixed(2)}%`);
    panel.style.setProperty('--hero-subj-top', `${(minY * 100).toFixed(2)}%`);
    panel.style.setProperty('--hero-subj-right', `${(maxX * 100).toFixed(2)}%`);
    panel.style.setProperty('--hero-subj-bottom', `${(maxY * 100).toFixed(2)}%`);
  };

  const placeCamera = (t: number) => {
    const phase = (t % ORBIT_PERIOD_S) / ORBIT_PERIOD_S;
    const theta = phase * Math.PI * 2;
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
    panel.style.removeProperty('--hero-subj-left');
    panel.style.removeProperty('--hero-subj-top');
    panel.style.removeProperty('--hero-subj-right');
    panel.style.removeProperty('--hero-subj-bottom');
    draco.dispose();
    pmrem.dispose();
    renderer.dispose();
  };
}

export type HeroPanelRef = RefObject<HTMLElement | null>;
