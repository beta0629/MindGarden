#!/usr/bin/env node

/**
 * 하드코딩된 색상값 카운트 도구 — 3 metric SSOT
 *
 * D7-2 인프라 (D6 §8 운영 게이트 metric / D7-1 §7 카운트 측정 / D7-2 합의서 §2.5)
 *
 * 본 스크립트는 frontend/src 전 영역에서 하드코딩된 hex 색상을 측정하고
 * 3가지 metric 을 동시에 출력하여 측정 불일치를 해소한다.
 *
 *   1) canonical (D6 §8 운영 게이트 metric)
 *      - convert-hardcoded-colors.js 의 HARD_EXCLUDE 영역 일관 차감
 *      - R-2 폴백 (`var(--token, #hex)`) 보호 차감
 *      - 주석 (`//`, `/* *\/`) 내부 hex 차감
 *      - D7-1 적용 후 codemod canonical 보고 (residualHexCounts 합계 = 606) 와 정합
 *
 *   2) withR2 (R-2 보호 미정착 시점 추적용)
 *      - canonical + R-2 폴백 보호 hex (codemod 보호로 잔존하는 of-design hex)
 *      - D7-1 적용 후 = canonical + 343 (D6 §6 R-2 폴백 343건)
 *
 *   3) rawLine (CI/BI 보호 시스템 호환 metric)
 *      - .github/workflows/ci-bi-protection.yml 의 grep 라인 카운트와 동일 동작
 *      - HARD_EXCLUDE 미적용 (CI/BI 와 정합 우선) — 토큰 정의 파일 포함, R-2 폴백 포함, 주석 포함
 *      - CSS HEX (#fff/#ffffff/#000/#000000 4종 제외) + JS `color.*['\"]#hex['\"]` 라인 합산
 *
 * HARD_EXCLUDE 패턴은 `convert-hardcoded-colors.js` 를 SSOT 로 차용한다.
 * 매핑이 늘어나거나 보호 영역이 변경되면 반드시 양쪽을 동시에 갱신해야 한다.
 *
 * 사용법:
 *   node scripts/design-system/color-management/count-hardcoded-colors.js [옵션]
 *
 * 옵션:
 *   --json, --json-only       JSON 만 출력 (사람 친화 표 생략)
 *   --report                  scripts/design-system/color-management/reports/
 *                             count-{YYYYMMDD-HHmm}.json 으로 리포트 저장
 *   --report-file <path>      지정 경로로 리포트 저장
 *   --top <N>                 상위 N 개 hex 출력 (기본 20)
 *   --detail                  파일별 분포 포함
 *   --help, -h                도움말
 *
 * @author MindGarden Team
 * @version 1.0.0 (D7-2 P2.5 인프라)
 * @since 2026-05-22
 */

'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const REPO_ROOT = path.resolve(__dirname, '../../../');
const REPORTS_DIR = path.resolve(__dirname, 'reports');
const CODEMOD_PATH = path.resolve(__dirname, 'convert-hardcoded-colors.js');
const DEFAULT_TOP = 20;

