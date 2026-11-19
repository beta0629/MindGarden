/**
 * Shared software-GPU probe cache — tiny module so DeferredScenes can
 * {@link peekSoftwareGpu} without importing atlas decode/banks.
 */

let softwareGpuCache: boolean | null = null;

/** Unmasked renderer strings that must keep the poster (skip three / GLB). */
const SOFTWARE_RENDERER_RE =
  /swiftshader|llvmpipe|softpipe|microsoft basic render|cpu rasterizer/i;

/**
 * Peek cached software-GPU result without creating a WebGL context.
 * `null` means not probed yet — callers must not treat that as "real GPU".
 */
export function peekSoftwareGpu(): boolean | null {
  return softwareGpuCache;
}

/**
 * Reset the software-GPU probe cache (Playwright / unit tests only).
 * Lets stubs of `getExtension` / `getParameter` run between cases.
 */
export function __resetSoftwareGpuCacheForTests(): void {
  softwareGpuCache = null;
}

/**
 * Detect SwiftShader / llvmpipe (and similar) via WEBGL_debug_renderer_info.
 * Creates a short-lived WebGL context on first call — defer until after LCP.
 * Cached for the page lifetime.
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
  if (typeof document === 'undefined') {
    softwareGpuCache = false;
    return false;
  }
  try {
    const probe = document.createElement('canvas');
    const attrs: WebGLContextAttributes = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
    };
    const gl =
      probe.getContext('webgl', attrs) ||
      probe.getContext('experimental-webgl', attrs);
    if (!gl || typeof (gl as WebGLRenderingContext).getExtension !== 'function') {
      softwareGpuCache = true;
      return true;
    }
    const wgl = gl as WebGLRenderingContext;
    const info = wgl.getExtension('WEBGL_debug_renderer_info');
    if (!info) {
      softwareGpuCache = false;
      const lose = wgl.getExtension('WEBGL_lose_context');
      lose?.loseContext();
      return false;
    }
    const name = String(wgl.getParameter(info.UNMASKED_RENDERER_WEBGL) || '');
    softwareGpuCache = SOFTWARE_RENDERER_RE.test(name);
    const lose = wgl.getExtension('WEBGL_lose_context');
    lose?.loseContext();
    return softwareGpuCache;
  } catch {
    softwareGpuCache = true;
    return true;
  }
}

/**
 * Cached software-GPU flag. Does **not** probe — until
 * {@link probeSoftwareGpu} runs after LCP idle, returns `false` (assume
 * hardware) so load-window paths never create a WebGL context.
 */
export function isSoftwareGpu(): boolean {
  return softwareGpuCache === true;
}
