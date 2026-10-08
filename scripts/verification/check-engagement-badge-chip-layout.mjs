#!/usr/bin/env node
/**
 * 기관연계 배지 · 좁은 일정 칩 레이아웃 실측 (Chromium/Chrome)
 *
 * 실제 ScheduleCalendarView.css + design tokens 를 file:// 로 로드하고,
 * WeekDayScheduleEventChip 과 동일한 클래스·6-stage judge(실제 computed font)로
 * 시간 잘림·배지 클리핑을 검사한다.
 *
 * Stages: long+badge → long → short+badge → short → compact-pad → hide-time
 * 추가: 34.8px half-width 연속 칩(10:00–10:50 + 11:00 overlap column)
 * 구코드(11px 가정 font / short 강제)는 34.8 에서 FAIL 해야 함.
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
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const LABEL = '기관연계';
const SEG_A = LABEL.slice(0, Math.floor(LABEL.length / 2));
const SEG_B = LABEL.slice(Math.floor(LABEL.length / 2));
const ALLOWED_LINE_PATTERNS = new Set([LABEL, `${SEG_A}/${SEG_B}`]);

const MOBILE_VIEWPORT_WIDTH = 390;
const DESKTOP_VIEWPORT_WIDTH = 1440;

const WEEK_COL_OPEN = 164;
const WEEK_COL_COLLAPSED = 126;
const WEEK_COL_SIDEBAR_OPEN = 78;
const DAY_COL_DESKTOP = 106.8;
const DAY_COL_MOBILE = 320;
/** 겹침 열 half-width — 「11:00」→「11:0」 FAIL 재현 폭 */
const WEEK_CHIP_HALF = 34.8;

const SLOT_30_MIN_PX = 38.4;
const EVENT_50_MIN_HARNESS_PX = (50 / 30) * SLOT_30_MIN_PX;
const GAP_10_MIN_PX = (10 / 30) * SLOT_30_MIN_PX;

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

function badgeMarkup(id) {
  return `<span class="mg-common-badge mg-common-badge--sm mg-common-badge--status mg-common-badge--info mg-engagement-type-badge" id="${id}" aria-label="${LABEL}"><span class="mg-engagement-type-badge__seg" aria-hidden="true">${SEG_A}</span><wbr /><span class="mg-engagement-type-badge__seg" aria-hidden="true">${SEG_B}</span></span>`;
}

