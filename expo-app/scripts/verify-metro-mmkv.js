#!/usr/bin/env node
/**
 * Metro `resolveRequest` 회귀: getMmkv 브리지가 여러 모듈 문자열로 들어와도
 * 동일 `src/lib/getMmkv.ts`로 수렴하는지 검증한다. (의존성 없음)
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const expoRoot = path.join(__dirname, '..');
const metroPath = path.join(expoRoot, 'metro.config.js');

function realPathSafe(p) {
  try {
    return fs.realpathSync.native(p);
  } catch {
    return path.resolve(p);
  }
}

const metroConfig = require(metroPath);
const resolveRequest =
  metroConfig.resolver && metroConfig.resolver.resolveRequest;

if (typeof resolveRequest !== 'function') {
  console.error(
    'verify-metro-mmkv: metro.config.js resolver.resolveRequest가 함수가 아님',
  );
  process.exit(1);
}

const expectedPath = path.join(expoRoot, 'src', 'lib', 'getMmkv.ts');
if (!fs.existsSync(expectedPath)) {
  console.error('verify-metro-mmkv: 기대 파일 없음:', expectedPath);
  process.exit(1);
}
const expectedReal = realPathSafe(expectedPath);

const psychoIndex = path.join(
  expoRoot,
  'app',
  '(client)',
  '(wellness)',
  'psycho-education',
  'index.tsx',
);
const psychoId = path.join(
  expoRoot,
  'app',
  '(client)',
  '(wellness)',
  'psycho-education',
  '[id].tsx',
);

/** @type {{ label: string, origin?: string, moduleName: string }[]} */
const cases = [
  {
    label: 'src/stores/useAuthStore.ts + ../lib/getMmkv',
    origin: path.join(expoRoot, 'src', 'stores', 'useAuthStore.ts'),
    moduleName: '../lib/getMmkv',
  },
  {
    label: 'psycho-education/index.tsx + ../../../../src/lib/getMmkv',
    origin: psychoIndex,
    moduleName: '../../../../src/lib/getMmkv',
  },
  {
    label: 'psycho-education/index.tsx + @/lib/getMmkv',
    origin: psychoIndex,
    moduleName: '@/lib/getMmkv',
  },
  {
    label: 'psycho-education/[id].tsx + ../../../../src/lib/getMmkv',
    origin: psychoId,
    moduleName: '../../../../src/lib/getMmkv',
  },
  {
    label: 'psycho-education/[id].tsx + @/lib/getMmkv',
    origin: psychoId,
    moduleName: '@/lib/getMmkv',
  },
  {
    label: 'undefined origin + ../../../../src/lib/getMmkv',
    moduleName: '../../../../src/lib/getMmkv',
  },
  {
    label: 'empty origin + ../../../../src/lib/getMmkv',
    origin: '',
    moduleName: '../../../../src/lib/getMmkv',
  },
  {
    label: 'undefined origin + @/lib/getMmkv',
    moduleName: '@/lib/getMmkv',
  },
  {
    label: 'app/(auth)/login.tsx + ../../../src/lib/getMmkv',
    origin: path.join(expoRoot, 'app', '(auth)', 'login.tsx'),
    moduleName: '../../../src/lib/getMmkv',
  },
];

const platforms = ['web', 'ios'];

for (const platform of platforms) {
  for (const c of cases) {
    if (typeof c.origin === 'string' && c.origin.length > 0) {
      if (!fs.existsSync(c.origin)) {
        console.error('verify-metro-mmkv: origin 파일 없음:', c.origin);
        process.exit(1);
      }
    }
    const context = { originModulePath: c.origin };
    let result;
    try {
      result = resolveRequest(context, c.moduleName, platform);
    } catch (err) {
      console.error(
        `verify-metro-mmkv: FAIL [${platform}] "${c.label}" threw`,
        err,
      );
      process.exit(1);
    }
    if (!result || result.type !== 'sourceFile' || !result.filePath) {
      console.error(
        `verify-metro-mmkv: FAIL [${platform}] "${c.label}" — 기대 type=sourceFile, 실제:`,
        result,
      );
      process.exit(1);
    }
    const gotReal = realPathSafe(result.filePath);
    if (gotReal !== expectedReal) {
      console.error(
        `verify-metro-mmkv: FAIL [${platform}] "${c.label}" — filePath 불일치`,
      );
      console.error('  expected:', expectedReal);
      console.error('  actual:  ', gotReal);
      process.exit(1);
    }
    console.log(`verify-metro-mmkv: OK  [${platform}] ${c.label}`);
  }
}

console.log('verify-metro-mmkv: all cases passed');
