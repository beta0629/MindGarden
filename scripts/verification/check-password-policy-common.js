#!/usr/bin/env node
'use strict';

/**
 * FE 비밀번호 정책 공통 모듈 사용 정적 검사 (허용 목록, 래칫 아님).
 *
 * 로그인 비밀번호 정책은 서버 PasswordPolicy 와 FE constants/passwordPolicyUi.js 가 단일 기준이다.
 * 화면은 hooks/usePasswordPolicyField + components/common/PasswordPolicyInput 로만 입력·검증·안내한다.
 * 화면별 정규식·길이 비교·안내 문구를 다시 만들면 서버와 어긋나 400 을 받고서야 사용자가 알게 된다.
 *
 *   RAW_PASSWORD_INPUT <파일> xN   — JSX 요소의 type 이 password 인데 PasswordPolicyInput 이 아니고
 *                                     autoComplete="current-password"(로그인·본인 확인)도 아닌 것.
 *   PASSWORD_FIELD_CONFIG <파일> xN — 폼 설정 객체의 type: 'password' (공통 렌더러로 우회).
 *   POLICY_INPUT_NO_VALIDATE <파일> — PasswordPolicyInput 을 그리지만 field.validate 를 부르지 않는 파일
 *                                     (안내만 보이고 제출은 막히지 않음).
 *   PASSWORD_PAYLOAD_NO_POLICY <파일> — 비밀번호 키(password·newPassword·adminPassword 등)에 값을 실어
 *                                     API 를 부르는데 공통 정책 모듈을 import 하지 않는 파일.
 *                                     현재 비밀번호 입력만 있는 파일(로그인)은 제외.
 *
 * 허용 목록 항목: `<종류> <파일> :: <사유>` — 사유 필수. 위반이 사라진 항목이 남아 있어도 exit 1.
 *
 * 사용:
 *   node scripts/verification/check-password-policy-common.js            # 검사
 *   node scripts/verification/check-password-policy-common.js --list     # 현재 위반 목록만 출력
 *   node scripts/verification/check-password-policy-common.js --root <dir> --allowlist <file>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */

const fs = require('fs');
const path = require('path');
const { stripComments, walk } = require('./check-fe-admin-list-paging');

const DEFAULT_ALLOWLIST = 'src/test/resources/guardrails/fe-password-policy-allowlist.txt';
const SCAN_DIR = 'frontend/src';

/** 공통 모듈 자체(정책 구현·입력 컴포넌트). */
const SHARED_MODULE_FILES = new Set([
  'frontend/src/constants/passwordPolicyUi.js',
  'frontend/src/utils/loginPasswordPolicy.js',
  'frontend/src/utils/generateMgLoginPassword.js',
  'frontend/src/hooks/usePasswordPolicyField.js',
  'frontend/src/components/common/PasswordPolicyInput.js'
]);

