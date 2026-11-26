#!/usr/bin/env node
'use strict';

/**
 * ScheduleReassignMapping*.css — 선택 테두리·잔여/예정 칸에 primary-* 틸 토큰 금지.
 *
 * FAIL 조건: `.is-selected` / `__cell--remaining` / `__cell--planned` 규칙 블록에
 *   primary-main | primary-subtle | primary-dark | primary-hover 사용.
 *
 * 사용:
 *   node scripts/verification/check-reassign-mapping-css-tokens.js
 *   node scripts/verification/check-reassign-mapping-css-tokens.js --root <dir>
 *
 * @author MindGarden
 * @since 2026-11-26
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN_TOKENS = [
  'primary-main',
  'primary-subtle',
  'primary-dark',
  'primary-hover'
];

const TARGET_SELECTORS = [
  '.is-selected',
  '__cell--remaining',
  '__cell--planned'
];

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

function walkCss(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'build') {
        continue;
      }
      walkCss(full, files);
    } else if (/ScheduleReassignMapping.*\.css$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

/**
 * 단순 CSS 규칙 블록 파서(중첩 거의 없는 컴포넌트 CSS용).
 *
 * @param {string} css
 * @returns {Array<{ selector: string, body: string, startLine: number }>}
 */
function parseRules(css) {
  const rules = [];
  let i = 0;
  let line = 1;
  while (i < css.length) {
    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end < 0) {
        break;
      }
      const chunk = css.slice(i, end + 2);
      line += (chunk.match(/\n/g) || []).length;
      i = end + 2;
      continue;
    }
    if (css[i] === '\n') {
      line += 1;
      i += 1;
      continue;
    }
    if (/\s/.test(css[i])) {
      i += 1;
      continue;
    }
    const selStart = i;
    const selStartLine = line;
    const brace = css.indexOf('{', i);
    if (brace < 0) {
      break;
    }
    const selector = css.slice(selStart, brace).trim();
    line += (css.slice(selStart, brace).match(/\n/g) || []).length;
    let depth = 0;
    let j = brace;
    for (; j < css.length; j += 1) {
      if (css[j] === '{') {
        depth += 1;
      } else if (css[j] === '}') {
        depth -= 1;
        if (depth === 0) {
          break;
        }
      }
      if (css[j] === '\n') {
        line += 1;
      }
    }
    const body = css.slice(brace + 1, j);
    rules.push({ selector, body, startLine: selStartLine });
    i = j + 1;
  }
  return rules;
}

/**
 * @param {string} relPath
 * @param {string} css
 * @returns {string[]}
 */
function scanCss(relPath, css) {
  const violations = [];
  const rules = parseRules(css);
  rules.forEach((rule) => {
    const hitSelector = TARGET_SELECTORS.some((token) => rule.selector.includes(token));
    if (!hitSelector) {
      return;
    }
    FORBIDDEN_TOKENS.forEach((token) => {
      if (rule.body.includes(token)) {
        violations.push(
          `${relPath}:${rule.startLine}: ${rule.selector.trim()} uses ${token}`
        );
      }
    });
  });
  return violations;
}

function scanTree(root) {
  const files = walkCss(path.join(root, 'frontend/src'));
  const violations = [];
  files.forEach((abs) => {
    const relPath = path.relative(root, abs).split(path.sep).join('/');
    violations.push(...scanCss(relPath, fs.readFileSync(abs, 'utf8')));
  });
  return { files, violations };
}

function main() {
  const { root } = parseArgs(process.argv);
  const { files, violations } = scanTree(root);
  if (violations.length > 0) {
    console.error('FAIL: ScheduleReassignMapping CSS — 선택/잔여/예정 칸에 primary-* 금지');
    violations.forEach((v) => console.error(`  ${v}`));
    process.exit(1);
  }
  console.log(`OK: reassign CSS tokens (${files.length} files)`);
}

if (require.main === module) {
  main();
}

module.exports = { scanCss, parseRules, FORBIDDEN_TOKENS, scanTree };
