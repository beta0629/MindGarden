#!/usr/bin/env node

/**
 * 하드코딩된 색상값 자동 변환 도구
 *
 * CI/BI 변경 대비 하드코딩된 색상을 CSS 변수로 자동 변환.
 *
 * 안전 가드 (T1 2차 §6 회귀 사고 재발 방지):
 *   - HARD_EXCLUDE: 토큰 정의 파일 (unified-design-tokens / dashboard-tokens-extension /
 *     responsive-layout-tokens / mindgarden-design-system / 00-core/_variables /
 *     00-core/_component-variables / common/variables / constants/css-variables.js)
 *     은 절대 처리하지 않음. `*tokens*.css` `*variables*.css` `*design-system*.css`
 *     일반 패턴도 자동 보호. (§6.2)
 *   - `--targets-file <path>`: zsh `$TARGETS` 단어 분리 문제 회피용 옵션. (§6.1)
 *   - 잔존 hex 카운트: 매핑 후에도 남는 hex 색상을 dry-run에서 정확히 집계.
 *     회색 3자리(#666·#333·#000·#ccc·#999·#eee 등) 및 8자리 alpha hex 모두 포함.
 *   - dry-run 보고서는 `docs/COLOR_CONVERSION_DRY_RUN_REPORT.md` 로 분리 저장.
 *   - var() 폴백 보호 (시각 QA R-2): `var(--token, #hex)` 형태의 폴백 위치에 들어 있는
 *     hex 는 codemod 가 절대 변환하지 않는다. processFile 1단계에서 placeholder 로
 *     임시 치환 → 2단계에서 HEX/RGB 매핑 적용 → 3단계에서 placeholder 복원으로
 *     `var(--cs-error-600, #dc2626)` 가 `var(--cs-error-600, var(--mg-color-error))`
 *     같은 nested var 로 잘못 치환되는 부작용을 차단한다.
 *
 * @author MindGarden Team
 * @version 1.3.0
 * @since 2025-11-28
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const glob = require('glob');

// 색상 매핑 테이블 (하드코딩 → CSS 변수)
const COLOR_MAPPING = {
  // Primary Colors
  '#007aff': 'var(--mg-primary-500)',
  '#007bff': 'var(--mg-primary-500)', 
  '#2196F3': 'var(--mg-primary-500)',
  '#3b82f6': 'var(--mg-primary-500)',
  '#6c5ce7': 'var(--mg-primary-500)',
  '#667eea': 'var(--mg-primary-500)',
  
  // Success Colors  
  '#28a745': 'var(--mg-success-500)',
  '#34c759': 'var(--mg-success-500)',
  '#4CAF50': 'var(--mg-success-500)',
  '#00b894': 'var(--mg-success-500)',
  '#10b981': 'var(--mg-success-500)',
  
  // Error/Danger Colors
  '#dc3545': 'var(--mg-error-500)',
  '#ff3b30': 'var(--mg-error-500)',
  '#F44336': 'var(--mg-error-500)',
  '#ff6b6b': 'var(--mg-error-500)',
  '#ef4444': 'var(--mg-error-500)',
  
  // Warning Colors
  '#ffc107': 'var(--mg-warning-500)',
  '#ff9500': 'var(--mg-warning-500)',
  '#FF9800': 'var(--mg-warning-500)',
  '#f59e0b': 'var(--mg-warning-500)',
  '#f093fb': 'var(--mg-warning-500)',
  
  // Info Colors
  '#17a2b8': 'var(--mg-info-500)',
  '#74b9ff': 'var(--mg-info-500)',
  
  // Secondary Colors
  '#6c757d': 'var(--mg-secondary-500)',
  '#1976D2': 'var(--mg-secondary-600)',
  
  // Gray Scale
  '#333333': 'var(--mg-gray-800)',
  '#666666': 'var(--mg-gray-600)', 
  '#999999': 'var(--mg-gray-500)',
  '#e0e0e0': 'var(--mg-gray-300)',
  '#f8f9fa': 'var(--mg-gray-100)',
  '#f5f5f5': 'var(--mg-gray-100)',
  
  // Background Colors
  '#ffffff': 'var(--mg-white)',
  '#000000': 'var(--mg-black)',
  
  // Brand Specific Colors (MindGarden)
  '#F5F5DC': 'var(--mg-cream)',
  '#FDF5E6': 'var(--mg-light-beige)',
  '#8B4513': 'var(--mg-cocoa)',
  '#808000': 'var(--mg-olive-green)',
  '#98FB98': 'var(--mg-mint-green)',
  '#B6E5D8': 'var(--mg-soft-mint)',
  
  // Purple Colors
  '#5856d6': 'var(--mg-purple-500)',
  '#8b5cf6': 'var(--mg-purple-500)',
  '#a29bfe': 'var(--mg-purple-400)',
  
  // Consultant Colors
  '#a29bfe': 'var(--mg-consultant-primary)',
  '#6c5ce7': 'var(--mg-consultant-dark)',
  
  // Finance Colors
  '#f39c12': 'var(--mg-finance-primary)',
  '#e67e22': 'var(--mg-finance-dark)',

  // 2026 Q2 D1 합의서 매핑 (SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2.md)
  // A. 기존 토큰 매핑 (4건)
  '#3d5246': 'var(--mg-color-primary-main)',
  '#d4cfc8': 'var(--mg-color-border-main)',
  '#5c6b61': 'var(--mg-color-text-secondary)',
  '#faf9f7': 'var(--mg-color-background-main)',

  // B. 신설 토큰 (3건) — unified-design-tokens.css §2026 Q2 신규 블록에 정의
  // 주의: #2c2c2c 는 텍스트 용도일 땐 var(--mg-color-text-main) 사용 (합의서 §1)
  '#1a1a1a': 'var(--mg-dark-bg-900)',
  '#2c2c2c': 'var(--mg-dark-bg-800)',
  '#764ba2': 'var(--mg-gradient-primary-end)',

  // C. 폐기·통합 (4건) — 합의서 §1 명시 통합 대상으로 치환
  // 주의: #1d1d1f 는 배경 용도일 땐 var(--mg-dark-bg-800) 로 수동 확인 (합의서 §1)
  '#1d1d1f': 'var(--mg-color-text-main)',
  '#0056b3': 'var(--mg-color-primary-dark)',
  '#87ceeb': 'var(--mg-info-500)',
  '#2c3e50': 'var(--mg-color-text-main)',

  // 2026 Q2 D2 합의서 매핑 (SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D2.md §3)
  // A. 기존 토큰 통합 (5건) — 변수명은 unified-design-tokens.css 실제 정의에 맞춤
  '#6b7280': 'var(--mg-color-text-secondary)',
  '#1f2937': 'var(--mg-color-text-main)',
  '#f9fafb': 'var(--mg-color-background-main)',
  '#2563eb': 'var(--mg-color-info)',
  '#dc2626': 'var(--mg-color-error)',

  // B. 신설 토큰 (2건) — unified-design-tokens.css D2 블록에 정의
  '#374151': 'var(--mg-color-text-secondary-dark)',
  '#4b5563': 'var(--mg-color-text-tertiary)',

  // C. 폐기 통합 (3건) — Tailwind/Bootstrap 잔재를 시스템 표준 토큰으로 흡수
  '#e5e7eb': 'var(--mg-color-border-main)',
  '#e9ecef': 'var(--mg-color-border-main)',
  '#495057': 'var(--mg-color-text-secondary)',

  // D2 보강 — 3자리 흰색(#fff)도 var(--mg-white)로 정규화
  // (lookbehind/lookahead 가드가 #ffffff 와의 충돌을 방지)
  '#fff': 'var(--mg-white)',

  // 2026 Q2 D3 합의서 매핑 (SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D3.md §3)
  // A. 기존 토큰 통합 (5건) — 3자리 회색 정규화 + Tailwind 잔재 흡수
  // 주의: 6자리 형태(#666666·#333333)는 기존 매핑(--mg-gray-*)에 그대로 남고,
  //       3자리 형태(#666·#333)는 D3 결정에 따라 시맨틱 토큰으로 정규화된다.
  //       lookbehind/lookahead 가드가 6자리/3자리를 분리한다.
  '#666': 'var(--mg-color-text-secondary)',
  '#333': 'var(--mg-color-text-main)',
  // 주의: --mg-color-background-subtle 토큰이 unified-design-tokens.css 에
  //       미정의이므로 D2 의 #f9fafb 매핑(--mg-color-background-main)과
  //       일관 처리한다. (작업 정의서 §PR-1, D3 SSOT §1 본문 동일)
  '#f3f4f6': 'var(--mg-color-background-main)',
  '#f8fafc': 'var(--mg-color-background-main)',
  '#9ca3af': 'var(--mg-color-text-tertiary)',

  // B. 신설 토큰 (2건) — unified-design-tokens.css D3 블록에 정의
  '#fef3c7': 'var(--mg-color-warning-bg)',
  '#fee2e2': 'var(--mg-color-error-bg)',

  // C. 폐기 통합 (3건) — Tailwind/Bootstrap 잔재를 시스템 표준 토큰으로 흡수
  '#e2e8f0': 'var(--mg-color-border-main)',
  '#d1d5db': 'var(--mg-color-border-main)',
  '#2d3748': 'var(--mg-color-text-main)',

  // 2026 Q2 D4 합의서 매핑 (SSOT: docs/standards/DESIGN_TOKEN_GAP_2026Q2_D4.md §1·§3)
  // A. 기존 토큰 통합 + 3자리 회색 일괄 정규화 보강 (7건)
  // 주의: 6자리 형태(#000000·#999999 등)는 기존 매핑(--mg-black·--mg-gray-*)에 그대로 남고,
  //       3자리 형태(#000·#999 등)는 D4 결정에 따라 시맨틱 토큰으로 정규화된다.
  //       lookbehind/lookahead 가드가 6자리/3자리를 분리하고,
  //       매핑 키 길이 내림차순(8→6→4→3) 정렬로 6자리가 항상 먼저 처리된다.
  '#000': 'var(--mg-color-text-main)',
  '#ddd': 'var(--mg-color-border-main)',
  '#ccc': 'var(--mg-color-border-main)',
  '#bbb': 'var(--mg-color-text-tertiary)',
  '#aaa': 'var(--mg-color-text-tertiary)',
  '#999': 'var(--mg-color-text-tertiary)',
  '#eee': 'var(--mg-color-border-main)',

  // C. 폐기 통합 (2건) — Bootstrap 잔재를 D3 정착 토큰으로 흡수
  '#f8d7da': 'var(--mg-color-error-bg)',
  '#fff3cd': 'var(--mg-color-warning-bg)',

  // B. 신설 토큰 (6건) — unified-design-tokens.css D4 블록에 정의
  '#f0f9ff': 'var(--mg-color-info-bg)',
  '#1e40af': 'var(--mg-color-info-dark)',
  '#fef2f2': 'var(--mg-color-error-50)',
  '#991b1b': 'var(--mg-color-error-dark)',
  '#059669': 'var(--mg-color-success)',
  '#6b7c32': 'var(--mg-color-brand-olive)'
};

// RGB/RGBA 색상 매핑
const RGB_MAPPING = {
  'rgb(0, 123, 255)': 'var(--mg-primary-500)',
  'rgb(40, 167, 69)': 'var(--mg-success-500)',
  'rgb(220, 53, 69)': 'var(--mg-error-500)',
  'rgb(255, 193, 7)': 'var(--mg-warning-500)',
  'rgb(23, 162, 184)': 'var(--mg-info-500)',
  'rgb(108, 117, 125)': 'var(--mg-secondary-500)',
  'rgba(255, 255, 255, 0.25)': 'var(--mg-glass-bg-light)',
  'rgba(255, 255, 255, 0.35)': 'var(--mg-glass-bg-medium)',
  'rgba(255, 255, 255, 0.45)': 'var(--mg-glass-bg-strong)',
  'rgba(0, 0, 0, 0.1)': 'var(--mg-shadow-light)',
  'rgba(0, 0, 0, 0.15)': 'var(--mg-shadow-medium)',
  'rgba(0, 0, 0, 0.5)': 'var(--mg-overlay)'
};

// 제외할 파일 패턴
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/build/**',
  '**/dist/**',
  '**/.git/**',
  '**/coverage/**',
  '**/*.min.js',
  '**/*.min.css'
];

