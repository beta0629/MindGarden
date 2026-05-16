#!/usr/bin/env node
/**
 * release APK를 연결된 Android 기기에 설치하고 앱을 실행한다.
 * 사전: npm run android:apk:dev
 */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const PACKAGE = 'com.mindgardenmobile';

/** Gradle 산출물을 우선 — 루트 mindgarden-dev-release.apk는 구버전일 수 있음 */
const candidates = [
  path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
  path.join(root, 'mindgarden-dev-release.apk'),
];

function adbArgs(extraArgs) {
  const serial = process.env.ANDROID_SERIAL?.trim();
  return serial ? ['-s', serial, ...extraArgs] : extraArgs;
}

function runAdb(args) {
  const full = ['adb', ...adbArgs(args)].join(' ');
  console.log(`> ${full}`);
  execSync(full, { stdio: 'inherit' });
}

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

let apk = null;
for (const p of candidates) {
  if (fs.existsSync(p)) {
    apk = p;
    break;
  }
}

if (!apk) {
  console.error('APK 없음. 먼저 npm run android:apk:dev 를 실행하세요.');
  process.exit(1);
}

const devices = execSync('adb devices', { encoding: 'utf8' })
  .split('\n')
  .filter((line) => /\tdevice$/.test(line));
if (devices.length === 0) {
  console.error('adb 연결 기기 없음. USB 디버깅 또는 Wi-Fi adb를 확인하세요.');
  process.exit(1);
}
if (!process.env.ANDROID_SERIAL?.trim() && devices.length > 1) {
  const physical = devices.find((line) => !line.includes('emulator-'));
  if (physical) {
    process.env.ANDROID_SERIAL = physical.split('\t')[0].trim();
    console.log(`ℹ️  기기 2대 이상 — 실기기 우선: ANDROID_SERIAL=${process.env.ANDROID_SERIAL}`);
  }
}

console.log(`\n📦 설치: ${apk}`);
const install = spawnSync('adb', adbArgs(['install', '-r', apk]), { encoding: 'utf8' });
if (install.status !== 0) {
  const err = `${install.stderr ?? ''}${install.stdout ?? ''}`;
  if (err.includes('INSTALL_FAILED_VERSION_DOWNGRADE')) {
    console.log('⚠️  버전 다운그레이드 — -d 로 재시도');
    runAdb(['install', '-r', '-d', apk]);
  } else {
    console.error(err);
    process.exit(install.status ?? 1);
  }
}

console.log('\n🚀 앱 실행:', PACKAGE);
const launch = spawnSync('adb', adbArgs([
  'shell',
  'monkey',
  '-p',
  PACKAGE,
  '-c',
  'android.intent.category.LAUNCHER',
  '1',
]), { encoding: 'utf8' });
if (launch.status !== 0) {
  runAdb(['shell', 'am', 'start', '-n', `${PACKAGE}/.MainActivity`]);
}

console.log('\n✅ 설치·실행 완료');
