#!/usr/bin/env node
/**
 * 기관연계 배지 · 좁은 일정 칩 레이아웃 실측 (로컬 Chromium/Chrome)
 *
 * jsdom 으로는 overflow 잘림을 못 잡으므로, 실제 브라우저에서
 * 배지 rect ⊆ 칩 rect · scrollWidth/Height ≤ client · textContent=「기관연계」·
 * 보이는 글자 4자를 검사한다.
 *
 * 사용:
 *   node scripts/verification/check-engagement-badge-chip-layout.mjs
 *
 * 의존: puppeteer-core + 시스템 Chrome/Chromium
 *   (CI 워크플로에는 기본적으로 넣지 않는다. 로컬·에이전트 완료 측정용.)
 *
 * 종료 코드: 0=전부 PASS, 1=FAIL 또는 브라우저 불가
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const LABEL = '기관연계';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/local/bin/google-chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium'
].filter(Boolean);

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function loadPuppeteer() {
  const require = createRequire(import.meta.url);
  const tried = [
    path.join(ROOT, 'node_modules/puppeteer-core'),
    path.join(ROOT, 'frontend/node_modules/puppeteer-core'),
    '/tmp/node_modules/puppeteer-core'
  ];
  for (const dir of tried) {
    try {
      return require(path.join(dir, 'package.json')) && require(dir);
    } catch {
      /* next */
    }
  }
  throw new Error('puppeteer-core 없음. npm i puppeteer-core 후 재실행.');
}

