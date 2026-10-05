#!/usr/bin/env node
'use strict';

/**
 * 변경된 main 소스가 PortOne·SMS 등 외부 호출을 포함하면,
 * 그 호출 스텁(thenAnswer/doAnswer) 안에서 커넥션 점유 0을 단언하는지 검사한다.
 * isActualTransactionActive 만 있으면 exit 1 (#1328).
 *
 * 사용:
 *   node scripts/verification/check-external-call-connection.js --changed /tmp/sv-changed.txt
 *
 * @author CoreSolution
 * @since 2026-10-01
 */

const fs = require('fs');
const path = require('path');
const scan = require('./java-scan');

const EXTERNAL = [
  /\bportOne[\w]*\s*\.\s*[A-Za-z_][\w]*\s*\(/,
  /\bPortOne[\w]*\s*\.\s*[A-Za-z_][\w]*\s*\(/,
  /\bsendSms\s*\(/,
  /\bsendAlimTalk\s*\(/,
  /\bdispatchAlimtalk\s*\(/,
  /\bdispatchSms\s*\(/,
  /\bkakaoAlimTalkService\s*\.\s*[A-Za-z_][\w]*\s*\(/,
  /\bkrPublicDataClient\s*\.\s*[A-Za-z_][\w]*\s*\(/
];

function parseArgs(argv) {
  const out = { root: process.cwd(), changed: null };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--root') {
      out.root = path.resolve(argv[i + 1] || '');
      i += 1;
    } else if (a === '--changed') {
      out.changed = argv[i + 1];
      i += 1;
    } else if (a === '-h' || a === '--help') {
      out.help = true;
    } else {
      console.error('Unknown arg: ' + a);
      process.exit(2);
    }
  }
  return out;
}

function walk(dir, acc) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'target' || ent.name === 'node_modules') {
      continue;
    }
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(p, acc);
    } else if (p.endsWith('.java')) {
      acc.push(p);
    }
  }
}

function hasExternalCall(text) {
  const code = scan.stripComments(text).replace(/^import .*$/gm, '');
  return EXTERNAL.some((re) => re.test(code));
}

function answerBlocks(testText) {
  const blocks = [];
  const re = /\b(?:thenAnswer|doAnswer|willAnswer)\s*\(/g;
  let m;
  while ((m = re.exec(testText))) {
    const parenAt = m.index + m[0].length - 1;
    const close = scan.matchParen(testText, parenAt);
    if (close < 0) {
      continue;
    }
    let inside = testText.slice(parenAt + 1, close);
    const helper = inside.match(/\b(assert[A-Za-z0-9_]+)\s*\(/);
    if (helper) {
      const declared = scan.findDeclaredMethod(testText, helper[1]);
      if (declared) {
        inside += '\n' + declared.body;
      }
    }
    blocks.push(inside);
    re.lastIndex = close + 1;
  }
  return blocks;
}

function blockProvesRelease(block) {
  if (/getActiveConnections\s*\(\s*\)\s*\)\s*\.thenReturn\s*\(\s*0\s*\)/.test(block)) {
    return false;
  }
  return /TransactionSynchronizationManager\.isActualTransactionActive\s*\(/.test(block)
    && /TransactionSynchronizationManager\.isSynchronizationActive\s*\(/.test(block)
    && /TransactionSynchronizationManager\.getResource\s*\(/.test(block)
    && /assertNull\s*\(/.test(block)
    && /getHikariPoolMXBean\s*\(\s*\)\s*\.getActiveConnections\s*\(/.test(block)
    && /assertEquals\s*\(\s*0\s*,/.test(block);
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.changed) {
    console.error('usage: check-external-call-connection.js --changed FILE [--root DIR]');
    process.exit(2);
  }
  if (!fs.existsSync(args.changed)) {
    console.error('changed file missing: ' + args.changed);
    process.exit(2);
  }
  const changed = fs.readFileSync(args.changed, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
  const callers = [];
  for (const rel of changed) {
    if (!rel.startsWith('src/main/java/') || !rel.endsWith('.java')) {
      continue;
    }
    const abs = path.join(args.root, rel);
    if (!fs.existsSync(abs)) {
      continue;
    }
    const text = fs.readFileSync(abs, 'utf8');
    if (hasExternalCall(text)) {
      callers.push({ rel, simple: path.basename(rel, '.java') });
    }
  }
  if (callers.length === 0) {
    console.log('PASS connection 외부 호출 변경 없음');
    process.exit(0);
  }
  const tests = [];
  walk(path.join(args.root, 'src/test/java'), tests);
  let failed = false;
  for (const caller of callers) {
    const related = tests.filter((t) => fs.readFileSync(t, 'utf8').includes(caller.simple));
    let ok = false;
    let stubbed = false;
    for (const testFile of related) {
      const text = fs.readFileSync(testFile, 'utf8');
      if (/getActiveConnections\s*\(\s*\)\s*\)\s*\.thenReturn\s*\(\s*0\s*\)/.test(text)) {
        stubbed = true;
      }
      for (const block of answerBlocks(text)) {
        if (blockProvesRelease(block)) {
          ok = true;
        }
      }
    }
    if (stubbed || !ok) {
      failed = true;
      const why = stubbed
        ? 'getActiveConnections 를 thenReturn(0) 으로 고정하면 안 된다'
        : '호출 시점 커넥션 0 테스트 없음. isActualTransactionActive 만으로는 PASS 아님 (#1328)';
      console.log('FAIL connection ' + caller.rel + ' ' + why);
    } else {
      console.log('PASS connection ' + caller.rel + ' thenAnswer 안에서 Hikari active==0, EntityManager 미바인딩, synchronization 없음');
    }
  }
  process.exit(failed ? 1 : 0);
}

main();
