#!/usr/bin/env node
'use strict';

/**
 * FE 관리자 목록 호출 정적 검사 (래칫 베이스라인).
 *
 *   FETCH_ALL  — `size: total` 처럼 전체 건수를 size 로 넘기는 전체 조회.
 *   NO_PAGING  — 관리자 목록 엔드포인트를 공통 목록 모듈(adminListFetch) 없이 page/size 없이 호출.
 *
 * 기존 위반은 베이스라인(줄어들기만)으로 통과, 새 위반은 exit 1.
 * 베이스라인에 있는데 사라진 항목도 exit 1 (베이스라인 정리 필요).
 *
 * 사용:
 *   node scripts/verification/check-fe-admin-list-paging.js            # 검사
 *   node scripts/verification/check-fe-admin-list-paging.js --list     # 현재 위반 목록만 출력
 *   node scripts/verification/check-fe-admin-list-paging.js --root <dir> --baseline <file>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_BASELINE = 'src/test/resources/guardrails/fe-admin-list-paging-baseline.txt';
const SCAN_DIR = 'frontend/src';
const SOURCE_EXT = /\.(js|jsx|ts|tsx)$/;
const SKIP_DIR = /(^|\/)(__tests__|__mocks__|node_modules|build)(\/|$)/;
const SKIP_FILE = /\.(test|spec)\.(js|jsx|ts|tsx)$/;

/** 공통 목록 모듈 자체는 page/size 를 강제하는 곳이라 검사 대상에서 뺀다. */
const SHARED_LIST_MODULE = 'frontend/src/api/adminListFetch.js';

/** 관리자 목록 엔드포인트 — 상수 참조 또는 리터럴 경로. 하위 경로(/{id}/...)는 제외. */
const LIST_ENDPOINT_CONSTANTS = [
  'ADMIN.MAPPINGS.LIST',
  'ADMIN.MAPPINGS.PENDING_PAYMENT',
  'ADMIN.MAPPINGS.PENDING_DEPOSIT',
  'ADMIN.SESSION_EXTENSIONS.PENDING_PAYMENT',
  'ADMIN.CLIENTS.WITH_MAPPING_INFO',
  'ADMIN.CLIENTS.WITH_STATS',
  'ADMIN.CONSULTANTS.WITH_STATS',
  'API_ADMIN_SCHEDULES',
  'API_SCHEDULE_CONTROLLER_ADMIN'
];
const LIST_ENDPOINT_PATHS = [
  '/api/v1/admin/mappings',
  '/api/v1/admin/mappings/pending-payment',
  '/api/v1/admin/mappings/pending-deposit',
  '/api/v1/admin/session-extensions/pending-payment',
  '/api/v1/admin/clients/with-mapping-info',
  '/api/v1/admin/clients/with-stats',
  '/api/v1/admin/consultants/with-stats',
  '/api/v1/admin/consultation-records',
  '/api/v1/admin/schedules',
  '/api/v1/schedules/admin'
];

const CALLEES = /\b(StandardizedApi\.get|apiGet|TenantAwareApiClient\.get|fetch)\s*\(/g;
const FETCH_ALL = /\bsize\s*[:=]\s*(?:\$\{\s*)?(?:[\w.]*\.)?(total|totalCount|totalElements|count|length)\b/g;
const SUB_PATH_AFTER = /^(\}\/|\+['"`]\/)/;
const PAGE_TOKEN = /\bpage\b/;
const SIZE_TOKEN = /\bsize\b/;

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

function walk(dir, acc) {
  if (!fs.existsSync(dir)) {
    return acc;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIR.test(`${full}/`)) {
        walk(full, acc);
      }
    } else if (entry.isFile() && SOURCE_EXT.test(entry.name) && !SKIP_FILE.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

/** 여는 괄호 다음부터 짝이 맞는 닫는 괄호까지의 인자 텍스트. 문자열·템플릿 안 괄호는 무시. */
function callArgs(text, openIndex) {
  let depth = 0;
  let quote = null;
  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') {
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
    } else if (ch === '(') {
      depth += 1;
    } else if (ch === ')') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(openIndex + 1, i);
      }
    }
  }
  return text.slice(openIndex + 1);
}

