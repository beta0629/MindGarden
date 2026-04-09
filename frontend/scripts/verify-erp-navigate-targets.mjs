#!/usr/bin/env node
/**
 * App.js 내 <Navigate to="..."> 등에서 /erp 로 시작하는 절대 경로가
 * 동일 파일의 Route path 집합에 존재하는지 검사한다.
 * verify-quick-action-routes.mjs 와 동일하게 path="..." 만 수집하고,
 * 중첩 라우트의 상대 path 는 /admin/ 접두 규칙만 보강한다.
 *
 * 사용: node scripts/verify-erp-navigate-targets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const appPath = path.join(root, 'src/App.js');
const app = fs.readFileSync(appPath, 'utf8');

/** @param {string} target */
function pathnameOnly(target) {
  return target.split('?')[0].split('#')[0];
}

/**
 * verify-quick-action-routes.mjs 와 동일: path="..." / path='...' 만 수집.
 * @param {string} appText
 * @returns {Set<string>}
 */
function collectRoutePaths(appText) {
  const appPaths = new Set();
  for (const m of appText.matchAll(/\bpath=["']([^"']+)["']/g)) {
    const p = m[1];
    appPaths.add(p);
    if (!p.startsWith('/')) {
      appPaths.add(`/admin/${p}`);
    }
  }
  return appPaths;
}

/**
 * @param {string} tagSlice opening tag from "<Navigate" through "/>" or ">"
 * @returns {{ kind: 'literal', value: string } | { kind: 'skip', expr: string } | { kind: 'none' }}
 */
function parseNavigateTo(tagSlice) {
  const mQuote = /\bto=["']([^"']*)["']/.exec(tagSlice);
  if (mQuote) {
    return { kind: 'literal', value: mQuote[1] };
  }
  const mJsString = /\bto=\{\s*["']([^"']*)["']\s*\}/.exec(tagSlice);
  if (mJsString) {
    return { kind: 'literal', value: mJsString[1] };
  }
  const mTpl = /\bto=\{\s*`([^`]*)`\s*\}/.exec(tagSlice);
  if (mTpl) {
    const raw = mTpl[1];
    if (raw.includes('${')) {
      return { kind: 'skip', expr: `to={\`${raw.slice(0, 80)}${raw.length > 80 ? '…' : ''}\`}` };
    }
    return { kind: 'literal', value: raw };
  }
  if (/\bto=\{/.test(tagSlice)) {
    const inner = /\bto=\{\s*([\s\S]*?)\s*\}/.exec(tagSlice);
    const expr = inner ? inner[1].replace(/\s+/g, ' ').trim().slice(0, 120) : '(non-literal to)';
    return { kind: 'skip', expr: expr || '(non-literal to)' };
  }
  return { kind: 'none' };
}

/**
 * @param {string} source
 * @param {(tag: string, index: number) => void} fn
 */
function forEachNavigateOpeningTag(source, fn) {
  const re = /<Navigate\b/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const start = m.index;
    const slice = source.slice(start, start + 2500);
    const selfClose = slice.indexOf('/>');
    const angle = slice.indexOf('>');
    let endRel;
    if (selfClose >= 0 && (angle < 0 || selfClose < angle)) {
      endRel = selfClose + 2;
    } else if (angle >= 0) {
      endRel = angle + 1;
    } else {
      continue;
    }
    fn(slice.slice(0, endRel), start);
  }
}

const routePaths = collectRoutePaths(app);
const erpNavigatePathnames = new Set();
const missing = [];
const skipLines = [];

forEachNavigateOpeningTag(app, (tag) => {
  const parsed = parseNavigateTo(tag);
  if (parsed.kind === 'none') {
    return;
  }
  if (parsed.kind === 'skip') {
    skipLines.push(`⏭️  Navigate 동적 to 스킵: ${parsed.expr}`);
    return;
  }
  const value = parsed.value;
  if (!value.startsWith('/erp')) {
    return;
  }
  const pn = pathnameOnly(value);
  if (erpNavigatePathnames.has(pn)) {
    return;
  }
  erpNavigatePathnames.add(pn);
  if (!routePaths.has(pn)) {
    missing.push(pn);
  }
});

for (const line of skipLines) {
  console.log(line);
}

if (missing.length > 0) {
  console.error('❌ App.js Navigate 대상(/erp…)이 Route path 집합에 없습니다:');
  for (const p of missing) {
    console.error('   ', p);
  }
  process.exit(1);
}

console.log(
  `✅ App.js ERP Navigate 절대 경로 ${erpNavigatePathnames.size}건 — Route path 와 정합합니다.`
);
