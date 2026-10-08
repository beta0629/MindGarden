#!/usr/bin/env node
/**
 * 기관연계 배지 · 좁은 일정 칩 레이아웃 실측 (Chromium/Chrome)
 *
 * 실제 ScheduleCalendarView.css + design tokens 를 HTML 에 인라인하고,
 * WeekDayScheduleEventChip 과 동일한 클래스·6-stage judge(실제 computed font)로
 * 시간 잘림·배지 클리핑을 검사한다.
 *
 * Stages: long+badge → long → short+badge → short → compact-pad → hide-time
 * 추가: 34.8px half-width 연속 칩(10:00–10:50 + 11:00 overlap column)
 * 구코드(11px 가정 font / short 강제)는 34.8 에서 FAIL 해야 함.
 * 추가: 내담자+상담사 동시 — 390 주간 12~29px, 1440 34.8·59px (client 우선 / counselor 숨김·ellipsis)
 *
 * 사용:
 *   node scripts/verification/check-engagement-badge-chip-layout.mjs
 *
 * 의존: puppeteer-core + Chrome/Chromium
 * CI: .github/workflows/guardrails.yml · Guardrail FE (engagement badge chip layout)
 *
 * 종료 코드: 0=PASS, 1=FAIL
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
/** snap Chromium 은 /tmp 를 못 읽음 — harness 는 레포 루트 하위에 둔다 */
const HARNESS_DIR = path.join(ROOT, '.tmp-harness');
const HARNESS_HTML = path.join(HARNESS_DIR, 'mg-engagement-badge-chip-layout.html');
const WEEK_DAY_CHIP_FIT_SRC = path.join(ROOT, 'frontend/src/utils/weekDayChipFit.js');
const WEEK_DAY_CHIP_FIT_IIFE = path.join(HARNESS_DIR, 'weekDayChipFit.iife.js');
const LABEL = '기관연계';
const SEG_A = LABEL.slice(0, Math.floor(LABEL.length / 2));
const SEG_B = LABEL.slice(Math.floor(LABEL.length / 2));
const ALLOWED_LINE_PATTERNS = new Set([LABEL, `${SEG_A}/${SEG_B}`]);

/**
 * 제품 weekDayChipFit.js 를 IIFE 로 번들 — 판정 로직 복사 금지.
 *
 * @returns {string} IIFE 소스
 */
function bundleWeekDayChipFitIife() {
  fs.mkdirSync(HARNESS_DIR, { recursive: true });
  const result = spawnSync(
    'npx',
    [
      '--yes',
      'esbuild@0.25.0',
      WEEK_DAY_CHIP_FIT_SRC,
      '--bundle',
      '--format=iife',
      '--global-name=MgWeekDayChipFit',
      `--outfile=${WEEK_DAY_CHIP_FIT_IIFE}`
    ],
    { cwd: ROOT, encoding: 'utf8' }
  );
  if (result.status !== 0) {
    throw new Error(
      `esbuild weekDayChipFit 번들 실패: ${result.stderr || result.stdout || result.error}`
    );
  }
  return fs.readFileSync(WEEK_DAY_CHIP_FIT_IIFE, 'utf8');
}

const MOBILE_VIEWPORT_WIDTH = 390;
const DESKTOP_VIEWPORT_WIDTH = 1440;

const WEEK_COL_OPEN = 164;
const WEEK_COL_COLLAPSED = 126;
const WEEK_COL_SIDEBAR_OPEN = 78;
const DAY_COL_DESKTOP = 106.8;
const DAY_COL_MOBILE = 320;
/** 겹침 열 half-width — 「11:00」→「11:0」 FAIL 재현 폭 */
const WEEK_CHIP_HALF = 34.8;

/** space-8(2rem) 슬롯 하한과 동기 — 하드코딩 상수가 아니라 토큰 rem→px(16*2) */
const SLOT_30_MIN_PX = 32;
const EVENT_50_MIN_HARNESS_PX = (50 / 30) * SLOT_30_MIN_PX;
const EVENT_30_MIN_HARNESS_PX = SLOT_30_MIN_PX;
const EVENT_15_MIN_HARNESS_PX = (15 / 30) * SLOT_30_MIN_PX;
const GAP_10_MIN_PX = (10 / 30) * SLOT_30_MIN_PX;

const HARNESS_CSS_REL_PATHS = [
  'frontend/src/styles/tokens/design-v2-tokens.css',
  'frontend/src/styles/tokens/design-v2-tokens-refine.css',
  'frontend/src/styles/unified-design-tokens.css',
  'frontend/src/components/common/Badge.css',
  'frontend/src/components/common/EngagementTypeBadge.css',
  'frontend/src/components/admin/mapping-management/integrated-schedule/molecules/ScheduleEventMarks.css',
  'frontend/src/components/admin/mapping-management/integrated-schedule/molecules/MatchingScheduleCompactRow.css',
  'frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.css',
  'frontend/src/components/ui/Schedule/ScheduleCalendarView.css',
  'frontend/src/components/schedule/ScheduleB0KlA.css',
  'frontend/src/components/ui/Schedule/ScheduleLegend.css'
];

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/local/bin/google-chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/snap/bin/chromium',
  '/usr/lib/chromium-browser/chromium-browser',
  '/usr/lib/chromium/chromium'
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

function badgeMarkup(id) {
  return `<span class="mg-common-badge mg-common-badge--sm mg-common-badge--status mg-common-badge--info mg-engagement-type-badge" id="${id}" aria-label="${LABEL}"><span class="mg-engagement-type-badge__seg" aria-hidden="true">${SEG_A}</span><wbr /><span class="mg-engagement-type-badge__seg" aria-hidden="true">${SEG_B}</span></span>`;
}

function inlineStylesheets() {
  return HARNESS_CSS_REL_PATHS.map((rel) => {
    const abs = path.join(ROOT, rel);
    const css = fs.readFileSync(abs, 'utf8');
    return `<!-- ${rel} -->\n<style>\n${css}\n</style>`;
  }).join('\n');
}

