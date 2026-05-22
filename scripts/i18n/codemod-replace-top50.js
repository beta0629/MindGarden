#!/usr/bin/env node
/**
 * i18n Phase 2.1b 1차 치환 codemod.
 *
 * common Top 50 + admin Top 50 한글 문자열을 `t('<ns>.<cat>.<slug>', '한글')` 형태로 치환한다.
 * 안전한 컨텍스트(JSX text children + 화이트리스트 attribute)만 변환하며, 테스트/스토리북/상수/주석/콘솔로그 등은 건너뛴다.
 *
 * 입력: scripts/i18n/reports/extracted-hangul-<timestamp>.json (최신)
 * 출력: frontend/src/** 내 .js/.jsx/.ts/.tsx 수정 + 통계 리포트 출력
 *
 * 사용:
 *   node scripts/i18n/codemod-replace-top50.js            (실제 적용)
 *   node scripts/i18n/codemod-replace-top50.js --dry-run  (적용 없이 통계만)
 *
 * @author Core Solution
 * @since 2026-05-22
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const FRONTEND_SRC = path.join(ROOT, 'frontend', 'src');
const REPORT_DIR = path.join(__dirname, 'reports');

const SAFE_ATTRIBUTES = new Set([
  'placeholder',
  'title',
  'alt',
  'aria-label',
  'aria-description',
  'tooltip',
  'label'
]);

const EXCLUDED_DIR_SEGMENTS = ['__tests__', '__mocks__', 'node_modules', '.next', 'build', 'dist'];
const EXCLUDED_FILE_SUFFIXES = ['.test.js', '.test.jsx', '.test.ts', '.test.tsx', '.spec.js', '.spec.jsx', '.spec.ts', '.spec.tsx', '.stories.js', '.stories.jsx', '.stories.ts', '.stories.tsx'];

// 1차 치환 대상에서 제외 (상수 export·유틸·스토어는 별도 라운드 — Phase 2.2+)
const EXCLUDED_TOP_DIRS = new Set(['constants', 'utils', 'store', 'hooks', 'contexts']);

function classifyNamespace(relPathFromFrontendSrc) {
  const normalized = relPathFromFrontendSrc.split(path.sep).join('/');
  if (normalized.startsWith('components/admin/')) return 'admin';
  if (normalized.startsWith('components/auth/') || normalized.startsWith('pages/auth/')) return 'auth';
  if (normalized.startsWith('components/client/')) return 'client';
  if (normalized.startsWith('components/wellness/') || normalized.startsWith('components/meditation/')) return 'wellness';
  if (normalized.startsWith('components/erp/') || normalized.startsWith('components/billing/') || normalized.startsWith('components/payment/')) return 'erp';
  if (normalized.startsWith('components/consultation/') || normalized.startsWith('components/clinical/') || normalized.startsWith('components/psych/')) return 'clinical';
  if (normalized.startsWith('components/consultant/')) return 'clinical';
  if (normalized.startsWith('components/dashboard/') || normalized.startsWith('components/settings/') || normalized.startsWith('components/statistics/')) return 'admin';
  if (normalized.startsWith('components/community/') || normalized.startsWith('components/academy/') || normalized.startsWith('components/shop/')) return 'client';
  if (normalized.startsWith('components/dashboard-v2/') || normalized.startsWith('components/tenant/') || normalized.startsWith('components/super-admin/') || normalized.startsWith('components/compliance/') || normalized.startsWith('components/ops/')) return 'admin';
  return 'common';
}

function shouldSkipFile(absPath) {
  const lower = absPath.toLowerCase();
  for (const suffix of EXCLUDED_FILE_SUFFIXES) if (lower.endsWith(suffix)) return true;
  for (const seg of EXCLUDED_DIR_SEGMENTS) if (lower.includes(`${path.sep}${seg}${path.sep}`)) return true;
  return false;
}

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    let stat;
    try { stat = fs.statSync(abs); } catch { continue; }
    if (stat.isDirectory()) {
      if (EXCLUDED_DIR_SEGMENTS.includes(name)) continue;
      walk(abs, out);
    } else if (stat.isFile()) {
      if (!/\.(js|jsx|ts|tsx)$/.test(name)) continue;
      if (shouldSkipFile(abs)) continue;
      out.push(abs);
    }
  }
}

function loadLatestReport() {
  const files = fs.readdirSync(REPORT_DIR)
    .filter((n) => /^extracted-hangul-\d{8}-\d{4}\.json$/.test(n))
    .sort();
  if (files.length === 0) throw new Error('No extraction reports found.');
  const latest = files[files.length - 1];
  return { name: latest, data: JSON.parse(fs.readFileSync(path.join(REPORT_DIR, latest), 'utf8')) };
}

function buildKeyMap(report) {
  const map = new Map();
  for (const ns of ['common', 'admin']) {
    for (const item of report.topByNamespace[ns] || []) {
      if (!map.has(item.text)) map.set(item.text, new Map());
      map.get(item.text).set(ns, item.suggestedKey);
    }
  }
  return map;
}

function resolveKeyForFile(text, fileNs, keyMap) {
  const nsMap = keyMap.get(text);
  if (!nsMap) return null;
  if (nsMap.has(fileNs)) return nsMap.get(fileNs);
  if (nsMap.has('common')) return nsMap.get('common');
  if (nsMap.has('admin')) return nsMap.get('admin');
  return null;
}

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ─ 컨텍스트 마스크 (주석·문자열·템플릿) ─
function buildContextMask(source) {
  const n = source.length;
  const mask = new Array(n).fill(' ');
  let i = 0;
  let inSingle = false, inDouble = false, inTpl = false;
  let inLineComment = false, inBlockComment = false;
  let braceDepthInTpl = 0;
  while (i < n) {
    const c = source[i];
    const c2 = source.slice(i, i + 2);
    if (inLineComment) { mask[i] = 'C'; if (c === '\n') inLineComment = false; i += 1; continue; }
    if (inBlockComment) { mask[i] = 'C'; if (c2 === '*/') { mask[i + 1] = 'C'; inBlockComment = false; i += 2; continue; } i += 1; continue; }
    if (inSingle) { mask[i] = 'S'; if (c === '\\') { if (i + 1 < n) mask[i + 1] = 'S'; i += 2; continue; } if (c === "'") inSingle = false; i += 1; continue; }
    if (inDouble) { mask[i] = 'S'; if (c === '\\') { if (i + 1 < n) mask[i + 1] = 'S'; i += 2; continue; } if (c === '"') inDouble = false; i += 1; continue; }
    if (inTpl) {
      if (braceDepthInTpl > 0) {
        if (c === '{') braceDepthInTpl += 1;
        else if (c === '}') braceDepthInTpl -= 1;
        i += 1; continue;
      }
      mask[i] = 'S';
      if (c === '\\') { if (i + 1 < n) mask[i + 1] = 'S'; i += 2; continue; }
      if (c2 === '${') { braceDepthInTpl = 1; mask[i + 1] = 'S'; i += 2; continue; }
      if (c === '`') inTpl = false;
      i += 1; continue;
    }
    if (c2 === '//') { inLineComment = true; mask[i] = 'C'; mask[i + 1] = 'C'; i += 2; continue; }
    if (c2 === '/*') { inBlockComment = true; mask[i] = 'C'; mask[i + 1] = 'C'; i += 2; continue; }
    if (c === "'") { inSingle = true; mask[i] = 'S'; i += 1; continue; }
    if (c === '"') { inDouble = true; mask[i] = 'S'; i += 1; continue; }
    if (c === '`') { inTpl = true; mask[i] = 'S'; i += 1; continue; }
    i += 1;
  }
  return mask;
}

