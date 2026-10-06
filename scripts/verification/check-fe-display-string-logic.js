#!/usr/bin/env node
'use strict';

/**
 * 표시용 문자열을 로직 입력으로 쓰는 실수 정적 검사.
 *
 *   DISPLAY_TIME_TO_LOGIC — 시각 판정 함수(canCompleteScheduleNow 등)에 화면 표시용 시각
 *                           (formatTime(...)·toLocale*·'오후 hh:mm' 리터럴·x.startTime 단독)을 넘긴다.
 *                           일정 511: 표시 문자열 '오후 01:30' 이 판정에 들어가 시작 전에도 완료 버튼이 켜졌다.
 *   I18N_RAW_TEMPLATE     — 다국어 문구에 JS 템플릿 `${` 가 남아 보간되지 않고 그대로 노출된다
 *                           (i18next 보간은 {{name}}). 웹·Expo 다국어 JSON 전부.
 *
 * DISPLAY_TIME_TO_LOGIC: 기존 위반은 베이스라인(줄어들기만)으로 통과, 새 위반은 exit 1.
 * 베이스라인에 있는데 사라진 항목도 exit 1 (베이스라인 정리 필요).
 * I18N_*: 하드 실패. 베이스라인·허용 목록이 없다. 베이스라인에 I18N_ 줄이 있어도 exit 1.
 *
 * 사용:
 *   node scripts/verification/check-fe-display-string-logic.js            # 검사
 *   node scripts/verification/check-fe-display-string-logic.js --list     # 현재 위반 목록만 출력
 *   node scripts/verification/check-fe-display-string-logic.js --root <dir> --baseline <file>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */

const fs = require('fs');
const path = require('path');
const { stripComments, callArgs, walk, readBaseline } = require('./check-fe-admin-list-paging');

const DEFAULT_BASELINE = 'src/test/resources/guardrails/fe-display-string-logic-baseline.txt';
const SCAN_DIR = 'frontend/src';
const LOCALE_DIRS = ['frontend/src/locales', 'expo-app/src/i18n/translations'];

/** 허용 목록 없이 항상 실패하는 규칙 접두사. */
const STRICT_PREFIX = 'I18N_';

/** 일정 시각 판정 함수 — 입력은 API 원본(apiStartTime·HH:mm[:ss]·ISO)이어야 한다. */
const TIME_LOGIC_CALLEES = /\b(canCompleteScheduleNow|hasScheduleSessionStarted)\s*\(/g;

/** 화면 표시용 시각을 만드는 호출·리터럴. */
const DISPLAY_TIME_SOURCES = [
  /\bformatTime\s*\(/,
  /\bformat\w*Time\w*\s*\(/,
  /\.toLocale(Time|Date)?String\s*\(/,
  /\bIntl\.DateTimeFormat\b/,
  /['"`]\s*(오전|오후)\s*\d/
];

/** 객체 리터럴의 `startTime: x.startTime` — 같은 객체에 apiStartTime 우선 없이 표시 필드만 넘긴다. */
const BARE_DISPLAY_START = /\bstartTime\s*:\s*[\w$.?]*\.startTime\b(?!\s*\?\?)/;
const API_START_FIRST = /\bapiStartTime\b/;

const RAW_TEMPLATE = /\$\{/;

function scanSource(rel, rawText) {
  const text = stripComments(rawText);
  const out = [];
  let m;
  TIME_LOGIC_CALLEES.lastIndex = 0;
  while ((m = TIME_LOGIC_CALLEES.exec(text)) !== null) {
    const args = callArgs(text, m.index + m[0].length - 1);
    const display = DISPLAY_TIME_SOURCES.some((re) => re.test(args));
    const bare = BARE_DISPLAY_START.test(args) && !API_START_FIRST.test(args);
    if (display || bare) {
      out.push(`DISPLAY_TIME_TO_LOGIC ${rel} :: ${m[1]}`);
    }
  }
  return out;
}

function flattenStrings(node, prefix, acc) {
  if (typeof node === 'string') {
    acc.push([prefix, node]);
  } else if (node && typeof node === 'object') {
    Object.entries(node).forEach(([k, v]) => flattenStrings(v, prefix ? `${prefix}.${k}` : k, acc));
  }
  return acc;
}

function scanLocale(rel, rawText) {
  let json;
  try {
    json = JSON.parse(rawText);
  } catch (e) {
    return [`I18N_INVALID_JSON ${rel}`];
  }
  return flattenStrings(json, '', [])
    .filter(([, value]) => RAW_TEMPLATE.test(value))
    .map(([key]) => `I18N_RAW_TEMPLATE ${rel} :: ${key}`);
}

function listJson(dir, acc) {
  if (!fs.existsSync(dir)) {
    return acc;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listJson(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      acc.push(full);
    }
  }
  return acc;
}

function collect(root) {
  const relOf = (file) => path.relative(root, file).split(path.sep).join('/');
  const found = [];
  for (const file of walk(path.join(root, SCAN_DIR), [])) {
    found.push(...scanSource(relOf(file), fs.readFileSync(file, 'utf8')));
  }
  for (const dir of LOCALE_DIRS) {
    for (const file of listJson(path.join(root, dir), [])) {
      found.push(...scanLocale(relOf(file), fs.readFileSync(file, 'utf8')));
    }
  }
  return [...new Set(found)].sort();
}

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

function main() {
  const args = parseArgs(process.argv);
  const current = collect(args.root);
  if (args.list) {
    current.forEach((l) => console.log(l));
    return 0;
  }
  const isStrict = (l) => l.startsWith(STRICT_PREFIX);
  const baselineLines = readBaseline(args.baseline);
  const allowlisted = baselineLines.filter(isStrict);
  const baseline = new Set(baselineLines.filter((l) => !isStrict(l)));
  const strictHits = current.filter(isStrict);
  const ratchet = current.filter((l) => !isStrict(l));
  const added = ratchet.filter((l) => !baseline.has(l));
  const ratchetSet = new Set(ratchet);
  const stale = [...baseline].filter((l) => !ratchetSet.has(l));
  if (strictHits.length === 0 && allowlisted.length === 0 && added.length === 0 && stale.length === 0) {
    console.log(`check-fe-display-string-logic: OK (i18n strict 0, baseline ${baseline.size})`);
    return 0;
  }
  if (strictHits.length > 0) {
    console.log('다국어 문구에 ${ 잔존 — 허용 목록 없음. {{name}} 으로 바꾸고 호출부에서 값을 넘기세요:');
    strictHits.forEach((l) => console.log(`  + ${l}`));
  }
  if (allowlisted.length > 0) {
    console.log('I18N_ 항목은 베이스라인에 둘 수 없습니다 — 해당 줄을 지우고 문구를 고치세요:');
    allowlisted.forEach((l) => console.log(`  ! ${l}`));
  }
  if (added.length > 0) {
    console.log('새 위반 — 판정에는 API 원본 시각(apiStartTime ?? startTime)을, 문구 보간에는 {{name}} 을 쓰세요:');
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

module.exports = { scanSource, scanLocale, collect };
