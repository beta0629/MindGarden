#!/usr/bin/env node
/**
 * 일지 달력·MGPagination·상담사 카드 — stone 계산값(#D4CFC8 / #FAF9F7) 금지,
 * slate(--mg-v2-consultant-border-card → --cs-slate-200 #e2e8f0) 강제.
 *
 * 사용: node scripts/verification/check-consultant-slate-border-tokens.mjs
 * 종료: 0=PASS, 1=FAIL
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const HARNESS_DIR = path.join(ROOT, '.tmp-harness');
const HARNESS_HTML = path.join(HARNESS_DIR, 'mg-consultant-slate-border.html');

const FORBIDDEN = new Set([
  'rgb(212, 207, 200)',
  'rgba(212, 207, 200, 1)',
  'rgb(250, 249, 247)',
  'rgba(250, 249, 247, 1)'
]);

const EXPECTED_SLATE_BORDER = 'rgb(226, 232, 240)'; // #e2e8f0

const CSS_REL = [
  'frontend/src/styles/tokens/design-v2-tokens.css',
  'frontend/src/styles/tokens/design-v2-tokens-refine.css',
  'frontend/src/styles/unified-design-tokens.css',
  'frontend/src/components/admin/consultation-log-view/ConsultationLogCalendarBlock.css',
  'frontend/src/components/common/MGPagination.css',
  'frontend/src/components/consultant/suite/ConsultantSuite.css'
];

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/local/bin/google-chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/snap/bin/chromium'
].filter(Boolean);

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function loadPuppeteer() {
  const require = createRequire(import.meta.url);
  for (const dir of [
    path.join(ROOT, 'node_modules/puppeteer-core'),
    path.join(ROOT, 'frontend/node_modules/puppeteer-core'),
    '/tmp/node_modules/puppeteer-core'
  ]) {
    try {
      return require(path.join(dir, 'package.json')) && require(dir);
    } catch {
      /* next */
    }
  }
  throw new Error('puppeteer-core 없음');
}

function buildHtml() {
  const styles = CSS_REL.map((rel) => {
    const abs = path.join(ROOT, rel);
    return `<!-- ${rel} -->\n<style>\n${fs.readFileSync(abs, 'utf8')}\n</style>`;
  }).join('\n');
  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8" />
${styles}
</head><body>
<div class="consultant-suite">
  <div class="consultant-suite__panel" id="suite-card">상담사 카드</div>
</div>
<div class="mg-v2-consultation-log-calendar-block__card" id="log-card">
  <div class="mg-v2-consultation-log-calendar-wrapper" id="log-wrap">
    <div class="fc">
      <table class="fc-theme-standard"><thead><tr>
        <th class="fc-col-header-cell" id="log-header">월</th>
      </tr></thead>
      <tbody><tr><td id="log-cell">1</td></tr></tbody></table>
      <button type="button" class="fc-button-primary" id="log-fc-btn">오늘</button>
    </div>
  </div>
</div>
<div class="mg-pagination" id="pager">
  <button type="button" class="mg-pagination__button mg-button mg-button--outline" id="pager-btn">1</button>
</div>
<pre id="out"></pre>
<script>
const FORBIDDEN=${JSON.stringify([...FORBIDDEN])};
const EXPECTED=${JSON.stringify(EXPECTED_SLATE_BORDER)};
function norm(v){
  const s=String(v||'').trim().toLowerCase();
  if(s.startsWith('rgba')){
    const m=s.match(/rgba\\((\\d+),\\s*(\\d+),\\s*(\\d+),\\s*([\\d.]+)\\)/);
    if(m && Number(m[4])===1) return 'rgb('+m[1]+', '+m[2]+', '+m[3]+')';
  }
  return s.replace(/\\s+/g,' ');
}
function sample(id, props){
  const el=document.getElementById(id);
  const cs=getComputedStyle(el);
  const out={ id };
  for(const p of props){
    out[p]=norm(cs[p] || cs.getPropertyValue(p));
  }
  return out;
}
window.__collect=function(){
  return {
    suiteCard: sample('suite-card', ['borderTopColor','backgroundColor','color']),
    logCard: sample('log-card', ['borderTopColor','backgroundColor','color']),
    logWrap: sample('log-wrap', ['backgroundColor','color']),
    logHeader: sample('log-header', ['borderTopColor','backgroundColor','color']),
    logFcBtn: sample('log-fc-btn', ['borderTopColor','backgroundColor','color']),
    pager: sample('pager', ['borderTopColor','backgroundColor','color']),
    pagerBtn: sample('pager-btn', ['borderTopColor','backgroundColor','color'])
  };
};
</script>
</body></html>`;
}

function hasForbidden(sample) {
  const hits = [];
  for (const [k, v] of Object.entries(sample)) {
    if (k === 'id') continue;
    if (FORBIDDEN.has(v) || [...FORBIDDEN].some((f) => v === f)) {
      hits.push(`${k}=${v}`);
    }
  }
  return hits;
}

async function main() {
  const chrome = findChrome();
  if (!chrome) {
    console.error('FAIL: Chrome/Chromium 없음');
    process.exit(1);
  }
  const puppeteer = loadPuppeteer();
  fs.mkdirSync(HARNESS_DIR, { recursive: true });
  fs.writeFileSync(HARNESS_HTML, buildHtml());

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  try {
    const page = await browser.newPage();
    await page.goto(`file://${HARNESS_HTML}`, { waitUntil: 'networkidle0' });
    const metrics = await page.evaluate(() => window.__collect());

    const cases = [];
    for (const [name, sample] of Object.entries(metrics)) {
      const forbidden = hasForbidden(sample);
      const borderOk = !sample.borderTopColor
        || sample.borderTopColor === 'rgba(0, 0, 0, 0)'
        || sample.borderTopColor === EXPECTED_SLATE_BORDER
        || sample.borderTopColor === 'rgb(0, 0, 0)' // transparent collapse
        || name === 'logWrap'; // wrap 은 border 없음
      const reasons = [];
      if (forbidden.length) reasons.push(`stone=${forbidden.join(',')}`);
      // 카드·페이저·달력 테두리는 slate 필수
      if (['suiteCard', 'logCard', 'logFcBtn', 'pager', 'pagerBtn'].includes(name)) {
        if (sample.borderTopColor !== EXPECTED_SLATE_BORDER) {
          reasons.push(`border=${sample.borderTopColor} expected=${EXPECTED_SLATE_BORDER}`);
        }
      }
      cases.push({
        name,
        ok: reasons.length === 0,
        reason: reasons.join('; ') || 'ok',
        metrics: sample,
        borderOk
      });
    }

    const failed = cases.filter((c) => !c.ok);
    console.log(JSON.stringify({ chrome, cases, failed: failed.map((f) => f.name) }, null, 2));
    if (failed.length) {
      console.error('FAIL cases:', failed.map((f) => `${f.name}: ${f.reason}`).join(' | '));
      process.exit(1);
    }
    console.log('PASS consultant-slate-border-tokens');
    process.exit(0);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error('FAIL:', e);
  process.exit(1);
});