// ── HARD_EXCLUDE 파일 패턴 (convert-hardcoded-colors.js SSOT 차용) ──────────
// codemod 와 동일한 보호 영역을 유지한다. 본 스크립트 단독 변경 금지 —
// codemod 의 HARD_EXCLUDE 가 갱신되면 본 영역도 함께 갱신해야 한다.
const HARD_EXCLUDE_PATTERNS = [
  // 명시적 토큰 정의 파일 (T1 2차 §6.2 되돌린 7개 파일)
  /\bfrontend\/src\/styles\/unified-design-tokens\.css$/,
  /\bfrontend\/src\/styles\/dashboard-tokens-extension\.css$/,
  /\bfrontend\/src\/styles\/responsive-layout-tokens\.css$/,
  /\bfrontend\/src\/styles\/mindgarden-design-system\.css$/,
  /\bfrontend\/src\/styles\/00-core\/_variables\.css$/,
  /\bfrontend\/src\/styles\/00-core\/_component-variables\.css$/,
  /\bfrontend\/src\/styles\/common\/variables\.css$/,
  /\bfrontend\/src\/constants\/css-variables\.js$/,

  // 일반 패턴 (신규 토큰/변수/디자인시스템 파일 자동 보호)
  /(?:^|\/)[^/]*tokens[^/]*\.css$/i,
  /(?:^|\/)[^/]*variables[^/]*\.css$/i,
  /(?:^|\/)[^/]*design-system[^/]*\.css$/i,

  // 디렉터리 단위 보호 영역
  /\bfrontend\/src\/styles\/tokens\//,
  /\bfrontend\/src\/styles\/themes\//,
  /\bfrontend\/src\/tokens\//,
  /\bfrontend\/src\/themes\//,
  /(?:^|\/)tokens\//,
  /(?:^|\/)themes\//,

  // 테스트·스토리북
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

// ── R-2 폴백 보호 패턴 (convert-hardcoded-colors.js 와 동일) ────────────────
// `var(--token, #hex)` 형태의 폴백 위치에 있는 hex 는 codemod 가 변환하지 않으므로
// canonical 카운트에서도 제외해야 한다. withR2 metric 에서는 별도 카운트로 합산.
const VAR_FALLBACK_HEX_PATTERN = /var\s*\(\s*--[\w-]+\s*,\s*#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])\s*\)/g;

// 잔존 hex 매칭 (3·4·6·8 자리, 앞뒤 hex 문자 없음 가드)
// codemod 의 residualHexRegex 와 동일 동작.
const RESIDUAL_HEX_PATTERN = /#[0-9a-fA-F]+(?![0-9a-fA-F])/g;

// ── codemod 매핑 추출 (convert-hardcoded-colors.js SSOT) ───────────────────
// canonical metric 은 codemod 의 residualHexCounts (D7-1 적용 후 606) 와 정확히 정합해야 한다.
// codemod 는 HEX/RGB 매핑을 적용한 _후_ 잔존 hex 를 카운트하므로,
// 본 스크립트도 동일 매핑·동일 적용 순서를 시뮬레이션한 뒤 잔존을 측정한다.
// 매핑 텍스트 파싱 방식은 check-token-ssot.js 의 extractMappingTokens 와 동일 패턴.
function loadCodemodMappings() {
  if (!fs.existsSync(CODEMOD_PATH)) {
    throw new Error(`codemod SSOT 누락: ${CODEMOD_PATH}`);
  }
  const src = fs.readFileSync(CODEMOD_PATH, 'utf8');
  const hexMap = new Map();
  const rgbMap = new Map();

  const hexBlock = src.match(/const COLOR_MAPPING\s*=\s*\{([\s\S]*?)\n\};/);
  if (hexBlock) {
    const lineRegex = /'(#[0-9a-fA-F]{3,8})'\s*:\s*'([^']+)'/g;
    let m;
    while ((m = lineRegex.exec(hexBlock[1])) !== null) {
      hexMap.set(m[1].toLowerCase(), m[2]);
    }
  }

  const rgbBlock = src.match(/const RGB_MAPPING\s*=\s*\{([\s\S]*?)\n\};/);
  if (rgbBlock) {
    const lineRegex = /'((?:rgb|rgba)\s*\([^']+\))'\s*:\s*'([^']+)'/g;
    let m;
    while ((m = lineRegex.exec(rgbBlock[1])) !== null) {
      rgbMap.set(m[1], m[2]);
    }
  }

  return { hexMap, rgbMap };
}

// RGB/RGBA 변형 정규식 빌더 (codemod 의 buildRgbRegex 와 동일 동작)
function buildRgbRegex(rgbColor) {
  const parsed = rgbColor.match(
    /^(rgba?)\s*\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/i
  );
  if (!parsed) {
    return new RegExp(rgbColor.replace(/[()]/g, '\\$&'), 'gi');
  }
  const [, fn, r, g, b, a] = parsed;
  const ws = '\\s*';
  const numToken = (val) => {
    const num = parseFloat(val);
    if (Number.isInteger(num)) {
      return `(?<![0-9.])${num}(?![0-9.])`;
    }
    const decPart = num.toString().split('.')[1];
    return `0?\\.${decPart}`;
  };
  const parts = [numToken(r), numToken(g), numToken(b)];
  if (a !== undefined) parts.push(numToken(a));
  const pattern = `${fn}${ws}\\(${ws}${parts.join(`${ws},${ws}`)}${ws}\\)`;
  return new RegExp(pattern, 'gi');
}

