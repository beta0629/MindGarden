import type { RefObject } from 'react';

type MountHeroOptions = {
  panel: HTMLElement;
  canvas: HTMLCanvasElement;
  signal?: AbortSignal;
};

/** Addendum B: one full azimuth orbit + radius zoom cycle (seconds). */
const ORBIT_PERIOD_S = 30;
/** Peak zoom amp — modest so resting fit stays large. */
const ZOOM_AMP = 0.05;
/**
 * Frustum margin around the painted mesh (~6% → 4–8% band).
 * Keep modest — over-shrink made a ~100px smudge in a huge cream field.
 */
const SPHERE_FIT_MARGIN = 1.03;
/** Samples across WingFold to capture max wing extent. */
const BOUNDS_SAMPLE_STEPS = 24;
/** Spec FOV from hero-IMPLEMENTATION.md §3 (poster match). */
const HERO_FOV_DEG = 30;
/**
 * Poster elevation: cam (0.12, 1.5, 1.95) → lookAt (0, 0.15, 0.06)
 * ⇒ vertical/horizontal ≈ 1.35/1.89 ≈ tan(35.5°). Orbit keeps this angle
 * so the flower ring retains depth (near-equatorial orbits flatten it).
 */
const ORBIT_ELEVATION_RAD = Math.atan(1.35 / 1.894);
/** Spec lookAt / camera from hero-IMPLEMENTATION.md §3. */
const POSTER_LOOK_AT = { x: 0, y: 0.15, z: 0.06 } as const;
const POSTER_CAM = { x: 0.12, y: 1.5, z: 1.95 } as const;
const POSTER_RADIUS = Math.hypot(
  POSTER_CAM.x - POSTER_LOOK_AT.x,
  POSTER_CAM.y - POSTER_LOOK_AT.y,
  POSTER_CAM.z - POSTER_LOOK_AT.z,
);

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
  renderer.toneMappingExposure = 1.55;
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = null;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;

  scene.add(new THREE.HemisphereLight(0xfff7ee, 0xd9cfbd, 0.28));
  const key = new THREE.DirectionalLight(0xfff8f0, 2.4);
  key.position.set(-1.0, 3.6, 1.0);
  key.castShadow = false;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffe8d6, 0.45);
  fill.position.set(1.4, 1.2, -0.8);
  scene.add(fill);

  const cam = new THREE.PerspectiveCamera(HERO_FOV_DEG, 81 / 47, 0.1, 50);

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
        color.setHSL(hsl.h, Math.min(1, hsl.s * 1.35), hsl.l);
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

  /*
   * Bounding sphere over the full WingFold cycle. Include cream flowers (they
   * still occupy space) but skip antenna tips that inflate empty framing.
   */
  const sampleBox = new THREE.Box3();
  const sampleSize = new THREE.Vector3();
  const sampleCenter = new THREE.Vector3();
  const frameCenters: InstanceType<typeof THREE.Vector3>[] = [];
  const frameRadii: number[] = [];
  const _skipBoundsName = /antenna/i;
  const expandBounds = (target: InstanceType<typeof THREE.Box3>) => {
    target.makeEmpty();
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((obj) => {
      if (_skipBoundsName.test(obj.name || '')) return;
      const mesh = obj as unknown as {
        isMesh?: boolean;
        geometry?: {
          computeBoundingBox?: () => void;
          boundingBox?: InstanceType<typeof THREE.Box3> | null;
        };
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
    expandBounds(sampleBox);
    if (sampleBox.isEmpty()) sampleBox.setFromObject(gltf.scene);
    if (sampleBox.isEmpty()) return;
    sampleBox.getCenter(sampleCenter);
    sampleBox.getSize(sampleSize);
    // Tight radius: max vertex distance to center (not inflated AABB sphere).
    let radius = 0;
    gltf.scene.traverse((obj) => {
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
      const step = Math.max(1, Math.floor(pos.count / 2000));
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i += step) {
        v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(
          mesh.matrixWorld,
        );
        radius = Math.max(radius, v.distanceTo(sampleCenter));
      }
    });
    if (radius <= 0) {
      radius =
        0.5 *
        Math.hypot(Math.max(sampleSize.x, sampleSize.z), sampleSize.y);
    }
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

  // Approved poster pivot — not the inflated vertex sphere center.
  const lookAt = new THREE.Vector3(
    POSTER_LOOK_AT.x,
    POSTER_LOOK_AT.y,
    POSTER_LOOK_AT.z,
  );

  const size = () => {
    const rect = panel.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height || width * (940 / 1620), 1);
    // Full CSS box × dpr (setPixelRatio already capped at 2) — never a tiny buffer.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    cam.aspect = width / height;
    cam.updateProjectionMatrix();
  };
  // is-3d activates poster aspect before the first measure/fit.
  panel.classList.add('is-3d');
  // Drop any leftover crop state from prior mounts.
  panel.classList.remove('is-cropped');
  panel.style.removeProperty('--hero-gl-h');
  panel.style.removeProperty('--hero-gl-offset-y');
  panel.style.removeProperty('--hero-crop-h');
  size();

  // Start from the approved poster distance, then project-fit (no sphere minDist clamp).
  let orbitRadius = POSTER_RADIUS * (1 + ZOOM_AMP);
  /** Fixed orbit pivot — lookAt stays on the flower bed center (poster). */
  const orbitCenterY = lookAt.y;
  const elevSin = Math.sin(ORBIT_ELEVATION_RAD);
  const elevCos = Math.cos(ORBIT_ELEVATION_RAD);
  let cameraY = orbitCenterY + orbitRadius * elevSin;

  const proj = new THREE.Vector3();
  type NdcExtents = { halfX: number; halfY: number; minY: number; maxY: number };
  const emptyNdc = (): NdcExtents => ({
    halfX: 0,
    halfY: 0,
    minY: 0,
    maxY: 0,
  });
  const absorbNdc = (
    into: NdcExtents & { any: boolean },
    x: number,
    y: number,
  ) => {
    into.halfX = Math.max(into.halfX, Math.abs(x));
    into.halfY = Math.max(into.halfY, Math.abs(y));
    into.minY = Math.min(into.minY, y);
    into.maxY = Math.max(into.maxY, y);
    into.any = true;
  };

  /** Conservative hull (sphere extremities) — zoom-OUT safety. */
  const measureNdcHull = (): NdcExtents => {
    tilt.updateMatrixWorld(true);
    const into = { halfX: 0, halfY: 0, minY: 1, maxY: -1, any: false };
    const centers = frameCenters.length > 0 ? frameCenters : [sphere.center];
    const radii = frameRadii.length > 0 ? frameRadii : [sphere.radius];
    for (let i = 0; i < centers.length; i += 1) {
      const c = centers[i];
      const r = radii[i] ?? sphere.radius;
      for (const [dx, dy, dz] of [
        [r, 0, 0],
        [-r, 0, 0],
        [0, r, 0],
        [0, -r, 0],
        [0, 0, r],
        [0, 0, -r],
      ] as const) {
        proj.set(c.x + dx, c.y + dy, c.z + dz).project(cam);
        if (!Number.isFinite(proj.x) || !Number.isFinite(proj.y) || !Number.isFinite(proj.z)) {
          continue;
        }
        if (proj.z < -1.05 || proj.z > 1.05) continue;
        if (Math.abs(proj.x) > 4 || Math.abs(proj.y) > 4) continue;
        absorbNdc(into, proj.x, proj.y);
      }
    }
    if (!into.any) return emptyNdc();
    return {
      halfX: into.halfX,
      halfY: into.halfY,
      minY: into.minY,
      maxY: into.maxY,
    };
  };

  /** Painted-mesh silhouette (dense verts) — top-pack + pause AABB. */
  const measureNdcMesh = (): NdcExtents => {
    tilt.updateMatrixWorld(true);
    const into = { halfX: 0, halfY: 0, minY: 1, maxY: -1, any: false };
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
        // Skip behind-camera / non-finite projections — they explode NDC and
        // force a catastrophic zoom-out (tiny subject in empty cream).
        if (!Number.isFinite(proj.x) || !Number.isFinite(proj.y) || !Number.isFinite(proj.z)) {
          continue;
        }
        if (proj.z < -1.05 || proj.z > 1.05) continue;
        if (Math.abs(proj.x) > 4 || Math.abs(proj.y) > 4) continue;
        absorbNdc(into, proj.x, proj.y);
      }
    });
    if (!into.any) return measureNdcHull();
    return {
      halfX: into.halfX,
      halfY: into.halfY,
      minY: into.minY,
      maxY: into.maxY,
    };
  };

  const placeAt = (radius: number, lookY: number, camY: number, theta: number) => {
    // Elevated orbit around the flower-bed pivot (poster-like depth).
    const horizontal = Math.sqrt(
      Math.max(radius * radius - (camY - orbitCenterY) ** 2, 0.01),
    );
    cam.position.set(
      lookAt.x + Math.sin(theta) * horizontal,
      camY,
      lookAt.z + Math.cos(theta) * horizontal,
    );
    lookAt.y = lookY;
    cam.lookAt(lookAt);
    cam.updateMatrixWorld(true);
  };

  const syncCamY = () => {
    cameraY = orbitCenterY + orbitRadius * elevSin;
  };

  /*
   * Camera-only framing (no CSS crop / offset):
   * Fit the POSTER angle (+ WingFold samples) so projected half ≈ 1/1.06.
   * Do NOT clamp to the inflated vertex sphere — that left a tiny subject.
   * Mild zoom-out only if other orbit angles exceed NDC ±1.02.
   */
  {
    const animSteps = clip ? 6 : 0;
    const duration = clip ? Math.max(clip.duration, 0.001) : 1;
    const fitTarget = 1 / SPHERE_FIT_MARGIN;
    // Poster azimuth ≈ atan2(0.12, 1.89) — near +Z.
    const posterTheta = Math.atan2(
      POSTER_CAM.x - POSTER_LOOK_AT.x,
      POSTER_CAM.z - POSTER_LOOK_AT.z,
    );

    const measureAtTheta = (theta: number): NdcExtents => {
      let halfX = 0;
      let halfY = 0;
      let minY = 1;
      let maxY = -1;
      placeAt(orbitRadius, lookAt.y, cameraY, theta);
      for (let s = 0; s <= animSteps; s += 1) {
        if (clip && wingAction) {
          mixer.setTime((duration * s) / Math.max(animSteps, 1));
        }
        const ext = measureNdcMesh();
        halfX = Math.max(halfX, ext.halfX);
        halfY = Math.max(halfY, ext.halfY);
        minY = Math.min(minY, ext.minY);
        maxY = Math.max(maxY, ext.maxY);
      }
      if (clip && wingAction) mixer.setTime(0);
      return { halfX, halfY, minY, maxY };
    };

    /*
     * Fit RESTING radius at the poster azimuth so projected half ≈ fitTarget.
     * Per-frame radius compensation (below) keeps fill stable through orbit.
     */
    const fitPoster = () => {
      syncCamY();
      const ext = measureAtTheta(posterTheta);
      const half = Math.max(ext.halfX, ext.halfY, 0.05);
      orbitRadius = Math.max(0.35, orbitRadius * (half / fitTarget));
      syncCamY();
    };

    placeAt(orbitRadius, lookAt.y, cameraY, posterTheta);
    if (clip && wingAction) mixer.setTime(0);
    fitPoster();
    fitPoster();
    fitPoster();

    placeAt(orbitRadius, lookAt.y, cameraY, posterTheta);
    if (clip && wingAction) mixer.setTime(0);
    const packed = measureNdcMesh();
    panel.dataset.heroFit = [
      packed.minY.toFixed(3),
      packed.maxY.toFixed(3),
      orbitRadius.toFixed(2),
      Math.max(packed.halfX, packed.halfY).toFixed(3),
    ].join(',');
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

  /**
   * Project painted mesh to panel % for pause placement.
   * 44px hit sits at subject bottom-right on cream — not on flower petals.
   */
  const updateSubjectCssVars = () => {
    const { width, height } = panel.getBoundingClientRect();
    if (width < 1 || height < 1) return;

    tilt.updateMatrixWorld(true);
    let minX = 1;
    let maxX = 0;
    let minY = 1;
    let maxY = 0;
    let any = false;
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
        if (!Number.isFinite(proj.x) || !Number.isFinite(proj.y) || !Number.isFinite(proj.z)) {
          continue;
        }
        if (proj.z < -1.05 || proj.z > 1.05) continue;
        if (Math.abs(proj.x) > 4 || Math.abs(proj.y) > 4) continue;
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

    /*
     * Pause at subject bottom-right on cream — just outside the AABB so the
     * 44px hit is not on flower petals. Clamp inside the panel.
     */
    const pauseX = Math.min(0.96, Math.max(0.62, maxX + 0.02));
    const pauseY = Math.min(0.96, Math.max(0.55, maxY + 0.02));
    panel.style.setProperty('--hero-pause-x', `${(pauseX * 100).toFixed(2)}%`);
    panel.style.setProperty('--hero-pause-y', `${(pauseY * 100).toFixed(2)}%`);
  };

  const posterTheta = Math.atan2(
    POSTER_CAM.x - POSTER_LOOK_AT.x,
    POSTER_CAM.z - POSTER_LOOK_AT.z,
  );
  /** Keep framing near the approved poster — full 360° foreshortening shrank the subject. */
  const ORBIT_SWAY_RAD = THREE.MathUtils.degToRad(28);
  const placeCamera = (t: number) => {
    const phase = (t % ORBIT_PERIOD_S) / ORBIT_PERIOD_S;
    // Gentle azimuth sway around the poster pose (not a full turntable).
    const theta = posterTheta + Math.sin(phase * Math.PI * 2) * ORBIT_SWAY_RAD;
    const zoom =
      1 + (ZOOM_AMP * (1 - Math.cos(phase * Math.PI * 2))) / 2;
    const radius = orbitRadius / zoom;
    const camY = orbitCenterY + radius * elevSin;
    const horizontal = Math.max(radius * elevCos, 0.01);
    cam.position.set(
      lookAt.x + Math.sin(theta) * horizontal,
      camY,
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
    delete panel.dataset.heroFitLog;
    draco.dispose();
    pmrem.dispose();
    renderer.dispose();
  };
}

export type HeroPanelRef = RefObject<HTMLElement | null>;
