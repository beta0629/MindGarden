#!/usr/bin/env node
'use strict';

/**
 * FE 로그인 직접 이동 정적 검사 (래칫 베이스라인).
 *
 * 401·세션 만료로 로그인에 보내는 경로는 공용 처리(frontend/src/utils/sessionRedirect.js 의
 * redirectToLoginPageOnce)를 지나야 작성 중 상담일지 보관 백업·returnUrl 이 붙는다.
 * 화면이 `/login` 으로 직접 이동하면 그 처리를 건너뛴다(활동 ping 401 입력 유실, #1439 후속).
 *
 *   LOGIN_NAV <파일> :: <방식> xN — navigate()/history/location.* 호출·location(.href) 대입·<Navigate to>
 *   중 인자에 `/login` 경로가 있는 것. 같은 줄에 onClick 이 있으면(사용자가 누른 로그인 버튼) 제외.
 *
 * 기존 위반은 베이스라인(줄어들기만)으로 통과, 새 위반(파일·방식별 개수 증가 포함)은 exit 1.
 * 베이스라인에 있는데 사라지거나 줄어든 항목도 exit 1 (베이스라인 정리 필요).
 *
 * 사용:
 *   node scripts/verification/check-login-redirect-bypass.js            # 검사
 *   node scripts/verification/check-login-redirect-bypass.js --list     # 현재 위반 목록만 출력
 *   node scripts/verification/check-login-redirect-bypass.js --root <dir> --baseline <file>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */

const fs = require('fs');
const path = require('path');
const { callArgs, firstArg, readBaseline, stripComments, walk } = require('./check-fe-admin-list-paging');

const DEFAULT_BASELINE = 'src/test/resources/guardrails/fe-login-redirect-bypass-baseline.txt';
const SCAN_DIR = 'frontend/src';

/** 공용 401→로그인 처리. 여기서의 이동은 보관 백업·returnUrl 을 거친다. */
const SHARED_HANDLER = 'frontend/src/utils/sessionRedirect.js';

const NAV_CALLS = /\b(navigate|history\.push|history\.replace|location\.replace|location\.assign)\s*\(/g;
const LOCATION_ASSIGN = /\blocation(?:\.href)?\s*=(?!=)/g;
const JSX_NAVIGATE = /<Navigate\b[^>]*?\bto\s*=\s*(\{[^}]*\}|"[^"]*"|'[^']*')/g;
const LOGIN_PATH = /(^|[^\w-])\/login(?![\w-])/;
const USER_CLICK = /\bonClick\b/;

function parseArgs(argv) {
  const out = { root: process.cwd(), baseline: null, list: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--root') {
      out.root = path.resolve(argv[i + 1] || '');
      i += 1;
    } else if (a === '--baseline') {
      out.baseline = argv[i + 1];
      i += 1;
    } else if (a === '--list') {
      out.list = true;
    }
  }
  out.baseline = path.resolve(out.root, out.baseline || DEFAULT_BASELINE);
  return out;
}

function lineAt(text, index) {
  const start = text.lastIndexOf('\n', index) + 1;
  const end = text.indexOf('\n', index);
  return text.slice(start, end < 0 ? text.length : end);
}

/** 대입 우변 — 문장 끝(; 또는 줄바꿈)까지. */
function assignedValue(text, from) {
  const semi = text.indexOf(';', from);
  const nl = text.indexOf('\n', from);
  const ends = [semi, nl].filter((n) => n >= 0);
  return text.slice(from, ends.length ? Math.min(...ends) : text.length);
}

function scanFile(rel, rawText) {
  if (rel === SHARED_HANDLER) {
    return [];
  }
  const text = stripComments(rawText);
  const counts = new Map();
  const hit = (kind, index) => {
    if (USER_CLICK.test(lineAt(text, index))) {
      return;
    }
    counts.set(kind, (counts.get(kind) || 0) + 1);
  };
  let m;
  NAV_CALLS.lastIndex = 0;
  while ((m = NAV_CALLS.exec(text)) !== null) {
    const arg = firstArg(callArgs(text, m.index + m[0].length - 1));
    if (LOGIN_PATH.test(arg)) {
      hit(m[1], m.index);
    }
  }
  LOCATION_ASSIGN.lastIndex = 0;
  while ((m = LOCATION_ASSIGN.exec(text)) !== null) {
    if (LOGIN_PATH.test(assignedValue(text, m.index + m[0].length))) {
      hit('location.href=', m.index);
    }
  }
  JSX_NAVIGATE.lastIndex = 0;
  while ((m = JSX_NAVIGATE.exec(text)) !== null) {
    if (LOGIN_PATH.test(m[1])) {
      hit('<Navigate>', m.index);
    }
  }
  return [...counts.entries()].map(([kind, n]) => `LOGIN_NAV ${rel} :: ${kind} x${n}`);
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

function main() {
  const args = parseArgs(process.argv);
  const current = collect(args.root);
  if (args.list) {
    current.forEach((l) => console.log(l));
    return 0;
  }
  const baseline = new Set(readBaseline(args.baseline));
  const added = current.filter((l) => !baseline.has(l));
  const currentSet = new Set(current);
  const stale = [...baseline].filter((l) => !currentSet.has(l));
  if (added.length === 0 && stale.length === 0) {
    console.log(`check-login-redirect-bypass: OK (baseline ${baseline.size})`);
    return 0;
  }
  if (added.length > 0) {
    console.log('새 위반 — 401·세션 만료 로그인 이동은 sessionRedirect.redirectToLoginPageOnce 를 쓰세요'
      + '(보관 백업·returnUrl):');
    added.forEach((l) => console.log(`  + ${l}`));
  }
  if (stale.length > 0) {
    console.log('베이스라인 정리 필요 — 고쳐진(줄어든) 항목을 베이스라인에서 지우거나 개수를 줄이세요:');
    stale.forEach((l) => console.log(`  - ${l}`));
  }
  return 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { scanFile, collect };
