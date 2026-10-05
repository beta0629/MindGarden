#!/usr/bin/env node
'use strict';

/**
 * 개발 nginx: sites-enabled 에 core-solution-dev 를 한 번만 켜고,
 * http 컨텍스트의 real_ip_header / set_real_ip_from 이 한 블록인지 검사한다.
 *
 *   node scripts/verification/check-nginx-dev-real-ip.js
 *   node scripts/verification/check-nginx-dev-real-ip.js --root <dir>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */

const fs = require('fs');
const path = require('path');

const WORKFLOW = '.github/workflows/deploy-nginx-dev.yml';
const CORE = 'config/nginx/core-solution-dev.conf';
const GARDEN = 'config/nginx/dev.m-garden.co.kr.conf';

const ENABLE_ONE = 'sudo ln -sf /etc/nginx/sites-available/core-solution-dev /etc/nginx/sites-enabled/core-solution-dev';
const REMOVE_OTHER = 'sudo rm -f /etc/nginx/sites-enabled/core-solution-dev.conf';
const BOTH_NAMES = /for\s+DEST_NAME\s+in\s+core-solution-dev\s+core-solution-dev\.conf/;
const LINK_CONF = /ln\s+-sf\b[^\n]*sites-enabled\/core-solution-dev\.conf/;

function parseArgs(argv) {
  const out = { root: process.cwd() };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--root') {
      out.root = path.resolve(argv[i + 1]);
      i += 1;
    }
  }
  return out;
}

function stripHashComment(line) {
  let out = '';
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (quote) {
      out += c;
      if (c === quote && line[i - 1] !== '\\') {
        quote = null;
      }
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      out += c;
      continue;
    }
    if (c === '#') {
      break;
    }
    out += c;
  }
  return out;
}

function codeText(text) {
  return text
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .map(stripHashComment)
    .join('\n');
}

function countDirective(text, name) {
  const re = new RegExp(`^\\s*${name}\\s+`);
  return codeText(text)
    .split('\n')
    .filter((line) => re.test(line))
    .length;
}

function directiveCounts(text) {
  return {
    real_ip_header: countDirective(text, 'real_ip_header'),
    real_ip_recursive: countDirective(text, 'real_ip_recursive'),
    set_real_ip_from: countDirective(text, 'set_real_ip_from')
  };
}

function workflowIssues(text) {
  const code = codeText(text);
  const issues = [];
  if (BOTH_NAMES.test(code)) {
    issues.push('workflow enables both core-solution-dev and core-solution-dev.conf');
  }
  if (LINK_CONF.test(code)) {
    issues.push('workflow links sites-enabled/core-solution-dev.conf');
  }
  if (!code.includes(ENABLE_ONE)) {
    issues.push('workflow does not enable only sites-enabled/core-solution-dev');
  }
  if (!code.includes(REMOVE_OTHER)) {
    issues.push('workflow does not remove leftover sites-enabled/core-solution-dev.conf');
  }
  const enableCount = code.split(ENABLE_ONE).length - 1;
  if (enableCount !== 1) {
    issues.push(`workflow enables core-solution-dev ${enableCount} times`);
  }
  return issues;
}

function siteIssues(coreText, gardenText) {
  const issues = [];
  const core = directiveCounts(coreText);
  const garden = directiveCounts(gardenText);
  if (core.real_ip_header !== 1) {
    issues.push(`core-solution-dev.conf real_ip_header count ${core.real_ip_header}`);
  }
  if (core.real_ip_recursive !== 1) {
    issues.push(`core-solution-dev.conf real_ip_recursive count ${core.real_ip_recursive}`);
  }
  if (!/^\s*real_ip_header\s+CF-Connecting-IP\s*;/m.test(codeText(coreText))) {
    issues.push('core-solution-dev.conf real_ip_header is not CF-Connecting-IP');
  }
  if (core.set_real_ip_from < 22) {
    issues.push(`core-solution-dev.conf set_real_ip_from count ${core.set_real_ip_from}`);
  }
  if (!codeText(coreText).includes('set_real_ip_from 173.245.48.0/20;')) {
    issues.push('core-solution-dev.conf missing Cloudflare range 173.245.48.0/20');
  }
  if (!codeText(coreText).includes('set_real_ip_from 2c0f:f248::/32;')) {
    issues.push('core-solution-dev.conf missing Cloudflare range 2c0f:f248::/32');
  }
  if (garden.real_ip_header !== 0) {
    issues.push(`dev.m-garden.co.kr.conf real_ip_header count ${garden.real_ip_header}`);
  }
  if (garden.real_ip_recursive !== 0) {
    issues.push(`dev.m-garden.co.kr.conf real_ip_recursive count ${garden.real_ip_recursive}`);
  }
  if (garden.set_real_ip_from !== 0) {
    issues.push(`dev.m-garden.co.kr.conf set_real_ip_from count ${garden.set_real_ip_from}`);
  }
  const combined = core.real_ip_header + garden.real_ip_header;
  if (combined !== 1) {
    issues.push(`http include real_ip_header count ${combined}`);
  }
  return issues;
}

function checkRoot(root) {
  const workflow = fs.readFileSync(path.join(root, WORKFLOW), 'utf8');
  const core = fs.readFileSync(path.join(root, CORE), 'utf8');
  const garden = fs.readFileSync(path.join(root, GARDEN), 'utf8');
  return [...workflowIssues(workflow), ...siteIssues(core, garden)];
}

function main() {
  const args = parseArgs(process.argv);
  const issues = checkRoot(args.root);
  if (issues.length === 0) {
    console.log('check-nginx-dev-real-ip: OK');
    return 0;
  }
  issues.forEach((issue) => console.log(`FAIL ${issue}`));
  return 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  checkRoot,
  codeText,
  directiveCounts,
  siteIssues,
  workflowIssues
};
