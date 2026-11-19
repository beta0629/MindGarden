/**
 * Shared software-GPU probe cache — tiny module so DeferredScenes can
 * {@link peekSoftwareGpu} without importing atlas decode/banks.
 */

const SESSION_KEY = 'mg-soft-gpu-v1';

let softwareGpuCache: boolean | null = null;
/** Reuse one probe canvas/context across calls in this document. */
let probeCanvas: HTMLCanvasElement | null = null;
let probeGl: WebGLRenderingContext | null = null;

/** Unmasked renderer strings that must keep the poster (skip three / GLB). */
const SOFTWARE_RENDERER_RE =
  /swiftshader|llvmpipe|softpipe|microsoft basic render|cpu rasterizer/i;

function readSessionCache(): boolean | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const v = sessionStorage.getItem(SESSION_KEY);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch {
    /* private mode / blocked */
  }
  return null;
}

function writeSessionCache(value: boolean): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_KEY, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function clearSessionCache(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Peek cached software-GPU result without creating a WebGL context.
 * `null` means not probed yet — callers must not treat that as "real GPU".
 */
export function peekSoftwareGpu(): boolean | null {
  if (softwareGpuCache != null) return softwareGpuCache;
  const fromSession = readSessionCache();
  if (fromSession != null) {
    softwareGpuCache = fromSession;
    return fromSession;
  }
  return null;
}

/**
 * Reset the software-GPU probe cache (Playwright / unit tests only).
 * Lets stubs of `getExtension` / `getParameter` run between cases.
 */
export function __resetSoftwareGpuCacheForTests(): void {
  softwareGpuCache = null;
  clearSessionCache();
  if (probeGl) {
    try {
      const lose = probeGl.getExtension('WEBGL_lose_context');
      lose?.loseContext();
    } catch {
      /* ignore */
    }
  }
  probeGl = null;
  probeCanvas = null;
}

/**
 * Detect SwiftShader / llvmpipe (and similar) via WEBGL_debug_renderer_info.
 * Creates a short-lived WebGL context on first call — defer until after LCP.
 * Cached in memory + sessionStorage so LH / remounts skip a second context.
 *
 * Rules:
 * 1. No WebGL at all → software (`true`, poster).
 * 2. `WEBGL_debug_renderer_info` present → software only on renderer regex match.
 * 3. Extension missing → hardware (`false`, allow 3D; Apple/Adreno/Mali).
 * Never use `failIfMajorPerformanceCaveat` as a fast-path that skips the
 * renderer string (Chromium SwiftShader can pass that gate).
 */
export function probeSoftwareGpu(): boolean {
  if (softwareGpuCache != null) return softwareGpuCache;
  const fromSession = readSessionCache();
  if (fromSession != null) {
    softwareGpuCache = fromSession;
    return fromSession;
  }
  if (typeof document === 'undefined') {
    softwareGpuCache = false;
    return false;
  }
  try {
    if (!probeCanvas) {
      probeCanvas = document.createElement('canvas');
    }
    const attrs: WebGLContextAttributes = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
    };
    if (!probeGl) {
      probeGl =
        (probeCanvas.getContext('webgl', attrs) as WebGLRenderingContext | null) ||
        (probeCanvas.getContext(
          'experimental-webgl',
          attrs,
        ) as WebGLRenderingContext | null);
    }
    if (!probeGl || typeof probeGl.getExtension !== 'function') {
      softwareGpuCache = true;
      writeSessionCache(true);
      return true;
    }
    const wgl = probeGl;
    const info = wgl.getExtension('WEBGL_debug_renderer_info');
    if (!info) {
      softwareGpuCache = false;
      writeSessionCache(false);
      return false;
    }
    const name = String(wgl.getParameter(info.UNMASKED_RENDERER_WEBGL) || '');
    softwareGpuCache = SOFTWARE_RENDERER_RE.test(name);
    writeSessionCache(softwareGpuCache);
    return softwareGpuCache;
  } catch {
    softwareGpuCache = true;
    writeSessionCache(true);
    return true;
  }
}

/**
 * Cached software-GPU flag. Does **not** probe — until
 * {@link probeSoftwareGpu} runs after LCP idle, returns `false` (assume
 * hardware) so load-window paths never create a WebGL context.
 */
export function isSoftwareGpu(): boolean {
  if (softwareGpuCache == null) {
    const fromSession = readSessionCache();
    if (fromSession != null) softwareGpuCache = fromSession;
  }
  return softwareGpuCache === true;
}