// 백업할 파일들
const BACKUP_EXTENSIONS = ['.css', '.scss', '.js', '.jsx', '.ts', '.tsx'];

// ── 시각 QA R-2: var() 폴백 보호 패턴 ─────────────────────────────────────────────
// `var(--token, #hex)` 형태의 폴백 위치에 있는 hex 는 절대 변환하지 않는다.
// 정규식 설계:
//   - `var\(`                : `var(` 시작 (공백 허용)
//   - `--[\w-]+`              : CSS 커스텀 프로퍼티 이름 (밑줄·하이픈·영숫자)
//   - `\s*,\s*`               : 폴백 구분자
//   - `#[0-9a-fA-F]{3,8}`     : 3·4·6·8자리 hex (alpha 포함 가능)
//   - `(?![0-9a-fA-F])`       : 추가 hex 문자 없을 때만 (예: `#1a1a1aff` 의 일부로 잘못 잡히지 않게)
//   - `\s*\)`                 : 닫는 괄호
// 주의: linear-gradient/box-shadow 등 var() 밖에서 콤마 + #hex 가 등장하는 케이스는
//       매칭되지 않으므로 정상 치환 대상으로 남는다.
// 주의: nested var 폴백(`var(--a, var(--b, #c))`)의 경우 안쪽 `var(--b, #c)` 가
//       매칭돼 placeholder 로 치환되므로, 바깥 var 는 자연히 비-hex 폴백을 갖게 되고
//       추가 처리 없이 그대로 유지된다.
const VAR_FALLBACK_HEX_PATTERN = /var\s*\(\s*--[\w-]+\s*,\s*#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])\s*\)/g;
const VAR_FALLBACK_PLACEHOLDER_PREFIX = '__MG_VAR_FALLBACK_HEX_';
const VAR_FALLBACK_PLACEHOLDER_SUFFIX = '__';

// ── D4 인프라 보강: rgb()/rgba() 변형 매칭 헬퍼 ─────────────────────────────────
// RGB_MAPPING 키는 카논 형식(`rgba(R, G, B, A)`)만 다루지만, 실 코드에는
// 다양한 공백·소수점 표기 변형(`rgba(0,0,0,.1)`·`rgba(0, 0, 0, 0.1)` 등)이
// 혼재한다. 각 키를 파싱해 다음 변형을 모두 매칭하는 정규식으로 변환한다:
//   - 콤마/괄호 주변 공백 0~다수
//   - 소수의 leading-zero 옵션 (`0.1` ↔ `.1`)
//   - 정수 채널: lookbehind/lookahead 가드로 `0` 가 `10`·`100`의 부분 매칭 방지
// 카논 입력(매핑 키 자체)이 위 정규식에 매칭됨이 보장되며, 치환 결과는 항상
// 카논 var(--token) 한 종류이므로 동일 입력에 동일 출력(R-2 정신 연장).
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

class HardcodedColorConverter {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      backup: options.backup !== false,
      verbose: options.verbose || false,
      criticalOnly: options.criticalOnly || false,
      target: options.target || null,
      ...options
    };

    this.stats = {
      filesProcessed: 0,
      filesModified: 0,
      colorsConverted: 0,
      backupsCreated: 0,
      errors: [],
      perMappingCounts: {},
      // 매핑 후에도 남은 hex 색상 카운트 (3·4·6·8자리 모두)
      // 회색 3자리(#666·#333·#000·#ccc·#999·#eee 등)가 매핑 테이블에 없을 때
      // dry-run에서 정확히 추적되도록 함 (D3 합의서 적용 라운드 데이터 소스)
      residualHexCounts: {},
      // 시각 QA R-2: `var(--token, #hex)` 폴백 위치에서 치환 대상에서 제외된 hex 개수.
      // dry-run 시 D3 적용 라운드에서 어떤 hex 가 폴백 안에 들어 있어 보호됐는지 추적.
      protectedVarFallbacks: 0,
      protectedVarFallbackHexCounts: {}
    };
  }

  /**
   * 메인 실행 함수
   */
  async run() {
    console.log('🔄 하드코딩된 색상값 자동 변환 시작...\n');
    
    if (this.options.dryRun) {
      console.log('🧪 DRY RUN 모드 - 실제 파일은 수정되지 않습니다.\n');
    }

    const startTime = Date.now();

    // 파일 검색
    const files = await this.findFiles();
    console.log(`📁 처리 대상 파일: ${files.length}개\n`);

    // 각 파일 처리
    for (const file of files) {
      await this.processFile(file);
    }

    // 결과 리포트
    this.generateReport();

    const endTime = Date.now();
    console.log(`\n✅ 변환 완료 (${endTime - startTime}ms)`);
  }

  /**
   * 처리할 파일들 찾기
   *
   * - `--target <path>` 가 주어지면 해당 디렉터리(또는 파일) 하위로만 한정한다 (반복 지정 가능).
   * - 토큰 정의 파일(`styles/unified-design-tokens.css`, `styles/tokens/**`, `styles/themes/**`,
   *   루트 외 `tokens/**`, `themes/**`) 과 테스트 파일(`__tests__/**`, `*.test.*`, `*.spec.*`)
   *   은 절대 변환하지 않는다 (인벤토리 §6).
   */
  async findFiles() {
    const exts = ['css', 'scss', 'js', 'jsx', 'ts', 'tsx'];
    const rawTargets = this.options.target
      ? (Array.isArray(this.options.target) ? this.options.target : [this.options.target])
      : [null];

    let allFiles = [];

    for (const rawTarget of rawTargets) {
      const base = rawTarget ? rawTarget.replace(/\/+$/, '') : 'frontend/src';

      try {
        const stat = fs.statSync(base);
        if (stat.isFile()) {
          if (exts.some(ext => base.endsWith('.' + ext))) {
            allFiles.push(base);
          }
          continue;
        }
      } catch (_) {
        // 존재하지 않으면 glob 으로 fall-through
      }

      for (const ext of exts) {
        const pattern = `${base}/**/*.${ext}`;
        const files = glob.sync(pattern, {
          ignore: EXCLUDE_PATTERNS,
          cwd: process.cwd()
        });
        allFiles = allFiles.concat(files);
      }
    }

    // 안전망: 절대 변환 금지 영역 (인벤토리 §6 + 작업 정의서 §치환 규칙)
    // T1 2차 라운드 회귀 사고(§6.2)에서 codemod가 토큰 정의 파일을 휩쓸어
    // `--mg-white: var(--mg-white)` 같은 순환 참조를 만든 사례를 재발 방지.
    const HARD_EXCLUDE = [
      // ── 명시적 토큰 정의 파일 (T1 2차 §6.2 되돌린 7개 파일) ──
      /\bfrontend\/src\/styles\/unified-design-tokens\.css$/,
      /\bfrontend\/src\/styles\/dashboard-tokens-extension\.css$/,
      /\bfrontend\/src\/styles\/responsive-layout-tokens\.css$/,
      /\bfrontend\/src\/styles\/mindgarden-design-system\.css$/,
      /\bfrontend\/src\/styles\/00-core\/_variables\.css$/,
      /\bfrontend\/src\/styles\/00-core\/_component-variables\.css$/,
      /\bfrontend\/src\/styles\/common\/variables\.css$/,
      /\bfrontend\/src\/constants\/css-variables\.js$/,

      // ── 일반 패턴 (forward-looking) — 신규 토큰/변수/디자인시스템 파일도 자동 보호 ──
      // 파일명에 tokens/variables/design-system 키워드를 포함하는 CSS는 정의 파일로 간주
      /(?:^|\/)[^/]*tokens[^/]*\.css$/i,
      /(?:^|\/)[^/]*variables[^/]*\.css$/i,
      /(?:^|\/)[^/]*design-system[^/]*\.css$/i,

      // ── 디렉터리 단위 보호 영역 ──
      /\bfrontend\/src\/styles\/tokens\//,
      /\bfrontend\/src\/styles\/themes\//,
      /\bfrontend\/src\/tokens\//,
      /\bfrontend\/src\/themes\//,
      /(?:^|\/)tokens\//,
      /(?:^|\/)themes\//,

      // ── 테스트·스토리북 ──
      /\/__tests__\//,
      /\.test\.(js|jsx|ts|tsx)$/,
      /\.spec\.(js|jsx|ts|tsx)$/,
      /\.stories\.(js|jsx|ts|tsx|mdx)$/
    ];
    allFiles = allFiles.filter(f => !HARD_EXCLUDE.some(rx => rx.test(f)));

    if (this.options.criticalOnly) {
      allFiles = allFiles.filter(file => this.isCriticalFile(file));
    }

    return [...new Set(allFiles)];
  }

  /**
   * 중요 파일 여부 확인
   */
  isCriticalFile(filePath) {
    const criticalPatterns = [
      /branding/i,
      /design-system/i,
      /theme/i,
      /color/i,
      /css-variables/i,
      /constants.*css/i,
      /mindgarden.*css/i
    ];

    return criticalPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * 개별 파일 처리
   */
  async processFile(filePath) {
    try {
      this.stats.filesProcessed++;
      
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let modifiedContent = originalContent;
      let changeCount = 0;

      // ── 1단계 (R-2): var(--token, #hex) 폴백 보호 ─────────────────────────────
      // 매핑 적용 전에 폴백 hex 위치를 placeholder 로 임시 치환하여
      // `var(--cs-error-600, #dc2626)` → `var(--cs-error-600, var(--mg-color-error))`
      // 같은 nested var 부작용을 차단한다. (시각 QA 보고서 §6 R-2)
      // 보호 토큰은 hex/rgb/매핑 정규식 어디에도 매칭되지 않는 ASCII 식별자다.
      const fallbackPlaceholders = new Map();
      let fallbackCounter = 0;
      modifiedContent = modifiedContent.replace(VAR_FALLBACK_HEX_PATTERN, (match) => {
        const placeholder = `${VAR_FALLBACK_PLACEHOLDER_PREFIX}${fallbackCounter++}${VAR_FALLBACK_PLACEHOLDER_SUFFIX}`;
        fallbackPlaceholders.set(placeholder, match);
        // 보호된 hex 통계 (dry-run 보고서·로그용)
        const hexMatch = match.match(/#[0-9a-fA-F]{3,8}/);
        if (hexMatch) {
          const hex = hexMatch[0].toLowerCase();
          this.stats.protectedVarFallbackHexCounts[hex] =
            (this.stats.protectedVarFallbackHexCounts[hex] || 0) + 1;
        }
        return placeholder;
      });
      if (fallbackPlaceholders.size > 0) {
        this.stats.protectedVarFallbacks += fallbackPlaceholders.size;
        if (this.options.verbose) {
          console.log(`  🛡️  R-2 폴백 보호: ${fallbackPlaceholders.size}건 (${filePath})`);
        }
      }

      // ── 2단계: HEX/RGB 매핑 적용 ──────────────────────────────────────────────
      // HEX 색상 변환
      // 안전성: 매핑 키 길이 내림차순(8→6→3) + 앞뒤가 hex 문자가 아닐 때만 치환
      // → `#1a1a1a` 가 `#1a1a1aff` 의 일부로 잘못 잡히는 케이스 방지
      const orderedHex = Object.entries(COLOR_MAPPING).sort((a, b) => b[0].length - a[0].length);
      orderedHex.forEach(([hexColor, cssVar]) => {
        const escaped = hexColor.replace(/[#]/g, '\\$&');
        const regex = new RegExp(`(?<![0-9a-fA-F])${escaped}(?![0-9a-fA-F])`, 'gi');
        const matches = modifiedContent.match(regex);
        if (matches) {
          modifiedContent = modifiedContent.replace(regex, cssVar);
          changeCount += matches.length;
          this.stats.perMappingCounts[hexColor] = (this.stats.perMappingCounts[hexColor] || 0) + matches.length;

          if (this.options.verbose) {
            console.log(`  🎨 ${hexColor} → ${cssVar} (${matches.length}개)`);
          }
        }
      });

      // RGB/RGBA 색상 변환 (D4 인프라 보강 — 공백·소수점 변형 자동 매칭)
      // buildRgbRegex 는 카논 키를 변형 허용 정규식으로 변환한다.
      // 치환 결과는 항상 카논 var(--token) 이므로 동일 입력에 동일 출력 보장.
      Object.entries(RGB_MAPPING).forEach(([rgbColor, cssVar]) => {
        const regex = buildRgbRegex(rgbColor);
        const matches = modifiedContent.match(regex);
        if (matches) {
          modifiedContent = modifiedContent.replace(regex, cssVar);
          changeCount += matches.length;
          this.stats.perMappingCounts[rgbColor] = (this.stats.perMappingCounts[rgbColor] || 0) + matches.length;

          if (this.options.verbose) {
            console.log(`  🎨 ${rgbColor} → ${cssVar} (${matches.length}개)`);
          }
        }
      });

      // 잔존 hex 카운트 (매핑 후에도 남아 있는 hex 색상)
      // - 회색 3자리(#666·#333·#000·#ccc·#999·#eee 등) 미매핑 항목 추적
      // - 8자리 alpha 포함 hex(#1a1a1aff) 등 lookbehind 가드로 변환 제외된 케이스 추적
      // - 정규식: `#` 다음 hex 문자 시퀀스, 뒤에 hex 문자가 더 없을 때만 (lookbehind는 불필요)
      // - R-2: placeholder 가 남아 있는 상태에서 카운트하므로 폴백 hex 는 잔존에서 제외된다
      //        (의도된 폴백은 잔존 hex 가 아니라 protectedVarFallbacks 로 별도 추적).
      const residualHexRegex = /#[0-9a-fA-F]+(?![0-9a-fA-F])/g;
      const residualMatches = modifiedContent.match(residualHexRegex) || [];
      residualMatches.forEach(raw => {
        const hex = raw.toLowerCase();
        const len = hex.length - 1; // '#' 제외
        if (![3, 4, 6, 8].includes(len)) return;
        this.stats.residualHexCounts[hex] = (this.stats.residualHexCounts[hex] || 0) + 1;
      });

      // ── 3단계 (R-2): placeholder 를 원본 var(--token, #hex) 폴백으로 복원 ─────
      // 보호된 폴백 위치는 codemod 변환 대상에서 제외했으므로 1단계에서 임시 치환한
      // 문자열을 그대로 원본으로 되돌린다. 동작 변경 0건이 되도록 placeholder 순서대로 복원.
      if (fallbackPlaceholders.size > 0) {
        for (const [placeholder, original] of fallbackPlaceholders) {
          modifiedContent = modifiedContent.split(placeholder).join(original);
        }
        // 방어 로직: 어떤 이유로든 placeholder 잔존 시 즉시 실패시켜
        // 잘못된 내용을 저장하지 않도록 한다 (T1 2차 §6 회귀 사고 재발 방지 정신).
        if (modifiedContent.includes(VAR_FALLBACK_PLACEHOLDER_PREFIX)) {
          throw new Error(
            `var() 폴백 placeholder 복원 실패: ${filePath} — 보호 토큰이 잔존함`
          );
        }
      }

      // 변경사항이 있는 경우 처리
      if (changeCount > 0) {
        this.stats.filesModified++;
        this.stats.colorsConverted += changeCount;

        console.log(`📝 ${filePath} - ${changeCount}개 색상 변환`);

        if (!this.options.dryRun) {
          // 백업 생성
          if (this.options.backup) {
            await this.createBackup(filePath, originalContent);
          }

          // 파일 저장
          fs.writeFileSync(filePath, modifiedContent, 'utf8');
        }
      }

    } catch (error) {
      this.stats.errors.push({
        file: filePath,
        error: error.message
      });
      console.error(`❌ 파일 처리 실패: ${filePath} - ${error.message}`);
    }
  }

  /**
   * 백업 파일 생성
   */
  async createBackup(filePath, content) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    
    try {
      fs.writeFileSync(backupPath, content, 'utf8');
      this.stats.backupsCreated++;
      
      if (this.options.verbose) {
        console.log(`💾 백업 생성: ${backupPath}`);
      }
    } catch (error) {
      console.warn(`⚠️  백업 생성 실패: ${backupPath} - ${error.message}`);
    }
  }

  /**
   * 결과 리포트 생성
   */
  generateReport() {
    console.log('\n📊 변환 결과 리포트');
    console.log('='.repeat(50));
    
    console.log(`📁 처리된 파일: ${this.stats.filesProcessed}개`);
    console.log(`📝 수정된 파일: ${this.stats.filesModified}개`);
    console.log(`🎨 변환된 색상: ${this.stats.colorsConverted}개`);
    console.log(`💾 생성된 백업: ${this.stats.backupsCreated}개`);
    console.log(`🛡️  R-2 폴백 보호: ${this.stats.protectedVarFallbacks}건`);
    console.log(`❌ 오류 발생: ${this.stats.errors.length}개`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ 오류 목록:');
      this.stats.errors.forEach(({ file, error }) => {
        console.log(`  - ${file}: ${error}`);
      });
    }

    // R-2 보호된 var() 폴백 hex 분포 (상위 20건)
    const protectedFallbackEntries = Object.entries(this.stats.protectedVarFallbackHexCounts)
      .sort((a, b) => b[1] - a[1]);
    if (protectedFallbackEntries.length > 0) {
      console.log('\n🛡️  R-2 보호된 var() 폴백 hex — 상위 20건:');
      protectedFallbackEntries.slice(0, 20).forEach(([hex, count]) => {
        console.log(`  - ${hex}: ${count}건`);
      });
    }

    // 잔존 hex 색상 Top 20 (D3 합의서 데이터 소스)
    const residualEntries = Object.entries(this.stats.residualHexCounts)
      .sort((a, b) => b[1] - a[1]);
    if (residualEntries.length > 0) {
      console.log('\n🔍 잔존 hex 색상 (매핑 외) — 상위 20건:');
      residualEntries.slice(0, 20).forEach(([hex, count]) => {
        const lenLabel = hex.length === 4 ? '3자리'
          : hex.length === 5 ? '4자리'
          : hex.length === 7 ? '6자리'
          : hex.length === 9 ? '8자리'
          : '기타';
        console.log(`  - ${hex} (${lenLabel}): ${count}건`);
      });
      const total = residualEntries.reduce((s, [, n]) => s + n, 0);
      const unique = residualEntries.length;
      console.log(`  합계: 고유 ${unique}종 / 총 ${total}건`);
    }

    // 상세 리포트 파일 생성
    this.generateDetailedReport();
  }

  /**
   * 상세 리포트 파일 생성
   *
   * - `--no-report` 가 주어지면 생성하지 않음.
   * - dry-run 결과는 actual 보고서를 덮어쓰지 않도록 별도 경로에 기록.
   *   (직전 라운드의 actual 보고서가 dry-run 결과에 휩쓸려 잔존하던 문제 해소)
   */
  generateDetailedReport() {
    if (this.options.report === false) {
      console.log('\n📄 상세 리포트 생략 (--no-report)');
      return;
    }

    const reportPath = this.options.dryRun
      ? 'docs/COLOR_CONVERSION_DRY_RUN_REPORT.md'
      : 'docs/COLOR_CONVERSION_REPORT.md';

    const residualEntries = Object.entries(this.stats.residualHexCounts)
      .sort((a, b) => b[1] - a[1]);
    const residualSection = residualEntries.length === 0
      ? '잔존 hex 없음 ✅'
      : residualEntries.slice(0, 50).map(([hex, count]) => {
          const lenLabel = hex.length === 4 ? '3자리'
            : hex.length === 5 ? '4자리'
            : hex.length === 7 ? '6자리'
            : hex.length === 9 ? '8자리'
            : '기타';
          return `- \`${hex}\` (${lenLabel}): ${count}건`;
        }).join('\n');
    const residualTotal = residualEntries.reduce((s, [, n]) => s + n, 0);
    const residualUnique = residualEntries.length;

    const protectedFallbackEntries = Object.entries(this.stats.protectedVarFallbackHexCounts)
      .sort((a, b) => b[1] - a[1]);
    const protectedFallbackSection = protectedFallbackEntries.length === 0
      ? '보호된 폴백 hex 없음 (영향 0건)'
      : protectedFallbackEntries.slice(0, 50)
          .map(([hex, count]) => `- \`${hex}\`: ${count}건`)
          .join('\n');

    const targetSummary = Array.isArray(this.options.target) && this.options.target.length > 0
      ? this.options.target.map(t => `\`${t}\``).join(', ')
      : '전체 (`frontend/src`)';

    const report = `# 🎨 색상 변환 리포트

> **생성일**: ${new Date().toISOString()}  
> **모드**: ${this.options.dryRun ? 'DRY RUN' : 'ACTUAL'}  
> **대상 영역**: ${targetSummary}  
> **필터**: ${this.options.criticalOnly ? '중요 파일만' : '전체 파일'}

---

## 📊 변환 결과

| 구분 | 수량 |
|------|------|
| 처리된 파일 | ${this.stats.filesProcessed}개 |
| 수정된 파일 | ${this.stats.filesModified}개 |
| 변환된 색상 | ${this.stats.colorsConverted}개 |
| 생성된 백업 | ${this.stats.backupsCreated}개 |
| R-2 폴백 보호 | ${this.stats.protectedVarFallbacks}건 |
| 오류 발생 | ${this.stats.errors.length}개 |

---

## 🛡️ R-2 — \`var(--token, #hex)\` 폴백 보호

> 시각 QA 보고서 §6 R-2 — 폴백 위치의 hex 가 nested var 로 잘못 치환되는 사고 방지.  
> 본 영역은 codemod 의 HEX 매핑에서 명시적으로 제외된다.  
> D3 적용 라운드처럼 매핑이 늘어나도 폴백 hex 는 안전.

- **보호된 폴백 총 건수**: ${this.stats.protectedVarFallbacks}건
- **보호된 폴백 고유 hex 종 수**: ${protectedFallbackEntries.length}종

${protectedFallbackSection}

---

## 🔍 잔존 hex 색상 (매핑 외)

> 처리 후에도 변환되지 않고 남아 있는 hex 색상.  
> 회색 3자리(\`#666\`·\`#333\`·\`#000\`·\`#ccc\`·\`#999\`·\`#eee\` 등) 미매핑 항목과  
> 4·8자리 alpha 포함 hex 모두 포함. D3 합의서 작성/적용 라운드의 데이터 소스.

- **고유 종 수**: ${residualUnique}종
- **총 건수**: ${residualTotal}건

${residualSection}

---

## 🎯 변환 규칙

### HEX 색상 변환
${Object.entries(COLOR_MAPPING).map(([hex, cssVar]) =>
  `- \`${hex}\` → \`${cssVar}\``
).join('\n')}

### RGB/RGBA 색상 변환  
${Object.entries(RGB_MAPPING).map(([rgb, cssVar]) =>
  `- \`${rgb}\` → \`${cssVar}\``
).join('\n')}

---

## 📋 다음 단계

1. **검증**: 변환된 파일들이 정상 동작하는지 확인
2. **테스트**: 전체 시스템 빌드 및 테스트 실행
3. **CSS 변수 정의**: 새로운 CSS 변수들이 실제로 정의되어 있는지 확인
4. **시각적 검토**: UI가 기존과 동일하게 표시되는지 확인

---

## 🚨 오류 목록

${this.stats.errors.length > 0 ?
  this.stats.errors.map(({ file, error }) => `- \`${file}\`: ${error}`).join('\n') :
  '오류 없음 ✅'
}

---

**💡 다음 실행**: \`node scripts/validate-css-variables.js\`로 CSS 변수 정의 확인
`;

    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 상세 리포트 생성: ${reportPath}`);
  }
}

// CLI 인터페이스
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { target: [] };

  const loadTargetsFile = (filePath) => {
    // 다중 --target 인자 안전성 (T1 2차 §6.1 zsh $TARGETS 단어 분리 문제 재발 방지)
    // 파일에서 영역 목록을 한 줄에 하나씩 읽고 빈 줄·`#` 주석은 무시.
    const absPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absPath)) {
      console.error(`❌ --targets-file 경로를 찾을 수 없습니다: ${filePath}`);
      process.exit(2);
    }
    const lines = fs.readFileSync(absPath, 'utf8').split(/\r?\n/);
    for (const raw of lines) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('#')) continue;
      options.target.push(trimmed);
    }
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--no-backup') options.backup = false;
    else if (arg === '--no-report') options.report = false;
    else if (arg === '--verbose') options.verbose = true;
    else if (arg === '--critical-only') options.criticalOnly = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--target' && args[i + 1]) {
      options.target.push(args[i + 1]);
      i++;
    } else if (arg.startsWith('--target=')) {
      options.target.push(arg.split('=')[1]);
    } else if (arg === '--targets-file' && args[i + 1]) {
      loadTargetsFile(args[i + 1]);
      i++;
    } else if (arg.startsWith('--targets-file=')) {
      loadTargetsFile(arg.split('=')[1]);
    } else if (arg === '--token-priority' && args[i + 1]) {
      options.tokenPriority = args[i + 1].split(',').map(s => s.trim()).filter(Boolean);
      i++;
    } else if (arg.startsWith('--token-priority=')) {
      options.tokenPriority = arg.split('=')[1].split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  if (options.target.length === 0) {
    options.target = null;
  }

  return options;
}

