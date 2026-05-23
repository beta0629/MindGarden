#!/usr/bin/env node

/**
 * Codemod 매핑 SSOT lint — D5 §3.1·§4 P1-a 명세 호환 진입점
 *
 * 본 스크립트는 색상 codemod (`convert-hardcoded-colors.js`) 가 치환 대상으로
 * 사용하는 모든 `var(--mg-color-*)` 토큰에 대해 두 가지 가드를 사전 검증한다:
 *
 *   가드 1) **SSOT 사전 lint**:
 *     `frontend/src/styles/unified-design-tokens.css` 에 라이트(:root) 정의가
 *     존재하는지 확인. alias chain 의 끝까지 follow 하여 resolve 실패 시 abort.
 *
 *   가드 2) **alias 충돌 사전 차단**:
 *     동일 hex 키가 둘 이상의 서로 다른 `--mg-color-*` 토큰으로 매핑된 경우
 *     R-5 회귀 (alias 톤 분리 합의 부재로 임의 선택) 재발을 방지하기 위해
 *     `--allow-duplicate-alias` (또는 `--token-priority`) 명시 없으면 abort.
 *
 * 핵심 로직은 `check-token-ssot.js` 가 모듈로 export 한 함수들에 위임한다.
 * 본 wrapper 의 책무는 사용자 명세 호환 CLI (이름·옵션) 와 `--strict` 승격이다.
 *
 * 옵션
 *   --mapping <path>           매핑 소스 (기본: ./convert-hardcoded-colors.js)
 *   --ssot <path>              SSOT (기본: frontend/src/styles/unified-design-tokens.css)
 *   --strict                   WARN (다크 미정의 / chain 깊이 / cycle) 도 ERROR 로 승격
 *   --quiet                    PASS 토큰 출력 생략 (ERROR/WARN/COLLIDE 만)
 *   --allow-duplicate-alias    동일 hex → 다중 토큰 매핑을 의도된 운영으로 허용
 *                              (내부적으로 check-token-ssot.js 의
 *                               --token-priority 와 동일 효과 — 인지 신호)
 *   --token-priority a,b,c     (호환) check-token-ssot.js 옵션을 그대로 위임.
 *                              `--allow-duplicate-alias` 와 동시에 지정 시 본 옵션 우선.
 *   --json                     결과를 JSON 으로 출력 (CI 인입용)
 *   --help, -h                 도움말
 *
 * 종료 코드
 *   0  PASS (ERROR/충돌 없음; --strict 미지정 시 WARN 만 존재 가능)
 *   1  ERROR (SSOT 정의 누락 / alias 충돌 / --strict 모드의 WARN)
 *
 * @author MindGarden Team
 * @since 2026-05-23
 * @version 1.0.0 (D5 T-D 가드 — 사용자 명세 호환 wrapper)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const {
    extractMappingTokens,
    parseSSOT,
    checkTokens,
    detectAliasCollisions
} = require('./check-token-ssot.js');

const REPO_ROOT = path.resolve(__dirname, '../../../');
const DEFAULT_MAPPING_PATH = path.resolve(__dirname, 'convert-hardcoded-colors.js');
const DEFAULT_SSOT_PATH = path.resolve(REPO_ROOT, 'frontend/src/styles/unified-design-tokens.css');

const MG_COLOR_TOKEN_RE = /^--mg-color-[a-z0-9-]+$/;

function parseArgs(argv) {
    const opts = {
        mappingPath: DEFAULT_MAPPING_PATH,
        ssotPath: DEFAULT_SSOT_PATH,
        strict: false,
        quiet: false,
        allowDuplicateAlias: false,
        tokenPriority: null,
        json: false,
        help: false
    };

    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--help' || arg === '-h') opts.help = true;
        else if (arg === '--strict') opts.strict = true;
        else if (arg === '--quiet') opts.quiet = true;
        else if (arg === '--allow-duplicate-alias') opts.allowDuplicateAlias = true;
        else if (arg === '--json') opts.json = true;
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

function printHelp() {
    console.log([
        '사용법:',
        '  node scripts/design-system/color-management/validate-codemod-mappings.js [옵션]',
        '',
        '책무 (D5 §3.1·§4 P1-a — T-D 가드):',
        '  가드 1) 매핑 대상 토큰의 SSOT 사전 lint',
        '         frontend/src/styles/unified-design-tokens.css 에 정의되지 않은',
        '         `var(--mg-color-*)` 토큰을 매핑이 사용하면 ❌ ERROR 후 exit 1.',
        '  가드 2) alias 충돌 사전 차단',
        '         동일 hex → 다중 `--mg-color-*` 매핑은 R-5 류 회귀의 직접 원인.',
        '         `--allow-duplicate-alias` 또는 `--token-priority` 명시 없으면 abort.',
        '',
        '옵션:',
        '  --mapping <path>           매핑 소스 (기본: convert-hardcoded-colors.js)',
        '  --ssot <path>              SSOT (기본: frontend/src/styles/unified-design-tokens.css)',
        '  --strict                   WARN (다크 미정의/chain 깊이/cycle) 도 ERROR 로 승격',
        '  --quiet                    PASS 토큰 출력 생략',
        '  --allow-duplicate-alias    동일 hex → 다중 토큰 매핑을 의도된 운영으로 허용',
        '  --token-priority a,b,c     (호환) check-token-ssot.js 옵션을 그대로 위임',
        '  --json                     JSON 출력 (CI 인입용)',
        '  --help, -h                 도움말',
        '',
        '종료 코드:',
        '  0  PASS',
        '  1  ERROR (SSOT 정의 누락 / alias 충돌 / --strict 모드의 WARN)',
        '',
        '연계:',
        '  본 lint 는 convert-hardcoded-colors.js 진입 시 자동 호출되며,',
        '  실패 시 codemod 본문 실행이 abort 된다. (`--skip-validation` 미지정 기준)',
        '  npm script: `lint:codemod-mappings` (루트) / `check:token-ssot` (frontend)'
    ].join('\n'));
}

function truncate(s, n) {
    if (typeof s !== 'string') return s;
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function printText(report, opts) {
    const { checks, collisions, summary } = report;
    const out = (msg) => console.log(msg);
    const err = (msg) => console.error(msg);

    out('🔍 validate-codemod-mappings — T-D 가드 (D5 §3.1·§4 P1-a)');
    out('='.repeat(66));
    out(`📂 매핑: ${path.relative(process.cwd(), report.mappingPath) || report.mappingPath}`);
    out(`📂 SSOT : ${path.relative(process.cwd(), report.ssotPath) || report.ssotPath}`);
    out('');
    out(`총 매핑 --mg-color-* 토큰    : ${summary.totalTokens}건`);
    out(`✅ PASS (라이트+다크 정의)   : ${checks.pass.length}건`);
    out(`⚠️  WARN — 다크 정의 없음     : ${checks.warnDarkMissing.length}건${opts.strict ? ' (strict 모드 → ERROR 승격)' : ''}`);
    out(`⚠️  WARN — chain 깊이 ≥ 5    : ${checks.warnDeep.length}건${opts.strict ? ' (strict 모드 → ERROR 승격)' : ''}`);
    out(`⚠️  WARN — chain cycle        : ${checks.warnCycle.length}건${opts.strict ? ' (strict 모드 → ERROR 승격)' : ''}`);
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
        const tag = opts.strict ? '❌ ERROR (strict)' : '⚠️  WARN';
        out(`--- ${tag} — 다크 정의 없음 (CSS cascade 로 라이트 톤 사용) ---`);
        for (const w of checks.warnDarkMissing) {
            out(`  ${w.token}  reason=${w.reason}  lastToken=${w.last}`);
        }
        out('');
    }

    if (checks.warnDeep.length > 0) {
        const tag = opts.strict ? '❌ ERROR (strict)' : '⚠️  WARN';
        out(`--- ${tag} — alias chain 깊이 초과 ---`);
        for (const w of checks.warnDeep) {
            out(`  ${w.token}  side=${w.side}  depth=${w.depth}`);
        }
        out('');
    }

    if (checks.warnCycle.length > 0) {
        const tag = opts.strict ? '❌ ERROR (strict)' : '⚠️  WARN';
        out(`--- ${tag} — alias cycle 감지 ---`);
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
        if (opts.allowDuplicateAlias || (opts.tokenPriority && opts.tokenPriority.length > 0)) {
            const label = opts.tokenPriority && opts.tokenPriority.length > 0
                ? `--token-priority=[${opts.tokenPriority.join(', ')}]`
                : '--allow-duplicate-alias';
            err(`  ⓘ ${label} 지정 → 충돌은 인지된 상태로 보고만 수행.`);
        } else {
            err('  ⓘ 명시적 허용 옵션 미지정 → abort.');
            err('     의도적 운영 시 --allow-duplicate-alias 또는 --token-priority a,b,c 추가.');
        }
        err('');
    }

    if (report.exitCode === 0) {
        out('✅ 결과: PASS (가드 1·2 모두 통과 — codemod 진입 안전)');
    } else {
        err(`❌ 결과: FAIL (exit ${report.exitCode}) — codemod 진입 가드 abort 사유`);
        err('   ↳ ERROR / alias 충돌 (또는 --strict 모드 WARN) 해소 후 재실행 필요.');
    }
}

function main(argv = process.argv) {
    const opts = parseArgs(argv);

    if (opts.help) {
        printHelp();
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

    const { tokens, hexToTokens } = extractMappingTokens(opts.mappingPath);
    const { lightDefs, darkDefs } = parseSSOT(opts.ssotPath);
    const tokenList = Array.from(tokens).sort();
    const checks = checkTokens(tokenList, lightDefs, darkDefs);
    const collisions = detectAliasCollisions(hexToTokens);

    const explicitDuplicateAllowed = opts.allowDuplicateAlias
        || (opts.tokenPriority && opts.tokenPriority.length > 0);

    const strictFailing = opts.strict
        && (checks.warnDarkMissing.length > 0
            || checks.warnDeep.length > 0
            || checks.warnCycle.length > 0);

    const exitCode = (
        checks.errorLight.length > 0
        || (collisions.length > 0 && !explicitDuplicateAllowed)
        || strictFailing
    ) ? 1 : 0;

    const summary = {
        totalTokens: tokenList.length,
        lightDefsTotal: lightDefs.size,
        darkDefsTotal: darkDefs.size
    };

    const report = {
        mappingPath: opts.mappingPath,
        ssotPath: opts.ssotPath,
        summary,
        checks,
        collisions,
        strict: opts.strict,
        allowDuplicateAlias: opts.allowDuplicateAlias,
        tokenPriority: opts.tokenPriority,
        exitCode
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
    main,
    MG_COLOR_TOKEN_RE
};
