#!/usr/bin/env node
/**
 * `adb devices`의 모든 device에 Metro 포트 reverse.
 * 포트: `METRO_PORT` 또는 `RCT_METRO_PORT` 또는 `EXPO_METRO_PORT` (기본 8081)
 */
const { execSync } = require('child_process');

const port = String(
  process.env.METRO_PORT || process.env.RCT_METRO_PORT || process.env.EXPO_METRO_PORT || '8081',
).trim();

let out;
try {
  out = execSync('adb devices', { encoding: 'utf8' });
} catch {
  console.error('adb 실행 실패. Android SDK platform-tools PATH 확인.');
  process.exit(1);
}

const serials = out
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('List of devices'))
  .filter((l) => /\tdevice$/.test(l) || /\sdevice$/.test(l))
  .map((l) => l.split(/\s+/)[0]);

if (serials.length === 0) {
  console.error('연결된 기기 없음 (adb devices에 device 상태가 없음).');
  process.exit(1);
}

for (const s of serials) {
  try {
    execSync(`adb -s ${s} reverse tcp:${port} tcp:${port}`, { stdio: 'inherit' });
    console.log(`reverse tcp:${port} ok:`, s);
  } catch {
    console.error('reverse 실패:', s);
    process.exit(1);
  }
}