function buildHarnessHtml() {
  const css = (rel) => path.join(ROOT, rel);
  const link = (rel) => `<link rel="stylesheet" href="file://${css(rel)}" />`;
  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8" />
${link('frontend/src/styles/tokens/design-v2-tokens.css')}
${link('frontend/src/styles/unified-design-tokens.css')}
${link('frontend/src/components/common/Badge.css')}
${link('frontend/src/components/common/EngagementTypeBadge.css')}
${link('frontend/src/components/admin/mapping-management/integrated-schedule/molecules/ScheduleEventMarks.css')}
${link('frontend/src/components/admin/mapping-management/integrated-schedule/molecules/MatchingScheduleCompactRow.css')}
${link('frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.css')}
${link('frontend/src/components/ui/Schedule/ScheduleCalendarView.css')}
${link('frontend/src/components/schedule/ScheduleB0KlA.css')}
${link('frontend/src/components/ui/Schedule/ScheduleLegend.css')}
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

/** 실제 WeekDayScheduleEventChip 마크업 미니 프로브 — computed font/pad 토큰 확보 */
function ensureFontProbe(){
  const host=document.getElementById('font-probe-host');
  let chip=host.querySelector('.mg-v2-ad-calendar-event--week-day-fit');
  if(!chip){
    chip=document.createElement('div');
    chip.className='mg-v2-ad-calendar-event mg-v2-ad-calendar-event--week-day-fit';
    chip.innerHTML='<div class="mg-v2-ad-calendar-event__time"><span class="mg-v2-ad-calendar-event__time-text"><span class="mg-v2-ad-calendar-event__time-measured">11:00</span></span>'+badgeHtml('probe-badge','mg-v2-ad-calendar-event__engagement')+'</div>';
    host.appendChild(chip);
  }
  return chip;
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
 * products weekDayChipFit.judgeWeekDayChipFit 와 동일 6 stages.
 * font 는 실제 CSS computed (가정 11px 금지).
 */
function pickStage(harnessW){
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
  const fits=(need,w)=>w+0.5>=need;

  if(fits(longW+gap+badgeW, chipW)) return {time:'오전 10:00', badge:true, stage:'long+badge', showTime:true, compactPad:false, timeFont, shortW, longW, chipW, compactW};
  if(fits(longW, chipW)) return {time:'오전 10:00', badge:false, stage:'long', showTime:true, compactPad:false, timeFont, shortW, longW, chipW, compactW};
  if(fits(shortW+gap+badgeW, chipW)) return {time:'10:00', badge:true, stage:'short+badge', showTime:true, compactPad:false, timeFont, shortW, longW, chipW, compactW};
  if(fits(shortW, chipW)) return {time:'10:00', badge:false, stage:'short', showTime:true, compactPad:false, timeFont, shortW, longW, chipW, compactW};
  if(fits(shortW+gap+badgeW, compactW)) return {time:'10:00', badge:true, stage:'compact-pad', showTime:true, compactPad:true, timeFont, shortW, longW, chipW, compactW};
  if(fits(shortW, compactW)) return {time:'10:00', badge:false, stage:'compact-pad', showTime:true, compactPad:true, timeFont, shortW, longW, chipW, compactW};
  return {
    time:'10:00',
    badge:fits(badgeW, compactW),
    stage:'hide-time',
    showTime:false,
    compactPad:true,
    timeFont, shortW, longW, chipW, compactW
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
  const badge=stageInfo.badge?badgeHtml('badge-'+id,'mg-v2-ad-calendar-event__engagement'):'';
  const timeHidden=stageInfo.showTime===false;
  const a11yTime=displayTime || stageInfo.time;
  const titleAttr=a11yTime+' · 이내담 - 예약됨';
  const measureSeed=displayTime || stageInfo.time;
  const timeInner=timeHidden
    ? '<span class="mg-v2-ad-calendar-event__time-text" hidden aria-hidden="true"><span class="mg-v2-ad-calendar-event__time-measured">'+measureSeed+'</span></span>'
    : '<span class="mg-v2-ad-calendar-event__time-text"><span class="mg-v2-ad-calendar-event__time-measured">'+displayTime+'</span></span>';
  return '<div class="mg-v2-ad-calendar-event mg-v2-ad-calendar-event--week-day-fit'+compactCls+'" id="chip-'+id+'" data-chip-fit-stage="'+stageInfo.stage+'" title="'+titleAttr+'" aria-label="'+titleAttr+'"><div class="mg-v2-ad-calendar-event__time">'+timeInner+badge+'</div><div class="mg-v2-ad-calendar-event__title"><span class="client-name">이내담</span></div><div class="mg-v2-ad-calendar-event__status">예약됨</div></div>';
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
document.getElementById('legacy-fail-row').innerHTML=[consecutiveStack(WEEK_COLLAPSED,'legacy',true)].join('');

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
  if(!badge){
    return {
      text:'',
      chipW:+c.width.toFixed(2), chipH:+c.height.toFixed(2),
      badgeAbsent:true,
      visibleChars:0,
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
      ...timeMode
    };
  }
  return measure(chipId, badge.id);
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
    ...timeMode
  };
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
  return {
    a, b,
    harnessH:+hA.height.toFixed(2),
    cardH_a:+cA.height.toFixed(2),
    cardH_b:+cB.height.toFixed(2),
    cardFitsHarnessA:cA.height<=hA.height+0.5,
    cardFitsHarnessB:cB.height<=hB.height+0.5,
    cardsOverlap:rectsOverlap(cA,cB),
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
  if (m.timeHidden) {
    // hide-time: aria/title must still carry full time
    const a11y = `${m.ariaLabel || ''} ${m.titleAttr || ''}`;
    if (!/\d{1,2}:\d{2}/.test(a11y)) reasons.push('hideTimeMissingA11y');
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
  return { name, ok: reasons.length === 0, reason: reasons.join('; ') || 'ok', metrics: m };
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
    if (!pair.cardFitsHarnessA) {
      reasons.push(`cardH_a ${pair.cardH_a}>harnessH ${pair.harnessH}`);
    }
    if (!pair.cardFitsHarnessB) {
      reasons.push(`cardH_b ${pair.cardH_b}>harnessH ${pair.harnessH}`);
    }
    if (pair.cardsOverlap) reasons.push('cardsOverlap');
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

  const htmlPath = path.join(os.tmpdir(), 'mg-engagement-badge-chip-layout.html');
  fs.writeFileSync(htmlPath, buildHarnessHtml());

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: DESKTOP_VIEWPORT_WIDTH,
      height: 1200,
      deviceScaleFactor: 1
    });
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
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
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
