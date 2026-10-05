#!/usr/bin/env node
'use strict';

/**
 * 발송 수신자 상한 숫자 리터럴 정적 검사 (허용 목록 래칫).
 *
 * 수동·일괄 발송 수신자 상한은 서버 설정 하나(notification.manual.max-recipients)에서만 정한다.
 * DTO·화면 상수·문구에 숫자를 따로 박으면 설정을 바꿔도 한쪽만 바뀐다(50/500 불일치 재발 방지).
 *
 *   SIZE_MAX <파일> :: <필드> max=<n>         — notification·manual·bulk DTO 의 목록 필드 @Size(max = n)
 *   FE_MAX_RECIPIENTS <파일> :: <이름>=<n>    — frontend/src 의 *MAX_RECIPIENTS = n
 *   LOCALE_LIMIT <파일> :: <키> "<일치>"       — 다국어 문구의 「최대 N명」·「N명 상한」
 *
 * 허용 목록에 없는 새 항목은 exit 1, 허용 목록에 있는데 사라진 항목도 exit 1(목록 정리 필요).
 * 허용 목록에는 서버 상한을 못 받았을 때만 쓰는 화면 폴백처럼 이유가 분명한 것만 둔다.
 *
 * 사용:
 *   node scripts/verification/check-recipient-limit-literals.js            # 검사
 *   node scripts/verification/check-recipient-limit-literals.js --list     # 현재 항목만 출력
 *   node scripts/verification/check-recipient-limit-literals.js --root <dir> --allowlist <file>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */

const fs = require('fs');
const path = require('path');
const { readBaseline, stripComments } = require('./check-fe-admin-list-paging');

const DEFAULT_ALLOWLIST = 'src/test/resources/guardrails/recipient-limit-literal-allowlist.txt';

const JAVA_DIR = 'src/main/java';
const DTO_PATH = /\/dto\//;
const DTO_TOPIC = /(notification|manual|bulk)/i;
const FE_DIR = 'frontend/src';
const LOCALE_DIRS = ['frontend/src/locales', 'expo-app/src/locales', 'expo-app/locales'];

const SKIP_DIR = /(^|\/)(__tests__|__mocks__|node_modules|build|testUtils)(\/|$)/;
const SKIP_FILE = /\.(test|spec)\.(js|jsx|ts|tsx)$/;
const FE_EXT = /\.(js|jsx|ts|tsx)$/;

const SIZE_ANNOTATION = /@Size\s*\(([^)]*)\)/g;
const SIZE_MAX_LITERAL = /\bmax\s*=\s*(\d+)/;
const COLLECTION_FIELD = /\b(?:List|Set|Collection)\s*</;
const FIELD_NAME = /(\w+)\s*(?:=[^;]*)?;\s*$/;
const FE_MAX_RECIPIENTS = /\b([A-Z0-9_]*MAX_RECIPIENTS)\s*=\s*(\d+)\b/g;
const LOCALE_PATTERNS = [/최대\s*\d+\s*명/g, /\d+\s*명\s*상한/g, /\bup to \d+ recipients\b/gi];

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

function walk(dir, ext, acc) {
  if (!fs.existsSync(dir)) {
    return acc;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIR.test(`${full}/`)) {
        walk(full, ext, acc);
      }
    } else if (entry.isFile() && ext.test(entry.name) && !SKIP_FILE.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function relOf(root, file) {
  return path.relative(root, file).split(path.sep).join('/');
}

/** @Size(max = n) 뒤 첫 필드 선언(다음 ; 까지)이 목록 타입이면 위반. */
function scanJavaDto(rel, rawText) {
  if (!DTO_PATH.test(`/${rel}`) || !DTO_TOPIC.test(path.basename(rel))) {
    return [];
  }
  const text = stripComments(rawText);
  const found = [];
  let m;
  SIZE_ANNOTATION.lastIndex = 0;
  while ((m = SIZE_ANNOTATION.exec(text)) !== null) {
    const max = SIZE_MAX_LITERAL.exec(m[1]);
    if (!max) {
      continue;
    }
    const after = m.index + m[0].length;
    const semi = text.indexOf(';', after);
    if (semi < 0) {
      continue;
    }
    const decl = text.slice(after, semi + 1);
    if (!COLLECTION_FIELD.test(decl)) {
      continue;
    }
    const name = FIELD_NAME.exec(decl.replace(/\s+/g, ' '));
    found.push(`SIZE_MAX ${rel} :: ${name ? name[1] : '?'} max=${max[1]}`);
  }
  return found;
}

function scanFrontend(rel, rawText) {
  const text = stripComments(rawText);
  const found = [];
  let m;
  FE_MAX_RECIPIENTS.lastIndex = 0;
  while ((m = FE_MAX_RECIPIENTS.exec(text)) !== null) {
    found.push(`FE_MAX_RECIPIENTS ${rel} :: ${m[1]}=${m[2]}`);
  }
  return found;
}

function scanLocale(rel, rawText) {
  let json;
  try {
    json = JSON.parse(rawText);
  } catch (e) {
    return [`LOCALE_LIMIT ${rel} :: <invalid json>`];
  }
  const found = [];
  const visit = (node, keyPath) => {
    if (typeof node === 'string') {
      LOCALE_PATTERNS.forEach((re) => {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(node)) !== null) {
          found.push(`LOCALE_LIMIT ${rel} :: ${keyPath} "${m[0]}"`);
        }
      });
    } else if (node && typeof node === 'object') {
      Object.entries(node).forEach(([k, v]) => visit(v, keyPath ? `${keyPath}.${k}` : k));
    }
  };
  visit(json, '');
  return found;
}

function collect(root) {
  const found = [];
  walk(path.join(root, JAVA_DIR), /\.java$/, []).forEach((file) => {
    found.push(...scanJavaDto(relOf(root, file), fs.readFileSync(file, 'utf8')));
  });
  walk(path.join(root, FE_DIR), FE_EXT, []).forEach((file) => {
    found.push(...scanFrontend(relOf(root, file), fs.readFileSync(file, 'utf8')));
  });
  LOCALE_DIRS.forEach((dir) => {
    walk(path.join(root, dir), /\.json$/, []).forEach((file) => {
      found.push(...scanLocale(relOf(root, file), fs.readFileSync(file, 'utf8')));
    });
  });
  return [...new Set(found)].sort();
}

function main() {
  const args = parseArgs(process.argv);
  const current = collect(args.root);
  if (args.list) {
    current.forEach((l) => console.log(l));
    return 0;
  }
  const allowed = new Set(readBaseline(args.allowlist));
  const added = current.filter((l) => !allowed.has(l));
  const currentSet = new Set(current);
  const stale = [...allowed].filter((l) => !currentSet.has(l));
  if (added.length === 0 && stale.length === 0) {
    console.log(`check-recipient-limit-literals: OK (allowlist ${allowed.size})`);
    return 0;
  }
  if (added.length > 0) {
    console.log('새 수신자 상한 숫자 리터럴 — notification.manual.max-recipients(서버 설정)를 쓰고,'
      + ' 화면 문구는 {{max}} 로 보간하세요:');
    added.forEach((l) => console.log(`  + ${l}`));
  }
  if (stale.length > 0) {
    console.log('허용 목록 정리 필요 — 사라진 항목을 허용 목록에서 지우세요:');
    stale.forEach((l) => console.log(`  - ${l}`));
  }
  return 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { scanJavaDto, scanFrontend, scanLocale, collect };
