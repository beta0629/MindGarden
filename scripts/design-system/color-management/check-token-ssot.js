#!/usr/bin/env node

/**
 * 색상 codemod 매핑 토큰 ↔ SSOT 정의 cross-check (T-D 가드)
 *
 * 직전 라운드 회귀 4건 (R-3·R-4·weekend·R-5) 의 근본 원인은
 * codemod 가 토큰 매핑은 일괄 치환했지만 SSOT 정의가 빠진 토큰을 사용하여
 * 무폴백 사용처에서 색이 비어 보이는 사이드이펙트.
 *
 * 본 lint 스크립트는 codemod 진입 가드 의 1차 안전망으로 동작하며 다음을 검사한다:
 *   1) `convert-hardcoded-colors.js` 매핑에서 `var(--mg-color-*)` 토큰을 모두 추출
 *   2) `frontend/src/styles/unified-design-tokens.css` 에서 라이트(:root) 와
 *      다크(:root[data-theme="dark"] / [data-theme='dark']) 양쪽 정의 cross-check
 *   3) 정의가 alias(`var(--mg-color-other)`)인 경우 chain 끝까지 follow
 *      (chain 깊이 5단 이상 또는 cycle 시 경고)
 *   4) 매핑 텍스트에서 동일 hex 키가 두 번 이상 등장하면서 둘 이상의
 *      서로 다른 `--mg-color-*` 토큰으로 매핑되는 경우 alias 충돌로 보고
 *
 * 출력 정책
 *   - ❌ ERROR  : 라이트 정의 자체가 없거나 chain 끝에서 resolve 실패 → exit 1
 *   - ⚠️ WARN   : 라이트 정의는 있으나 다크 정의 없음 (CSS cascade 로 라이트 톤 사용) /
 *                 alias chain 깊이 ≥ 5 / cycle → exit 0 (보고만)
 *   - 🚨 COLLIDE: 동일 hex → 다중 `--mg-color-*` 매핑 → exit 1
 *
 * 옵션
 *   --mapping <path>          매핑 소스 (기본: 동봉 convert-hardcoded-colors.js)
 *   --ssot <path>             SSOT (기본: frontend/src/styles/unified-design-tokens.css)
 *   --json                    결과를 JSON 으로 출력 (CI 인입용)
 *   --quiet                   PASS 토큰 출력 생략 (ERROR/WARN 만)
 *   --token-priority <list>   alias 충돌 발견 시 명시적 우선순위 (인지 신호) — comma 구분
 *                             옵션 미지정 + 충돌 발견 시 abort
 *   --help, -h                도움말
 *
 * @author MindGarden Team
 * @since 2026-05-21
 * @version 1.0.0 (T-D 가드, D5 §3.1·§4 P1-a)
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../../../');
const DEFAULT_MAPPING_PATH = path.resolve(__dirname, 'convert-hardcoded-colors.js');
const DEFAULT_SSOT_PATH = path.resolve(REPO_ROOT, 'frontend/src/styles/unified-design-tokens.css');

const MAX_ALIAS_DEPTH = 5;
const MG_COLOR_TOKEN_RE = /^--mg-color-[a-z0-9-]+$/;

// ── CLI 파서 ─────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const opts = {
    mappingPath: DEFAULT_MAPPING_PATH,
    ssotPath: DEFAULT_SSOT_PATH,
    json: false,
    quiet: false,
    tokenPriority: null,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--json') opts.json = true;
    else if (arg === '--quiet') opts.quiet = true;
    else if (arg === '--mapping' && argv[i + 1]) {
      opts.mappingPath = path.resolve(process.cwd(), argv[++i]);
    } else if (arg.startsWith('--mapping=')) {
      opts.mappingPath = path.resolve(process.cwd(), arg.split('=')[1]);
    } else if (arg === '--ssot' && argv[i + 1]) {
      opts.ssotPath = path.resolve(process.cwd(), argv[++i]);
    } else if (arg.startsWith('--ssot=')) {
      opts.ssotPath = path.resolve(process.cwd(), arg.split('=')[1]);
    } else if (arg === '--token-priority' && argv[i + 1]) {
      opts.tokenPriority = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
    } else if (arg.startsWith('--token-priority=')) {
      opts.tokenPriority = arg.split('=')[1].split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  return opts;
}

// ── 매핑 추출 ────────────────────────────────────────────────────────────────
/**
 * convert-hardcoded-colors.js 소스 텍스트에서 `--mg-color-*` 매핑을 추출한다.
 *
 * 객체 리터럴이 아닌 소스 텍스트 기반 추출이므로, 동일 hex 키가 두 번 등장
 * (런타임에는 마지막만 살아남음)하는 경우도 모두 잡아낸다.
 * → 검증 시나리오 3 (alias 충돌) 의 핵심 데이터 소스.
 *
 * 반환:
 *   {
 *     tokens: Set<string>,           // 모든 `--mg-color-*` 토큰 (중복 제거)
 *     hexToTokens: Map<hex, string[]>, // hex 키별 매핑된 토큰 리스트 (소스 등장 순)
 *     entries: [{hex, token, line}], // 모든 매핑 줄 (디버깅용)
 *   }
 */
