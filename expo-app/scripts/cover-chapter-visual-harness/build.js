/**
 * 시각 하네스 번들 — esbuild 로 `entry.tsx` 를 react-native-web 브라우저 번들로 묶는다.
 *
 * - `react-native` → `react-native-web`, `.web.*` 확장자 우선 (Metro web 과 같은 해석 순서)
 * - `@/` 는 tsconfig paths 로 해석
 * - 네이티브 전용(expo-haptics · expo-font · reanimated)만 `stubs/` 로 대체
 *
 * @author MindGarden
 * @since 2026-11-07
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { HARNESS_DIR, EXPO_APP_DIR, OUT_DIR, requireTool } = require('./tools');

const FONT_FILES = [
  'Pretendard-Regular.otf',
  'Pretendard-Medium.otf',
  'Pretendard-SemiBold.otf',
  'Pretendard-Bold.otf',
];

const STUBS = {
  'expo-haptics': path.join(HARNESS_DIR, 'stubs', 'expoHaptics.ts'),
  'expo-font': path.join(HARNESS_DIR, 'stubs', 'expoFont.ts'),
  'react-native-reanimated': path.join(HARNESS_DIR, 'stubs', 'reanimated.ts'),
};

const COVER_CHAPTER_DIR = path.join('src', 'components', 'organisms', 'coverChapter');

function indexHtml() {
  const faces = FONT_FILES.map((file) => {
    const family = path.basename(file, '.otf');
    return `@font-face{font-family:'${family}';src:url('./fonts/${file}') format('opentype');font-display:block;}`;
  }).join('\n');
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Cover/Chapter v4 visual harness (HARVEST fixtures)</title>
<style>
${faces}
html,body,#root{height:100%;margin:0;}
body{overflow:hidden;font-family:'Pretendard-Regular',sans-serif;}
#root{display:flex;}
</style>
</head>
<body>
<div id="root"></div>
<script src="./harness.js"></script>
</body>
</html>
`;
}

async function build() {
  const esbuild = requireTool('esbuild');
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT_DIR, 'fonts'), { recursive: true });

  const result = await esbuild.build({
    absWorkingDir: EXPO_APP_DIR,
    entryPoints: [path.join(HARNESS_DIR, 'entry.tsx')],
    outfile: path.join(OUT_DIR, 'harness.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome120'],
    jsx: 'automatic',
    tsconfig: path.join(EXPO_APP_DIR, 'tsconfig.json'),
    resolveExtensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.mjs',
      '.json',
    ],
    mainFields: ['browser', 'module', 'main'],
    loader: { '.js': 'jsx', '.otf': 'file', '.ttf': 'file', '.png': 'file' },
    alias: { 'react-native': 'react-native-web', ...STUBS },
    define: {
      __DEV__: 'false',
      'process.env.NODE_ENV': '"production"',
      'process.env.EXPO_OS': '"web"',
      global: 'globalThis',
    },
    banner: { js: 'globalThis.process = globalThis.process || { env: {} };' },
    metafile: true,
    minify: false,
    sourcemap: false,
    logLevel: 'warning',
  });

  for (const file of FONT_FILES) {
    fs.copyFileSync(
      path.join(EXPO_APP_DIR, 'assets', 'fonts', file),
      path.join(OUT_DIR, 'fonts', file),
    );
  }
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml());

  const inputs = Object.keys(result.metafile.inputs);
  const coverChapterModules = inputs
    .filter(
      (p) => p.startsWith(COVER_CHAPTER_DIR + path.sep) || p.startsWith(`${COVER_CHAPTER_DIR}/`),
    )
    .sort();
  const expectedModules = fs
    .readdirSync(path.join(EXPO_APP_DIR, COVER_CHAPTER_DIR))
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => `${COVER_CHAPTER_DIR}/${f}`)
    .sort();
  const meta = {
    esbuildVersion: esbuild.version,
    reactNativeWebVersion: require(
      path.join(EXPO_APP_DIR, 'node_modules', 'react-native-web', 'package.json'),
    ).version,
    bundleBytes: fs.statSync(path.join(OUT_DIR, 'harness.js')).size,
    inputCount: inputs.length,
    coverChapterModules,
    coverChapterModulesMissing: expectedModules.filter((m) => !coverChapterModules.includes(m)),
    stubbedModules: Object.keys(STUBS),
    warnings: result.warnings.length,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'bundle-meta.json'), JSON.stringify(meta, null, 2));
  console.log(
    `[cover-harness] bundled ${inputs.length} inputs → ${OUT_DIR} (coverChapter modules: ${coverChapterModules.length}/${expectedModules.length})`,
  );
  return meta;
}

if (require.main === module) {
  build().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { build };