const SHARED_IMPORT = /(?:from\s+|require\(\s*)['"][^'"]*\/(?:usePasswordPolicyField|loginPasswordPolicy|PasswordPolicyInput|generateMgLoginPassword)['"]/;
const JSX_OPEN = /<([A-Za-z][\w.]*)\b/g;
const TYPE_PASSWORD = /\btype\s*=\s*(?:"password"|'password'|\{[^}]*['"]password['"][^}]*\})/;
const CURRENT_PASSWORD = /\bautoComplete\s*=\s*(?:"current-password"|'current-password'|\{\s*PASSWORD_AUTOCOMPLETE\.CURRENT\s*\})/;
const FIELD_CONFIG = /\btype\s*:\s*['"]password['"]/g;
const PAYLOAD_KEY = /(?<![\w.'"$-])(?:password|newPassword|adminPassword|tempPassword|initialPassword)\s*:(?!\s*(?:''|""|``))/;
const VALIDATE_CALL = /\.validate\s*\(/;
const VALIDATE_ALIAS = /\bvalidate\s*:\s*(\w+)/g;
const API_CALL = /\b(?:StandardizedApi\.(?:post|put|patch)|apiPost|apiPut|apiPatch|csrfTokenManager\.(?:post|put|patch)|axios\.(?:post|put|patch)|fetch)\s*\(/;

function parseArgs(argv) {
  const out = { root: process.cwd(), allowlist: null, list: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--root') {
      out.root = path.resolve(argv[i + 1] || '');
      i += 1;
    } else if (a === '--allowlist') {
      out.allowlist = argv[i + 1];
      i += 1;
    } else if (a === '--list') {
      out.list = true;
    }
  }
  out.allowlist = path.resolve(out.root, out.allowlist || DEFAULT_ALLOWLIST);
  return out;
}

/** `<Tag` 다음부터 짝이 맞는 `>` 까지. 중괄호·문자열 안의 `>` 는 무시. 닫히지 않으면 null. */
function jsxTagText(text, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') {
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
    } else if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
    } else if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
    } else if (ch === '>' && depth === 0) {
      return text.slice(start, i + 1);
    } else if (ch === ';' && depth === 0) {
      return null;
    }
  }
  return null;
}

/** 파일 안 비밀번호 입력 요소 — { policy, current, raw } 개수. */
function passwordInputs(text) {
  const out = { policy: 0, current: 0, raw: 0 };
  let m;
  JSX_OPEN.lastIndex = 0;
  while ((m = JSX_OPEN.exec(text)) !== null) {
    const tag = jsxTagText(text, m.index);
    if (!tag || !TYPE_PASSWORD.test(tag)) {
      continue;
    }
    if (m[1] === 'PasswordPolicyInput') {
      out.policy += 1;
    } else if (CURRENT_PASSWORD.test(tag)) {
      out.current += 1;
    } else {
      out.raw += 1;
    }
  }
  return out;
}

/** field.validate(...) 또는 구조분해 별칭(`validate: validatePassword`) 호출 여부. */
function callsValidate(text) {
  if (VALIDATE_CALL.test(text)) {
    return true;
  }
  let m;
  VALIDATE_ALIAS.lastIndex = 0;
  while ((m = VALIDATE_ALIAS.exec(text)) !== null) {
    if (new RegExp(`\\b${m[1]}\\s*\\(`).test(text)) {
      return true;
    }
  }
  return false;
}

function scanFile(rel, rawText) {
  if (SHARED_MODULE_FILES.has(rel)) {
    return [];
  }
  const text = stripComments(rawText);
  const found = [];
  const inputs = passwordInputs(text);
  if (inputs.raw > 0) {
    found.push(`RAW_PASSWORD_INPUT ${rel} x${inputs.raw}`);
  }
  if (inputs.policy > 0 && !callsValidate(text)) {
    found.push(`POLICY_INPUT_NO_VALIDATE ${rel}`);
  }
  const configs = (text.match(FIELD_CONFIG) || []).length;
  if (configs > 0) {
    found.push(`PASSWORD_FIELD_CONFIG ${rel} x${configs}`);
  }
  const loginOnly = inputs.current > 0 && inputs.raw === 0 && inputs.policy === 0;
  if (PAYLOAD_KEY.test(text) && API_CALL.test(text) && !SHARED_IMPORT.test(text) && !loginOnly) {
    found.push(`PASSWORD_PAYLOAD_NO_POLICY ${rel}`);
  }
  return found;
}

function collect(root) {
  const files = walk(path.join(root, SCAN_DIR), []);
  const found = [];
  for (const file of files) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    found.push(...scanFile(rel, fs.readFileSync(file, 'utf8')));
  }
  return [...new Set(found)].sort();
}

/** 허용 목록 — { entries: Map<항목, 사유>, invalid: 사유 없는 줄 }. */
function readAllowlist(file) {
  const entries = new Map();
  const invalid = [];
  if (!fs.existsSync(file)) {
    return { entries, invalid };
  }
  fs.readFileSync(file, 'utf8').split('\n').map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .forEach((l) => {
      const sep = l.indexOf(' :: ');
      const key = (sep < 0 ? l : l.slice(0, sep)).trim();
      const reason = sep < 0 ? '' : l.slice(sep + 4).trim();
      if (!reason) {
        invalid.push(l);
      } else {
        entries.set(key, reason);
      }
    });
  return { entries, invalid };
}

function main() {
  const args = parseArgs(process.argv);
  const current = collect(args.root);
  if (args.list) {
    current.forEach((l) => console.log(l));
    return 0;
  }
  const { entries, invalid } = readAllowlist(args.allowlist);
  const added = current.filter((l) => !entries.has(l));
  const currentSet = new Set(current);
  const stale = [...entries.keys()].filter((l) => !currentSet.has(l));
  if (added.length === 0 && stale.length === 0 && invalid.length === 0) {
    console.log(`check-password-policy-common: OK (allowlist ${entries.size})`);
    return 0;
  }
  if (added.length > 0) {
    console.log('새 위반 — 비밀번호 입력·검증은 hooks/usePasswordPolicyField + components/common/PasswordPolicyInput 를 쓰세요'
      + '(로그인·본인 확인 입력은 autoComplete="current-password"):');
    added.forEach((l) => console.log(`  + ${l}`));
  }
  if (invalid.length > 0) {
    console.log('허용 목록 사유 누락 — `<항목> :: <사유>` 형식으로 적으세요:');
    invalid.forEach((l) => console.log(`  ! ${l}`));
  }
  if (stale.length > 0) {
    console.log('허용 목록 정리 필요 — 더 이상 위반이 아닌 항목을 지우세요:');
    stale.forEach((l) => console.log(`  - ${l}`));
  }
  return 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { scanFile, collect, readAllowlist };
