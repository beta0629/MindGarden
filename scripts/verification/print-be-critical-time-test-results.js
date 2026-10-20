#!/usr/bin/env node
'use strict';

/**
 * #1718 CI-required time tests — surefire 결과 요약·단언.
 *
 * 기본 리포트 디렉터리: <repo>/target/surefire-reports
 * 옵션: --reports-dir <path>
 *
 * Exit 1 if any required class is missing, tests run == 0, or failures/errors > 0.
 *
 * @author CoreSolution
 * @since 2026-10-20
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const DEFAULT_REPORTS_DIR = path.join(ROOT, 'target', 'surefire-reports');

/** @type {readonly { fqcn: string, simple: string }[]} */
const REQUIRED_TIME_TESTS = Object.freeze([
  {
    fqcn: 'com.coresolution.consultation.controller.SystemTimeControllerTest',
    simple: 'SystemTimeControllerTest'
  },
  {
    fqcn: 'com.coresolution.consultation.config.filter.JwtAuthenticationFilterPublicTimePathTest',
    simple: 'JwtAuthenticationFilterPublicTimePathTest'
  },
  {
    fqcn: 'com.coresolution.core.controller.academy.AcademyConsultationControllerPastTimeTest',
    simple: 'AcademyConsultationControllerPastTimeTest'
  }
]);

/**
 * @param {string[]} argv
 * @returns {{ reportsDir: string }}
 */
function parseArgs(argv) {
  let reportsDir = DEFAULT_REPORTS_DIR;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--reports-dir' && argv[i + 1]) {
      reportsDir = path.resolve(argv[i + 1]);
      i += 1;
    }
  }
  return { reportsDir };
}

/**
 * @param {string} text
 * @returns {{ tests: number, failures: number, errors: number, skipped: number } | null}
 */
function parseTxtSummary(text) {
  const m = text.match(
    /Tests run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+),\s*Skipped:\s*(\d+)/i
  );
  if (!m) {
    return null;
  }
  return {
    tests: Number(m[1]),
    failures: Number(m[2]),
    errors: Number(m[3]),
    skipped: Number(m[4])
  };
}

/**
 * @param {string} text
 * @param {string} fqcn
 * @returns {{ tests: number, failures: number, errors: number, skipped: number } | null}
 */
function parseXmlSummary(text, fqcn) {
  const escaped = fqcn.replace(/\./g, '\\.');
  const re = new RegExp(
    `<testsuite\\b[^>]*\\bname="${escaped}"[^>]*>|<testsuite\\b[^>]*\\bname='${escaped}'[^>]*>`,
    'i'
  );
  const m = text.match(re);
  if (!m) {
    // Fallback: first testsuite attrs if file is dedicated to this class
    const any = text.match(/<testsuite\b([^>]*)>/i);
    if (!any) {
      return null;
    }
    const attrs = any[1];
    const nameMatch = attrs.match(/\bname=["']([^"']+)["']/i);
    if (!nameMatch || nameMatch[1] !== fqcn) {
      return null;
    }
    return attrsToCounts(attrs);
  }
  return attrsToCounts(m[0]);
}

/**
 * @param {string} attrsChunk
 * @returns {{ tests: number, failures: number, errors: number, skipped: number } | null}
 */
function attrsToCounts(attrsChunk) {
  const num = (key) => {
    const m = attrsChunk.match(new RegExp(`\\b${key}=["'](\\d+)["']`, 'i'));
    return m ? Number(m[1]) : null;
  };
  const tests = num('tests');
  const failures = num('failures');
  const errors = num('errors');
  const skipped = num('skipped');
  if (tests == null || failures == null || errors == null) {
    return null;
  }
  return {
    tests,
    failures,
    errors,
    skipped: skipped == null ? 0 : skipped
  };
}

/**
 * @param {string} reportsDir
 * @param {string} fqcn
 * @returns {{ tests: number, failures: number, errors: number, skipped: number, source: string } | null}
 */
function findReport(reportsDir, fqcn) {
  const xmlName = `TEST-${fqcn}.xml`;
  const txtName = `${fqcn}.txt`;
  const xmlPath = path.join(reportsDir, xmlName);
  const txtPath = path.join(reportsDir, txtName);

  if (fs.existsSync(xmlPath)) {
    const counts = parseXmlSummary(fs.readFileSync(xmlPath, 'utf8'), fqcn);
    if (counts) {
      return { ...counts, source: xmlName };
    }
  }
  if (fs.existsSync(txtPath)) {
    const counts = parseTxtSummary(fs.readFileSync(txtPath, 'utf8'));
    if (counts) {
      return { ...counts, source: txtName };
    }
  }

  // Nested / alternate filenames: scan directory
  if (!fs.existsSync(reportsDir)) {
    return null;
  }
  const files = fs.readdirSync(reportsDir);
  for (const file of files) {
    if (file === xmlName || file === txtName) {
      continue;
    }
    if (file.startsWith(`TEST-${fqcn}`) && file.endsWith('.xml')) {
      const counts = parseXmlSummary(fs.readFileSync(path.join(reportsDir, file), 'utf8'), fqcn);
      if (counts) {
        return { ...counts, source: file };
      }
    }
    if (file.startsWith(fqcn) && file.endsWith('.txt')) {
      const counts = parseTxtSummary(fs.readFileSync(path.join(reportsDir, file), 'utf8'));
      if (counts) {
        return { ...counts, source: file };
      }
    }
  }
  return null;
}

/**
 * @param {{ reportsDir?: string }} [options]
 * @returns {{ ok: boolean, lines: string[], exitCode: number }}
 */
function run(options = {}) {
  const reportsDir = options.reportsDir || DEFAULT_REPORTS_DIR;
  const lines = [];
  lines.push('=== CI-required time tests (#1718) ===');
  lines.push(`reports: ${reportsDir}`);

  if (!fs.existsSync(reportsDir)) {
    lines.push(`ERROR: surefire reports directory missing: ${reportsDir}`);
    lines.push('(mvn may have failed before writing reports, or wrong --reports-dir)');
    return { ok: false, lines, exitCode: 1 };
  }

  let ok = true;
  for (const { fqcn, simple } of REQUIRED_TIME_TESTS) {
    const report = findReport(reportsDir, fqcn);
    if (!report) {
      ok = false;
      lines.push(`${simple}: MISSING (no surefire report for ${fqcn})`);
      continue;
    }
    const summary =
      `${simple}: Tests run: ${report.tests}, Failures: ${report.failures}, ` +
      `Errors: ${report.errors}, Skipped: ${report.skipped} (${report.source})`;
    lines.push(summary);
    if (report.tests === 0) {
      ok = false;
      lines.push(`  ERROR: ${simple} tests run == 0`);
    }
    if (report.failures > 0 || report.errors > 0) {
      ok = false;
      lines.push(`  ERROR: ${simple} has failures/errors`);
    }
  }

  if (ok) {
    lines.push('OK: all #1718 time tests present with tests>0 and failures=0 errors=0');
  } else {
    lines.push('FAIL: one or more #1718 time tests missing or unhealthy');
  }

  return { ok, lines, exitCode: ok ? 0 : 1 };
}

function main(argv = process.argv.slice(2)) {
  const { reportsDir } = parseArgs(argv);
  const result = run({ reportsDir });
  result.lines.forEach((line) => console.log(line));
  process.exit(result.exitCode);
}

if (require.main === module) {
  main();
}

module.exports = {
  REQUIRED_TIME_TESTS,
  DEFAULT_REPORTS_DIR,
  parseArgs,
  parseTxtSummary,
  parseXmlSummary,
  findReport,
  run,
  main
};
