#!/usr/bin/env node
/**
 * GNB 빠른 액션(navigate)의 label이 LNB 폴백(menuItems.js) 라벨과
 * 동일 경로 기준으로 허용 가능한 수준인지 검사한다.
 *
 * 사용: node scripts/verify-quick-action-labels.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const ga = read('src/constants/gnbQuickActions.js');
const ar = read('src/constants/adminRoutes.js');
const mi = read('src/components/dashboard-v2/constants/menuItems.js');

const routeMap = {};
for (const m of ar.matchAll(/^\s*([A-Z_]+):\s*'([^']*)'/gm)) {
  routeMap[m[1]] = m[2];
}

const resolvePath = (literalPath, adminRouteKey) => {
  if (literalPath) return literalPath;
  if (adminRouteKey) return routeMap[adminRouteKey] || null;
  return null;
};

const quickActionPairs = [];
const qaRe = /label:\s*'([^']+)'\s*,[\s\S]*?action:\s*(?:'([^']+)'|ADMIN_ROUTES\.(\w+))\s*,[\s\S]*?type:\s*'navigate'/g;
for (const m of ga.matchAll(qaRe)) {
  const label = m[1];
  const actionPath = resolvePath(m[2], m[3]);
  if (actionPath && actionPath.startsWith('/')) {
    quickActionPairs.push({ path: actionPath, label });
  }
}

const menuLabelMap = new Map();
const menuRe = /to:\s*(?:'([^']+)'|ADMIN_ROUTES\.(\w+))[^}]*?label:\s*'([^']+)'/g;
for (const m of mi.matchAll(menuRe)) {
  const p = resolvePath(m[1], m[2]);
  const label = m[3];
  if (!p || !p.startsWith('/')) continue;
  if (!menuLabelMap.has(p)) menuLabelMap.set(p, new Set());
  menuLabelMap.get(p).add(label);
}

const canon = (s) =>
  String(s || '')
    .replace(/[·ㆍ/()\-]/g, '')
    .replace(/\s+/g, '')
    .replace(/(보기|확인)$/g, '')
    .replace(/센터$/g, '')
    .toLowerCase();

// 같은 경로에서 의미상 허용되는 표현 차이
const labelAliasesByPath = {
  '/admin/dashboard': ['대시보드 보기', '대시보드'],
  '/admin/integrated-schedule': ['통합 스케줄', '통합 스케줄 센터'],
  '/client/schedule': ['내 일정', '스케줄'],
  '/consultant/schedule': ['일정 확인', '일정 관리', '전체 스케줄'],
  '/consultant/clients': ['내담자 관리', '내담자 조회', '내 내담자 목록'],
  '/consultant/consultation-records': ['상담일지 작성', '상담 기록', '상담 일지 관리']
};

let failCount = 0;
for (const { path: p, label } of quickActionPairs) {
  const lnbLabels = menuLabelMap.get(p);
  if (!lnbLabels || lnbLabels.size === 0) {
    // 해당 경로가 LNB에 없는 경우는 경로 검증 스크립트에서 이미 확인하므로 여기서는 skip
    continue;
  }

  const allowed = new Set([label, ...(labelAliasesByPath[p] || [])].map(canon));
  const matched = [...lnbLabels].some((v) => allowed.has(canon(v)));
  if (!matched) {
    failCount += 1;
    console.error(
      `❌ 라벨 불일치: path=${p}, quickAction='${label}', lnb=[${[...lnbLabels].join(', ')}]`
    );
  }
}

if (failCount > 0) {
  console.error(`❌ 빠른 액션 라벨 정합 실패: ${failCount}건`);
  process.exit(1);
}

console.log(`✅ 빠른 액션 navigate 라벨 ${quickActionPairs.length}건 정합 통과`);
