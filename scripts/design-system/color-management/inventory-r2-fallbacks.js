#!/usr/bin/env node

/**
 * R-2 폴백 인벤토리 도구 — D8 PR-B 단계 1
 *
 * `var(--token, #hex)` 형태의 R-2 폴백 패턴을 frontend/src 전 영역에서 수집하고
 * mg-* (1단) / mg-v2-* (다단) / 기타 세 그룹으로 분류한다.
 *
 * 분류 기준 (D8 §2.3 + §4 C3 결정):
 *   - mg-*  : 토큰명이 `--mg-` 로 시작하고 `--mg-v2-` 로 시작하지 않음 → D8 처리 범위
 *   - mg-v2-*: 토큰명이 `--mg-v2-` 로 시작 → D9 이월 (본 PR 대상 외)
 *   - other  : 그 외 (cs-*, color-*, theme-* 등) → 본 PR 대상 외, 별도 검토
 *
 * 자동 대체 가능 여부 판정:
 *   - COLOR_MAPPING (convert-hardcoded-colors.js SSOT) 에 해당 hex 가 존재하면
 *     auto-replaceable (단일 canonical 토큰으로 대체 가능)
 *   - 없으면 manual-review (의미 분류 보류, P1 디자이너 검토 필요)
 *
 * 출력:
 *   - JSON 리포트 (reports/r2-inventory-{YYYYMMDD-HHmm}.json)
 *   - 콘솔 요약 (그룹별 카운트 + Top N 분포 + 대체 매핑 후보)
 *
 * 사용법:
 *   node scripts/design-system/color-management/inventory-r2-fallbacks.js [--top N] [--report]
 *
 * @author MindGarden Team
 * @version 1.0.0 (D8 PR-B 단계 1)
 * @since 2026-05-23
 */

'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const REPO_ROOT = path.resolve(__dirname, '../../../');
const REPORTS_DIR = path.resolve(__dirname, 'reports');
const CODEMOD_PATH = path.resolve(__dirname, 'convert-hardcoded-colors.js');
const DEFAULT_TOP = 30;

// HARD_EXCLUDE / GLOB_EXCLUDE 는 count-hardcoded-colors.js 와 동일 (codemod SSOT 차용)
const HARD_EXCLUDE_PATTERNS = [
  /\bfrontend\/src\/styles\/unified-design-tokens\.css$/,
  /\bfrontend\/src\/styles\/dashboard-tokens-extension\.css$/,
  /\bfrontend\/src\/styles\/responsive-layout-tokens\.css$/,
  /\bfrontend\/src\/styles\/mindgarden-design-system\.css$/,
  /\bfrontend\/src\/styles\/00-core\/_variables\.css$/,
  /\bfrontend\/src\/styles\/00-core\/_component-variables\.css$/,
  /\bfrontend\/src\/styles\/common\/variables\.css$/,
  /\bfrontend\/src\/constants\/css-variables\.js$/,
  /(?:^|\/)[^/]*tokens[^/]*\.css$/i,
  /(?:^|\/)[^/]*variables[^/]*\.css$/i,
  /(?:^|\/)[^/]*design-system[^/]*\.css$/i,
  /\bfrontend\/src\/styles\/tokens\//,
  /\bfrontend\/src\/styles\/themes\//,
  /\bfrontend\/src\/tokens\//,
  /\bfrontend\/src\/themes\//,
  /(?:^|\/)tokens\//,
  /(?:^|\/)themes\//,
  /\/__tests__\//,
  /\.test\.(js|jsx|ts|tsx)$/,
  /\.spec\.(js|jsx|ts|tsx)$/,
  /\.stories\.(js|jsx|ts|tsx|mdx)$/
];

const GLOB_EXCLUDE = [
  '**/node_modules/**',
  '**/build/**',
  '**/dist/**',
  '**/.git/**',
  '**/coverage/**',
  '**/*.min.js',
  '**/*.min.css'
];

// R-2 폴백 패턴: 토큰명 + hex 추출 (캡처 그룹 사용)
const VAR_FALLBACK_PATTERN = /var\s*\(\s*(--[\w-]+)\s*,\s*(#[0-9a-fA-F]{3,8})(?![0-9a-fA-F])\s*\)/g;

function isHardExcluded(relPath) {
  return HARD_EXCLUDE_PATTERNS.some(rx => rx.test(relPath));
}

function loadCodemodMappings() {
  const src = fs.readFileSync(CODEMOD_PATH, 'utf8');
  const hexMap = new Map();
  const hexBlock = src.match(/const COLOR_MAPPING\s*=\s*\{([\s\S]*?)\n\};/);
  if (hexBlock) {
    const lineRegex = /'(#[0-9a-fA-F]{3,8})'\s*:\s*'([^']+)'/g;
    let m;
    while ((m = lineRegex.exec(hexBlock[1])) !== null) {
      hexMap.set(m[1].toLowerCase(), m[2]);
    }
  }
  return hexMap;
}