// ── T-D 진입 가드 (D5 §3.1·§4 P1-a) ─────────────────────────────────────────
// 직전 라운드 회귀 4건 (R-3·R-4·weekend·R-5) 모두 codemod 가 토큰 매핑을
// 일괄 치환했지만 SSOT 정의 없는 토큰을 사용한 사이드이펙트가 원인.
// 본 가드는 codemod 진입 시 다음을 차단한다:
//   1) check-token-ssot.js 가 ERROR 보고 → 즉시 abort
//   2) 매핑 텍스트에서 동일 hex → 다중 `--mg-color-*` 매핑 (alias 충돌) 발견 시
//      `--token-priority` 옵션이 없으면 abort
//
// `--skip-ssot-check` 옵션은 주지 않는다 — 가드 회피 경로를 차단하기 위함.
function runEntryGuards(options) {
  const lintScript = path.resolve(__dirname, 'check-token-ssot.js');
  if (!fs.existsSync(lintScript)) {
    console.error('🚨 [T-D 가드] SSOT lint 스크립트가 존재하지 않습니다:');
    console.error(`   ${lintScript}`);
    console.error('   codemod 사이드이펙트 차단 가드가 비활성 상태로 진행할 수 없습니다.');
    process.exit(1);
  }

  const lintArgs = ['--quiet'];
  if (Array.isArray(options.tokenPriority) && options.tokenPriority.length > 0) {
    lintArgs.push('--token-priority', options.tokenPriority.join(','));
  }

  console.log('🔍 [T-D 가드] check-token-ssot.js 실행 중...');
  const result = spawnSync(process.execPath, [lintScript, ...lintArgs], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    console.error('');
    console.error('🚨 [T-D 가드] SSOT cross-check 실패 — codemod 를 abort 합니다.');
    console.error('   D5 §3.1·§4 P1-a: SSOT 정의 누락·alias 충돌 토큰의 일괄 치환은 회귀를 유발합니다.');
    console.error('   1) 위 lint 출력의 ❌ ERROR / 🚨 alias 충돌 항목을 먼저 해소하세요.');
    console.error('   2) 의도적 alias 충돌 운영 시 `--token-priority a,b,c` 옵션을 추가하세요.');
    process.exit(result.status || 1);
  }

  console.log('✅ [T-D 가드] SSOT cross-check 통과. codemod 본문 실행을 계속합니다.\n');
}

