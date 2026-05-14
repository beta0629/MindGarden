#!/usr/bin/env node
/**
 * 릴리즈 APK를 releases/artifacts/에 버전·versionCode 포함 파일명으로 복사한다.
 * 소스: 우선 mindgarden-dev-release.apk, 없으면 android/app/build/outputs/apk/release/app-release.apk
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'releases', 'manifest.json'), 'utf8'));
const ver = pkg.version.replace(/[^0-9.]/g, '') || '0.0.0';
const code = manifest.androidVersionCode ?? 1;
const channel = process.argv[2] || 'dev';

const candidates = [
  path.join(root, 'mindgarden-dev-release.apk'),
  path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
];

let src = null;
for (const p of candidates) {
  if (fs.existsSync(p)) {
    src = p;
    break;
  }
}

if (!src) {
  console.error('APK를 찾을 수 없습니다. 먼저 npm run android:apk:dev 로 빌드하세요.');
  process.exit(1);
}

const outDir = path.join(root, 'releases', 'artifacts');
fs.mkdirSync(outDir, { recursive: true });
const dest = path.join(outDir, `MindGarden-${channel}-v${ver}-build${code}.apk`);
fs.copyFileSync(src, dest);
console.log(`복사 완료: ${dest}`);