function buildHarnessHtml() {
  const css = (rel) => path.join(ROOT, rel);
  const link = (rel) => `<link rel="stylesheet" href="file://${css(rel)}" />`;
  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8" />
${link('frontend/src/styles/tokens/design-v2-tokens.css')}
${link('frontend/src/components/common/Badge.css')}
${link('frontend/src/components/admin/mapping-management/integrated-schedule/molecules/ScheduleEventMarks.css')}
${link('frontend/src/components/admin/mapping-management/integrated-schedule/molecules/MatchingScheduleCompactRow.css')}
${link('frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.css')}
${link('frontend/src/components/ui/Schedule/ScheduleCalendarView.css')}
${link('frontend/src/components/schedule/ScheduleB0KlA.css')}
${link('frontend/src/components/ui/Schedule/ScheduleLegend.css')}
<style>
:root{--font-size-xs:.75rem;--mg-font-xs:.75rem;--mg-radius-full:9999px;--mg-spacing-2:2px;--mg-spacing-8:8px;--mg-spacing-sm:8px;--mg-spacing-xs:4px;--mg-spacing-1:.25rem;--mg-spacing-xl:2rem;--mg-spacing-36:9rem;--mg-badge-status-info-bg:#e8f1fb;--mg-badge-status-info-text:#1d4f91;--mg-v2-color-primary-main:#2f6fed;--mg-v2-color-text-primary:#1a1a1a;--mg-v2-color-text-secondary:#4b5563;--mg-v2-color-neutral-50:#f9fafb;--mg-v2-color-neutral-100:#f3f4f6;--mg-v2-color-neutral-200:#e5e7eb;--mg-v2-color-neutral-500:#6b7280;--mg-v2-color-neutral-600:#4b5563;--mg-v2-border-width-thick:2px;--mg-v2-font-weight-semibold:600;--mg-v2-color-semantic-warning:#b45309;--mg-v2-color-semantic-warning-dark:#92400e;--mg-v2-color-semantic-warning-light:#fef3c7;--mg-v2-color-semantic-success-dark:#166534;--cs-brown-50:#faf8f5;--cs-brown-300:#d4c4b0;--cs-brown-600:#8b6914;--cs-brown-700:#6b4f0f;--mg-text-secondary:#4b5563;--mg-text-primary:#1a1a1a;--mg-secondary-600:#4b5563;--mg-color-text-main:#1a1a1a;--mg-color-text-secondary:#4b5563;--mg-color-border-main:#e5e7eb;--mg-color-background-main:#fff;--mg-color-surface-main:#fff;--mg-color-primary-light:#93c5fd;--mg-color-primary-main:#2f6fed;--mg-primary-700:#1d4ed8;--mg-gray-500:#6b7280;--mg-radius-sm:6px;--mg-month-event-status-color:var(--mg-v2-color-primary-main);--mg-schedule-legend-inline-pad:0}
body{margin:0;font-family:"Noto Sans KR",sans-serif}
.sec{padding:12px;border-bottom:1px solid #ddd}.lab{font-size:11px;margin-bottom:6px}
.row{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start}.harness{border:1px dashed #aaa}
.legend-title{font-size:13px;font-weight:600;margin:0 0 8px;padding:0}
</style></head><body>
<div class="sec"><div class="lab">month</div><div class="row" id="month-row"></div></div>
<div class="sec"><div class="lab">week</div><div class="row" id="week-row"></div></div>
<div class="sec" style="width:390px;box-sizing:border-box;border:1px solid #ccc">
  <div class="lab">390 sidebar</div>
  <button type="button" class="integrated-schedule__compact-row" id="sidebar-row">
    <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">이내담</span>
    <span class="mg-schedule-event-marks"><span class="mg-schedule-event-marks__institution">
      <span class="mg-common-badge mg-common-badge--sm mg-common-badge--status mg-common-badge--info mg-engagement-type-badge" id="badge-sidebar">${LABEL}</span>
    </span></span>
  </button>
</div>
<div class="sec" style="width:390px;box-sizing:border-box;border:1px solid #ccc">
  <div class="lab">390 mapping</div>
  <div id="mapping-card" style="display:flex;flex-wrap:wrap;gap:8px;padding:8px;overflow:hidden;border:1px solid #eee">
    <h5 style="margin:0">이내담</h5>
    <span class="mg-common-badge mg-common-badge--sm mg-common-badge--status mg-common-badge--info mg-engagement-type-badge" id="badge-mapping">${LABEL}</span>
  </div>
</div>
<div class="sec" style="width:390px;box-sizing:border-box;border:1px solid #ccc">
  <div class="lab">390 detail</div>
  <div id="detail-wrap" style="display:flex;flex-wrap:wrap;gap:8px;padding:8px;overflow:hidden">
    <span>계약 유형</span>
    <span class="mg-common-badge mg-common-badge--sm mg-common-badge--status mg-common-badge--info mg-engagement-type-badge" id="badge-detail">${LABEL}</span>
  </div>
</div>
<div class="sec" id="legend">
  <p class="legend-title" id="legend-title">안내</p>
  <div class="mg-schedule-marks-legend" id="legend-marks"><span class="mg-schedule-marks-legend__item">상태</span></div>
  <p class="integrated-schedule__legend integrated-schedule__legend--same-day" id="legend-sameday">
    <span class="integrated-schedule__legend-swatch integrated-schedule__legend-swatch--same-day"></span>
    <span class="integrated-schedule__legend-text">당일결제 점선</span>
  </p>
</div>
<pre id="metrics"></pre>
<script>
function monthChip(w,id){return '<div><div class="lab">m'+w+'</div><div class="integrated-schedule__calendar-wrapper--integrated"><div class="fc-daygrid-event-harness harness" style="width:'+w+'px"><div class="mg-v2-ad-calendar-event mg-v2-ad-calendar-event--compact mg-v2-ad-calendar-event--integrated-month mg-v2-ad-calendar-event--status-booked" id="chip-'+id+'"><span class="mg-v2-ad-calendar-event__time"><span class="mg-v2-ad-calendar-event__time-short">14:00</span></span><span class="mg-v2-ad-calendar-event__client">이내담</span><span class="mg-schedule-event-marks"><span class="mg-schedule-event-marks__institution"><span class="mg-common-badge mg-common-badge--sm mg-common-badge--status mg-common-badge--info mg-engagement-type-badge" id="badge-'+id+'">${LABEL}</span></span></span></div></div></div></div>';}
function weekChip(w,id){return '<div><div class="lab">w'+w+'</div><div class="harness" style="width:'+w+'px"><div class="mg-v2-ad-calendar-event" id="chip-'+id+'" style="min-height:40px"><div class="mg-v2-ad-calendar-event__time">14:00</div><div class="mg-v2-ad-calendar-event__title"><span class="client-name">이내담</span></div><span class="mg-common-badge mg-common-badge--sm mg-common-badge--status mg-common-badge--info mg-engagement-type-badge mg-v2-ad-calendar-event__engagement" id="badge-'+id+'">${LABEL}</span><div class="mg-v2-ad-calendar-event__status">예약됨</div></div></div></div>';}
document.getElementById('month-row').innerHTML=[33,88,135].map(w=>monthChip(w,'m'+w)).join('');
document.getElementById('week-row').innerHTML=[26,74,120].map(w=>weekChip(w,'w'+w)).join('');
function measure(chipId,badgeId){
  const chip=document.getElementById(chipId), badge=document.getElementById(badgeId);
  if(!chip||!badge) return null;
  const c=chip.getBoundingClientRect(), b=badge.getBoundingClientRect();
  const inside=b.left>=c.left-0.5&&b.top>=c.top-0.5&&b.right<=c.right+0.5&&b.bottom<=c.bottom+0.5;
  let visibleChars=0;
  if(badge.firstChild && badge.firstChild.nodeType===3){
    for(let i=0;i<badge.textContent.length;i++){
      const range=document.createRange();
      range.setStart(badge.firstChild,i); range.setEnd(badge.firstChild,i+1);
      const r=range.getBoundingClientRect();
      if(r.width>0&&r.height>0&&r.right<=c.right+0.5&&r.left>=c.left-0.5&&r.bottom<=c.bottom+0.5&&r.top>=c.top-0.5) visibleChars++;
    }
  }
  return {text:badge.textContent,chipW:+c.width.toFixed(2),chipH:+c.height.toFixed(2),badgeW:+b.width.toFixed(2),badgeH:+b.height.toFixed(2),scrollW:badge.scrollWidth,clientW:badge.clientWidth,scrollH:badge.scrollHeight,clientH:badge.clientHeight,fitW:badge.scrollWidth<=badge.clientWidth+0.5,fitH:badge.scrollHeight<=badge.clientHeight+0.5,inside,visibleChars,badgeInTitle:!!badge.closest('.mg-v2-ad-calendar-event__title'),whiteSpace:getComputedStyle(badge).whiteSpace};
}
const out={
  month33:measure('chip-m33','badge-m33'), month88:measure('chip-m88','badge-m88'), month135:measure('chip-m135','badge-m135'),
  week26:measure('chip-w26','badge-w26'), week74:measure('chip-w74','badge-w74'), week120:measure('chip-w120','badge-w120'),
  sidebar:measure('sidebar-row','badge-sidebar'), mapping:measure('mapping-card','badge-mapping'), detail:measure('detail-wrap','badge-detail'),
  legend:{
    titleLeft:+document.getElementById('legend-title').getBoundingClientRect().left.toFixed(2),
    marksLeft:+document.getElementById('legend-marks').getBoundingClientRect().left.toFixed(2),
    sameSwatchLeft:+document.querySelector('#legend-sameday .integrated-schedule__legend-swatch--same-day').getBoundingClientRect().left.toFixed(2),
    samePad:getComputedStyle(document.getElementById('legend-sameday')).paddingInlineStart
  }
};
document.getElementById('metrics').textContent=JSON.stringify(out,null,2);
</script></body></html>`;
}

function passCase(name, m, { requireOutsideTitle = false } = {}) {
  if (!m) return { name, ok: false, reason: 'missing' };
  const reasons = [];
  if (m.text !== LABEL) reasons.push(`text=${m.text}`);
  if (!m.inside) reasons.push('badgeOutsideChip');
  if (!m.fitW) reasons.push(`scrollW ${m.scrollW}>clientW ${m.clientW}`);
  if (!m.fitH) reasons.push(`scrollH ${m.scrollH}>clientH ${m.clientH}`);
  if (m.visibleChars !== 4) reasons.push(`visibleChars=${m.visibleChars}`);
  if (requireOutsideTitle && m.badgeInTitle) reasons.push('badgeStillInTitle');
  return { name, ok: reasons.length === 0, reason: reasons.join('; ') || 'ok', metrics: m };
}

async function main() {
  const chrome = findChrome();
  if (!chrome) {
    console.error('FAIL: Chrome/Chromium 경로 없음 (CHROME_PATH 또는 시스템 바이너리)');
    process.exit(1);
  }
  let puppeteer;
  try {
    puppeteer = loadPuppeteer();
  } catch (e) {
    console.error('FAIL:', e.message);
    process.exit(1);
  }

  const htmlPath = path.join(os.tmpdir(), 'mg-engagement-badge-chip-layout.html');
  fs.writeFileSync(htmlPath, buildHarnessHtml());

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 1 });
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 400));
    const metrics = await page.evaluate(() => JSON.parse(document.getElementById('metrics').textContent));

    const cases = [
      passCase('month33', metrics.month33),
      passCase('month88', metrics.month88),
      passCase('month135', metrics.month135),
      passCase('week26', metrics.week26, { requireOutsideTitle: true }),
      passCase('week74', metrics.week74, { requireOutsideTitle: true }),
      passCase('week120', metrics.week120, { requireOutsideTitle: true }),
      passCase('sidebar390', metrics.sidebar),
      passCase('mapping390', metrics.mapping),
      passCase('detail390', metrics.detail)
    ];

    const legend = metrics.legend;
    const legendAligned =
      Math.abs(legend.titleLeft - legend.marksLeft) < 0.5 &&
      Math.abs(legend.titleLeft - legend.sameSwatchLeft) < 0.5 &&
      (legend.samePad === '0px' || legend.samePad === '0');
    cases.push({
      name: 'legendAlign',
      ok: legendAligned,
      reason: legendAligned ? 'ok' : JSON.stringify(legend),
      metrics: legend
    });

    const failed = cases.filter((c) => !c.ok);
    console.log(JSON.stringify({ chrome, cases, failed: failed.map((f) => f.name) }, null, 2));
    if (failed.length) {
      console.error('FAIL cases:', failed.map((f) => `${f.name}: ${f.reason}`).join(' | '));
      process.exit(1);
    }
    console.log('PASS engagement-badge-chip-layout');
    process.exit(0);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