function extractMappingTokens(mappingPath) {
  const src = fs.readFileSync(mappingPath, 'utf8');
  const lines = src.split('\n');
  const tokens = new Set();
  const hexToTokens = new Map();
  const entries = [];

  // `'#hex': 'var(--mg-color-name)'` 또는 `'rgb(...)': 'var(--mg-color-name)'` 라인
  // 객체 키는 작은따옴표만 사용한다는 가정 (현행 매핑이 모두 작은따옴표).
  const lineRegex = /^\s*'([^']+)'\s*:\s*'var\(\s*(--mg-color-[a-z0-9-]+)\s*\)'/;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(lineRegex);
    if (!m) continue;
    const hex = m[1].toLowerCase();
    const token = m[2];
    tokens.add(token);
    if (!hexToTokens.has(hex)) hexToTokens.set(hex, []);
    hexToTokens.get(hex).push(token);
    entries.push({ hex, token, line: i + 1 });
  }

  return { tokens, hexToTokens, entries };
}

// ── SSOT 파싱 ────────────────────────────────────────────────────────────────
/**
 * CSS 파일을 selector 블록 단위로 파싱.
 * - 블록 주석 제거 후 balanced-brace 스캔
 * - 미디어쿼리 안의 :root 같은 nested 케이스도 동일하게 추출되며, 본 lint 는
 *   selector 텍스트만 보고 light/dark 분류하므로 의도 부합.
 */
function parseCssBlocks(src) {
  const noComments = src.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = [];
  let i = 0;
  let cursor = 0;

  while (i < noComments.length) {
    const braceStart = noComments.indexOf('{', i);
    if (braceStart < 0) break;

    const selector = noComments.slice(cursor, braceStart).trim();

    let depth = 1;
    let j = braceStart + 1;
    while (j < noComments.length && depth > 0) {
      const ch = noComments[j];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      j++;
    }
    if (depth !== 0) break;

    const body = noComments.slice(braceStart + 1, j - 1);
    blocks.push({ selector, body });
    i = j;
    cursor = j;
  }

  return blocks;
}

/**
 * selector 가 light(:root) / dark(data-theme=dark) 블록인지 판별.
 * - light : selector 가 정확히 `:root` (콤마 분리된 부분 중 하나)
 * - dark  : selector 어디든 `[data-theme="dark"]` 또는 `[data-theme='dark']` 포함
 *           (`:root[data-theme="dark"]` 도 dark 로 분류)
 */
