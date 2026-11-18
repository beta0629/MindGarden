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
/** Visible pad above painted mesh top inside the cropped panel (fraction of GL H). */
const STAGE_TOP_PAD = 0.005;
/** Visible pad below painted mesh bottom inside the cropped panel (fraction of GL H). */
const STAGE_BOTTOM_PAD = 0.035;

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
    // Silhouette sphere (height × dominant horizontal) — tighter than AABB diagonal.
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
  /** GL buffer height (px) — may be taller than the cropped panel. */
  let glH = 0;
  let glAspect = 0;
  /** Visible band inside the GL buffer (fractions of glH). */
  let cropTopFrac = 0;
  let cropFrac = 1;

  const size = () => {
    const width = panel.getBoundingClientRect().width;
    if (glAspect > 0) {
      glH = width / glAspect;
      panel.style.setProperty('--hero-gl-h', `${Math.round(glH)}px`);
      panel.style.setProperty(
        '--hero-gl-offset-y',
        `${Math.round(-glH * cropTopFrac)}px`,
      );
      panel.style.setProperty(
        '--hero-crop-h',
        `${Math.round(glH * cropFrac)}px`,
      );
    }
    const height =
      glH > 0 ? glH : panel.getBoundingClientRect().height || width * 0.5;
    renderer.setSize(width, Math.max(height, 1), false);
    cam.aspect = width / Math.max(height, 1);
    cam.updateProjectionMatrix();
  };
  // is-3d activates the subject-hugging aspect before the first measure/fit.
  panel.classList.add('is-3d');
  size();
  glH = panel.getBoundingClientRect().height;
  glAspect = panel.getBoundingClientRect().width / Math.max(glH, 1);

  const fitDist =
    (sphere.radius * SPHERE_FIT_MARGIN) /
    Math.tan(THREE.MathUtils.degToRad(cam.fov * 0.5));
  // Keep the sphere inside the frustum at peak zoom (orbitRadius / zoomMin).
  let orbitRadius = fitDist * (1 + ZOOM_AMP);
  // Near-equatorial orbit — a large Y offset bobbed the silhouette and
  // left a cream band above the subject at some orbit phases.
  let cameraY = lookAt.y + orbitRadius * 0.03;

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

  /** Conservative hull (sphere extremities) — used only to zoom OUT safely. */
  const measureNdcHull = (): NdcExtents => {
    tilt.updateMatrixWorld(true);
    const into = { halfX: 0, halfY: 0, minY: 1, maxY: -1, any: false };
    const centers =
      frameCenters.length > 0
        ? frameCenters
        : [sphere.center];
    const radii =
      frameRadii.length > 0 ? frameRadii : [sphere.radius];
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

  /**
   * Tight painted-mesh silhouette via dense verts — drives top-pack + CSS crop
   * so cream above the butterfly is not mistaken for subject extent.
   */
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
      // ≤4k samples/mesh — dense enough for silhouette, cheap enough for fit.
      const step = Math.max(1, Math.floor(pos.count / 4000));
      for (let i = 0; i < pos.count; i += step) {
        proj.set(pos.getX(i), pos.getY(i), pos.getZ(i));
        proj.applyMatrix4(mesh.matrixWorld).project(cam);
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
    const horizontal = Math.sqrt(
      Math.max(radius * radius - (camY - lookY) ** 2, 0.01),
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

  /*
   * 1) Iterative mesh size-fit (WingFold × orbit) with 8% margin. Damped steps
   *    avoid overshoot when the painted mesh is off the loose sphere center.
   * 2) Nudge lookAt so the mesh mid-Y sits on the optical axis (less one-sided
   *    clip risk), without a vertical “sky pack” that fights the margin.
   * 3) CSS crop to the mesh silhouette — CTA→paint ≈ hero gap only.
   */
  {
    const angles = 8;
    const animSteps = clip ? 6 : 0;
    const duration = clip ? Math.max(clip.duration, 0.001) : 1;

    const measureOrbitMesh = (): NdcExtents => {
      let halfX = 0;
      let halfY = 0;
      let minY = 1;
      let maxY = -1;
      for (let a = 0; a < angles; a += 1) {
        placeAt(orbitRadius, lookAt.y, cameraY, (a / angles) * Math.PI * 2);
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
      }
      if (clip && wingAction) mixer.setTime(0);
      return { halfX, halfY, minY, maxY };
    };

    const fitTarget = 1 / SPHERE_FIT_MARGIN;
    let lastHalf = 0;
    for (let iter = 0; iter < 8; iter += 1) {
      const ext = measureOrbitMesh();
      const half = Math.max(ext.halfX, ext.halfY);
      lastHalf = half;
      if (half < 1e-4) break;

      // Recenter lookAt toward mesh mid-Y in world units (small nudge).
      const midNdcY = (ext.minY + ext.maxY) * 0.5;
      if (Math.abs(midNdcY) > 0.02) {
        const dist = Math.max(cam.position.distanceTo(lookAt), 0.01);
        const worldPerNdc =
          dist * Math.tan(THREE.MathUtils.degToRad(cam.fov * 0.5));
        lookAt.y += midNdcY * worldPerNdc * 0.5;
        cameraY = lookAt.y + orbitRadius * 0.03;
      }

      const factor = half / fitTarget;
      if (Math.abs(factor - 1) < 0.02) break;
      // Dampen zoom-in (factor>1 means subject too big → zoom out fully;
      // factor<1 means too small → ease in to avoid one-sided overshoot).
      const applied = factor >= 1 ? factor : 1 - (1 - factor) * 0.65;
      orbitRadius *= applied;
      cameraY = lookAt.y + orbitRadius * 0.03;
    }

    // Final safety: if anything still breaches the margin, zoom out once.
    {
      const ext = measureOrbitMesh();
      const half = Math.max(ext.halfX, ext.halfY);
      lastHalf = half;
      if (half > fitTarget) {
        orbitRadius *= half * SPHERE_FIT_MARGIN;
        cameraY = lookAt.y + orbitRadius * 0.03;
      }
    }

    const packed = measureOrbitMesh();
    placeAt(orbitRadius, lookAt.y, cameraY, 0);
    const minTopFrac = -packed.maxY * 0.5 + 0.5;
    const maxBottomFrac = -packed.minY * 0.5 + 0.5;

    /*
     * Fixed crop height = max mesh span + pads across orbit. Per-frame we slide
     * --hero-gl-offset-y so the painted top stays pinned (no cream band as the
     * silhouette bobs during orbit).
     */
    const span = Math.max(0.3, maxBottomFrac - minTopFrac);
    cropFrac = Math.min(1, Math.max(0.42, span + STAGE_TOP_PAD + STAGE_BOTTOM_PAD));
    cropTopFrac = Math.max(0, minTopFrac - STAGE_TOP_PAD);

    panel.dataset.heroCrop = [
      minTopFrac.toFixed(3),
      maxBottomFrac.toFixed(3),
      cropTopFrac.toFixed(3),
      cropFrac.toFixed(3),
      orbitRadius.toFixed(2),
      lastHalf.toFixed(3),
    ].join(',');

    /**
     * Slide GL offset so live mesh top sits at the panel top.
     * cropFrac ≥ union span + pads, so pin-top never clips the live bottom.
     */
    const applyCropOffset = (topFrac: number, _bottomFrac: number) => {
      const desired = Math.max(0, topFrac - STAGE_TOP_PAD);
      cropTopFrac = Math.min(desired, Math.max(0, 1 - cropFrac));
      panel.style.setProperty(
        '--hero-gl-offset-y',
        `${Math.round(-glH * cropTopFrac)}px`,
      );
    };

    const width = panel.getBoundingClientRect().width;
    glH = Math.max(panel.getBoundingClientRect().height, width * 0.4);
    glAspect = width / Math.max(glH, 1);
    panel.style.setProperty('--hero-gl-h', `${Math.round(glH)}px`);
    applyCropOffset(minTopFrac, maxBottomFrac);
    panel.style.setProperty(
      '--hero-crop-h',
      `${Math.round(glH * cropFrac)}px`,
    );
    panel.classList.add('is-cropped');
    size();

    (
      panel as HTMLElement & {
        __heroApplyCrop?: (top: number, bottom: number) => void;
      }
    ).__heroApplyCrop = (topFrac: number, bottomFrac: number) => {
      if (glH < 1) return;
      applyCropOffset(topFrac, bottomFrac);
    };
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

  /** Project painted mesh verts to the *cropped* panel % — pause sits on subject BR. */
  const updateSubjectCssVars = () => {
    const { width, height } = panel.getBoundingClientRect();
    if (width < 1 || height < 1 || glH < 1 || cropFrac < 1e-4) return;

    const mesh = measureNdcMesh();
    // Also need X extents — sample verts once more for left/right.
    tilt.updateMatrixWorld(true);
    let minX = 1;
    let maxX = 0;
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
        minX = Math.min(minX, proj.x * 0.5 + 0.5);
        maxX = Math.max(maxX, proj.x * 0.5 + 0.5);
        any = true;
      }
    });
    if (!any) return;
    const minY = (-mesh.maxY * 0.5 + 0.5 - cropTopFrac) / cropFrac;
    const maxY = (-mesh.minY * 0.5 + 0.5 - cropTopFrac) / cropFrac;
    minX = Math.min(1, Math.max(0, minX));
    maxX = Math.min(1, Math.max(0, maxX));
    const top = Math.min(1, Math.max(0, minY));
    const bottom = Math.min(1, Math.max(0, maxY));

    panel.style.setProperty('--hero-subj-left', `${(minX * 100).toFixed(2)}%`);
    panel.style.setProperty('--hero-subj-top', `${(top * 100).toFixed(2)}%`);
    panel.style.setProperty('--hero-subj-right', `${(maxX * 100).toFixed(2)}%`);
    panel.style.setProperty(
      '--hero-subj-bottom',
      `${(bottom * 100).toFixed(2)}%`,
    );
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
    // Pin painted subject top to the crop window as the silhouette bobs.
    const pin = (
      panel as HTMLElement & {
        __heroApplyCrop?: (top: number, bottom: number) => void;
      }
    ).__heroApplyCrop;
    if (pin) {
      const live = measureNdcMesh();
      pin(-live.maxY * 0.5 + 0.5, -live.minY * 0.5 + 0.5);
    }
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
    panel.style.removeProperty('--hero-gl-h');
    panel.style.removeProperty('--hero-gl-offset-y');
    panel.style.removeProperty('--hero-crop-h');
    delete (panel as HTMLElement & { __heroApplyCrop?: unknown }).__heroApplyCrop;
    draco.dispose();
    pmrem.dispose();
    renderer.dispose();
  };
}

export type HeroPanelRef = RefObject<HTMLElement | null>;