function isInsideTCall(source, index) {
  const head = source.slice(Math.max(0, index - 800), index);
  if (/\bt\s*\(\s*$/.test(head)) return true;
  if (/\bt\s*\(\s*['"`][^'"`]*['"`]\s*,\s*$/.test(head)) return true;
  return false;
}

function isInsideConsoleOrThrow(source, index) {
  const head = source.slice(Math.max(0, index - 400), index);
  if (/\bconsole\s*\.\s*(log|error|warn|info|debug|trace)\s*\([^()]*$/.test(head)) return true;
  if (/\bthrow\s+new\s+Error\s*\([^()]*$/.test(head)) return true;
  return false;
}

// ─ Import 블록 끝 위치 찾기 (multi-line import 안전 처리) ─
function findImportBlockEndIndex(source, mask) {
  // 코드 영역에서 `import ... from ...;` 를 정규식으로 스캔하되, 멀티라인 허용
  // mask 를 이용해 코드 영역(공백) 만 매칭
  const re = /\bimport\b[\s\S]*?\bfrom\s*['"][^'"]+['"]\s*;?/g;
  let m;
  let lastEnd = -1;
  while ((m = re.exec(source)) !== null) {
    if (mask[m.index] !== ' ') continue; // 주석/문자열 내 import 키워드 가능 (드뭄)
    lastEnd = m.index + m[0].length;
  }
  // side effect import: `import './foo.css';`
  const sideRe = /\bimport\s+['"][^'"]+['"]\s*;?/g;
  while ((m = sideRe.exec(source)) !== null) {
    if (mask[m.index] !== ' ') continue;
    const end = m.index + m[0].length;
    if (end > lastEnd) lastEnd = end;
  }
  return lastEnd;
}

// ─ Top-level 함수/화살표 컴포넌트 본문 위치 탐지 ─
// 컴포넌트로 추정되는 선언 형태: PascalCase 이름 + 화살표/함수 본문
function findComponentBodies(source) {
  const bodies = [];
  const patterns = [
    // const|let|var|export const Name = (...args) => {
    /(?:^|[\n;}])\s*(?:export\s+(?:default\s+)?)?(?:const|let|var)\s+([A-Z][A-Za-z0-9_]*)\s*=\s*(?:React\.)?(?:memo|forwardRef|observer)?\s*\(?\s*(?:\([^)]*\)|[A-Za-z_$][A-Za-z0-9_$]*)\s*=>\s*\{/g,
    // function Name(...) {
    /(?:^|[\n;}])\s*(?:export\s+(?:default\s+)?)?function\s+([A-Z][A-Za-z0-9_]*)\s*\([^)]*\)\s*\{/g,
    // const Name = function (...) {
    /(?:^|[\n;}])\s*(?:export\s+(?:default\s+)?)?(?:const|let|var)\s+([A-Z][A-Za-z0-9_]*)\s*=\s*function\s*\*?\s*\([^)]*\)\s*\{/g,
    // export default function (...) {  -- anonymous default
    /(?:^|[\n;}])\s*export\s+default\s+function\s*\([^)]*\)\s*\{/g,
    // export default (...) => {
    /(?:^|[\n;}])\s*export\s+default\s*(?:\([^)]*\)|[A-Za-z_$][A-Za-z0-9_$]*)\s*=>\s*\{/g
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(source)) !== null) {
      const openBraceIdx = m.index + m[0].length - 1;
      bodies.push({ name: m[1] || '<default>', openBraceIdx });
    }
  }
  // Deduplicate by openBraceIdx
  const seen = new Set();
  const unique = bodies.filter((b) => { if (seen.has(b.openBraceIdx)) return false; seen.add(b.openBraceIdx); return true; });
  unique.sort((a, b) => a.openBraceIdx - b.openBraceIdx);
  return unique;
}

function findMatchingClose(source, openIdx) {
  let depth = 1;
  let i = openIdx + 1;
  const n = source.length;
  // Use a simple scan with string/comment awareness via a small state machine
  let inSingle = false, inDouble = false, inTpl = false;
  let tplBrace = 0;
  let inLineComment = false, inBlockComment = false;
  while (i < n && depth > 0) {
    const c = source[i];
    const c2 = source.slice(i, i + 2);
    if (inLineComment) { if (c === '\n') inLineComment = false; i += 1; continue; }
    if (inBlockComment) { if (c2 === '*/') { inBlockComment = false; i += 2; continue; } i += 1; continue; }
    if (inSingle) { if (c === '\\') { i += 2; continue; } if (c === "'") inSingle = false; i += 1; continue; }
    if (inDouble) { if (c === '\\') { i += 2; continue; } if (c === '"') inDouble = false; i += 1; continue; }
    if (inTpl) {
      if (tplBrace > 0) {
        if (c === '{') tplBrace += 1;
        else if (c === '}') tplBrace -= 1;
        i += 1; continue;
      }
      if (c === '\\') { i += 2; continue; }
      if (c2 === '${') { tplBrace = 1; i += 2; continue; }
      if (c === '`') inTpl = false;
      i += 1; continue;
    }
    if (c2 === '//') { inLineComment = true; i += 2; continue; }
    if (c2 === '/*') { inBlockComment = true; i += 2; continue; }
    if (c === "'") { inSingle = true; i += 1; continue; }
    if (c === '"') { inDouble = true; i += 1; continue; }
    if (c === '`') { inTpl = true; i += 1; continue; }
    if (c === '{') depth += 1;
    else if (c === '}') depth -= 1;
    i += 1;
  }
  return depth === 0 ? i - 1 : -1;
}

function replaceInFile(absPath, keyMap, opts) {
  const original = fs.readFileSync(absPath, 'utf8');
  const rel = path.relative(FRONTEND_SRC, absPath);
  const topDir = rel.split(path.sep)[0];
  if (EXCLUDED_TOP_DIRS.has(topDir)) return { skipped: true, reason: `excluded-dir:${topDir}` };

  const ns = classifyNamespace(rel);
  let source = original;
  let mask = buildContextMask(source);
  const edits = [];
  const texts = Array.from(keyMap.keys()).sort((a, b) => b.length - a.length);

  for (const text of texts) {
    const fullKey = resolveKeyForFile(text, ns, keyMap);
    if (!fullKey) continue;

    // A. JSX text children: `>...text...<` (text-only, possibly with leading/trailing whitespace)
    const jsxTextRe = new RegExp(`>(\\s*)${escapeRegex(text)}(\\s*)<`, 'g');
    let match;
    while ((match = jsxTextRe.exec(source)) !== null) {
      const startIdx = match.index + 1 + match[1].length;
      if (mask[startIdx] !== ' ') continue;
      if (isInsideTCall(source, startIdx)) continue;
      if (isInsideConsoleOrThrow(source, startIdx)) continue;
      const replacement = `>${match[1]}{t('${fullKey}', '${text.replace(/'/g, "\\'")}')}${match[2]}<`;
      edits.push({ start: match.index, end: match.index + match[0].length, replacement, kind: 'jsx-text', text, key: fullKey });
    }

    // B. attr="text"
    const attrAlt = Array.from(SAFE_ATTRIBUTES).map(escapeRegex).join('|');
    const attrDQRe = new RegExp(`\\b(${attrAlt})="${escapeRegex(text)}"`, 'g');
    while ((match = attrDQRe.exec(source)) !== null) {
      const startIdx = match.index;
      const textStart = startIdx + match[1].length + 2;
      if (mask[textStart] !== 'S') continue;
      if (isInsideTCall(source, startIdx)) continue;
      if (isInsideConsoleOrThrow(source, startIdx)) continue;
      const replacement = `${match[1]}={t('${fullKey}', '${text.replace(/'/g, "\\'")}')}`;
      edits.push({ start: startIdx, end: startIdx + match[0].length, replacement, kind: 'attr-dq', text, key: fullKey });
    }
    // C. attr='text'
    const attrSQRe = new RegExp(`\\b(${attrAlt})='${escapeRegex(text)}'`, 'g');
    while ((match = attrSQRe.exec(source)) !== null) {
      const startIdx = match.index;
      const textStart = startIdx + match[1].length + 2;
      if (mask[textStart] !== 'S') continue;
      if (isInsideTCall(source, startIdx)) continue;
      if (isInsideConsoleOrThrow(source, startIdx)) continue;
      const replacement = `${match[1]}={t('${fullKey}', '${text.replace(/'/g, "\\'")}')}`;
      edits.push({ start: startIdx, end: startIdx + match[0].length, replacement, kind: 'attr-sq', text, key: fullKey });
    }
    // D. attr={'text'} / attr={"text"}
    const attrBraceRe = new RegExp(`\\b(${attrAlt})=\\{\\s*(['"])${escapeRegex(text)}\\2\\s*\\}`, 'g');
    while ((match = attrBraceRe.exec(source)) !== null) {
      const startIdx = match.index;
      if (isInsideTCall(source, startIdx)) continue;
      if (isInsideConsoleOrThrow(source, startIdx)) continue;
      const replacement = `${match[1]}={t('${fullKey}', '${text.replace(/'/g, "\\'")}')}`;
      edits.push({ start: startIdx, end: startIdx + match[0].length, replacement, kind: 'attr-brace', text, key: fullKey });
    }
  }

  if (edits.length === 0) return { changed: false, edits: 0, ns };

  // Dedupe overlapping edits (sorted asc; skip later starting before earlier ended)
  edits.sort((a, b) => a.start - b.start);
  const accepted = [];
  let lastEnd = -1;
  for (const e of edits) { if (e.start < lastEnd) continue; accepted.push(e); lastEnd = e.end; }

  // Apply edits from end to start
  let out = source;
  for (let k = accepted.length - 1; k >= 0; k -= 1) {
    const e = accepted[k];
    out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
  }

  // ─ Import: ensure { useTranslation } from 'react-i18next' ─
  let importInserted = false;
  if (/from\s+['"]react-i18next['"]/.test(out)) {
    if (!/\buseTranslation\b/.test(out)) {
      out = out.replace(
        /import\s*\{([^}]*)\}\s*from\s*(['"])react-i18next\2/,
        (m0, inside, q) => `import { ${inside.trim().replace(/,?\s*$/, '')}, useTranslation } from ${q}react-i18next${q}`
      );
      importInserted = true;
    }
  } else {
    // Find end of import block (after last `from '...';`)
    const newMask = buildContextMask(out);
    const importEnd = findImportBlockEndIndex(out, newMask);
    const importLine = "import { useTranslation } from 'react-i18next';\n";
    if (importEnd > 0) {
      // Insert after the newline following importEnd
      let insertAt = importEnd;
      while (insertAt < out.length && out[insertAt] !== '\n') insertAt += 1;
      if (out[insertAt] === '\n') insertAt += 1;
      out = out.slice(0, insertAt) + importLine + out.slice(insertAt);
    } else {
      out = importLine + out;
    }
    importInserted = true;
  }

  // ─ Hook injection: for each function component body that contains our new t() calls,
  //   ensure `const { t } = useTranslation();` is present at body start ─
  const hookInjected = injectHookCalls(out, getInjectedKeyPrefix());
  let final = hookInjected.source;

  // ─ 안전성 검증: t() 호출이 있는데 useTranslation() 훅이 없으면 롤백 (runtime error 방지) ─
  const hasOurT = getInjectedKeyPrefix().test(final);
  const hasHook = /\buseTranslation\s*\(/.test(final);
  if (hasOurT && !hasHook) {
    // 화살표 함수 implicit return (`=> (`) 형태 등 훅 주입 불가 케이스 — 해당 파일은 다음 라운드로 미룬다
    return { changed: false, edits: 0, ns, skipped: true, reason: 'hook-injection-failed' };
  }

  if (final === original) return { changed: false, edits: 0, ns };
  fs.writeFileSync(absPath, final, 'utf8');
  return {
    changed: true,
    edits: accepted.length,
    replacements: accepted.map((e) => ({ kind: e.kind, text: e.text, key: e.key })),
    importInserted,
    hookInjected: hookInjected.injected,
    ns
  };
}

function getInjectedKeyPrefix() {
  return /t\(\s*'(common|admin|client|clinical|erp|auth|wellness)\.[A-Za-z0-9_]+\.[A-Za-z0-9_]+'\s*,/;
}

function injectHookCalls(source, tCallRegex) {
  const bodies = findComponentBodies(source);
  let injected = 0;
  let result = source;
  // Process from end so insertions don't shift earlier offsets
  const sorted = [...bodies].sort((a, b) => b.openBraceIdx - a.openBraceIdx);
  for (const b of sorted) {
    const closeIdx = findMatchingClose(result, b.openBraceIdx);
    if (closeIdx < 0) continue;
    const body = result.slice(b.openBraceIdx + 1, closeIdx);
    if (!tCallRegex.test(body)) continue;
    if (/\buseTranslation\s*\(/.test(body)) continue;
    // Compute indent (from first non-empty line of body)
    const firstNL = body.indexOf('\n');
    let indent = '  ';
    if (firstNL >= 0) {
      const rest = body.slice(firstNL + 1);
      const im = rest.match(/^([ \t]+)\S/);
      if (im) indent = im[1];
    }
    const inject = `\n${indent}const { t } = useTranslation();`;
    result = result.slice(0, b.openBraceIdx + 1) + inject + result.slice(b.openBraceIdx + 1);
    injected += 1;
  }
  return { source: result, injected };
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
  const targetArg = args.find((a) => a.startsWith('--target='));
  const target = targetArg ? targetArg.split('=')[1] : null;

  const { name: reportName, data: report } = loadLatestReport();
  console.log(`[codemod] 사용 리포트: ${reportName}`);
  console.log(`[codemod] dryRun=${dryRun}${target ? ` target=${target}` : ''}`);
  const keyMap = buildKeyMap(report);
  console.log(`[codemod] Top50 매핑: ${keyMap.size} unique texts`);

  let files;
  if (target) {
    files = [path.resolve(ROOT, target)];
  } else {
    files = [];
    walk(FRONTEND_SRC, files);
    files.sort();
  }

  let processed = 0;
  let changedFiles = 0;
  let totalEdits = 0;
  let importInsertedCount = 0;
  let hookInjectedCount = 0;
  let missingHookFiles = [];
  const skippedReasons = new Map();
  const byKind = new Map();

  for (const f of files) {
    if (processed >= limit) break;
    let result;
    try {
      result = replaceInFile(f, keyMap, { dryRun });
    } catch (err) {
      console.error(`[codemod] FAILED ${f}: ${err.stack || err.message}`);
      continue;
    }
    processed += 1;
    if (result.skipped) {
      skippedReasons.set(result.reason, (skippedReasons.get(result.reason) || 0) + 1);
      continue;
    }
    if (result.changed) {
      changedFiles += 1;
      totalEdits += result.edits;
      if (result.importInserted) importInsertedCount += 1;
      hookInjectedCount += result.hookInjected || 0;
      for (const r of (result.replacements || [])) byKind.set(r.kind, (byKind.get(r.kind) || 0) + 1);
      // Sanity post-check: file should now have at least one useTranslation() call and at least one t( prefix call
      const newContent = fs.readFileSync(f, 'utf8');
      const hasHook = /\buseTranslation\s*\(/.test(newContent);
      const hasOurT = getInjectedKeyPrefix().test(newContent);
      if (hasOurT && !hasHook) missingHookFiles.push(f);
    }
  }

  console.log('\n=== 결과 ===');
  console.log(`처리 파일 수      : ${processed}`);
  console.log(`변경 파일 수      : ${changedFiles}`);
  console.log(`총 치환 건수      : ${totalEdits}`);
  console.log(`import 추가 파일  : ${importInsertedCount}`);
  console.log(`useTranslation 훅 추가: ${hookInjectedCount}`);
  console.log('패턴별 치환:');
  for (const [k, v] of byKind.entries()) console.log(`  - ${k}: ${v}`);
  console.log('스킵 사유별 파일:');
  for (const [k, v] of skippedReasons.entries()) console.log(`  - ${k}: ${v}`);
  if (missingHookFiles.length > 0) {
    console.log(`\n[WARN] t() 호출은 있지만 useTranslation() 훅 미주입 파일: ${missingHookFiles.length}건`);
    for (const f of missingHookFiles.slice(0, 30)) console.log(`  - ${path.relative(ROOT, f)}`);
    if (missingHookFiles.length > 30) console.log(`  ... 외 ${missingHookFiles.length - 30}건`);
  }
}

main();
