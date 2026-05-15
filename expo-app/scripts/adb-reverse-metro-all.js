#!/usr/bin/env node
/**
 * `adb devices`에 나온 모든 `device` 상태 기기에 `tcp:8081` reverse 적용.
 * 실기기 + 에뮬레이터 병행 시 각각 한 번씩 실행해야 Metro(호스트 8081)에 붙는다.
 */
const { execSync } = require('child_process');

let out;
try {
  out = execSync('adb devices', { encoding: 'utf8' });
} catch (e) {
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
    execSync(`adb -s ${s} reverse tcp:8081 tcp:8081`, { stdio: 'inherit' });
    console.log('reverse tcp:8081 ok:', s);
  } catch {
    console.error('reverse 실패:', s);
    process.exit(1);
  }
}
