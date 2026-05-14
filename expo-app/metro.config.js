const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@expo/metro/metro-config');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = __dirname;

function realPathSafe(p) {
  try {
    return fs.realpathSync.native(p);
  } catch {
    return path.resolve(p);
  }
}

const resolvedProjectRoot = realPathSafe(projectRoot);

/**
 * MMKV 브리지 소스 경로. 실패 시 null (bare import는 tryMmkvExplicitResolution 앞단에서 별도 처리).
 * @returns {string|null}
 */
function resolveMmkvSourceFile() {
  try {
    return require.resolve('./src/lib/getMmkv.ts');
  } catch {
    return null;
  }
}

const MMKV_SOURCE_FILE = resolveMmkvSourceFile();
const MMKV_RESOLVED_BASE =
  MMKV_SOURCE_FILE == null
    ? null
    : path.join(
        path.dirname(MMKV_SOURCE_FILE),
        path.basename(MMKV_SOURCE_FILE, path.extname(MMKV_SOURCE_FILE)),
      );

/**
 * `getMmkv` 브리지 TS를 Metro `sourceFile`로 반환. `resolveMmkvSourceFile`과 동일 조건.
 *
 * @returns {{ type: 'sourceFile', filePath: string }|null}
 */
function mmkvExplicitSourceResolution() {
  const filePath = resolveMmkvSourceFile();
  return filePath == null ? null : { type: 'sourceFile', filePath };
}

/**
 * `origin`에서 `moduleName`(상대)을 결합한 경로가 MMKV 브리지 소스와 동일한지(realpath 기준).
 *
 * @param {string} origin
 * @param {string} moduleName
 * @param {string} sourceFile
 * @returns {boolean}
 */
function joinedRelativeResolvesToMmkv(origin, moduleName, sourceFile) {
  if (MMKV_RESOLVED_BASE == null) {
    return false;
  }
  const joined = path.normalize(path.join(path.dirname(origin), moduleName));
  try {
    const jr = realPathSafe(joined);
    const br = realPathSafe(MMKV_RESOLVED_BASE);
    const fr = realPathSafe(sourceFile);
    return jr === br || jr === fr;
  } catch {
    return joined === MMKV_RESOLVED_BASE || joined === sourceFile;
  }
}

/**
 * 상대 모듈 지정자에서 선행 `../`·`./`를 반복 제거해 정규화한다.
 * `./../../../../src/lib/getMmkv` → `src/lib/getMmkv` 등 Babel·캐시 변형 흡수.
 *
 * @param {string} moduleName
 * @returns {string|null} 선행 dot-segment 제거 후 나머지, 상대가 아니면 null
 */
function normalizeRelativeSpecifier(moduleName) {
  if (typeof moduleName !== 'string' || !moduleName.startsWith('.')) {
    return null;
  }
  let s = moduleName.split(path.sep).join('/');
  while (true) {
    const before = s;
    while (s.startsWith('../')) {
      s = s.slice(3);
    }
    while (s.startsWith('./')) {
      s = s.slice(2);
    }
    if (s === before) {
      break;
    }
  }
  return s;
}

/**
 * Babel 캐시·도구가 `@/lib/getMmkv` → `../lib/getMmkv` 등으로 바꾼 경우.
 * `../../lib/getMmkv`(app 깊은 트리)까지 동일 파일로 수렴.
 */
function stripsToProjectLibGetMmkv(moduleName) {
  const s = normalizeRelativeSpecifier(moduleName);
  return s === 'lib/getMmkv';
}

/**
 * MindGarden 전용 규약: 선행 `./`·`../` 제거 후 문자열이 정확히 `src/lib/getMmkv`인 상대 지정자만.
 * (다른 `src/lib/*` 확장·오탐 방지)
 *
 * @param {string} moduleName
 * @returns {boolean}
 */
