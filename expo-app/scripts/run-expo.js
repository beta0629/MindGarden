#!/usr/bin/env node
/**
 * `expo start …`를 프로젝트 루트에서 Node로 직접 실행한다.
 * npm 스크립트에 `# 주석`이 붙어 셸/Expo가 프로젝트 경로를 `…/#`로 오인하는 문제를 피한다.
 *
 * 사용: node ./scripts/run-expo.js start --lan
 */
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const expoCli = require.resolve('expo/bin/cli');
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node ./scripts/run-expo.js <expo-args…>  (예: start --lan)');
  process.exit(1);
}

const r = spawnSync(process.execPath, [expoCli, ...args], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

if (r.error) {
  console.error(r.error);
  process.exit(1);
}
process.exit(r.status === null ? 1 : r.status);