function classifySelector(selector) {
  const parts = selector.split(',').map(s => s.trim());
  let isLight = false;
  let isDark = false;
  for (const p of parts) {
    if (/\[data-theme\s*=\s*['"]dark['"]\]/.test(p)) {
      isDark = true;
    } else if (p === ':root') {
      isLight = true;
    }
  }
  return { isLight, isDark };
}

/**
 * 블록 본문에서 `--mg-color-*` 정의 추출.
 * 같은 토큰이 한 블록에 여러 번 정의되면 마지막 값이 유효 (CSS 캐스케이드).
 */
function extractColorTokenDefs(body) {
  const defs = new Map();
  const re = /(--mg-color-[a-z0-9-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    defs.set(m[1], m[2].trim());
  }
  return defs;
}

function parseSSOT(ssotPath) {
  const src = fs.readFileSync(ssotPath, 'utf8');
  const blocks = parseCssBlocks(src);
  const lightDefs = new Map();
  const darkDefs = new Map();

  for (const block of blocks) {
    const { isLight, isDark } = classifySelector(block.selector);
    if (!isLight && !isDark) continue;
    const defs = extractColorTokenDefs(block.body);
    const target = isDark ? darkDefs : lightDefs;
    for (const [k, v] of defs) {
      target.set(k, v);
    }
  }

  return { lightDefs, darkDefs };
}

// ── alias chain follow ──────────────────────────────────────────────────────
/**
 * 정의 값이 `var(--xxx)` alias 인 경우 chain 을 끝까지 따라간다.
 * - hex / rgb / 그 외 비-alias 값에서 종료
 * - depth ≥ MAX_ALIAS_DEPTH 또는 cycle 시 경고
 *
 * 다크 chain follow 시에도 상위 토큰은 light 정의에서 fallback 하지 않는다
 * (light 와 dark 는 독립 cascade — CSS 동작과 일치). 따라서 darkDefs 만 사용.
 *
 * 단, 라이트 정의는 있으나 다크에 정의 없을 경우 (CSS 동작상 라이트 캐스케이드)
 * 호출자(checkToken) 가 별도 분기로 WARN 처리한다.
 */
function followChain(token, defs, options = {}) {
  const visited = new Set();
  let cur = token;
  let depth = 0;
  while (true) {
    if (visited.has(cur)) {
      return { resolved: null, depth, warning: 'cycle', last: cur };
    }
    visited.add(cur);
    const value = defs.get(cur);
    if (value === undefined) {
      return { resolved: null, depth, warning: 'undefined', last: cur };
    }
    const aliasMatch = value.match(/^var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)$/);
    if (!aliasMatch) {
      return { resolved: value, depth, warning: depth >= MAX_ALIAS_DEPTH ? 'depth-exceeded' : null, last: cur };
    }
    cur = aliasMatch[1];
    depth++;
    if (depth > MAX_ALIAS_DEPTH) {
      return { resolved: null, depth, warning: 'depth-exceeded', last: cur };
    }
  }
}

// ── 메인 검사 ────────────────────────────────────────────────────────────────
function checkTokens(tokens, lightDefs, darkDefs) {
  const result = {
    pass: [],          // 라이트+다크 모두 정의 / chain resolve OK
    warnDarkMissing: [], // 라이트 OK, 다크 정의 없음 (cascade)
    warnDeep: [],      // chain 깊이 초과
    warnCycle: [],     // chain cycle
    errorLight: [],    // 라이트 정의 자체 없음 또는 resolve 실패
  };

  for (const token of tokens) {
    if (!MG_COLOR_TOKEN_RE.test(token)) continue;
    const lightCheck = followChain(token, lightDefs);
    const darkCheck = followChain(token, darkDefs);

    if (!lightCheck.resolved) {
      result.errorLight.push({
        token,
        side: 'light',
        reason: lightCheck.warning,
        last: lightCheck.last,
      });
      continue;
    }

    if (lightCheck.warning === 'depth-exceeded') {
      result.warnDeep.push({ token, side: 'light', depth: lightCheck.depth });
    } else if (lightCheck.warning === 'cycle') {
      result.warnCycle.push({ token, side: 'light' });
    }

    if (!darkCheck.resolved) {
      // 라이트 정의는 통과 — 다크는 cascade 가 동작하므로 WARN 만.
      result.warnDarkMissing.push({
        token,
        reason: darkCheck.warning,
        last: darkCheck.last,
      });
    } else {
      if (darkCheck.warning === 'depth-exceeded') {
        result.warnDeep.push({ token, side: 'dark', depth: darkCheck.depth });
      } else if (darkCheck.warning === 'cycle') {
        result.warnCycle.push({ token, side: 'dark' });
      }
      result.pass.push({
        token,
        light: lightCheck.resolved,
        dark: darkCheck.resolved,
      });
    }
  }

  return result;
}

function detectAliasCollisions(hexToTokens) {
  const collisions = [];
  for (const [hex, tokens] of hexToTokens) {
    const colorTokens = tokens.filter(t => MG_COLOR_TOKEN_RE.test(t));
    const unique = Array.from(new Set(colorTokens));
    if (unique.length >= 2) {
      collisions.push({ hex, tokens: unique });
    }
  }
  return collisions;
}

// ── 출력 ─────────────────────────────────────────────────────────────────────
function printText(report, opts) {
  const {
    mappingPath, ssotPath, summary, checks, collisions, exitCode, tokenPriority,
  } = report;

  const out = (msg) => console.log(msg);
  const err = (msg) => console.error(msg);

  out('🔍 SSOT 토큰 cross-check (T-D 가드, D5 §3.1·§4 P1-a)');
  out('='.repeat(66));
  out(`📂 매핑: ${path.relative(process.cwd(), mappingPath) || mappingPath}`);
  out(`📂 SSOT : ${path.relative(process.cwd(), ssotPath) || ssotPath}`);
  out('');
  out(`총 매핑 --mg-color-* 토큰    : ${summary.totalTokens}건`);
  out(`✅ PASS (라이트+다크 정의)   : ${checks.pass.length}건`);
  out(`⚠️  WARN — 다크 정의 없음     : ${checks.warnDarkMissing.length}건`);
  out(`⚠️  WARN — chain 깊이 ≥ ${MAX_ALIAS_DEPTH} : ${checks.warnDeep.length}건`);
  out(`⚠️  WARN — chain cycle        : ${checks.warnCycle.length}건`);
  out(`❌ ERROR — 라이트 정의 누락   : ${checks.errorLight.length}건`);
  out(`🚨 alias 충돌 (동일 hex 다중) : ${collisions.length}건`);
  out('');

  if (!opts.quiet && checks.pass.length > 0) {
    out('--- ✅ PASS ---');
    for (const r of checks.pass) {
      out(`  ${r.token}  light=${truncate(r.light, 40)}  dark=${truncate(r.dark, 40)}`);
    }
    out('');
  }

  if (checks.warnDarkMissing.length > 0) {
    out('--- ⚠️  다크 정의 없음 (CSS cascade 로 라이트 톤 사용) ---');
    for (const w of checks.warnDarkMissing) {
      out(`  ${w.token}  reason=${w.reason}  lastToken=${w.last}`);
    }
    out('');
  }

  if (checks.warnDeep.length > 0) {
    out('--- ⚠️  alias chain 깊이 초과 ---');
    for (const w of checks.warnDeep) {
      out(`  ${w.token}  side=${w.side}  depth=${w.depth}`);
    }
    out('');
  }

  if (checks.warnCycle.length > 0) {
    out('--- ⚠️  alias cycle 감지 ---');
    for (const w of checks.warnCycle) {
      out(`  ${w.token}  side=${w.side}`);
    }
    out('');
  }

  if (checks.errorLight.length > 0) {
    err('--- ❌ ERROR — 라이트 정의 누락 ---');
    for (const e of checks.errorLight) {
      err(`  ${e.token}  reason=${e.reason}  lastToken=${e.last}`);
    }
    err('');
  }

  if (collisions.length > 0) {
    err('--- 🚨 alias 충돌 (동일 hex → 다중 --mg-color-* 토큰 매핑) ---');
    for (const c of collisions) {
      err(`  hex='${c.hex}' → tokens=[${c.tokens.join(', ')}]`);
    }
    if (tokenPriority && tokenPriority.length > 0) {
      err(`  ⓘ --token-priority 지정: [${tokenPriority.join(', ')}]`);
      err('     충돌은 인지된 상태로 보고만 수행 (매핑 변경은 사용자 책임).');
    } else {
      err('  ⓘ 명시적 우선순위 미지정 → abort.');
      err('     의도적 운영 시 --token-priority a,b,c 옵션을 추가하라.');
    }
    err('');
  }

  if (exitCode === 0) {
    out('✅ 결과: PASS (ERROR 없음, WARN 만 존재 가능 — 운영 cascade 영향 없음)');
  } else {
    err(`❌ 결과: FAIL (exit ${exitCode})`);
    err('   ↳ codemod 진입 가드는 본 lint 실패 시 abort 한다.');
  }
}

function truncate(s, n) {
  if (typeof s !== 'string') return s;
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

// ── 진입점 ───────────────────────────────────────────────────────────────────
function main(argv = process.argv) {
  const opts = parseArgs(argv);

  if (opts.help) {
    console.log([
      '사용법:',
      '  node scripts/design-system/color-management/check-token-ssot.js [옵션]',
      '',
      '옵션:',
      '  --mapping <path>         매핑 소스 (기본: convert-hardcoded-colors.js)',
      '  --ssot <path>            SSOT (기본: frontend/src/styles/unified-design-tokens.css)',
      '  --json                   JSON 출력',
      '  --quiet                  PASS 토큰 출력 생략',
      '  --token-priority a,b,c   alias 충돌 발견 시 명시적 우선순위 (인지 신호)',
      '  --help, -h               이 도움말',
      '',
      '종료 코드:',
      '  0  PASS (ERROR/충돌 없음, WARN 만 존재 가능)',
      '  1  ERROR (라이트 정의 누락) 또는 alias 충돌 감지',
      '',
      'codemod 진입 가드 시:',
      '  scripts/design-system/color-management/convert-hardcoded-colors.js 가',
      '  본 스크립트를 spawnSync 로 호출하여 exit !== 0 일 때 즉시 abort 한다.',
    ].join('\n'));
    process.exit(0);
  }

  if (!fs.existsSync(opts.mappingPath)) {
    console.error(`❌ 매핑 파일을 찾을 수 없습니다: ${opts.mappingPath}`);
    process.exit(2);
  }
  if (!fs.existsSync(opts.ssotPath)) {
    console.error(`❌ SSOT 파일을 찾을 수 없습니다: ${opts.ssotPath}`);
    process.exit(2);
  }

  const { tokens, hexToTokens, entries } = extractMappingTokens(opts.mappingPath);
  const { lightDefs, darkDefs } = parseSSOT(opts.ssotPath);
  const tokenList = Array.from(tokens).sort();
  const checks = checkTokens(tokenList, lightDefs, darkDefs);
  const collisions = detectAliasCollisions(hexToTokens);

  const collisionFatal = collisions.length > 0 && (!opts.tokenPriority || opts.tokenPriority.length === 0);
  const exitCode = (checks.errorLight.length > 0 || collisionFatal) ? 1 : 0;

  const report = {
    mappingPath: opts.mappingPath,
    ssotPath: opts.ssotPath,
    summary: {
      totalTokens: tokenList.length,
      totalMappingEntries: entries.length,
      lightDefsTotal: lightDefs.size,
      darkDefsTotal: darkDefs.size,
    },
    checks,
    collisions,
    tokenPriority: opts.tokenPriority,
    exitCode,
  };

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printText(report, opts);
  }

  process.exit(exitCode);
}

if (require.main === module) {
  main();
}

module.exports = {
  extractMappingTokens,
  parseSSOT,
  followChain,
  checkTokens,
  detectAliasCollisions,
  classifySelector,
  parseCssBlocks,
};