function isMindGardenProjectSrcLibGetMmkvRelative(moduleName) {
  return normalizeRelativeSpecifier(moduleName) === 'src/lib/getMmkv';
}

function isFirstPartyProjectPath(originPath) {
  if (typeof originPath !== 'string') {
    return false;
  }
  const rel = path.relative(resolvedProjectRoot, realPathSafe(originPath));
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    return false;
  }
  return !rel.split(path.sep).includes('node_modules');
}

/**
 * MMKV 브리지 전담 해석. `src/lib/getMmkv` MindGarden 규약 상대 지정자는
 * `originModulePath` 없음·비 1st-party여도 `mmkvExplicitSourceResolution()`으로 수렴한다.
 *
 * @param {{ originModulePath?: string }} context
 * @param {string} moduleName
 * @returns {{ type: 'sourceFile', filePath: string }|null}
 */
function tryMmkvExplicitResolution(context, moduleName) {
  if (typeof moduleName !== 'string') {
    return null;
  }

  if (moduleName === '@/lib/getMmkv') {
    return mmkvExplicitSourceResolution();
  }

  if (isMindGardenProjectSrcLibGetMmkvRelative(moduleName)) {
    return mmkvExplicitSourceResolution();
  }

  if (stripsToProjectLibGetMmkv(moduleName)) {
    const origin = context.originModulePath;
    if (typeof origin === 'string' && origin.length > 0 && isFirstPartyProjectPath(origin)) {
      return mmkvExplicitSourceResolution();
    }
  }

  const sourceFile = resolveMmkvSourceFile();
  if (sourceFile == null || MMKV_RESOLVED_BASE == null) {
    return null;
  }

  if (!moduleName.startsWith('.')) {
    return null;
  }

  const origin = context.originModulePath;
  if (typeof origin !== 'string' || !isFirstPartyProjectPath(origin)) {
    return null;
  }

  if (joinedRelativeResolvesToMmkv(origin, moduleName, sourceFile)) {
    return mmkvExplicitSourceResolution();
  }

  return null;
}

const baseConfig = getDefaultConfig(projectRoot);
const upstreamResolveRequest = baseConfig.resolver.resolveRequest;

function mindGardenResolveRequest(context, moduleName, platform) {
  if (typeof moduleName !== 'string') {
    return typeof upstreamResolveRequest === 'function'
      ? upstreamResolveRequest(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
  }

  const mmkvResolution = tryMmkvExplicitResolution(context, moduleName);
  if (mmkvResolution != null) {
    return mmkvResolution;
  }

  let next = moduleName;

  if (next.startsWith('@/')) {
    next = path.resolve(resolvedProjectRoot, 'src', next.slice(2));
  } else if (isMindGardenProjectSrcLibGetMmkvRelative(next)) {
    next = path.resolve(resolvedProjectRoot, 'src', 'lib', 'getMmkv');
  } else if (next.startsWith('.') && isFirstPartyProjectPath(context.originModulePath)) {
    const relRest = normalizeRelativeSpecifier(next);
    const safeStripped = relRest == null ? next : relRest;
    const originPath = context.originModulePath;
    if (
      MMKV_SOURCE_FILE != null &&
      joinedRelativeResolvesToMmkv(originPath, next, MMKV_SOURCE_FILE)
    ) {
      next = MMKV_RESOLVED_BASE;
    } else if (safeStripped === 'src' || safeStripped.startsWith('src/')) {
      next = path.resolve(resolvedProjectRoot, safeStripped);
    }
  }

  if (typeof upstreamResolveRequest === 'function') {
    return upstreamResolveRequest(context, next, platform);
  }
  return context.resolveRequest(context, next, platform);
}

/** `@/`·상대 경로에서 `getMmkv`가 Metro에서 안정적으로 해석되도록 커스텀 resolve */
module.exports = mergeConfig(baseConfig, {
  resolver: {
    resolveRequest: mindGardenResolveRequest,
  },
});