// 스크립트 실행
if (require.main === module) {
  const options = parseArgs();

  const usage = [
    '사용법:',
    '  node scripts/design-system/color-management/convert-hardcoded-colors.js [옵션]',
    '',
    '옵션:',
    '  --dry-run                 실제 파일 수정 없이 미리보기 (보고서는 별도 경로에 저장)',
    '  --no-backup               백업 파일 생성 안함',
    '  --no-report               docs/COLOR_CONVERSION_*REPORT.md 생성 생략',
    '  --verbose                 상세 로그 출력',
    '  --critical-only           중요 파일만 처리',
    '  --target <path>           처리 영역을 디렉터리/파일로 한정 (반복 지정 가능)',
    '  --targets-file <path>     영역 목록 파일에서 한 줄에 하나씩 읽어 처리',
    '                            (zsh $TARGETS 단어 분리 문제 회피 — T1 2차 §6.1)',
    '  --token-priority a,b,c    [T-D 가드] alias 충돌 발견 시 명시적 우선순위 (인지 신호)',
    '                            옵션 미지정 + 매핑에 동일 hex → 다중 --mg-color-* 토큰',
    '                            매핑이 있을 때 lint 가 abort 한다.',
    '  --help, -h                도움말 출력',
    '',
    '예시 (영역 목록 파일):',
    '  # scripts/design-system/color-management/targets.b7.txt',
    '  frontend/src/components/common',
    '  frontend/src/components/admin/commoncode',
    '  frontend/src/styles/06-components',
    '',
    '  node scripts/design-system/color-management/convert-hardcoded-colors.js \\\\',
    '       --dry-run --targets-file scripts/design-system/color-management/targets.b7.txt',
    '',
    '안전성:',
    '  - 토큰 정의 파일 (unified-design-tokens / dashboard-tokens-extension /',
    '    responsive-layout-tokens / mindgarden-design-system /',
    '    00-core/_variables / 00-core/_component-variables / common/variables /',
    '    constants/css-variables.js) 은 항상 처리 대상에서 제외 (T1 2차 §6.2 재발 방지)',
    '  - *tokens*.css / *variables*.css / *design-system*.css / tokens/* / themes/*',
    '    및 *.test.* / *.spec.* / *.stories.* / __tests__/ 도 자동 제외',
    '  - var(--token, #hex) 폴백 위치의 hex 는 절대 변환하지 않음 (시각 QA R-2 보호).',
    '    예: `var(--cs-error-600, #dc2626)` → 그대로 유지 (nested var 부작용 방지)',
    '  - [T-D 가드, D5 §3.1·§4 P1-a] 진입 시 check-token-ssot.js 를 호출해',
    '    매핑 토큰의 SSOT 정의·alias 충돌을 cross-check. 실패 시 즉시 abort.',
    ''
  ].join('\n');

  if (options.help) {
    console.log(usage);
    process.exit(0);
  }

  console.log(usage);

  // T-D 진입 가드: lint·alias 충돌 사전 차단 (D5 §3.1·§4 P1-a)
  runEntryGuards(options);

  const converter = new HardcodedColorConverter(options);
  converter.run().catch(console.error);
}

module.exports = HardcodedColorConverter;