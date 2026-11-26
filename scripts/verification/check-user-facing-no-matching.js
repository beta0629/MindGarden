#!/usr/bin/env node
'use strict';

/**
 * 배정 변경(reassign) 사용자 노출 문자열에 「매칭」이 남지 않았는지 검사한다.
 *
 * 대상(문자열 리터럴만):
 *   - *UserFacingMessages*.java 의 MSG_REASSIGN_* 상수
 *   - ScheduleReassignMappingRequest 의 validation message=
 *   - AdminController 의 reassign-mapping 경로 IllegalArgumentException / 안내 문구
 *
 * 식별자·메서드명·주석은 검사하지 않는다.
 *
 * 사용:
 *   node scripts/verification/check-user-facing-no-matching.js
 *   node scripts/verification/check-user-facing-no-matching.js --root <dir>
 *
 * @author MindGarden
 * @since 2026-11-26
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN = '매칭';
const STRING_LITERAL_RE = /"((?:\\.|[^"\\])*)"/g;

function parseArgs(argv) {
  const out = { root: process.cwd() };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--root') {
      out.root = path.resolve(argv[i + 1] || '');
      i += 1;
    }
  }
  return out;
}

function rel(root, abs) {
  return path.relative(root, abs).split(path.sep).join('/');
}

function collectLiterals(line) {
  const out = [];
  STRING_LITERAL_RE.lastIndex = 0;
  let match;
  while ((match = STRING_LITERAL_RE.exec(line)) != null) {
    out.push(match[1]);
  }
  return out;
}

/**
 * MSG_REASSIGN_* 상수 블록의 문자열 리터럴을 수집한다.
 *
 * @param {string} relPath
 * @param {string} source
 * @returns {string[]}
 */
function scanUserFacingReassignMessages(relPath, source) {
  const violations = [];
  const lines = source.split(/\r?\n/);
  let inReassignConst = false;
  lines.forEach((line, idx) => {
    if (/MSG_REASSIGN_[A-Z0-9_]+\s*=/.test(line)) {
      inReassignConst = true;
    }
    if (inReassignConst) {
      collectLiterals(line).forEach((literal) => {
        if (literal.includes(FORBIDDEN)) {
          violations.push(`${relPath}:${idx + 1}: "${literal}"`);
        }
      });
      if (line.includes(';')) {
        inReassignConst = false;
      }
    }
  });
  return violations;
}

/**
 * @param {string} relPath
 * @param {string} source
 * @returns {string[]}
 */
function scanRequestMessages(relPath, source) {
  const violations = [];
  const lines = source.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (!/message\s*=/.test(line)) {
      return;
    }
    collectLiterals(line).forEach((literal) => {
      if (literal.includes(FORBIDDEN)) {
        violations.push(`${relPath}:${idx + 1}: "${literal}"`);
      }
    });
  });
  return violations;
}

/**
 * AdminController 배정 변경 구간의 「대상 …」 사용자 문구만 검사.
 *
 * @param {string} relPath
 * @param {string} source
 * @returns {string[]}
 */
function scanAdminControllerReassign(relPath, source) {
  const violations = [];
  const lines = source.split(/\r?\n/);
  let inReassignBlock = false;
  lines.forEach((line, idx) => {
    if (/reassign-mapping/.test(line) || /reassignScheduleMapping|getReassignMapping|previewReassignMapping/.test(line)) {
      inReassignBlock = true;
    }
    if (inReassignBlock) {
      collectLiterals(line).forEach((literal) => {
        if (literal.includes(FORBIDDEN)) {
          violations.push(`${relPath}:${idx + 1}: "${literal}"`);
        }
      });
      if (/^\s*@GetMapping|^\s*@PostMapping|^\s*@PutMapping|^\s*@DeleteMapping/.test(line)
          && !/reassign-mapping/.test(line)
          && idx > 0) {
        // 다음 엔드포인트 시작 — 배정 변경 블록 종료 후보. history 포함 구간은 reassign-mapping path로만 유지.
      }
      if (/auto-complete|스케줄 자동 완료/.test(line)) {
        inReassignBlock = false;
      }
    }
  });
  return violations;
}

function walkJava(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'target' || entry.name === 'node_modules' || entry.name === '.git') {
        continue;
      }
      walkJava(full, files);
    } else if (entry.name.endsWith('.java')) {
      files.push(full);
    }
  }
  return files;
}

function scanTree(root) {
  const javaFiles = walkJava(path.join(root, 'src/main/java'));
  const violations = [];
  javaFiles.forEach((abs) => {
    const r = rel(root, abs);
    const source = fs.readFileSync(abs, 'utf8');
    if (/UserFacingMessages\.java$/.test(r)) {
      violations.push(...scanUserFacingReassignMessages(r, source));
    }
    if (/ScheduleReassignMappingRequest\.java$/.test(r)) {
      violations.push(...scanRequestMessages(r, source));
    }
    if (/AdminController\.java$/.test(r)) {
      violations.push(...scanAdminControllerReassign(r, source));
    }
  });
  return violations;
}

function main() {
  const { root } = parseArgs(process.argv);
  const violations = scanTree(root);
  if (violations.length > 0) {
    console.error('FAIL: 배정 변경 사용자 노출 문자열에 「매칭」이 포함되어 있습니다.');
    violations.forEach((v) => console.error(`  ${v}`));
    process.exit(1);
  }
  console.log('OK: reassign user-facing 「매칭」없음');
}

if (require.main === module) {
  main();
}

module.exports = {
  scanUserFacingReassignMessages,
  scanRequestMessages,
  scanAdminControllerReassign,
  scanTree,
  FORBIDDEN
};
