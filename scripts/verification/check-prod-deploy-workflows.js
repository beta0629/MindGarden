#!/usr/bin/env node
'use strict';

/**
 * 운영 배포 워크플로 정적 검사 (허용 목록 래칫).
 *
 *   OR_TRUE            — `|| true` / `|| :` 로 실패를 삼킴
 *   CONTINUE_ON_ERROR  — `continue-on-error: true`
 *   NON_FATAL          — 실행 줄에 "non-fatal" 류 문구(실패를 무시한다는 표시)
 *   MIND_GARDEN        — 옛 DB 이름 mind_garden 참조
 *
 * 주석 줄(# 로 시작)과 줄 끝 주석은 보지 않는다. 기존 항목은 허용 목록(줄어들기만)으로 통과하고,
 * 새 항목이나 허용 목록에만 남은 항목은 exit 1. 같은 줄이 여러 번 나오면 허용 목록에도 그 횟수만큼 적는다.
 *
 * 사용:
 *   node scripts/verification/check-prod-deploy-workflows.js           # 검사
 *   node scripts/verification/check-prod-deploy-workflows.js --list    # 현재 항목만 출력
 *   node scripts/verification/check-prod-deploy-workflows.js --root <dir> --allowlist <file>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_ALLOWLIST = 'src/test/resources/guardrails/prod-deploy-workflow-allowlist.txt';
const WORKFLOW_DIR = '.github/workflows';
/** 운영 배포 워크플로: 파일명에 prod/production 이 들어간 deploy-* 와, 운영 화면 배포가 호출하는 재사용 워크플로. */
const PROD_WORKFLOW = /^deploy-.*(prod|production).*\.ya?ml$/;
const EXTRA_FILES = [
  '.github/workflows/reusable-static-site-ssh-deploy.yml',
  '.github/actions/sync-prod-env-key/action.yml'
];

const RULES = [
  ['OR_TRUE', /\|\|\s*(true|:)(?=\s|;|\)|$)/],
  ['CONTINUE_ON_ERROR', /\bcontinue-on-error\s*:\s*['"]?true\b/],
  ['NON_FATAL', /\bnon[-_ ]?fatal\b/i],
  ['MIND_GARDEN', /\bmind_garden\w*/]
];

function parseArgs(argv) {
  const out = { root: process.cwd(), allowlist: null, list: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--root') {
      out.root = path.resolve(argv[i + 1]);
      i += 1;
    } else if (a === '--allowlist') {
      out.allowlist = path.resolve(argv[i + 1]);
      i += 1;
    } else if (a === '--list') {
      out.list = true;
    }
  }
  if (!out.allowlist) {
    out.allowlist = path.join(out.root, DEFAULT_ALLOWLIST);
  }
  return out;
}

function stripComment(line) {
  if (/^\s*#/.test(line)) {
    return '';
  }
  return line.replace(/(^|\s)#(?![{!]).*$/, '');
}

function scanText(rel, text) {
  const out = [];
  text.split('\n').forEach((raw) => {
    const code = stripComment(raw);
    if (!code.trim()) {
      return;
    }
    const snippet = code.trim().replace(/\s+/g, ' ');
    RULES.forEach(([kind, re]) => {
      if (re.test(code)) {
        out.push(`${kind} ${rel} :: ${snippet}`);
      }
    });
  });
  return out;
}

function targetFiles(root) {
  const dir = path.join(root, WORKFLOW_DIR);
  const found = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => PROD_WORKFLOW.test(f)).map((f) => `${WORKFLOW_DIR}/${f}`)
    : [];
  EXTRA_FILES.forEach((rel) => {
    if (fs.existsSync(path.join(root, rel)) && !found.includes(rel)) {
      found.push(rel);
    }
  });
  return found.sort();
}

function collect(root) {
  const found = [];
  targetFiles(root).forEach((rel) => {
    found.push(...scanText(rel, fs.readFileSync(path.join(root, rel), 'utf8')));
  });
  return found.sort();
}

function readAllowlist(file) {
  if (!fs.existsSync(file)) {
    return [];
  }
  return fs.readFileSync(file, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

function countOf(lines) {
  const m = new Map();
  lines.forEach((l) => m.set(l, (m.get(l) || 0) + 1));
  return m;
}

function diff(current, allowed) {
  const cur = countOf(current);
  const allow = countOf(allowed);
  const added = [];
  const stale = [];
  cur.forEach((n, l) => {
    for (let i = allow.get(l) || 0; i < n; i += 1) {
      added.push(l);
    }
  });
  allow.forEach((n, l) => {
    for (let i = cur.get(l) || 0; i < n; i += 1) {
      stale.push(l);
    }
  });
  return { added, stale };
}

function main() {
  const args = parseArgs(process.argv);
  const current = collect(args.root);
  if (args.list) {
    current.forEach((l) => console.log(l));
    return 0;
  }
  const allowed = readAllowlist(args.allowlist);
  const { added, stale } = diff(current, allowed);
  if (added.length === 0 && stale.length === 0) {
    console.log(`check-prod-deploy-workflows: OK (allowlist ${allowed.length}, files ${targetFiles(args.root).length})`);
    return 0;
  }
  if (added.length > 0) {
    console.log('새 항목 — 운영 배포 단계는 실패하면 배포 실패여야 하고, 옛 DB(mind_garden)를 대상으로 하면 안 됩니다:');
    added.forEach((l) => console.log(`  + ${l}`));
  }
  if (stale.length > 0) {
    console.log('허용 목록 정리 필요 — 없어진 항목을 허용 목록에서 지우세요:');
    stale.forEach((l) => console.log(`  - ${l}`));
  }
  return 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { scanText, collect, diff, stripComment };