function classifyToken(tokenName) {
  if (/^--mg-v2-/.test(tokenName)) return 'mg-v2';
  if (/^--mg-/.test(tokenName)) return 'mg';
  return 'other';
}

function findFiles() {
  const exts = ['css', 'scss', 'js', 'jsx', 'ts', 'tsx'];
  const base = 'frontend/src';
  let all = [];
  for (const ext of exts) {
    const pattern = `${base}/**/*.${ext}`;
    const files = glob.sync(pattern, {
      ignore: GLOB_EXCLUDE,
      cwd: REPO_ROOT
    });
    all = all.concat(files);
  }
  return Array.from(new Set(all)).filter(f => !isHardExcluded(f)).sort();
}

function parseArgs(argv) {
  const opts = { top: DEFAULT_TOP, report: false, reportFile: null, jsonOnly: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--top' && argv[i + 1]) {
      opts.top = parseInt(argv[++i], 10) || DEFAULT_TOP;
    } else if (arg === '--report') {
      opts.report = true;
    } else if (arg === '--report-file' && argv[i + 1]) {
      opts.report = true;
      opts.reportFile = argv[++i];
    } else if (arg === '--json' || arg === '--json-only') {
      opts.jsonOnly = true;
    }
  }
  return opts;
}

function timestampForFile() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function main() {
  const opts = parseArgs(process.argv);
  const hexMap = loadCodemodMappings();
  const files = findFiles();

  // 그룹별 집계 + 매핑별 분포 + 파일별 분포
  const groups = {
    mg: { total: 0, byHex: new Map(), byToken: new Map(), byFile: new Map(), occurrences: [], autoReplaceable: 0, manualReview: 0, byTokenHexPair: new Map() },
    'mg-v2': { total: 0, byHex: new Map(), byToken: new Map(), byFile: new Map(), occurrences: [], autoReplaceable: 0, manualReview: 0, byTokenHexPair: new Map() },
    other: { total: 0, byHex: new Map(), byToken: new Map(), byFile: new Map(), occurrences: [], autoReplaceable: 0, manualReview: 0, byTokenHexPair: new Map() }
  };

  for (const relPath of files) {
    const absPath = path.resolve(REPO_ROOT, relPath);
    let content;
    try {
      content = fs.readFileSync(absPath, 'utf8');
    } catch (_) {
      continue;
    }
    let match;
    VAR_FALLBACK_PATTERN.lastIndex = 0;
    while ((match = VAR_FALLBACK_PATTERN.exec(content)) !== null) {
      const tokenName = match[1];
      const hex = match[2].toLowerCase();
      const group = classifyToken(tokenName);
      const bucket = groups[group];
      bucket.total++;
      bucket.byHex.set(hex, (bucket.byHex.get(hex) || 0) + 1);
      bucket.byToken.set(tokenName, (bucket.byToken.get(tokenName) || 0) + 1);
      bucket.byFile.set(relPath, (bucket.byFile.get(relPath) || 0) + 1);

      const pairKey = `${tokenName}|${hex}`;
      const pairBucket = bucket.byTokenHexPair.get(pairKey) || { tokenName, hex, count: 0, canonical: hexMap.get(hex) || null, files: new Set() };
      pairBucket.count++;
      pairBucket.files.add(relPath);
      bucket.byTokenHexPair.set(pairKey, pairBucket);

      if (hexMap.has(hex)) {
        bucket.autoReplaceable++;
      } else {
        bucket.manualReview++;
      }
    }
  }

  // 직렬화용 변환 (Set/Map → 일반 객체)
  const serialize = (group) => {
    const sortedPairs = Array.from(group.byTokenHexPair.values())
      .sort((a, b) => b.count - a.count)
      .map(p => ({
        tokenName: p.tokenName,
        hex: p.hex,
        count: p.count,
        canonical: p.canonical,
        replaceable: !!p.canonical,
        fileCount: p.files.size
      }));
    return {
      total: group.total,
      autoReplaceable: group.autoReplaceable,
      manualReview: group.manualReview,
      uniqueHexCount: group.byHex.size,
      uniqueTokenCount: group.byToken.size,
      uniquePairCount: group.byTokenHexPair.size,
      topHex: Array.from(group.byHex.entries()).sort((a, b) => b[1] - a[1]).slice(0, opts.top).map(([hex, count]) => ({ hex, count, canonical: hexMap.get(hex) || null })),
      topTokens: Array.from(group.byToken.entries()).sort((a, b) => b[1] - a[1]).slice(0, opts.top).map(([token, count]) => ({ token, count })),
      topFiles: Array.from(group.byFile.entries()).sort((a, b) => b[1] - a[1]).slice(0, opts.top).map(([file, count]) => ({ file, count })),
      pairs: sortedPairs
    };
  };

  const report = {
    generatedAt: new Date().toISOString(),
    schema: 'r2-fallback-inventory@1',
    summary: {
      filesScanned: files.length,
      totalFallbacks: groups.mg.total + groups['mg-v2'].total + groups.other.total,
      mgTotal: groups.mg.total,
      mgV2Total: groups['mg-v2'].total,
      otherTotal: groups.other.total
    },
    groups: {
      mg: serialize(groups.mg),
      'mg-v2': serialize(groups['mg-v2']),
      other: serialize(groups.other)
    },
    codemodMappingCount: hexMap.size
  };

  if (opts.jsonOnly) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } else {
    console.log('');
    console.log('🛡️  R-2 폴백 인벤토리 — D8 PR-B 단계 1');
    console.log('='.repeat(60));
    console.log(`생성 시각          : ${report.generatedAt}`);
    console.log(`스캔 파일          : ${report.summary.filesScanned}개`);
    console.log(`전체 R-2 폴백      : ${report.summary.totalFallbacks}건`);
    console.log('');
    console.log('📊 그룹별 분포');
    console.log('-'.repeat(60));
    console.log(`  mg-*   (D8 처리 범위)    : ${groups.mg.total}건 (auto ${groups.mg.autoReplaceable} / manual ${groups.mg.manualReview})`);
    console.log(`  mg-v2-* (D9 이월)         : ${groups['mg-v2'].total}건 (auto ${groups['mg-v2'].autoReplaceable} / manual ${groups['mg-v2'].manualReview})`);
    console.log(`  other                     : ${groups.other.total}건 (auto ${groups.other.autoReplaceable} / manual ${groups.other.manualReview})`);
    console.log('');
    console.log(`🎯 mg-* Top ${Math.min(opts.top, groups.mg.uniqueHexCount)} hex (D8 대상)`);
    console.log('-'.repeat(60));
    for (const item of report.groups.mg.topHex) {
      const target = item.canonical || '(매핑 없음 — 검토)';
      console.log(`  ${item.hex.padEnd(10)} ${String(item.count).padStart(3)}건  → ${target}`);
    }
    console.log('');
    console.log(`🎯 mg-* Top ${Math.min(opts.top, groups.mg.uniqueTokenCount)} 토큰 (D8 대상)`);
    console.log('-'.repeat(60));
    for (const item of report.groups.mg.topTokens) {
      console.log(`  ${item.token.padEnd(50)} ${item.count}건`);
    }
    console.log('');
    console.log(`📦 mg-* (token, hex) 쌍 분포 — 상위 ${Math.min(opts.top, report.groups.mg.uniquePairCount)}건`);
    console.log('-'.repeat(60));
    for (const p of report.groups.mg.pairs.slice(0, opts.top)) {
      const tag = p.replaceable ? '✅' : '⚠️ ';
      const target = p.canonical || '(매핑 없음)';
      console.log(`  ${tag} ${p.tokenName.padEnd(45)} ${p.hex.padEnd(10)} ${String(p.count).padStart(3)}건  → ${target}`);
    }
    console.log('');
    console.log(`📦 mg-v2-* Top ${Math.min(opts.top, groups['mg-v2'].uniqueTokenCount)} 토큰 (D9 이월)`);
    console.log('-'.repeat(60));
    for (const item of report.groups['mg-v2'].topTokens) {
      console.log(`  ${item.token.padEnd(50)} ${item.count}건`);
    }
    console.log('');
    process.stdout.write(JSON.stringify(report.summary, null, 2) + '\n');
  }

  if (opts.report) {
    let outPath;
    if (opts.reportFile) {
      outPath = path.resolve(process.cwd(), opts.reportFile);
    } else {
      if (!fs.existsSync(REPORTS_DIR)) {
        fs.mkdirSync(REPORTS_DIR, { recursive: true });
      }
      outPath = path.join(REPORTS_DIR, `r2-inventory-${timestampForFile()}.json`);
    }
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
    console.error(`📄 리포트 저장: ${path.relative(REPO_ROOT, outPath)}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { classifyToken, VAR_FALLBACK_PATTERN, HARD_EXCLUDE_PATTERNS };