function buildHarnessHtml() {
  const chipFitIife = bundleWeekDayChipFitIife();
  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8" />
${inlineStylesheets()}
<script>
${chipFitIife}
</script>
<style>
:root{--font-size-xs:.75rem;--mg-font-xs:.75rem;--mg-font-size-2xs:.625rem;--mg-radius-full:9999px;--mg-spacing-2:2px;--mg-spacing-8:8px;--mg-spacing-sm:8px;--mg-spacing-xs:4px;--mg-spacing-1:.25rem;--mg-spacing-xl:2rem;--mg-spacing-36:9rem;--mg-badge-status-info-bg:#e8f1fb;--mg-badge-status-info-text:#1d4f91;--mg-v2-color-primary-main:#2f6fed;--mg-v2-color-text-primary:#1a1a1a;--mg-v2-color-text-secondary:#4b5563;--mg-v2-color-neutral-50:#f9fafb;--mg-v2-color-neutral-100:#f3f4f6;--mg-v2-color-neutral-200:#e5e7eb;--mg-v2-color-neutral-500:#6b7280;--mg-v2-color-neutral-600:#4b5563;--mg-v2-border-width-thick:2px;--mg-v2-font-weight-semibold:600;--mg-v2-color-semantic-warning:#b45309;--mg-v2-color-semantic-warning-dark:#92400e;--mg-v2-color-semantic-warning-light:#fef3c7;--mg-v2-color-semantic-success-dark:#166534;--cs-brown-50:#faf8f5;--cs-brown-300:#d4c4b0;--cs-brown-600:#8b6914;--cs-brown-700:#6b4f0f;--mg-text-secondary:#4b5563;--mg-text-primary:#1a1a1a;--mg-secondary-600:#4b5563;--mg-color-text-main:#1a1a1a;--mg-color-text-secondary:#4b5563;--mg-color-border-main:#e5e7eb;--mg-color-background-main:#fff;--mg-color-surface-main:#fff;--mg-color-primary-light:#93c5fd;--mg-color-primary-main:#2f6fed;--mg-primary-700:#1d4ed8;--mg-gray-500:#6b7280;--mg-radius-sm:6px;--mg-month-event-status-color:var(--mg-v2-color-primary-main);--mg-schedule-legend-inline-pad:0}
body{margin:0;font-family:"Pretendard","Noto Sans KR",sans-serif}
.sec{padding:12px;border-bottom:1px solid #ddd}.lab{font-size:11px;margin-bottom:6px}
.row{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start}
.harness{border:0;box-sizing:border-box}
.slot-stack{position:relative;box-sizing:border-box}
.fc-timegrid-event-harness{position:absolute;left:0;right:0;box-sizing:border-box}
.legend-title{font-size:13px;font-weight:600;margin:0 0 8px;padding:0}
#font-probe-host{position:absolute;left:-9999px;top:0;width:200px}
</style></head><body>
<div id="font-probe-host" aria-hidden="true"></div>
<div class="sec" id="sec-month"><div class="lab">month</div><div class="row" id="month-row"></div></div>
<div class="sec" id="sec-week-desktop"><div class="lab">week/day consecutive slots (desktop)</div><div class="row" id="week-row"></div></div>
<div class="sec" id="sec-week-mobile" style="width:100%;box-sizing:border-box">
  <div class="lab">narrow week chips (measure stages — same judge as day)</div>
  <div class="row" id="mobile-week-row"></div>
</div>
<div class="sec" id="sec-day-mobile" style="width:100%;box-sizing:border-box">
  <div class="lab">mobile day / 390 week-day (measure stages)</div>
  <div class="row" id="mobile-day-row"></div>
</div>
<div class="sec" id="sec-fit-cases" style="width:100%;box-sizing:border-box">
  <div class="lab">chip-fit widths 35 / 73.5 / 78 / 124 / 390 / 34.8</div>
  <div class="row" id="fit-row"></div>
</div>
<div class="sec" id="sec-half" style="width:100%;box-sizing:border-box">
  <div class="lab">half-width 34.8 consecutive overlap column (10:00–10:50 + 11:00)</div>
  <div class="row" id="half-row"></div>
</div>
<div class="sec" id="sec-name-priority" style="width:100%;box-sizing:border-box">
  <div class="lab">name priority client+counselor (12 / 20 / 29 / 34.8 / 59)</div>
  <div class="row" id="name-priority-row"></div>
</div>
<div class="sec" id="sec-dur-desktop" style="width:100%;box-sizing:border-box">
  <div class="lab">duration stack 50·30·15 (desktop 1440 week/day widths)</div>
  <div class="row" id="dur-desktop-row"></div>
</div>
<div class="sec" id="sec-dur-mobile" style="width:100%;box-sizing:border-box">
  <div class="lab">duration stack 50·30·15 (390 week/day)</div>
  <div class="row" id="dur-mobile-row"></div>
</div>
<div class="sec" id="sec-legacy-fail" style="width:100%;box-sizing:border-box">
  <div class="lab">legacy sibling badge (expect FAIL metrics)</div>
  <div class="row" id="legacy-fail-row"></div>
</div>
<div class="sec" id="sec-sidebar" style="width:100%;max-width:100%;box-sizing:border-box;border:1px solid #ccc">
  <div class="lab">sidebar</div>
  <button type="button" class="integrated-schedule__compact-row" id="sidebar-row">
    <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">이내담</span>
    <span class="mg-schedule-event-marks"><span class="mg-schedule-event-marks__institution">
      ${badgeMarkup('badge-sidebar')}
    </span></span>
  </button>
</div>
<div class="sec" id="sec-mapping" style="width:100%;box-sizing:border-box;border:1px solid #ccc">
  <div class="lab">mapping</div>
  <div id="mapping-card" style="display:flex;flex-wrap:wrap;gap:8px;padding:8px;overflow:hidden;border:1px solid #eee">
    <h5 style="margin:0">이내담</h5>
    ${badgeMarkup('badge-mapping')}
  </div>
</div>
<div class="sec" id="sec-detail" style="width:100%;box-sizing:border-box;border:1px solid #ccc">
  <div class="lab">detail</div>
  <div id="detail-wrap" style="display:flex;flex-wrap:wrap;gap:8px;padding:8px;overflow:hidden">
    <span>계약 유형</span>
    ${badgeMarkup('badge-detail')}
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
const LABEL=${JSON.stringify(LABEL)};
const SEG_A=${JSON.stringify(SEG_A)};
const SEG_B=${JSON.stringify(SEG_B)};
const ALLOWED=${JSON.stringify([...ALLOWED_LINE_PATTERNS])};
const WEEK_OPEN=${WEEK_COL_OPEN};
const WEEK_COLLAPSED=${WEEK_COL_COLLAPSED};
const WEEK_SIDEBAR=${WEEK_COL_SIDEBAR_OPEN};
const DAY_DESKTOP=${DAY_COL_DESKTOP};
const DAY_MOBILE=${DAY_COL_MOBILE};
const WEEK_HALF=${WEEK_CHIP_HALF};
const HARNESS_H=${EVENT_50_MIN_HARNESS_PX};
const HARNESS_H30=${EVENT_30_MIN_HARNESS_PX};
const HARNESS_H15=${EVENT_15_MIN_HARNESS_PX};
const GAP_H=${GAP_10_MIN_PX};
const LEGACY_TIME_FONT='600 11px "Pretendard", "Noto Sans KR", sans-serif';

function badgeHtml(id, extraClass){
  const cls='mg-common-badge mg-common-badge--sm mg-common-badge--status mg-common-badge--info mg-engagement-type-badge'+(extraClass?' '+extraClass:'');
  return '<span class="'+cls+'" id="'+id+'" aria-label="'+LABEL+'"><span class="mg-engagement-type-badge__seg" aria-hidden="true">'+SEG_A+'</span><wbr /><span class="mg-engagement-type-badge__seg" aria-hidden="true">'+SEG_B+'</span></span>';
}

function resolveFont(el){
  if(!el) return '';
  const s=getComputedStyle(el);
  const weight=s.fontWeight||'400';
  const size=s.fontSize||'';
  const family=s.fontFamily||'sans-serif';
  if(size) return weight+' '+size+' '+family;
  if(s.font && String(s.font).trim()) return String(s.font).trim();
  return weight+' 12px '+family;
}

function measureText(text, font){
  const canvas=document.createElement('canvas');
  const ctx=canvas.getContext('2d');
  if(!ctx) return String(text).length*7;
  ctx.font=font;
  return ctx.measureText(String(text)).width;
}

/** 실제 WeekDayScheduleEventChip 마크업 미니 프로브 — computed font/pad·줄 높이 확보 */
function ensureFontProbe(){
  const host=document.getElementById('font-probe-host');
  let chip=host.querySelector('.mg-v2-ad-calendar-event--week-day-fit');
  if(!chip){
    chip=document.createElement('div');
    chip.className='mg-v2-ad-calendar-event mg-v2-ad-calendar-event--week-day-fit';
    chip.innerHTML='<div class="mg-v2-ad-calendar-event__time"><span class="mg-v2-ad-calendar-event__time-text"><span class="mg-v2-ad-calendar-event__time-measured">11:00</span></span>'
      +badgeHtml('probe-badge','mg-v2-ad-calendar-event__engagement')+'</div>'
      +'<div class="mg-v2-ad-calendar-event__title"><span class="client-name">라마바</span><span class="counselor-name">상담사A</span></div>'
      +'<div class="mg-v2-ad-calendar-event__status">예약됨</div>';
    host.appendChild(chip);
  }
  return chip;
}

/** 프로브에서 제품 readRowHeight 로 자연 줄 높이 측정 */
function probeRowHeights(probe){
  const api=globalThis.MgWeekDayChipFit;
  const read=(sel)=>{
    const el=probe.querySelector(sel);
    if(!el) return 14;
    if(api && typeof api.readRowHeight==='function'){
      const h=api.readRowHeight(el);
      return h>0 ? h : 14;
    }
    const cs=getComputedStyle(el);
    return Number.parseFloat(cs.lineHeight)||Number.parseFloat(cs.fontSize)||14;
  };
  return {
    timeRowHeight:read('.mg-v2-ad-calendar-event__time'),
    titleRowHeight:read('.mg-v2-ad-calendar-event__title'),
    statusRowHeight:read('.mg-v2-ad-calendar-event__status')
  };
}

function parseCssLengthToPx(raw, el){
  const v=String(raw||'').trim();
  if(!v) return 0;
  if(v.endsWith('rem')){
    const rootPx=Number.parseFloat(getComputedStyle(document.documentElement).fontSize)||16;
    return (Number.parseFloat(v)||0)*rootPx;
  }
  if(v.endsWith('em')&&el){
    const parentPx=Number.parseFloat(getComputedStyle(el).fontSize)||16;
    return (Number.parseFloat(v)||0)*parentPx;
  }
  return Number.parseFloat(v)||0;
}

function readHorizontalPadding(el){
  const s=getComputedStyle(el);
  return (Number.parseFloat(s.paddingLeft)||0)+(Number.parseFloat(s.paddingRight)||0);
}

function readPadTokens(el){
  const probe=document.createElement('div');
  probe.className='mg-v2-ad-calendar-event mg-v2-ad-calendar-event--week-day-fit';
  probe.style.cssText='position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none;';
  document.body.appendChild(probe);
  const normalPadX=readHorizontalPadding(probe);
  probe.classList.add('mg-v2-ad-calendar-event--chip-pad-compact');
  const compactPadX=readHorizontalPadding(probe);
  probe.remove();
  if(normalPadX>0||compactPadX>0) return { normalPadX, compactPadX };
  const cs=getComputedStyle(el);
  const s1=parseCssLengthToPx(cs.getPropertyValue('--mg-v2-space-1'), el);
  const s2=parseCssLengthToPx(cs.getPropertyValue('--mg-v2-space-2'), el);
  return { normalPadX:s2*2, compactPadX:s1*2 };
}

/**
 * 제품 MgWeekDayChipFit.judgeWeekDayChipFit 직접 호출 (판정 로직 복사 금지).
 * font 는 실제 CSS computed (가정 11px 금지).
 */
function pickStage(harnessW){
  const api=globalThis.MgWeekDayChipFit;
  if(!api || typeof api.judgeWeekDayChipFit!=='function'){
    throw new Error('MgWeekDayChipFit.judgeWeekDayChipFit missing — product import failed');
  }
  const probe=ensureFontProbe();
  const timeEl=probe.querySelector('.mg-v2-ad-calendar-event__time-measured');
  const badgeEl=probe.querySelector('.mg-engagement-type-badge');
  const timeFont=resolveFont(timeEl);
  const badgeFont=resolveFont(badgeEl)||timeFont;
  const longW=measureText('오전 10:00', timeFont);
  const shortW=measureText('10:00', timeFont);
  const badgeW=measureText(LABEL, badgeFont)+8;
  const gap=4;
  const { normalPadX, compactPadX }=readPadTokens(probe);
  const chipW=Math.max(0, harnessW-normalPadX);
  const compactW=Math.max(0, harnessW-compactPadX);
  const rowH=probeRowHeights(probe);
  const judged=api.judgeWeekDayChipFit({
    chipWidth:chipW,
    compactChipWidth:compactW,
    longTimeWidth:longW,
    shortTimeWidth:shortW,
    badgeWidth:badgeW,
    gap,
    considerBadge:true,
    chipHeight:HARNESS_H,
    timeRowHeight:rowH.timeRowHeight,
    titleRowHeight:rowH.titleRowHeight,
    statusRowHeight:rowH.statusRowHeight,
    gapY:2
  });
  const time=judged.showTime
    ? (judged.timeMode==='long' ? '오전 10:00' : '10:00')
    : '10:00';
  return {
    time,
    badge:!!judged.showBadge,
    stage:judged.stage,
    showTime:!!judged.showTime,
    compactPad:!!judged.compactPad,
    showStatus:judged.showStatus!==false,
    showTitle:judged.showTitle!==false,
    mergeTimeTitle:!!judged.mergeTimeTitle,
    heightStage:judged.heightStage||'full',
    timeFont, shortW, longW, chipW, compactW,
    ...rowH
  };
}

function pickStageForHeight(harnessW, chipH){
  const base=pickStage(harnessW);
  const api=globalThis.MgWeekDayChipFit;
  const probe=ensureFontProbe();
  const timeEl=probe.querySelector('.mg-v2-ad-calendar-event__time-measured');
  const badgeEl=probe.querySelector('.mg-engagement-type-badge');
  const timeFont=resolveFont(timeEl);
  const badgeFont=resolveFont(badgeEl)||timeFont;
  const longW=measureText('오전 10:00', timeFont);
  const shortW=measureText('10:00', timeFont);
  const badgeW=measureText(LABEL, badgeFont)+8;
  const { normalPadX, compactPadX }=readPadTokens(probe);
  const chipW=Math.max(0, harnessW-normalPadX);
  const compactW=Math.max(0, harnessW-compactPadX);
  const rowH=probeRowHeights(probe);
  const judged=api.judgeWeekDayChipFit({
    chipWidth:chipW,
    compactChipWidth:compactW,
    longTimeWidth:longW,
    shortTimeWidth:shortW,
    badgeWidth:badgeW,
    gap:4,
    considerBadge:true,
    chipHeight:chipH,
    timeRowHeight:rowH.timeRowHeight,
    titleRowHeight:rowH.titleRowHeight,
    statusRowHeight:rowH.statusRowHeight,
    gapY:2
  });
  return {
    ...base,
    time:judged.showTime ? (judged.timeMode==='long' ? '오전 10:00' : '10:00') : '10:00',
    badge:!!judged.showBadge,
    stage:judged.stage,
    showTime:!!judged.showTime,
    compactPad:!!judged.compactPad,
    showStatus:judged.showStatus!==false,
    showTitle:judged.showTitle!==false,
    mergeTimeTitle:!!judged.mergeTimeTitle,
    heightStage:judged.heightStage||'full'
  };
}

/** 구 HEAD: 11px 가정 + short 단계까지만(compact/hide 없음) → short 강제 */
function legacyPickStage11px(harnessW){
  const padX=24;
  const chipW=Math.max(0, harnessW-padX);
  const longW=measureText('오전 10:00', LEGACY_TIME_FONT);
  const shortW=measureText('10:00', LEGACY_TIME_FONT);
  const badgeW=measureText(LABEL, '600 10px "Pretendard", "Noto Sans KR", sans-serif')+8;
  const gap=4;
  const fits=(need)=>chipW+0.5>=need;
  if(fits(longW+gap+badgeW)) return {time:'오전 10:00', badge:true, stage:'long+badge', showTime:true};
  if(fits(longW)) return {time:'오전 10:00', badge:false, stage:'long', showTime:true};
  if(fits(shortW+gap+badgeW)) return {time:'10:00', badge:true, stage:'short+badge', showTime:true};
  // 구코드: short 가 실제로 안 맞아도 SHORT 반환 → 클리핑
  return {time:'10:00', badge:false, stage:'short', showTime:true, shortW, chipW, wouldClip: shortW>chipW+0.5};
}

function weekDayCard(id, stageInfo, displayTimeOverride){
  const displayTime=displayTimeOverride!=null?displayTimeOverride:stageInfo.time;
  const compactCls=stageInfo.compactPad?' mg-v2-ad-calendar-event--chip-pad-compact':'';
  const mergeCls=stageInfo.mergeTimeTitle?' mg-v2-ad-calendar-event--merge-time-title':'';
  const badge=stageInfo.badge?badgeHtml('badge-'+id,'mg-v2-ad-calendar-event__engagement'):'';
  const timeHidden=stageInfo.showTime===false;
  const showTitle=stageInfo.showTitle!==false;
  const showStatus=stageInfo.showStatus!==false;
  const clientLabel=stageInfo.clientLabel||'이내담';
  const counselorLabel=stageInfo.counselorLabel||'';
  const showCounselor=stageInfo.showCounselorName===true && !!counselorLabel;
  const a11yTime=displayTime || stageInfo.time;
  const institutionPart=stageInfo.badge?' · '+LABEL:'';
  const a11yName=[clientLabel, counselorLabel].filter(Boolean).join(' ');
  const titleAttr=a11yTime+' · '+a11yName+' - 예약됨'+institutionPart;
  const measureSeed=displayTime || stageInfo.time;
  const timeInner=timeHidden
    ? '<span class="mg-v2-ad-calendar-event__time-text" hidden aria-hidden="true"><span class="mg-v2-ad-calendar-event__time-measured">'+measureSeed+'</span></span>'
    : '<span class="mg-v2-ad-calendar-event__time-text"><span class="mg-v2-ad-calendar-event__time-measured">'+displayTime+'</span></span>';
  const counselorHtml=showCounselor
    ? '<span class="counselor-name">'+counselorLabel+'</span>'
    : '';
  const titleHtml=showTitle
    ? '<div class="mg-v2-ad-calendar-event__title"><span class="client-name">'+clientLabel+'</span>'+counselorHtml+'</div>'
    : '';
  const statusHtml=showStatus
    ? '<div class="mg-v2-ad-calendar-event__status">예약됨</div>'
    : '';
  const heightStage=stageInfo.heightStage||'full';
  const timeBlock='<div class="mg-v2-ad-calendar-event__time">'+timeInner+badge+'</div>';
  const body=stageInfo.mergeTimeTitle
    ? '<div class="mg-v2-ad-calendar-event__merge-row">'+timeBlock+titleHtml+'</div>'
    : timeBlock+titleHtml;
  return '<div class="mg-v2-ad-calendar-event mg-v2-ad-calendar-event--week-day-fit'+compactCls+mergeCls+'" id="chip-'+id+'" data-chip-fit-stage="'+stageInfo.stage+'" data-chip-height-stage="'+heightStage+'" data-show-counselor="'+String(showCounselor)+'" title="'+titleAttr+'" aria-label="'+titleAttr+'">'+body+statusHtml+'</div>';
}

/** 내담자+상담사 동시 — 공용 judge 로 showCounselorName 반영 */
function pickStageWithNames(harnessW, opts){
  const clientLabel=(opts&&opts.clientLabel)||'라마바';
  const counselorLabel=(opts&&opts.counselorLabel)||'상담사A';
  const base=pickStage(harnessW);
  const api=globalThis.MgWeekDayChipFit;
  if(!api || typeof api.judgeWeekDayChipFit!=='function'){
    return { ...base, clientLabel, counselorLabel, showCounselorName:false };
  }
  const probe=ensureFontProbe();
  const timeEl=probe.querySelector('.mg-v2-ad-calendar-event__time-measured');
  const badgeEl=probe.querySelector('.mg-engagement-type-badge');
  const clientEl=probe.querySelector('.client-name');
  const counselorEl=probe.querySelector('.counselor-name');
  const timeFont=resolveFont(timeEl);
  const badgeFont=resolveFont(badgeEl)||timeFont;
  const clientFont=resolveFont(clientEl)||timeFont;
  const counselorFont=resolveFont(counselorEl)||clientFont;
  const longW=measureText('오전 10:00', timeFont);
  const shortW=measureText('10:00', timeFont);
  const badgeW=measureText(LABEL, badgeFont)+8;
  const clientW=measureText(clientLabel, clientFont);
  const counselorW=measureText(counselorLabel, counselorFont);
  const minClientW=measureText(clientLabel.charAt(0), clientFont);
  const gap=4;
  const { normalPadX, compactPadX }=readPadTokens(probe);
  const chipW=Math.max(0, harnessW-normalPadX);
  const compactW=Math.max(0, harnessW-compactPadX);
  const rowH=probeRowHeights(probe);
  const judged=api.judgeWeekDayChipFit({
    chipWidth:chipW,
    compactChipWidth:compactW,
    longTimeWidth:longW,
    shortTimeWidth:shortW,
    badgeWidth:badgeW,
    gap,
    considerBadge:true,
    chipHeight:HARNESS_H,
    timeRowHeight:rowH.timeRowHeight,
    titleRowHeight:rowH.titleRowHeight,
    statusRowHeight:rowH.statusRowHeight,
    gapY:2,
    clientNameWidth:clientW,
    counselorNameWidth:counselorW,
    minClientWidth:minClientW,
    nameGap:gap
  });
  return {
    ...base,
    time:judged.showTime ? (judged.timeMode==='long' ? '오전 10:00' : '10:00') : '10:00',
    badge:!!judged.showBadge,
    stage:judged.stage,
    showTime:!!judged.showTime,
    compactPad:!!judged.compactPad,
    showStatus:judged.showStatus!==false,
    showTitle:judged.showTitle!==false,
    mergeTimeTitle:!!judged.mergeTimeTitle,
    heightStage:judged.heightStage||'full',
    showCounselorName:!!judged.showCounselorName,
    clientLabel,
    counselorLabel,
    clientW, counselorW, minClientW, chipW, compactW
  };
}

function namePriorityChip(w, id){
  const stage=pickStageWithNames(w, { clientLabel:'라마바', counselorLabel:'상담사A' });
  return '<div><div class="lab">namePri'+w+' stage='+stage.stage+' counselor='+stage.showCounselorName+'</div>'
    +'<div class="harness" style="width:'+w+'px;height:'+HARNESS_H+'px">'
    +'<div class="fc-timegrid-event-harness" style="position:relative;height:100%">'+weekDayCard(id, stage)+'</div>'
    +'</div></div>';
}

function legacySiblingCard(id, timeText){
  const badge=badgeHtml('badge-'+id,'mg-v2-ad-calendar-event__engagement');
  return '<div class="mg-v2-ad-calendar-event" id="chip-'+id+'" style="min-height:4rem;height:auto;overflow:visible;padding:8px 12px;gap:4px"><div class="mg-v2-ad-calendar-event__time">'+timeText+'</div><div class="mg-v2-ad-calendar-event__title"><span class="client-name">이내담</span></div>'+badge+'<div class="mg-v2-ad-calendar-event__status">예약됨</div></div>';
}

/** 구코드 short 강제 렌더(compact/hide 없음) — 34.8 FAIL 증거용 */
function legacyShortForcedCard(id, timeText){
  return '<div class="mg-v2-ad-calendar-event mg-v2-ad-calendar-event--week-day-fit" id="chip-'+id+'" data-chip-fit-stage="legacy-short"><div class="mg-v2-ad-calendar-event__time"><span class="mg-v2-ad-calendar-event__time-text"><span class="mg-v2-ad-calendar-event__time-measured">'+timeText+'</span></span></div><div class="mg-v2-ad-calendar-event__title"><span class="client-name">이내담</span></div><div class="mg-v2-ad-calendar-event__status">예약됨</div></div>';
}

function consecutiveStack(w, idPrefix, useLegacy){
  const h1=HARNESS_H;
  const top2=HARNESS_H+GAP_H;
  const stackH=top2+HARNESS_H;
  const stage=pickStage(w);
  const timeB=stage.time.replace('10:','11:').replace('오전 10','오전 11');
  let c1, c2;
  if(useLegacy){
    c1=legacySiblingCard(idPrefix+'-a', '오전 10:00');
    c2=legacySiblingCard(idPrefix+'-b', '오전 11:00');
  }else{
    c1=weekDayCard(idPrefix+'-a', stage, stage.time);
    c2=weekDayCard(idPrefix+'-b', stage, timeB);
  }
  return '<div><div class="lab">'+idPrefix+' w'+w+' '+stage.stage+(useLegacy?' LEGACY':'')+'</div><div class="slot-stack harness" style="width:'+w+'px;height:'+stackH+'px"><div class="fc-timegrid-event-harness" id="harness-'+idPrefix+'-a" style="top:0;height:'+h1+'px">'+c1+'</div><div class="fc-timegrid-event-harness" id="harness-'+idPrefix+'-b" style="top:'+top2+'px;height:'+h1+'px">'+c2+'</div></div></div>';
}

function fitChip(w,id){
  const stage=pickStage(w);
  return '<div><div class="lab">fit'+w+' '+stage.stage+'</div><div class="harness" style="width:'+w+'px;height:'+HARNESS_H+'px"><div class="fc-timegrid-event-harness" style="position:relative;height:100%">'+weekDayCard(id, stage)+'</div></div></div>';
}

/** 연속 50·30·15분 스택 — 실제 높이 측정·빈칩·겹침 검사 */
function durationStack(w, idPrefix){
  const h50=HARNESS_H;
  const h30=HARNESS_H30;
  const h15=HARNESS_H15;
  const top30=h50+GAP_H;
  const top15=top30+h30+GAP_H;
  const stackH=top15+h15;
  const s50=pickStageForHeight(w, h50);
  const s30=pickStageForHeight(w, h30);
  const s15=pickStageForHeight(w, h15);
  const c50=weekDayCard(idPrefix+'-50', s50, s50.time);
  const c30=weekDayCard(idPrefix+'-30', s30, s30.time.replace('10:','11:').replace('오전 10','오전 11'));
  const c15=weekDayCard(idPrefix+'-15', s15, s15.time.replace('10:','12:').replace('오전 10','오후 12'));
  return '<div><div class="lab">'+idPrefix+' w'+w+' dur50/30/15 '+s50.heightStage+'/'+s30.heightStage+'/'+s15.heightStage+'</div>'
    +'<div class="slot-stack harness" style="width:'+w+'px;height:'+stackH+'px">'
    +'<div class="fc-timegrid-event-harness" id="harness-'+idPrefix+'-50" style="top:0;height:'+h50+'px">'+c50+'</div>'
    +'<div class="fc-timegrid-event-harness" id="harness-'+idPrefix+'-30" style="top:'+top30+'px;height:'+h30+'px">'+c30+'</div>'
    +'<div class="fc-timegrid-event-harness" id="harness-'+idPrefix+'-15" style="top:'+top15+'px;height:'+h15+'px">'+c15+'</div>'
    +'</div></div>';
}

function halfWidthOverlapStack(){
  const w=WEEK_HALF;
  const stage=pickStage(w);
  const legacy=legacyPickStage11px(w);
  const h1=HARNESS_H;
  const top2=HARNESS_H+GAP_H;
  const stackH=top2+HARNESS_H;
  const timeA=stage.time;
  const timeB=stage.time.replace('10:','11:').replace('오전 10','오전 11');
  const c1=weekDayCard('half-a', stage, timeA);
  const c2=weekDayCard('half-b', stage, timeB);
  const legacyCard=legacyShortForcedCard('half-legacy', '11:00');
  return '<div><div class="lab">half '+w+' '+stage.stage+' (legacyWouldClip='+!!legacy.wouldClip+')</div>'
    +'<div class="slot-stack harness" style="width:'+w+'px;height:'+stackH+'px">'
    +'<div class="fc-timegrid-event-harness" id="harness-half-a" style="top:0;height:'+h1+'px">'+c1+'</div>'
    +'<div class="fc-timegrid-event-harness" id="harness-half-b" style="top:'+top2+'px;height:'+h1+'px">'+c2+'</div>'
    +'</div>'
    +'<div class="harness" style="width:'+w+'px;height:'+h1+'px;margin-top:8px" id="harness-half-legacy">'+legacyCard+'</div>'
    +'</div>';
}

function monthChip(w,id){
  return '<div><div class="lab">m'+w+'</div><div class="integrated-schedule__calendar-wrapper--integrated"><div class="fc-daygrid-event-harness harness" style="width:'+w+'px"><div class="mg-v2-ad-calendar-event mg-v2-ad-calendar-event--compact mg-v2-ad-calendar-event--integrated-month mg-v2-ad-calendar-event--status-booked" id="chip-'+id+'"><span class="mg-v2-ad-calendar-event__time"><span class="mg-v2-ad-calendar-event__time-short">14:00</span></span><span class="mg-v2-ad-calendar-event__client">이내담</span><span class="mg-schedule-event-marks"><span class="mg-schedule-event-marks__institution">'+badgeHtml('badge-'+id)+'</span></span></div></div></div></div>';
}

ensureFontProbe();
document.getElementById('month-row').innerHTML=[33,49,60,88,135].map(w=>monthChip(w,'m'+w)).join('');
document.getElementById('week-row').innerHTML=[
  consecutiveStack(WEEK_OPEN,'wopen',false),
  consecutiveStack(WEEK_COLLAPSED,'wfold',false),
  consecutiveStack(WEEK_SIDEBAR,'wnarrow',false),
  consecutiveStack(DAY_DESKTOP,'ddesk',false)
].join('');
document.getElementById('mobile-week-row').innerHTML=[35,40].map(w=>fitChip(w,'mw'+w)).join('');
document.getElementById('mobile-day-row').innerHTML=[
  consecutiveStack(DAY_MOBILE,'dmob',false),
  consecutiveStack(390,'w390',false)
].join('');
document.getElementById('fit-row').innerHTML=[35,73.5,78,124,390,WEEK_HALF].map(w=>fitChip(w,'fit'+String(w).replace('.','p'))).join('');
document.getElementById('half-row').innerHTML=halfWidthOverlapStack();
document.getElementById('name-priority-row').innerHTML=[12,20,29,WEEK_HALF,59].map(w=>namePriorityChip(w,'np'+String(w).replace('.','p'))).join('');
document.getElementById('legacy-fail-row').innerHTML=[consecutiveStack(WEEK_COLLAPSED,'legacy',true)].join('');
document.getElementById('dur-desktop-row').innerHTML=[
  durationStack(WEEK_OPEN,'dur-wopen'),
  durationStack(DAY_DESKTOP,'dur-ddesk')
].join('');
document.getElementById('dur-mobile-row').innerHTML=[
  durationStack(390,'dur-w390'),
  durationStack(DAY_MOBILE,'dur-dmob')
].join('');

function linePattern(badge){
  const segs=[...badge.querySelectorAll('.mg-engagement-type-badge__seg')];
  if(segs.length>0){
    const rows=[];
    for(const seg of segs){
      const top=Math.round(seg.getBoundingClientRect().top);
      let row=rows.find(r=>Math.abs(r.top-top)<=1);
      if(!row){ row={top, parts:[]}; rows.push(row); }
      row.parts.push(seg.textContent);
    }
    rows.sort((a,b)=>a.top-b.top);
    return rows.map(r=>r.parts.join('')).join('/');
  }
  return '';
}

function visibleCharCount(badge, chip){
  const c=chip.getBoundingClientRect();
  let visibleChars=0;
  const walker=document.createTreeWalker(badge, NodeFilter.SHOW_TEXT, null);
  let node;
  while((node=walker.nextNode())){
    const text=node.textContent||'';
    for(let i=0;i<text.length;i++){
      const range=document.createRange();
      range.setStart(node,i); range.setEnd(node,i+1);
      const r=range.getBoundingClientRect();
      if(r.width>0&&r.height>0&&r.right<=c.right+0.5&&r.left>=c.left-0.5&&r.bottom<=c.bottom+0.5&&r.top>=c.top-0.5) visibleChars++;
    }
  }
  return visibleChars;
}

function rectsOverlap(a,b){
  return !(a.right<=b.left+0.5||a.left>=b.right-0.5||a.bottom<=b.top+0.5||a.top>=b.bottom-0.5);
}

function adjacentOverlapCount(chip){
  const badge=chip.querySelector('.mg-engagement-type-badge');
  if(!badge) return 0;
  const b=badge.getBoundingClientRect();
  const title=chip.querySelector('.mg-v2-ad-calendar-event__title');
  const status=chip.querySelector('.mg-v2-ad-calendar-event__status');
  let n=0;
  for(const el of [title,status]){
    if(!el) continue;
    if(rectsOverlap(b, el.getBoundingClientRect())) n+=1;
  }
  return n;
}

/** 칩에 실제로 보이는 텍스트 글자 수(시간·이름·상태). 0이면 빈 칩. */
function visibleChipTextCount(chip){
  if(!chip) return 0;
  let count=0;
  const selectors=[
    '.mg-v2-ad-calendar-event__time-measured',
    '.client-name',
    '.mg-v2-ad-calendar-event__status'
  ];
  for(const sel of selectors){
    const el=chip.querySelector(sel);
    if(!el) continue;
    const wrap=el.closest('.mg-v2-ad-calendar-event__time-text');
    if(wrap && wrap.hasAttribute('hidden')) continue;
    const text=String(el.textContent||'').replace(/\\s+/g,'').trim();
    if(!text) continue;
    const r=el.getBoundingClientRect();
    if(r.width>0.5 && r.height>0.5) count+=text.length;
  }
  return count;
}

function visibleTimeMode(chip){
  const stage=chip.getAttribute('data-chip-fit-stage')||'';
  const measured=chip.querySelector('.mg-v2-ad-calendar-event__time-measured');
  const timeTextWrap=chip.querySelector('.mg-v2-ad-calendar-event__time-text');
  const hidden=timeTextWrap && timeTextWrap.hasAttribute('hidden');
  // NOTE: buildHarnessHtml 은 outer template literal — regex \\\\ 이스케이프
  const raw=measured?String(measured.textContent||'').replace(/\\s+/g,' ').trim():'';
  const text=hidden?'':raw;
  const hasEllipsis=text.includes('…')||text.includes('...');
  const isShort=/^\\d{1,2}:\\d{2}$/.test(text);
  const isLong=(text.indexOf('오전')===0||text.indexOf('오후')===0)&&/\\d{1,2}:\\d{2}/.test(text);
  const patternOk=text===''||isShort||isLong;
  let scrollOk=true;
  if(!hidden && measured){
    scrollOk=measured.scrollWidth<=measured.clientWidth+0.5
      && (!timeTextWrap || timeTextWrap.scrollWidth<=timeTextWrap.clientWidth+0.5);
  }
  // 잘린 글자 감지: 「11:0」 등 초 자릿수 누락
  const truncatedShort=/^\\d{1,2}:\\d$/.test(text);
  const timeFullVisible=hidden
    ? true
    : (text.length>0&&patternOk&&!hasEllipsis&&!truncatedShort&&scrollOk);
  return {
    timeText:text,
    timeScrollOk:scrollOk&&!truncatedShort,
    timeFullVisible,
    shortShown:isShort,
    fullShown:isLong,
    shortText:isShort?text:'',
    fullText:isLong?text:'',
    timeHidden:!!hidden,
    fitStage:stage,
    ariaLabel:chip.getAttribute('aria-label')||'',
    titleAttr:chip.getAttribute('title')||''
  };
}

function measureChipTimeOnly(chipId){
  const chip=document.getElementById(chipId);
  if(!chip) return null;
  const badge=chip.querySelector('.mg-engagement-type-badge');
  const timeMode=visibleTimeMode(chip);
  const c=chip.getBoundingClientRect();
  const clientLayout=clientNameLayoutOk(chip);
  const counselorLayout=counselorNameLayoutOk(chip);
  if(!badge){
    return {
      text:'',
      chipW:+c.width.toFixed(2), chipH:+c.height.toFixed(2),
      badgeAbsent:true,
      visibleChars:0,
      visibleChipText:visibleChipTextCount(chip),
      linePattern:'',
      linePatternOk:true,
      badgeInTitle:false,
      badgeInTime:false,
      hasNegMargin:false,
      adjacentOverlap:0,
      fitW:true,
      fitH:true,
      inside:true,
      scrollW:0, clientW:0, scrollH:0, clientH:0,
      clientLayout,
      counselorLayout,
      ...timeMode
    };
  }
  return measure(chipId, badge.id);
}

/** 내담자+상담사 동시 칩 — client 폭·counselor ellipsis·a11y */
function measureNamePriority(chipId){
  const chip=document.getElementById(chipId);
  if(!chip) return null;
  const base=measureChipTimeOnly(chipId);
  const a11y=(chip.getAttribute('aria-label')||'')+' '+(chip.getAttribute('title')||'');
  return {
    ...base,
    showTitle:!!chip.querySelector('.mg-v2-ad-calendar-event__title'),
    showCounselorInDom:!!chip.querySelector('.counselor-name'),
    hasCounselorA11y:a11y.indexOf('상담사A')>=0,
    hasClientA11y:a11y.indexOf('라마바')>=0
  };
}

function measure(chipId,badgeId){
  const chip=document.getElementById(chipId), badge=document.getElementById(badgeId);
  if(!chip) return null;
  if(!badge) return measureChipTimeOnly(chipId);
  const c=chip.getBoundingClientRect(), b=badge.getBoundingClientRect();
  const inside=b.left>=c.left-0.5&&b.top>=c.top-0.5&&b.right<=c.right+0.5&&b.bottom<=c.bottom+0.5;
  const pattern=linePattern(badge);
  const time=chip.querySelector('.mg-v2-ad-calendar-event__time');
  const cs=getComputedStyle(badge);
  const timeMode=visibleTimeMode(chip);
  return {
    text:badge.textContent,
    chipW:+c.width.toFixed(2), chipH:+c.height.toFixed(2),
    badgeW:+b.width.toFixed(2), badgeH:+b.height.toFixed(2),
    scrollW:badge.scrollWidth, clientW:badge.clientWidth,
    scrollH:badge.scrollHeight, clientH:badge.clientHeight,
    fitW:badge.scrollWidth<=badge.clientWidth+0.5,
    fitH:badge.scrollHeight<=badge.clientHeight+0.5,
    inside,
    visibleChars:visibleCharCount(badge, chip),
    linePattern:pattern,
    linePatternOk:ALLOWED.includes(pattern),
    badgeInTitle:!!badge.closest('.mg-v2-ad-calendar-event__title'),
    badgeInTime:!!(time&&time.contains(badge)),
    whiteSpace:cs.whiteSpace,
    marginInline:cs.marginInline|| (cs.marginLeft+' '+cs.marginRight),
    hasNegMargin:/^-/.test(String(cs.marginLeft))||/^-/.test(String(cs.marginRight))||String(cs.marginInline).includes('-'),
    segCount:badge.querySelectorAll('.mg-engagement-type-badge__seg').length,
    adjacentOverlap:adjacentOverlapCount(chip),
    badgeAbsent:false,
    visibleChipText:visibleChipTextCount(chip),
    clientLayout:clientNameLayoutOk(chip),
    counselorLayout:counselorNameLayoutOk(chip),
    ...timeMode
  };
}

/** 칩 안 시간·이름·상태 줄 — 글자 노드 렌더H vs line-height/font-size. 눌림이면 lineCrushed. */
function measureChipRowHeights(chip){
  const api=globalThis.MgWeekDayChipFit;
  const rows=[
    { key:'time', sel:'.mg-v2-ad-calendar-event__time', textSel:'.mg-v2-ad-calendar-event__time-measured' },
    { key:'title', sel:'.mg-v2-ad-calendar-event__title', textSel:'.client-name' },
    { key:'status', sel:'.mg-v2-ad-calendar-event__status', textSel:null }
  ];
  const out={ rows:{}, lineCrushed:false };
  for(const { key, sel, textSel } of rows){
    const el=chip.querySelector(sel);
    if(!el){
      out.rows[key]=null;
      continue;
    }
    // 글자 노드 기준(컨테이너 상속 line-height 오탐 방지). 예: title 25.6 vs client-name 13
    const textEl=(textSel && el.querySelector(textSel)) || el;
    const cs=getComputedStyle(textEl);
    const fontSize=Number.parseFloat(cs.fontSize)||0;
    let lineH=Number.parseFloat(cs.lineHeight);
    if(!Number.isFinite(lineH)||lineH<=0) lineH=fontSize>0?fontSize*1.2:0;
    const glyphH=Math.max(lineH, fontSize);
    const renderH=textEl.getBoundingClientRect().height;
    const rowNatural=(api && typeof api.readRowHeight==='function')
      ? api.readRowHeight(el)
      : Math.max(glyphH, el.scrollHeight||0);
    // 실제 FAIL 재현: 이름 ~1.8px < font-size. 살짝 작음(line-box)은 허용.
    const crushed=glyphH>0 && renderH+0.5 < fontSize;
    if(crushed) out.lineCrushed=true;
    out.rows[key]={
      renderH:+renderH.toFixed(2),
      glyphH:+glyphH.toFixed(2),
      fontSize:+fontSize.toFixed(2),
      naturalH:+rowNatural.toFixed(2),
      crushed
    };
  }
  return out;
}

/**
 * .client-name 렌더 시 폭>0 이고 글자 보이거나 말줄임.
 * @returns {{ present:boolean, ok:boolean, width:number, reason?:string, truncated?:boolean, ellipsis?:boolean }}
 */
function clientNameLayoutOk(chip){
  const name=chip.querySelector('.client-name');
  if(!name) return { present:false, ok:true, width:0 };
  const r=name.getBoundingClientRect();
  const text=String(name.textContent||'').replace(/\\s+/g,'').trim();
  const width=+r.width;
  if(!text.length) return { present:true, ok:false, width, reason:'clientEmptyText' };
  if(width<=0.5) return { present:true, ok:false, width, reason:'clientWidthZero' };
  const cs=getComputedStyle(name);
  const truncated=name.scrollWidth>name.clientWidth+0.5;
  const ellipsis=cs.textOverflow==='ellipsis'
    && (cs.overflow==='hidden'||cs.overflowX==='hidden');
  // 폭>0 + (말줄임 또는 높이로 글자 박스 존재)
  if(r.height>0.5 && (!truncated || ellipsis)){
    return { present:true, ok:true, width, truncated, ellipsis };
  }
  if(r.height>0.5 && text.length>0 && width>0.5){
    return { present:true, ok:true, width, truncated, ellipsis };
  }
  return { present:true, ok:false, width, reason:'clientInvisible', truncated, ellipsis };
}

/**
 * .counselor-name 이 잘리면 반드시 말줄임. 말줄임 없는 잘림 FAIL.
 */
function counselorNameLayoutOk(chip){
  const name=chip.querySelector('.counselor-name');
  if(!name) return { present:false, ok:true, width:0 };
  const r=name.getBoundingClientRect();
  const cs=getComputedStyle(name);
  const truncated=name.scrollWidth>name.clientWidth+0.5;
  const ellipsis=cs.textOverflow==='ellipsis'
    && (cs.overflow==='hidden'||cs.overflowX==='hidden');
  if(truncated && !ellipsis){
    return {
      present:true,
      ok:false,
      width:+r.width,
      reason:'counselorClippedNoEllipsis',
      scrollW:name.scrollWidth,
      clientW:name.clientWidth
    };
  }
  return { present:true, ok:true, width:+r.width, truncated, ellipsis };
}

function clientNameVisible(chip){
  const layout=clientNameLayoutOk(chip);
  return layout.present && layout.ok && layout.width>0.5;
}

/**
 * 구 readRowHeight(clientHeight/getBoundingClientRect) 시뮬 —
 * 눌린 높이로 판정하면 50분에서 FULL 오판이어야 함(반례 증명).
 */
function simulateCrushedHeightJudge(chip, chipH){
  const api=globalThis.MgWeekDayChipFit;
  if(!api || typeof api.judgeWeekDayChipHeightFit!=='function') return null;
  const time=chip.querySelector('.mg-v2-ad-calendar-event__time');
  const title=chip.querySelector('.mg-v2-ad-calendar-event__title');
  const status=chip.querySelector('.mg-v2-ad-calendar-event__status');
  const crushedH=(el)=>el ? el.getBoundingClientRect().height : 0;
  const naturalH=(el)=>{
    if(!el) return 0;
    if(typeof api.readRowHeight==='function') return api.readRowHeight(el);
    return crushedH(el);
  };
  // 강제로 세 줄을 모두 보이게 한 뒤 측정하는 대신, 현재 DOM +
  // 눌린 title 이 있으면 crushed 경로가 FULL 이 되는지 검증.
  // 반례 시나리오: natural 줄(16) + crushed title(1.8)
  const naturalTime=naturalH(time)||16;
  const naturalTitle=naturalH(title)||16;
  const naturalStatus=naturalH(status)||16;
  const legacyCrushed=api.judgeWeekDayChipHeightFit({
    chipHeight:chipH,
    timeRowHeight:naturalTime,
    titleRowHeight:1.8,
    statusRowHeight:naturalStatus,
    gapY:2
  });
  const productNatural=api.judgeWeekDayChipHeightFit({
    chipHeight:chipH,
    timeRowHeight:naturalTime,
    titleRowHeight:naturalTitle,
    statusRowHeight:naturalStatus,
    gapY:2
  });
  return {
    legacyHeightStage:legacyCrushed.heightStage,
    productHeightStage:productNatural.heightStage,
    legacyWouldMisjudgeFull:legacyCrushed.heightStage==='full'
      && productNatural.heightStage==='hide-status'
  };
}

function measureDurationStack(prefix){
  const parts=['50','30','15'];
  const out={ parts:{} };
  let empty=false;
  let overflow=false;
  let overlap=false;
  const rects=[];
  for(const p of parts){
    const chip=document.getElementById('chip-'+prefix+'-'+p);
    const harness=document.getElementById('harness-'+prefix+'-'+p);
    if(!chip||!harness){
      out.parts[p]=null;
      empty=true;
      continue;
    }
    const m=measureChipTimeOnly('chip-'+prefix+'-'+p);
    const h=harness.getBoundingClientRect();
    const c=chip.getBoundingClientRect();
    const fits=c.height<=h.height+0.5;
    if(!fits) overflow=true;
    if((m.visibleChipText||0)<=0) empty=true;
    rects.push(c);
    const rowMetrics=measureChipRowHeights(chip);
    const nameVisible=clientNameVisible(chip);
    const crushedSim=p==='50' ? simulateCrushedHeightJudge(chip, h.height) : null;
    out.parts[p]={
      ...m,
      harnessH:+h.height.toFixed(2),
      cardH:+c.height.toFixed(2),
      cardFitsHarness:fits,
      heightStage:chip.getAttribute('data-chip-height-stage')||'',
      nameVisible,
      lineCrushed:rowMetrics.lineCrushed,
      rowHeights:rowMetrics.rows,
      crushedSim
    };
  }
  for(let i=0;i<rects.length;i++){
    for(let j=i+1;j<rects.length;j++){
      if(rectsOverlap(rects[i], rects[j])) overlap=true;
    }
  }
  out.emptyChip=empty;
  out.overflow=overflow;
  out.cardsOverlap=overlap;
  return out;
}

/**
 * 앞 칩 텍스트가 뒤 칩에 가려지는지 elementFromPoint 로 판정.
 * 교차 사각형 중앙·시간 텍스트 샘플 포인트에서 상위 칩 id 가 유지되어야 함.
 */
function textOcclusionByLaterChip(frontChip, backChip){
  if(!frontChip||!backChip) return false;
  const f=frontChip.getBoundingClientRect();
  const b=backChip.getBoundingClientRect();
  if(!rectsOverlap(f,b)) return false;
  const measured=frontChip.querySelector('.mg-v2-ad-calendar-event__time-measured')
    || frontChip.querySelector('.client-name')
    || frontChip;
  const t=measured.getBoundingClientRect();
  const samples=[
    {x:(t.left+t.right)/2, y:(t.top+t.bottom)/2},
    {x:t.left+2, y:t.top+2},
    {x:Math.min(t.right-2, (f.left+f.right)/2), y:Math.min(t.bottom-2, (f.top+f.bottom)/2)}
  ];
  for(const p of samples){
    if(p.x<f.left||p.x>f.right||p.y<f.top||p.y>f.bottom) continue;
    if(p.x<b.left||p.x>b.right||p.y<b.top||p.y>b.bottom) continue;
    const topEl=document.elementFromPoint(p.x, p.y);
    if(!topEl) continue;
    if(backChip===topEl || backChip.contains(topEl)){
      if(!(frontChip===topEl || frontChip.contains(topEl))){
        return true;
      }
    }
  }
  return false;
}

function measurePair(prefix){
  const chipA=document.getElementById('chip-'+prefix+'-a');
  const chipB=document.getElementById('chip-'+prefix+'-b');
  const ha=document.getElementById('harness-'+prefix+'-a');
  const hb=document.getElementById('harness-'+prefix+'-b');
  if(!chipA||!chipB||!ha||!hb) return null;
  const a=measureChipTimeOnly('chip-'+prefix+'-a');
  const b=measureChipTimeOnly('chip-'+prefix+'-b');
  if(!a||!b) return null;
  const hA=ha.getBoundingClientRect(), hB=hb.getBoundingClientRect();
  const cA=chipA.getBoundingClientRect(), cB=chipB.getBoundingClientRect();
  const textOccludedA=textOcclusionByLaterChip(chipA, chipB);
  const textOccludedB=textOcclusionByLaterChip(chipB, chipA);
  return {
    a, b,
    harnessH:+hA.height.toFixed(2),
    cardH_a:+cA.height.toFixed(2),
    cardH_b:+cB.height.toFixed(2),
    cardFitsHarnessA:cA.height<=hA.height+0.5,
    cardFitsHarnessB:cB.height<=hB.height+0.5,
    cardsOverlap:rectsOverlap(cA,cB),
    textOccluded:textOccludedA||textOccludedB,
    textOccludedA,
    textOccludedB,
    badgeInTimeA:a.badgeAbsent?true:a.badgeInTime,
    badgeInTimeB:b.badgeAbsent?true:b.badgeInTime,
    hasNegMargin:a.hasNegMargin||b.hasNegMargin,
    linePatternA:a.linePattern,
    linePatternB:b.linePattern
  };
}

function measureLegacyHalfFail(){
  const chip=document.getElementById('chip-half-legacy');
  if(!chip) return null;
  const measured=chip.querySelector('.mg-v2-ad-calendar-event__time-measured');
  const timeWrap=chip.querySelector('.mg-v2-ad-calendar-event__time-text');
  const text=measured?String(measured.textContent||'').trim():'';
  const scrollOverflow=measured && measured.scrollWidth>measured.clientWidth+0.5;
  const wrapOverflow=timeWrap && timeWrap.scrollWidth>timeWrap.clientWidth+0.5;
  const chipOverflow=chip.scrollWidth>chip.clientWidth+0.5;
  const stageInfo=pickStage(WEEK_HALF);
  const legacy=legacyPickStage11px(WEEK_HALF);
  // 실제 12px 폭 vs 정상 content — 구코드가 short 강제하면 잘림
  const realShortW=stageInfo.shortW;
  const normalContent=stageInfo.chipW;
  const wouldFail=realShortW>normalContent+0.5 && legacy.stage==='short' && legacy.showTime;
  return {
    text,
    scrollOverflow:!!(scrollOverflow||wrapOverflow||chipOverflow),
    wouldFail,
    realShortW,
    normalContent,
    legacyStage:legacy.stage,
    newStage:stageInfo.stage,
    timeFont:stageInfo.timeFont
  };
}

window.__collectDesktop=function(){
  return {
    month33:measure('chip-m33','badge-m33'),
    month49:measure('chip-m49','badge-m49'),
    month60:measure('chip-m60','badge-m60'),
    month88:measure('chip-m88','badge-m88'),
    month135:measure('chip-m135','badge-m135'),
    weekOpen164:measurePair('wopen'),
    weekFold126:measurePair('wfold'),
    weekNarrow78:measurePair('wnarrow'),
    dayDesk106:measurePair('ddesk'),
    legacyFail126:measurePair('legacy'),
    fit35:measureChipTimeOnly('chip-fit35'),
    fit73p5:measureChipTimeOnly('chip-fit73p5'),
    fit78:measureChipTimeOnly('chip-fit78'),
    fit124:measureChipTimeOnly('chip-fit124'),
    fit390:measureChipTimeOnly('chip-fit390'),
    fit34p8:measureChipTimeOnly('chip-fit34p8'),
    halfPair:measurePair('half'),
    halfLegacyFail:measureLegacyHalfFail(),
    namePri34p8:measureNamePriority('chip-np34p8'),
    namePri59:measureNamePriority('chip-np59'),
    durWopen:measureDurationStack('dur-wopen'),
    durDdesk:measureDurationStack('dur-ddesk'),
    legend:{
      titleLeft:+document.getElementById('legend-title').getBoundingClientRect().left.toFixed(2),
      marksLeft:+document.getElementById('legend-marks').getBoundingClientRect().left.toFixed(2),
      sameSwatchLeft:+document.querySelector('#legend-sameday .integrated-schedule__legend-swatch--same-day').getBoundingClientRect().left.toFixed(2),
      samePad:getComputedStyle(document.getElementById('legend-sameday')).paddingInlineStart
    }
  };
};

window.__collectMobile=function(){
  return {
    mobileWeek35:measureChipTimeOnly('chip-mw35'),
    mobileWeek40:measureChipTimeOnly('chip-mw40'),
    dayMob390:measurePair('dmob'),
    weekDay390:measurePair('w390'),
    namePri12:measureNamePriority('chip-np12'),
    namePri20:measureNamePriority('chip-np20'),
    namePri29:measureNamePriority('chip-np29'),
    durW390:measureDurationStack('dur-w390'),
    durDmob:measureDurationStack('dur-dmob'),
    sidebar:measure('sidebar-row','badge-sidebar'),
    mapping:measure('mapping-card','badge-mapping'),
    detail:measure('detail-wrap','badge-detail')
  };
};
</script></body></html>`;
}

function passCase(name, m, { requireOutsideTitle = false, requireInTime = false } = {}) {
  if (!m) return { name, ok: false, reason: 'missing' };
  const reasons = [];
  if (m.text !== LABEL) reasons.push(`text=${m.text}`);
  if (!m.inside) reasons.push('badgeOutsideChip');
  if (!m.fitW) reasons.push(`scrollW ${m.scrollW}>clientW ${m.clientW}`);
  if (!m.fitH) reasons.push(`scrollH ${m.scrollH}>clientH ${m.clientH}`);
  if (m.visibleChars !== 4) reasons.push(`visibleChars=${m.visibleChars}`);
  if (!m.linePatternOk) reasons.push(`linePattern=${m.linePattern}`);
  if (requireOutsideTitle && m.badgeInTitle) reasons.push('badgeStillInTitle');
  if (requireInTime && !m.badgeInTime) reasons.push('badgeNotInTime');
  if (m.hasNegMargin) reasons.push(`negMargin=${m.marginInline}`);
  if (typeof m.adjacentOverlap === 'number' && m.adjacentOverlap > 0) {
    reasons.push(`adjacentOverlap=${m.adjacentOverlap}`);
  }
  return { name, ok: reasons.length === 0, reason: reasons.join('; ') || 'ok', metrics: m };
}

function passFitChip(name, m) {
  if (!m) return { name, ok: false, reason: 'missing' };
  const reasons = [];
  if (!m.timeFullVisible) reasons.push(`timeTruncated=${m.timeText}`);
  if (!m.timeScrollOk) reasons.push('timeScrollOverflow');
  if ((m.visibleChipText || 0) <= 0) reasons.push('emptyChip');
  if (m.timeHidden) {
    // hide-time: aria/title must still carry full time
    const a11y = `${m.ariaLabel || ''} ${m.titleAttr || ''}`;
    if (!/\d{1,2}:\d{2}/.test(a11y)) reasons.push('hideTimeMissingA11y');
    // hide-time 이어도 이름 등 가시 텍스트 필수
    if ((m.visibleChipText || 0) <= 0) reasons.push('hideTimeEmptyVisible');
  } else if (m.timeText) {
    // visible text must equal full short/long chosen (no 「11:0」)
    if (/^\d{1,2}:\d$/.test(m.timeText)) reasons.push(`truncatedShort=${m.timeText}`);
  }
  if (m.badgeAbsent) {
    // ok
  } else {
    if (m.text !== LABEL) reasons.push(`text=${m.text}`);
    if (m.visibleChars !== 4) reasons.push(`visibleChars=${m.visibleChars}`);
    if (m.visibleChars === 2) reasons.push('badgeTruncatedTo2');
    if (!m.fitW || !m.fitH) reasons.push('badgeScrollOverflow');
    if (!m.inside) reasons.push('badgeOutsideChip');
    if (!m.badgeInTime) reasons.push('badgeNotInTime');
  }
  if (m.adjacentOverlap > 0) reasons.push(`adjacentOverlap=${m.adjacentOverlap}`);
  if (m.clientLayout && m.clientLayout.present && !m.clientLayout.ok) {
    reasons.push(m.clientLayout.reason || 'clientLayout');
  }
  if (m.counselorLayout && m.counselorLayout.present && !m.counselorLayout.ok) {
    reasons.push(m.counselorLayout.reason || 'counselorLayout');
  }
  return { name, ok: reasons.length === 0, reason: reasons.join('; ') || 'ok', metrics: m };
}

function passNamePriority(name, m) {
  if (!m) return { name, ok: false, reason: 'missing' };
  const reasons = [];
  if ((m.visibleChipText || 0) <= 0) reasons.push('emptyChip');
  if (m.clientLayout && m.clientLayout.present && !m.clientLayout.ok) {
    reasons.push(m.clientLayout.reason || 'clientLayout');
  }
  if (m.showTitle && m.clientLayout && m.clientLayout.present && !(m.clientLayout.width > 0.5)) {
    reasons.push('clientWidthZero');
  }
  if (m.counselorLayout && m.counselorLayout.present && !m.counselorLayout.ok) {
    reasons.push(m.counselorLayout.reason || 'counselorClippedNoEllipsis');
  }
  if (!m.hasCounselorA11y) reasons.push('counselorMissingA11y');
  if (!m.hasClientA11y) reasons.push('clientMissingA11y');
  return { name, ok: reasons.length === 0, reason: reasons.join('; ') || 'ok', metrics: m };
}

function passDurationStack(name, stack) {
  if (!stack) return { name, ok: false, reason: 'missing' };
  const reasons = [];
  if (stack.emptyChip) reasons.push('emptyChip');
  if (stack.overflow) reasons.push('cardOverflowHarness');
  if (stack.cardsOverlap) reasons.push('cardsOverlap');
  for (const key of ['50', '30', '15']) {
    const p = stack.parts?.[key];
    if (!p) {
      reasons.push(`missing${key}`);
      continue;
    }
    if ((p.visibleChipText || 0) <= 0) reasons.push(`${key}.emptyChip`);
    if (!p.cardFitsHarness) reasons.push(`${key}.overflow`);
    if (!p.timeFullVisible && !p.timeHidden) reasons.push(`${key}.timeTruncated`);
    if (p.lineCrushed) reasons.push(`${key}.lineCrushed`);
    const a11y = `${p.ariaLabel || ''} ${p.titleAttr || ''}`;
    if (!/\d{1,2}:\d{2}/.test(a11y)) reasons.push(`${key}.missingA11yTime`);
  }
  // 50분(≈53px) 은 시간+이름 두 줄 → hide-status(또는 full). 이름 텍스트 필수.
  const p50 = stack.parts?.['50'];
  if (p50) {
    if (!['full', 'hide-status'].includes(p50.heightStage)) {
      reasons.push(`50.heightStage=${p50.heightStage}`);
    }
    // 재검증 FAIL 보완: 50분은 이름이 보여야 함(눌려 FULL 오판 금지)
    if (!p50.nameVisible) {
      reasons.push('50.nameNotVisible');
    }
    if (p50.heightStage === 'full' && p50.rowHeights?.title?.crushed) {
      reasons.push('50.fullWithCrushedTitle');
    }
    // 반례: 눌린 titleH(1.8)로 판정하면 FULL, 자연 높이면 hide-status
    if (p50.crushedSim && !p50.crushedSim.legacyWouldMisjudgeFull) {
      reasons.push(
        `50.crushedCounterexampleMissing legacy=${p50.crushedSim.legacyHeightStage}`
        + ` product=${p50.crushedSim.productHeightStage}`
      );
    }
  }
  return { name, ok: reasons.length === 0, reason: reasons.join('; ') || 'ok', metrics: stack };
}

function passPair(name, pair, { expectFail = false, requireShortTime = false } = {}) {
  if (!pair) return { name, ok: false, reason: 'missing' };
  const reasons = [];
  const checkCard = (label, m) => {
    if (!m.timeFullVisible) reasons.push(`${label}.timeTruncated=${m.timeText}`);
    if (!m.timeScrollOk) reasons.push(`${label}.timeScrollOverflow`);
    if (m.badgeAbsent) {
      // ok
    } else {
      if (m.text !== LABEL) reasons.push(`${label}.text=${m.text}`);
      if (!m.inside) reasons.push(`${label}.badgeOutsideChip`);
      if (!m.fitW) reasons.push(`${label}.scrollW`);
      if (!m.fitH) reasons.push(`${label}.scrollH`);
      if (m.visibleChars !== 4) reasons.push(`${label}.visibleChars=${m.visibleChars}`);
      if (m.visibleChars === 2) reasons.push(`${label}.badgeTruncatedTo2`);
      if (m.linePattern !== LABEL) reasons.push(`${label}.linePattern=${m.linePattern}`);
      if (m.badgeInTitle) reasons.push(`${label}.badgeInTitle`);
      if (!m.badgeInTime) reasons.push(`${label}.badgeNotInTime`);
    }
    if (m.hasNegMargin) reasons.push(`${label}.negMargin`);
    if (m.adjacentOverlap > 0) reasons.push(`${label}.adjacentOverlap=${m.adjacentOverlap}`);
    if (requireShortTime) {
      if (!m.shortShown) reasons.push(`${label}.shortTimeHidden`);
      if (m.fullShown) reasons.push(`${label}.fullTimeStillShown`);
      if (!/^\d{2}:\d{2}$/.test(m.shortText || m.timeText || '')) {
        reasons.push(`${label}.shortText=${m.shortText || m.timeText}`);
      }
    }
  };
  if (!expectFail) {
    checkCard('a', pair.a);
    checkCard('b', pair.b);
    if ((pair.a?.visibleChipText || 0) <= 0) reasons.push('a.emptyChip');
    if ((pair.b?.visibleChipText || 0) <= 0) reasons.push('b.emptyChip');
    if (!pair.cardFitsHarnessA) {
      reasons.push(`cardH_a ${pair.cardH_a}>harnessH ${pair.harnessH}`);
    }
    if (!pair.cardFitsHarnessB) {
      reasons.push(`cardH_b ${pair.cardH_b}>harnessH ${pair.harnessH}`);
    }
    if (pair.cardsOverlap) reasons.push('cardsOverlap');
    if (pair.textOccluded) reasons.push('textOccludedByLaterChip');
    if (pair.hasNegMargin) reasons.push('negMargin');
  } else {
    const failsLegacy =
      !pair.cardFitsHarnessA ||
      !pair.cardFitsHarnessB ||
      pair.cardsOverlap ||
      !pair.badgeInTimeA;
    if (!failsLegacy) {
      reasons.push('legacyDidNotFail');
    }
  }
  return {
    name,
    ok: reasons.length === 0,
    reason: reasons.join('; ') || 'ok',
    metrics: {
      harnessH: pair.harnessH,
      cardH_a: pair.cardH_a,
      cardH_b: pair.cardH_b,
      cardsOverlap: pair.cardsOverlap,
      linePatternA: pair.linePatternA,
      linePatternB: pair.linePatternB,
      badgeInTimeA: pair.badgeInTimeA,
      cardFitsHarnessA: pair.cardFitsHarnessA,
      cardFitsHarnessB: pair.cardFitsHarnessB,
      a: pair.a,
      b: pair.b
    }
  };
}

function passHalfLegacyFail(name, m) {
  if (!m) return { name, ok: false, reason: 'missing' };
  // 구코드가 34.8에서 FAIL 해야 함 (wouldFail=true)
  if (!m.wouldFail) {
    return {
      name,
      ok: false,
      reason: `legacyDidNotFail newStage=${m.newStage} realShortW=${m.realShortW} content=${m.normalContent}`,
      metrics: m
    };
  }
  return { name, ok: true, reason: 'ok', metrics: m };
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

  fs.mkdirSync(HARNESS_DIR, { recursive: true });
  fs.writeFileSync(HARNESS_HTML, buildHarnessHtml());

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--allow-file-access-from-files'
    ]
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: DESKTOP_VIEWPORT_WIDTH,
      height: 1200,
      deviceScaleFactor: 1
    });
    await page.goto(`file://${HARNESS_HTML}`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 300));
    const desktop = await page.evaluate(() => window.__collectDesktop());

    await page.setViewport({
      width: MOBILE_VIEWPORT_WIDTH,
      height: 844,
      deviceScaleFactor: 1
    });
    await new Promise((r) => setTimeout(r, 300));
    const mobile = await page.evaluate(() => window.__collectMobile());

    const metrics = { ...desktop, ...mobile };

    const cases = [
      passCase('month33', metrics.month33),
      passCase('month49', metrics.month49),
      passCase('month60', metrics.month60),
      passCase('month88', metrics.month88),
      passCase('month135', metrics.month135),
      passPair('weekOpen164', metrics.weekOpen164),
      passPair('weekFold126', metrics.weekFold126),
      passPair('weekNarrow78', metrics.weekNarrow78),
      passPair('dayDesk106', metrics.dayDesk106),
      passPair('legacyFail126', metrics.legacyFail126, { expectFail: true }),
      passFitChip('mobileWeek35', metrics.mobileWeek35),
      passFitChip('mobileWeek40', metrics.mobileWeek40),
      passPair('dayMob390', metrics.dayMob390),
      passPair('weekDay390', metrics.weekDay390),
      passFitChip('fit35', metrics.fit35),
      passFitChip('fit73p5', metrics.fit73p5),
      passFitChip('fit78', metrics.fit78),
      passFitChip('fit124', metrics.fit124),
      passFitChip('fit390', metrics.fit390),
      passFitChip('fit34p8', metrics.fit34p8),
      passPair('half34p8', metrics.halfPair),
      passHalfLegacyFail('half34p8LegacyWouldFail', metrics.halfLegacyFail),
      passNamePriority('namePri12', metrics.namePri12),
      passNamePriority('namePri20', metrics.namePri20),
      passNamePriority('namePri29', metrics.namePri29),
      passNamePriority('namePri34p8', metrics.namePri34p8),
      passNamePriority('namePri59', metrics.namePri59),
      passDurationStack('durWopen1440', metrics.durWopen),
      passDurationStack('durDdesk1440', metrics.durDdesk),
      passDurationStack('durW390', metrics.durW390),
      passDurationStack('durDmob390', metrics.durDmob),
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
    console.log(JSON.stringify({
      chrome,
      harnessHtml: HARNESS_HTML,
      cases,
      halfSummary: {
        fit34p8: {
          stage: metrics.fit34p8?.fitStage,
          timeText: metrics.fit34p8?.timeText,
          timeHidden: metrics.fit34p8?.timeHidden,
          ok: cases.find((c) => c.name === 'fit34p8')?.ok
        },
        halfPair: {
          a: metrics.halfPair?.a?.fitStage,
          b: metrics.halfPair?.b?.fitStage,
          ok: cases.find((c) => c.name === 'half34p8')?.ok
        },
        legacy: metrics.halfLegacyFail
      },
      failed: failed.map((f) => f.name)
    }, null, 2));
    if (failed.length) {
      console.error('FAIL cases:', failed.map((f) => `${f.name}: ${f.reason}`).join(' | '));
      process.exit(1);
    }
    console.log('PASS engagement-badge-chip-layout');
    process.exit(0);
  } finally {
    await browser.close();
    try {
      fs.rmSync(HARNESS_DIR, { recursive: true, force: true });
    } catch {
      /* ignore cleanup */
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
