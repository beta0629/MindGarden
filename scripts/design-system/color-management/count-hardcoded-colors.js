#!/usr/bin/env node

/**
 * 하드코딩된 색상값 카운트 도구 — Dual-metric SSOT (v2)
 *
 * D7-2 인프라 + D11 P2-M 산식 확장 (D11 §1.1 + §4 C1=b/C2=a + P0-inv §1.2)
 *
 * 본 스크립트는 frontend/src 전 영역에서 하드코딩된 색상값을 측정하고
 * legacy(D8~D10 호환) + unified(D11 신 산식) 두 계열의 metric 을 동시에 출력한다.
 *
 *   ┌──────────────────────────────── Legacy 계열 (D8~D10 답습, 추적성 보존) ─┐
 *   │ canonical (D6 §8 운영 게이트 metric)                                    │
 *   │   - HARD_EXCLUDE + R-2 폴백 보호 차감 후 잔존 hex                       │
 *   │ withR2 (R-2 보호 미정착 시점 추적용)                                    │
 *   │   - canonical + R-2 폴백 보호 hex                                        │
 *   │ legacyRawLine (== rawLine alias)                                         │
 *   │   - CSS HEX (#fff/#ffffff/#000/#000000 제외) + JS `color.*['"]#hex['"]` │
 *   │   - .github/workflows/ci-bi-protection.yml grep 라인 카운트 호환        │
 *   └──────────────────────────────────────────────────────────────────────────┘
 *
 *   ┌──────────────────── Unified 계열 (D11 신 산식, KPI 신 baseline) ──────┐
 *   │ unifiedRawLine = legacyRawLine + rgba(CSS) + rgba(JS) + hsl/hsla + 8hex│
 *   │   - rgba   : `rgba\([^)]+\)` (CSS 소비처 + JS)                          │
 *   │   - hsl    : `hsla?\([^)]+\)` (미래 안전성, 현재 0건)                   │
 *   │   - alpha8 : `#[0-9a-fA-F]{8}\b`   (미래 안전성, 현재 0건)              │
 *   │   - HARD_EXCLUDE: unified-design-tokens.css 의 rgba 토큰 정의 자동 제외 │
 *   │     (P0-inv §1.2 grep `--exclude=unified-design-tokens.css` 측정 정합) │
 *   │   - var(--mg-*) 만 있는 라인은 raw 매치가 없으므로 자연 제외           │
 *   │     (이미 토큰화 SUCCESS, D11 §4 C2=a)                                  │
 *   │ varCount = var(--mg-[a-zA-Z0-9_-]+) 발생 합계 (occurrence, CSS+JS)     │
 *   │ coverage = varCount / (varCount + unifiedRawLine) × 100 (백분율 문자열)│
 *   │   - D11 §4 C2=a 신 KPI (목표 ≥ 95%)                                     │
 *   └──────────────────────────────────────────────────────────────────────────┘
 *
 * HARD_EXCLUDE 패턴은 `convert-hardcoded-colors.js` 를 SSOT 로 차용한다.
 * SSOT 문서: `docs/standards/HARDCODE_GATE_METRIC.md` (D11 §4 C4=a 신설 SSOT)
 * 매핑·보호 영역이 변경되면 반드시 양쪽을 동시에 갱신해야 한다.
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
 * @version 2.0.0 (D11 P2-M 산식 확장 — dual-metric)
 * @since 2026-05-22 (v1.0 D7-2) / 2026-05-26 (v2.0 D11 P2-M)
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

// ── D11 §1.1 신 산식 — unifiedRawLine 매칭 정규식 ────────────────────────
// SSOT: docs/standards/HARDCODE_GATE_METRIC.md §2 (D11 §4 C1=b/C2=a 정합)
// rgba: CSS+JS 라인 단위 매칭. hsl/hsla/8자리 hex 는 현재 0건이나 미래 안전성용.
const RAW_RGBA_PATTERN = /rgba\([^)]+\)/i;
const RAW_HSL_PATTERN = /hsla?\([^)]+\)/i;
const RAW_HEX8_PATTERN = /#[0-9a-fA-F]{8}\b/i;

// var(--mg-*) 발생량 (토큰화 SUCCESS 라인) — coverage 분자.
// grep -rEoh "var\(--mg-[a-zA-Z0-9_-]+" frontend/src ... | wc -l 와 동일 동작 (occurrence count).
const VAR_MG_TOKEN_PATTERN = /var\(--mg-[a-zA-Z0-9_-]+/g;

// unifiedRawLine HARD_EXCLUDE — token 정의 파일의 rgba 정의는 unifiedRawLine 자동 제외.
// P0-inv §1.2 측정 (grep --exclude="unified-design-tokens.css") 정합 (CSS rgba 소비처 822 라인).
// SSOT: docs/standards/HARDCODE_GATE_METRIC.md §3 (HARD_EXCLUDE 토큰 14종 + 정의 파일 보호).
const UNIFIED_RAW_HARD_EXCLUDE_PATTERNS = [
  /\bfrontend\/src\/styles\/unified-design-tokens\.css$/
];

// ── 유틸 ──────────────────────────────────────────────────────────────────
function isHardExcluded(relPath) {
  return HARD_EXCLUDE_PATTERNS.some(rx => rx.test(relPath));
}

// D11 §1.1 — unifiedRawLine rgba/hsl/8hex 측정 시 토큰 정의 파일 자동 제외.
// HARD_EXCLUDE_PATTERNS 와 별개 (legacyRawLine 은 정의 파일 포함, unifiedRawLine 은 제외).
function isUnifiedHardExcluded(relPath) {
  return UNIFIED_RAW_HARD_EXCLUDE_PATTERNS.some(rx => rx.test(relPath));
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
    // D11 §1.1 dual-metric: unifiedRawLine details (rgba/hsl/8hex) + varCount.
    // SSOT: docs/standards/HARDCODE_GATE_METRIC.md §2.
    this.unified = {
      rgbaCss: 0,
      rgbaJs: 0,
      hslAll: 0,
      alphaHex8: 0,
      varCount: 0
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

    // D11 §1.1 unifiedRawLine — rgba/hsl/8hex 라인 단위 카운트 + varCount 발생량.
    // HARD_EXCLUDE: token 정의 파일(unified-design-tokens.css) 의 rgba 정의는 제외
    //              (P0-inv §1.2 grep `--exclude=unified-design-tokens.css` 정합).
    // var(--mg-*) 만 있는 라인은 raw 매치가 없으므로 자연 제외 (D11 §4 C2=a).
    const unifiedExcluded = isUnifiedHardExcluded(relPath);
    if (!unifiedExcluded) {
      for (const line of lines) {
        if (RAW_RGBA_PATTERN.test(line)) {
          if (isCss) {
            this.unified.rgbaCss++;
          } else {
            this.unified.rgbaJs++;
          }
        }
        if (RAW_HSL_PATTERN.test(line)) {
          this.unified.hslAll++;
        }
        if (RAW_HEX8_PATTERN.test(line)) {
          this.unified.alphaHex8++;
        }
      }
    }

    // varCount: HARD_EXCLUDE 미적용. P0-inv §1.3 grep -rEoh 와 동일 (occurrence count).
    const varMatches = content.match(VAR_MG_TOKEN_PATTERN);
    if (varMatches) {
      this.unified.varCount += varMatches.length;
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
    // D11 §1.1 dual-metric SSOT — legacy(D8~D10 호환) + unified(D11 신 산식)
    // SSOT: docs/standards/HARDCODE_GATE_METRIC.md §2.
    const legacyRawLine = this.rawLine.cssLines + this.rawLine.jsLines;
    const unifiedRawLine =
      legacyRawLine +
      this.unified.rgbaCss +
      this.unified.rgbaJs +
      this.unified.hslAll +
      this.unified.alphaHex8;
    const coverageDenominator = this.unified.varCount + unifiedRawLine;
    const coverageValue = coverageDenominator > 0
      ? (this.unified.varCount / coverageDenominator) * 100
      : 0;
    const coverage = `${coverageValue.toFixed(2)}%`;

    const summary = {
      metricVersion: 'v2',
      // ── Legacy 계열 (D8~D10 호환, 추적성 보존) ──
      canonical: this.canonical.total,
      withR2: this.canonical.total + this.r2Protected.total,
      legacyRawLine,
      rawLine: legacyRawLine,
      rawLineCss: this.rawLine.cssLines,
      rawLineJs: this.rawLine.jsLines,
      r2Protected: this.r2Protected.total,
      // ── Unified 계열 (D11 §1.1 신 산식, KPI 신 baseline) ──
      unifiedRawLine,
      coverage,
      varCount: this.unified.varCount,
      details: {
        hexOnly: legacyRawLine,
        rgbaCss: this.unified.rgbaCss,
        rgbaJs: this.unified.rgbaJs,
        hslAll: this.unified.hslAll,
        alphaHex8: this.unified.alphaHex8
      },
      // ── 공통 메타 ──
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
      schema: 'count-hardcoded-colors@2',
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
  console.log(`🎨 하드코딩 색상 카운트 — Dual-metric SSOT (${summary.metricVersion})`);
  console.log('='.repeat(60));
  console.log(`생성 시각          : ${report.generatedAt}`);
  console.log(`스캔 파일          : ${summary.filesScanned}개`);
  console.log(`HARD_EXCLUDE 제외  : ${summary.filesExcluded}개`);
  console.log('');
  console.log('📊 Legacy 계열 (D8~D10 호환 — 추적성 보존)');
  console.log('-'.repeat(60));
  console.log(`  canonical (D6 §8 운영 게이트)         : ${summary.canonical}건`);
  console.log(`  withR2    (= canonical + R-2 보호)    : ${summary.withR2}건`);
  console.log(`  legacyRawLine (== rawLine alias)      : ${summary.legacyRawLine}건`);
  console.log(`    └ CSS 라인 : ${summary.rawLineCss}건 / JS 라인 : ${summary.rawLineJs}건`);
  console.log(`  R-2 폴백 보호 (별도 집계)             : ${summary.r2Protected}건`);
  console.log('');
  console.log('📈 Unified 계열 (D11 §1.1 신 산식 — KPI 신 baseline)');
  console.log('-'.repeat(60));
  console.log(`  unifiedRawLine (hex + rgba + hsl + 8hex) : ${summary.unifiedRawLine}건`);
  console.log(`    └ hexOnly  : ${summary.details.hexOnly}건 (== legacyRawLine)`);
  console.log(`    └ rgbaCss  : ${summary.details.rgbaCss}건 (unified-design-tokens.css 제외)`);
  console.log(`    └ rgbaJs   : ${summary.details.rgbaJs}건`);
  console.log(`    └ hslAll   : ${summary.details.hslAll}건 (미래 안전성)`);
  console.log(`    └ alphaHex8: ${summary.details.alphaHex8}건 (미래 안전성)`);
  console.log(`  varCount (var(--mg-*) 발생량)         : ${summary.varCount}건`);
  console.log(`  coverage (var()/(var()+unified))      : ${summary.coverage}  (D11 KPI ≥ 95%)`);
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
  console.log('  - legacyRawLine 은 D8~D10 추적성 보존 (CI/BI 호환, ±2% 허용)');
  console.log('  - unifiedRawLine + coverage 는 D11 신 KPI baseline');
  console.log('  - 자세한 정의: docs/standards/HARDCODE_GATE_METRIC.md (SSOT)');
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
    '출력 metric (Dual-metric v2):',
    '  [Legacy 계열 — D8~D10 호환, 추적성 보존]',
    '  canonical     : convert-hardcoded-colors.js 의 HARD_EXCLUDE + R-2 보호 + 주석 차감 후',
    '                  잔존 hex 카운트. D6 §8 운영 게이트 metric (SSOT).',
    '  withR2        : canonical + R-2 폴백 보호 hex.',
    '  legacyRawLine : CI/BI workflow (ci-bi-protection.yml) 의 grep 라인 카운트와 동일.',
    '                  HARD_EXCLUDE 미적용, 라인 단위 카운트. `rawLine` alias 제공.',
    '  r2Protected   : R-2 폴백 보호 hex 별도 집계.',
    '',
    '  [Unified 계열 — D11 §1.1 신 산식, KPI 신 baseline]',
    '  unifiedRawLine: legacyRawLine + rgba(CSS+JS) + hsl/hsla + 8자리 hex 통합.',
    '                  unified-design-tokens.css rgba 정의 자동 제외 (HARD_EXCLUDE).',
    '  varCount      : var(--mg-*) 발생 합계 (occurrence, CSS+JS).',
    '  coverage      : varCount/(varCount+unifiedRawLine) 백분율. D11 KPI ≥ 95%.',
    '  details       : { hexOnly, rgbaCss, rgbaJs, hslAll, alphaHex8 } 분리 집계.',
    '',
    'SSOT: docs/standards/HARDCODE_GATE_METRIC.md (D11 §4 C4=a 신설)',
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
  RESIDUAL_HEX_PATTERN,
  // D11 §1.1 unified metric (P2-M)
  RAW_RGBA_PATTERN,
  RAW_HSL_PATTERN,
  RAW_HEX8_PATTERN,
  VAR_MG_TOKEN_PATTERN,
  UNIFIED_RAW_HARD_EXCLUDE_PATTERNS
};