// CI/BI rawLine grep 패턴 (.github/workflows/ci-bi-protection.yml 모방)
//   - CSS: grep -E "#[0-9a-fA-F]{3,6}" 후 grep -v -E "#fff|#ffffff|#000|#000000"
//   - JS : grep -E "color.*['\"]#[0-9a-fA-F]{3,6}['\"]"
// 두 패턴 모두 라인 단위 카운트 (한 라인에 여러 hex 가 있어도 1 라인).
const RAW_CSS_HEX_PATTERN = /#[0-9a-fA-F]{3,6}/;
const RAW_CSS_EXCLUDE_PATTERN = /#fff|#ffffff|#000|#000000/i;
const RAW_JS_COLOR_PATTERN = /color.*['"]#[0-9a-fA-F]{3,6}['"]/i;

// ── 유틸 ──────────────────────────────────────────────────────────────────
function isHardExcluded(relPath) {
  return HARD_EXCLUDE_PATTERNS.some(rx => rx.test(relPath));
}

function classifyHexLen(hex) {
  const len = hex.length - 1; // '#' 제외
  if (len === 3) return '3자리';
  if (len === 4) return '4자리';
  if (len === 6) return '6자리';
  if (len === 8) return '8자리';
  return '기타';
}

function isValidHex(hex) {
  const len = hex.length - 1;
  return [3, 4, 6, 8].includes(len);
}

// 주석 제거 유틸 (캐시용).
// codemod (convert-hardcoded-colors.js) 는 주석을 별도 처리하지 않으므로
// canonical metric 의 codemod 정합을 위해 본 스크립트도 주석을 _제거하지 않는다_.
// 본 함수는 향후 strict metric (주석 제거) 도입 여지를 위해 보존만 한다.
function stripComments(content, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let stripped = content.replace(/\/\*[\s\S]*?\*\//g, '');
  if (ext === '.css') {
    return stripped;
  }
  stripped = stripped.replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  return stripped;
}

function relativePath(absPath) {
  return path.relative(REPO_ROOT, absPath).split(path.sep).join('/');
}

// ── 파일 검색 ─────────────────────────────────────────────────────────────
function findFiles() {
  const exts = ['css', 'scss', 'js', 'jsx', 'ts', 'tsx'];
  const cwd = REPO_ROOT;
  const base = 'frontend/src';
  let all = [];
  for (const ext of exts) {
    const pattern = `${base}/**/*.${ext}`;
    const files = glob.sync(pattern, {
      ignore: GLOB_EXCLUDE,
      cwd
    });
    all = all.concat(files);
  }
  return Array.from(new Set(all)).sort();
}

// ── 메인 카운터 ───────────────────────────────────────────────────────────
class HardcodedColorCounter {
  constructor(options) {
    this.options = options;
    const { hexMap, rgbMap } = loadCodemodMappings();
    this.hexMap = hexMap;
    this.rgbMap = rgbMap;
    // codemod 와 동일하게 키 길이 내림차순 정렬 (8→6→4→3 자리 우선 매칭)
    this.orderedHex = Array.from(hexMap.entries()).sort((a, b) => b[0].length - a[0].length);
    this.rgbRegexes = Array.from(rgbMap.entries()).map(([rgb, token]) => [buildRgbRegex(rgb), token]);

    this.canonical = {
      total: 0,
      byHex: new Map(),
      byFile: new Map()
    };
    this.r2Protected = {
      total: 0,
      byHex: new Map(),
      byFile: new Map()
    };
    this.rawLine = {
      cssLines: 0,
      jsLines: 0,
      byFile: new Map()
    };
    this.byArea = {
      css: { canonical: 0, withR2: 0, rawLine: 0 },
      js: { canonical: 0, withR2: 0, rawLine: 0 }
    };
    this.filesScanned = 0;
    this.filesExcluded = 0;
  }

  run() {
    const files = findFiles();
    for (const relPath of files) {
      this.processFile(relPath);
    }
    return this.buildReport();
  }

  processFile(relPath) {
    const absPath = path.resolve(REPO_ROOT, relPath);
    let content;
    try {
      content = fs.readFileSync(absPath, 'utf8');
    } catch (err) {
      return;
    }

    const ext = path.extname(relPath).toLowerCase();
    const isCss = ext === '.css' || ext === '.scss';
    const areaKey = isCss ? 'css' : 'js';

    // rawLine: HARD_EXCLUDE 미적용. CI/BI workflow 와 동일하게 전체 frontend/src 대상.
    // 단, 우리 스크립트는 grep 의 라인 단위 매칭을 동일하게 모방한다.
    const lines = content.split(/\r?\n/);
    let fileRawLines = 0;
    for (const line of lines) {
      if (isCss) {
        if (RAW_CSS_HEX_PATTERN.test(line) && !RAW_CSS_EXCLUDE_PATTERN.test(line)) {
          this.rawLine.cssLines++;
          fileRawLines++;
        }
      } else {
        if (RAW_JS_COLOR_PATTERN.test(line)) {
          this.rawLine.jsLines++;
          fileRawLines++;
        }
      }
    }
    if (fileRawLines > 0) {
      this.rawLine.byFile.set(relPath, fileRawLines);
      this.byArea[areaKey].rawLine += fileRawLines;
    }

    // canonical / withR2: HARD_EXCLUDE 적용 + codemod 매핑 시뮬레이션 후 잔존 카운트
    if (isHardExcluded(relPath)) {
      this.filesExcluded++;
      return;
    }
    this.filesScanned++;

    // ── codemod 와 동일한 3단계 시뮬레이션 ───────────────────────────────────
    // 1) R-2 폴백 placeholder 치환 (보호된 hex 통계 수집)
    // 2) HEX/RGB 매핑 적용 (codemod COLOR_MAPPING + RGB_MAPPING 그대로)
    // 3) 잔존 hex 카운트 (residualHexRegex, codemod residualHexCounts 동일)
    // → canonical 은 codemod 의 residualHexCounts 합계 (D7-1 기준 606) 와 정합.
    let processed = content;
    let fileR2 = 0;

    processed = processed.replace(VAR_FALLBACK_HEX_PATTERN, (match) => {
      const hexMatch = match.match(/#[0-9a-fA-F]{3,8}/);
      if (hexMatch) {
        const hex = hexMatch[0].toLowerCase();
        if (isValidHex(hex)) {
          this.r2Protected.total++;
          this.r2Protected.byHex.set(hex, (this.r2Protected.byHex.get(hex) || 0) + 1);
          fileR2++;
        }
      }
      // codemod 는 placeholder 로 치환 후 복원하지만, 우리는 카운트만 하면 되므로 빈 문자열 마스킹.
      return '';
    });
    if (fileR2 > 0) {
      this.r2Protected.byFile.set(relPath, fileR2);
    }

    for (const [hexColor, ] of this.orderedHex) {
      const escaped = hexColor.replace(/[#]/g, '\\$&');
      const regex = new RegExp(`(?<![0-9a-fA-F])${escaped}(?![0-9a-fA-F])`, 'gi');
      processed = processed.replace(regex, '');
    }
    for (const [regex, ] of this.rgbRegexes) {
      processed = processed.replace(regex, '');
    }

    const residual = processed.match(RESIDUAL_HEX_PATTERN) || [];
    let fileCanonical = 0;
    for (const raw of residual) {
      const hex = raw.toLowerCase();
      if (!isValidHex(hex)) continue;
      this.canonical.total++;
      this.canonical.byHex.set(hex, (this.canonical.byHex.get(hex) || 0) + 1);
      fileCanonical++;
    }
    if (fileCanonical > 0) {
      this.canonical.byFile.set(relPath, fileCanonical);
    }

    this.byArea[areaKey].canonical += fileCanonical;
    this.byArea[areaKey].withR2 += fileCanonical + fileR2;
  }

  buildReport() {
    const summary = {
      canonical: this.canonical.total,
      withR2: this.canonical.total + this.r2Protected.total,
      rawLine: this.rawLine.cssLines + this.rawLine.jsLines,
      rawLineCss: this.rawLine.cssLines,
      rawLineJs: this.rawLine.jsLines,
      r2Protected: this.r2Protected.total,
      filesScanned: this.filesScanned,
      filesExcluded: this.filesExcluded,
      uniqueCanonicalHex: this.canonical.byHex.size,
      uniqueR2ProtectedHex: this.r2Protected.byHex.size
    };

    const topN = this.options.top;
    const topHex = Array.from(this.canonical.byHex.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([hex, occurrences]) => ({
        hex,
        length: classifyHexLen(hex),
        occurrences,
        files: this.options.detail ? this.filesContaining('canonical', hex) : undefined
      }));

    const r2ProtectedHex = Array.from(this.r2Protected.byHex.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([hex, occurrences]) => ({
        hex,
        length: classifyHexLen(hex),
        occurrences,
        files: this.options.detail ? this.filesContaining('r2Protected', hex) : undefined
      }));

    const report = {
      generatedAt: new Date().toISOString(),
      schema: 'count-hardcoded-colors@1',
      summary,
      byArea: this.byArea,
      topHex,
      r2ProtectedHex
    };

    if (this.options.detail) {
      report.byFile = {
        canonical: this.sortedFileMap(this.canonical.byFile, topN * 5),
        r2Protected: this.sortedFileMap(this.r2Protected.byFile, topN * 5),
        rawLine: this.sortedFileMap(this.rawLine.byFile, topN * 5)
      };
    }

    return report;
  }

  filesContaining(bucket, hex) {
    // 파일별 분포는 무거우므로 detail 모드에서만 호출.
    // 각 파일을 재스캔하지 않고 byFile (총합) 만으로는 hex 별 파일 분포를 알 수 없으므로
    // detail 모드일 때만 별도 인덱스를 구축한다 (placeholder — 추후 확장 여지).
    return [];
  }

  sortedFileMap(map, limit) {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([file, count]) => ({ file, count }));
  }
}

// ── 출력 ──────────────────────────────────────────────────────────────────
function printHumanReport(report) {
  const { summary, byArea, topHex, r2ProtectedHex } = report;

  console.log('');
  console.log('🎨 하드코딩 색상 카운트 — 3 metric SSOT');
  console.log('='.repeat(60));
  console.log(`생성 시각          : ${report.generatedAt}`);
  console.log(`스캔 파일          : ${summary.filesScanned}개`);
  console.log(`HARD_EXCLUDE 제외  : ${summary.filesExcluded}개`);
  console.log('');
  console.log('📊 metric 요약');
  console.log('-'.repeat(60));
  console.log(`  canonical (D6 §8 운영 게이트)         : ${summary.canonical}건`);
  console.log(`  withR2    (= canonical + R-2 보호)    : ${summary.withR2}건`);
  console.log(`  rawLine   (CI/BI grep 라인 호환)      : ${summary.rawLine}건`);
  console.log(`    └ CSS 라인 : ${summary.rawLineCss}건 / JS 라인 : ${summary.rawLineJs}건`);
  console.log(`  R-2 폴백 보호 (별도 집계)             : ${summary.r2Protected}건`);
  console.log('');
  console.log('📁 영역별 분포 (canonical / withR2 / rawLine)');
  console.log('-'.repeat(60));
  console.log(`  CSS  : ${byArea.css.canonical} / ${byArea.css.withR2} / ${byArea.css.rawLine}`);
  console.log(`  JS   : ${byArea.js.canonical} / ${byArea.js.withR2} / ${byArea.js.rawLine}`);
  console.log('');
  console.log(`🔝 Top ${topHex.length} hex (canonical 기준)`);
  console.log('-'.repeat(60));
  for (const item of topHex) {
    console.log(`  ${item.hex.padEnd(10)} (${item.length})  ${item.occurrences}건`);
  }
  console.log('');
  if (r2ProtectedHex.length > 0) {
    console.log(`🛡️  R-2 보호 hex Top ${r2ProtectedHex.length}`);
    console.log('-'.repeat(60));
    for (const item of r2ProtectedHex) {
      console.log(`  ${item.hex.padEnd(10)} (${item.length})  ${item.occurrences}건`);
    }
    console.log('');
  }
  console.log('💡 metric SSOT');
  console.log('  - 운영 게이트(D6 §8) 판정은 반드시 canonical 사용');
  console.log('  - CI/BI 워크플로 호환 비교는 rawLine 사용 (±2% 허용)');
  console.log('  - 자세한 정의: scripts/design-system/color-management/README.md');
  console.log('');
}

function timestampForFile() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function writeReportFile(report, explicitPath) {
  let outPath;
  if (explicitPath) {
    outPath = path.resolve(process.cwd(), explicitPath);
  } else {
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
    outPath = path.join(REPORTS_DIR, `count-${timestampForFile()}.json`);
  }
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  return outPath;
}

// ── CLI ───────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const opts = {
    jsonOnly: false,
    report: false,
    reportFile: null,
    top: DEFAULT_TOP,
    detail: false,
    help: false
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--json' || arg === '--json-only') opts.jsonOnly = true;
    else if (arg === '--report') opts.report = true;
    else if (arg === '--report-file' && argv[i + 1]) {
      opts.report = true;
      opts.reportFile = argv[++i];
    } else if (arg.startsWith('--report-file=')) {
      opts.report = true;
      opts.reportFile = arg.split('=')[1];
    } else if (arg === '--top' && argv[i + 1]) {
      opts.top = parseInt(argv[++i], 10) || DEFAULT_TOP;
    } else if (arg.startsWith('--top=')) {
      opts.top = parseInt(arg.split('=')[1], 10) || DEFAULT_TOP;
    } else if (arg === '--detail') {
      opts.detail = true;
    }
  }
  return opts;
}

function printHelp() {
  console.log([
    '사용법:',
    '  node scripts/design-system/color-management/count-hardcoded-colors.js [옵션]',
    '',
    '옵션:',
    '  --json, --json-only       JSON 만 출력 (사람 친화 표 생략)',
    '  --report                  reports/count-{YYYYMMDD-HHmm}.json 자동 생성',
    '  --report-file <path>      지정 경로로 리포트 저장 (--report 자동 활성)',
    '  --top <N>                 상위 N개 hex 출력 (기본 20)',
    '  --detail                  파일별 분포 포함',
    '  --help, -h                도움말',
    '',
    '출력 metric:',
    '  canonical : convert-hardcoded-colors.js 의 HARD_EXCLUDE + R-2 보호 + 주석 차감 후',
    '              잔존 hex 카운트. D6 §8 운영 게이트 metric (SSOT).',
    '  withR2    : canonical + R-2 폴백 보호 hex.',
    '  rawLine   : CI/BI workflow (ci-bi-protection.yml) 의 grep 라인 카운트와 동일.',
    '              HARD_EXCLUDE 미적용, 라인 단위 카운트.',
    '',
    '리포트 디렉터리는 .gitignore 대상 (scripts/design-system/color-management/reports/*.json).',
    ''
  ].join('\n'));
}

function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const counter = new HardcodedColorCounter(opts);
  const report = counter.run();

  if (opts.jsonOnly) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } else {
    printHumanReport(report);
    process.stdout.write(JSON.stringify(report.summary, null, 2) + '\n');
  }

  if (opts.report) {
    const outPath = writeReportFile(report, opts.reportFile);
    console.error(`📄 리포트 저장: ${path.relative(REPO_ROOT, outPath)}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  HardcodedColorCounter,
  HARD_EXCLUDE_PATTERNS,
  VAR_FALLBACK_HEX_PATTERN,
  RESIDUAL_HEX_PATTERN
};
