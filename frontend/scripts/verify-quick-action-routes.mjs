#!/usr/bin/env node
/**
 * GNB 빠른 액션 중 type navigate 의 action 경로가 App.js Route path에 정의돼 있는지 검사.
 * lucide 등을 import 하지 않도록 소스 텍스트만 파싱한다.
 *
 * @see docs/project-management/GNB_LNB_MENU_SYNCHRONIZATION_DIRECTIVE.md
 * 사용: node scripts/verify-quick-action-routes.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const ga = read('src/constants/gnbQuickActions.js');
const ar = read('src/constants/adminRoutes.js');
const app = read('src/App.js');

const routeMap = {};
for (const m of ar.matchAll(/^\s*([A-Z_]+):\s*'([^']*)'/gm)) {
  routeMap[m[1]] = m[2];
}

const navigatePaths = new Set();
for (const m of ga.matchAll(/action:\s*'(\/[^']+)'/g)) {
  navigatePaths.add(m[1]);
}
for (const m of ga.matchAll(/action:\s*ADMIN_ROUTES\.(\w+)/g)) {
  const key = m[1];
  if (!Object.hasOwn(routeMap, key)) {
    console.error(`❌ gnbQuickActions: 알 수 없는 ADMIN_ROUTES.${key}`);
    process.exit(1);
  }
  navigatePaths.add(routeMap[key]);
}

const appPaths = new Set();
for (const m of app.matchAll(/\bpath=["']([^"']+)["']/g)) {
  appPaths.add(m[1]);
}

const missing = [...navigatePaths].filter((p) => {
  const base = p.split('?')[0];
  return !appPaths.has(base);
});

if (missing.length > 0) {
  console.error('❌ 빠른 액션 navigate 경로가 App.js Route에 없습니다:');
  for (const p of missing) console.error('   ', p);
  process.exit(1);
}

console.log(`✅ 빠른 액션 navigate 경로 ${navigatePaths.size}개 모두 App.js에 존재합니다.`);
