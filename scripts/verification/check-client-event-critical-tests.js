#!/usr/bin/env node
'use strict';

/**
 * ClientEvent*IntegrationTest 가 backend-critical-tests.txt 패턴에 포함되는지 검사한다.
 *
 * 사용:
 *   node scripts/verification/check-client-event-critical-tests.js
 *   node scripts/verification/check-client-event-critical-tests.js --root <dir>
 *   node scripts/verification/check-client-event-critical-tests.js --list
 *
 * @author MindGarden
 * @since 2026-11-27
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_CRITICAL_FILE = 'src/test/resources/ci/backend-critical-tests.txt';
const DEFAULT_TEST_ROOT = 'src/test/java';
const INTEGRATION_FILE_RE = /ClientEvent.*IntegrationTest\.java$/;

function parseArgs(argv) {
  const out = { root: process.cwd(), list: false };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--root') {
      out.root = path.resolve(argv[i + 1] || '');
      i += 1;
    } else if (argv[i] === '--list') {
      out.list = true;
    }
  }
  return out;
}

function rel(root, abs) {
  return path.relative(root, abs).split(path.sep).join('/');
}

/**
 * Ant-style includes 패턴 → RegExp (경로 / 구분).
 *
 * @param {string} pattern
 * @returns {RegExp}
 */
function antPatternToRegExp(pattern) {
  let i = 0;
  let out = '^';
  while (i < pattern.length) {
    if (pattern.startsWith('**/', i)) {
      out += '(?:.*/)?';
      i += 3;
      continue;
    }
    if (pattern[i] === '*' && pattern[i + 1] === '*') {
      out += '.*';
      i += 2;
      continue;
    }
    if (pattern[i] === '*') {
      out += '[^/]*';
      i += 1;
      continue;
    }
    if (pattern[i] === '?') {
      out += '[^/]';
      i += 1;
      continue;
    }
    out += pattern[i].replace(/[.+^${}()|[\]\\]/g, '\\$&');
    i += 1;
  }
  out += '$';
  return new RegExp(out);
}

/**
 * @param {string} criticalFileText
 * @returns {string[]}
 */
function parseCriticalPatterns(criticalFileText) {
  return criticalFileText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

/**
 * @param {string} dir
 * @param {(abs: string) => void} visit
 */
function walkFiles(dir, visit) {
  if (!fs.existsSync(dir)) {
    return;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(abs, visit);
      return;
    }
    if (entry.isFile()) {
      visit(abs);
    }
  });
}

/**
 * @param {string} root
 * @returns {string[]} paths relative to src/test/java
 */
function findClientEventIntegrationTests(root) {
  const testRoot = path.join(root, DEFAULT_TEST_ROOT);
  const found = [];
  walkFiles(testRoot, (abs) => {
    const name = path.basename(abs);
    if (!INTEGRATION_FILE_RE.test(name)) {
      return;
    }
    found.push(rel(testRoot, abs));
  });
  found.sort();
  return found;
}

/**
 * @param {string} relativePath path under src/test/java
 * @param {string[]} patterns
 * @returns {boolean}
 */
function matchesAnyPattern(relativePath, patterns) {
  const normalized = relativePath.split(path.sep).join('/');
  return patterns.some((pattern) => antPatternToRegExp(pattern).test(normalized));
}

/**
 * @param {{ root: string }} options
 * @returns {{ ok: boolean, missing: string[], matched: string[], patterns: string[] }}
 */
function checkClientEventCriticalRegistration(options) {
  const root = options.root || process.cwd();
  const criticalPath = path.join(root, DEFAULT_CRITICAL_FILE);
  if (!fs.existsSync(criticalPath)) {
    throw new Error(`missing critical list: ${DEFAULT_CRITICAL_FILE}`);
  }
  const patterns = parseCriticalPatterns(fs.readFileSync(criticalPath, 'utf8'));
  const files = findClientEventIntegrationTests(root);
  const matched = [];
  const missing = [];
  files.forEach((file) => {
    if (matchesAnyPattern(file, patterns)) {
      matched.push(file);
    } else {
      missing.push(file);
    }
  });
  return {
    ok: missing.length === 0,
    missing,
    matched,
    patterns,
    files
  };
}

function main(argv) {
  const args = parseArgs(argv);
  const result = checkClientEventCriticalRegistration({ root: args.root });
  if (args.list) {
    console.log(`ClientEvent*IntegrationTest files: ${result.files.length}`);
    result.files.forEach((file) => {
      const flag = result.missing.includes(file) ? 'MISSING' : 'OK';
      console.log(`  [${flag}] ${file}`);
    });
  }
  if (!result.ok) {
    console.error('ClientEvent*IntegrationTest not covered by backend-critical-tests.txt:');
    result.missing.forEach((file) => console.error(`  - ${file}`));
    console.error('Add an explicit pattern (e.g. **/ClientEventWriteRollbackIntegrationTest.java).');
    process.exit(1);
  }
  console.log(
    `OK: ${result.matched.length} ClientEvent*IntegrationTest(s) covered by backend-critical-tests.txt`
  );
}

if (require.main === module) {
  try {
    main(process.argv);
  } catch (error) {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  }
}

module.exports = {
  antPatternToRegExp,
  parseCriticalPatterns,
  matchesAnyPattern,
  checkClientEventCriticalRegistration,
  findClientEventIntegrationTests
};
