#!/usr/bin/env node
'use strict';

/**
 * 상담사 스위트 내담자 목록 — 상태 칩을 현재 페이지 배열에서 집계/필터하면 FAIL.
 *
 * 금지 패턴(ConsultantClientList 등):
 *   - clientList.filter((c) => c.status === key).length 로 칩 카운트
 *   - filterStatus 로 현재 페이지 clients 를 클라이언트 필터
 *   - statusCounts 를 page length 에서 파생
 *
 * 사용:
 *   node scripts/verification/check-fe-consultant-status-chip-paging.js
 *
 * @author CoreSolution
 * @since 2026-10-08
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const TARGETS = [
  'frontend/src/components/consultant/ConsultantClientList.js'
];

/** 현재 페이지 배열로 상태 칩 집계 — 구코드 FAIL */
const PAGE_AGGREGATE = /counts\s*\[\s*key\s*\]\s*=\s*\w+\.filter\s*\(\s*\([^)]*\)\s*=>\s*[^)]*\.status\s*===/;
const PAGE_AGGREGATE_ALT = /\.filter\s*\(\s*\([^)]*\)\s*=>\s*[^)]*\.status\s*===\s*key\s*\)\s*\.length/;
/** 클라이언트 상태 필터(서버 status param 대신) */
const CLIENT_STATUS_FILTER =
  /filterStatus\s*!==\s*CONSULTANT_CLIENT_STATUS_FILTER\.ALL[\s\S]{0,120}\.filter\s*\(\s*\([^)]*\)\s*=>\s*[^)]*\.status\s*===/;
/** 서버 statusCounts 미사용 */
const MISSING_SERVER_COUNTS = /result\.statusCounts|statusCounts\s*from|serverCounts/;

function main() {
  const failures = [];
  for (const rel of TARGETS) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      failures.push(`${rel}: missing`);
      continue;
    }
    const src = fs.readFileSync(abs, 'utf8');
    if (PAGE_AGGREGATE.test(src) || PAGE_AGGREGATE_ALT.test(src)) {
      failures.push(`${rel}: page-array status chip aggregation`);
    }
    if (CLIENT_STATUS_FILTER.test(src)) {
      failures.push(`${rel}: client-side status filter on current page`);
    }
    if (!MISSING_SERVER_COUNTS.test(src)) {
      failures.push(`${rel}: missing server statusCounts usage`);
    }
    if (!/params\.status\s*=\s*filterStatus|status:\s*filterStatus/.test(src)
      && !/params\.status\s*=/.test(src)) {
      failures.push(`${rel}: missing status request param for non-ALL filter`);
    }
  }

  if (failures.length > 0) {
    console.error('FAIL: consultant status chip must use server statusCounts + status filter');
    failures.forEach((f) => console.error(' -', f));
    process.exit(1);
  }
  console.log('PASS: consultant status chips use server statusCounts (no page aggregation)');
  process.exit(0);
}

main();