/** 첫 번째 인자(최상위 콤마 전까지). */
function firstArg(args) {
  let depth = 0;
  let quote = null;
  for (let i = 0; i < args.length; i += 1) {
    const ch = args[i];
    if (quote) {
      if (ch === '\\') {
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
    } else if ('([{'.includes(ch)) {
      depth += 1;
    } else if (')]}'.includes(ch)) {
      depth -= 1;
    } else if (ch === ',' && depth === 0) {
      return args.slice(0, i);
    }
  }
  return args;
}

function endpointKey(arg, localPaths = {}) {
  const compact = arg.replace(/\s+/g, '');
  if (Object.prototype.hasOwnProperty.call(localPaths, compact)) {
    return localPaths[compact];
  }
  for (const c of LIST_ENDPOINT_CONSTANTS) {
    const re = new RegExp(`(^|[^\\w.])(API_ENDPOINTS\\.)?${c.replace(/\./g, '\\.')}(?![\\w.(])`);
    const m = re.exec(compact);
    if (m) {
      const after = compact.slice(m.index + m[0].length);
      // `${LIST}/${id}` · LIST + '/' + id 는 단건 하위 경로
      return SUB_PATH_AFTER.test(after) ? null : c;
    }
  }
  const literal = /^[`'"]([^`'"?$]*)/.exec(compact);
  if (literal) {
    const pathOnly = literal[1];
    if (LIST_ENDPOINT_PATHS.includes(pathOnly)) {
      return pathOnly;
    }
  }
  return null;
}

function normalizeSnippet(s) {
  return s.replace(/\s+/g, ' ').trim().slice(0, 120);
}

/** 주석을 같은 길이의 공백으로 바꾼다 (문자열·템플릿 안은 유지). */
function stripComments(text) {
  let out = '';
  let quote = null;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quote) {
      out += ch;
      if (ch === '\\' && i + 1 < text.length) {
        out += next;
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') {
        out += ' ';
        i += 1;
      }
      out += i < text.length ? '\n' : '';
      continue;
    }
    if (ch === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end < 0 ? text.length : end + 2;
      out += text.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop - 1;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
    }
    out += ch;
  }
  return out;
}

function scanFile(rel, rawText) {
  const text = stripComments(rawText);
  const out = [];
  const localPaths = {};
  const LOCAL_CONST = /\bconst\s+([A-Z_][A-Z0-9_]*)\s*=\s*['"`]([^'"`?$]*)['"`]/g;
  let lc;
  while ((lc = LOCAL_CONST.exec(text)) !== null) {
    if (LIST_ENDPOINT_PATHS.includes(lc[2])) {
      localPaths[lc[1]] = lc[2];
    }
  }
  if (rel !== SHARED_LIST_MODULE) {
    let m;
    CALLEES.lastIndex = 0;
    while ((m = CALLEES.exec(text)) !== null) {
      const open = m.index + m[0].length - 1;
      const args = callArgs(text, open);
      const key = endpointKey(firstArg(args), localPaths);
      if (!key) {
        continue;
      }
      if (PAGE_TOKEN.test(args) && SIZE_TOKEN.test(args)) {
        continue;
      }
      out.push(`NO_PAGING ${rel} :: ${m[1]} ${key}`);
    }
  }
  let f;
  FETCH_ALL.lastIndex = 0;
  while ((f = FETCH_ALL.exec(text)) !== null) {
    out.push(`FETCH_ALL ${rel} :: ${normalizeSnippet(f[0])}`);
  }
  return out;
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

function readBaseline(file) {
  if (!fs.existsSync(file)) {
    return [];
  }
  return fs.readFileSync(file, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
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
    console.log(`check-fe-admin-list-paging: OK (baseline ${baseline.size})`);
    return 0;
  }
  if (added.length > 0) {
    console.log('새 위반 — adminListFetch 공통 모듈(page/size)을 쓰고 size=total 전체 조회를 하지 마세요:');
    added.forEach((l) => console.log(`  + ${l}`));
  }
  if (stale.length > 0) {
    console.log('베이스라인 정리 필요 — 고쳐진 항목을 베이스라인에서 지우세요:');
    stale.forEach((l) => console.log(`  - ${l}`));
  }
  return 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { scanFile, collect, stripComments, callArgs, firstArg, walk, readBaseline };
