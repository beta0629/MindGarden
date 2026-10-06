/**
 * 390px 대응 계약 (#1486 후속, gate-1486 항목 3)
 *
 * - 모바일 툴바: 제목 한 줄 전폭, 버튼 줄바꿈 금지 (토큰만, px·색 리터럴 없음)
 * - 두 줄 단계(F): 24시 HH:mm 짧은 시간으로 바꿔 오전/오후 잘림 방지
 * - 가장 좁은 단계(G): 시간 줄 전폭, 표식은 이름 줄 끝, 상태 색은 시작 테두리
 *
 * @author CoreSolution
 * @since 2026-10-06
 */

import fs from 'fs';
import path from 'path';
import { formatIntegratedMonthChipShortTime } from '../integratedMonthChipCopy';

const SRC = path.resolve(__dirname, '..', '..', '..', '..');
const CALENDAR_CSS = fs.readFileSync(
  path.resolve(SRC, 'components', 'ui', 'Schedule', 'ScheduleCalendarView.css'),
  'utf8'
);
const IMS_CSS = fs.readFileSync(
  path.resolve(SRC, 'components', 'admin', 'mapping-management', 'IntegratedMatchingSchedule.css'),
  'utf8'
);
const CALENDAR_JS = fs.readFileSync(
  path.resolve(SRC, 'components', 'ui', 'Schedule', 'ScheduleCalendarView.js'),
  'utf8'
);

const extractBlock = (css, header) => {
  const start = css.indexOf(header);
  if (start < 0) {
    return '';
  }
  let depth = 0;
  for (let i = css.indexOf('{', start); i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        return css.slice(start, i + 1);
      }
    }
  }
  return '';
};

const declarationsOnly = (block) =>
  block
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => line.includes(':') && !line.includes('{'))
    .join('\n');

describe('짧은 시간 포맷', () => {
  test('24시 HH:mm 로 고정 폭', () => {
    expect(formatIntegratedMonthChipShortTime(new Date(2026, 9, 6, 9, 0))).toBe('09:00');
    expect(formatIntegratedMonthChipShortTime(new Date(2026, 9, 6, 13, 5))).toBe('13:05');
    expect(formatIntegratedMonthChipShortTime(new Date(2026, 9, 6, 0, 30))).toBe('00:30');
  });

  test('값이 없거나 잘못되면 빈 문자열', () => {
    expect(formatIntegratedMonthChipShortTime(null)).toBe('');
    expect(formatIntegratedMonthChipShortTime(undefined)).toBe('');
    expect(formatIntegratedMonthChipShortTime('not-a-date')).toBe('');
  });

  test('통합 월간 칩만 전체/짧은 시간 두 칸을 그린다', () => {
    expect(CALENDAR_JS).toContain('mg-v2-ad-calendar-event__time-full');
    expect(CALENDAR_JS).toContain('mg-v2-ad-calendar-event__time-short');
    expect(CALENDAR_JS).toMatch(/integratedMonthEventLayout \? \(\s*<>\s*<span className="mg-v2-ad-calendar-event__time-full">/);
  });
});

describe('모바일 툴바', () => {
  const block = extractBlock(CALENDAR_CSS, '@media (max-width: 767px)');

  test('제목 칸이 전폭 첫 줄이고 줄바꿈하지 않는다', () => {
    expect(block).toContain('flex-wrap: wrap');
    expect(block).toMatch(/\.fc-toolbar-chunk:nth-child\(2\)\s*\{[^}]*order:\s*-1;[^}]*flex:\s*1 0 100%;/);
    expect(block).toMatch(/\.fc-toolbar-title\s*\{[^}]*white-space:\s*nowrap;/);
  });

  test('버튼은 줄바꿈하지 않고 토큰 크기만 쓴다', () => {
    expect(block).toMatch(/\.fc-button\s*\{[^}]*white-space:\s*nowrap;/);
    const decls = declarationsOnly(block);
    expect(decls).not.toMatch(/\d+px/);
    expect(decls).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(decls).not.toMatch(/rgba?\(/);
  });
});

describe('월간 칩 좁은 단계', () => {
  test('두 줄 단계에서 전체 시간을 숨기고 짧은 시간을 보인다', () => {
    const stageF = extractBlock(IMS_CSS, '@container mg-month-event (width < 109px)');
    expect(stageF).toMatch(/__time-full\s*\{\s*display:\s*none;/);
    expect(stageF).toMatch(/__time-short\s*\{\s*display:\s*inline;/);
    expect(IMS_CSS).toMatch(/__time-short\s*\{\s*display:\s*none;\s*\}/);
  });

  test('가장 좁은 단계: 시간 전폭, 표식은 흐름 안, 상태 색은 시작 테두리', () => {
    const stageG = extractBlock(IMS_CSS, '@container mg-month-event (width < 64px)');
    expect(stageG).not.toBe('');
    expect(stageG).toMatch(/__time\s*\{\s*flex-basis:\s*100%;/);
    expect(stageG).toMatch(/\.mg-schedule-event-marks\s*\{[^}]*position:\s*static;[^}]*order:\s*2;/);
    expect(stageG).toContain('border-inline-start: var(--mg-v2-border-width-thick) solid var(--mg-month-event-status-color)');
    expect(stageG).toMatch(/__dot\s*\{\s*display:\s*none;/);
    const decls = declarationsOnly(stageG);
    expect(decls).not.toMatch(/\d+px/);
    expect(decls).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  test('상태 색은 칩 변수 한 곳에서 정하고 점이 그 변수를 쓴다', () => {
    ['booked', 'confirmed', 'completed', 'tentative', 'cancelled'].forEach((status) => {
      expect(IMS_CSS).toMatch(
        new RegExp(`mg-v2-ad-calendar-event--status-${status} \\{\\s*--mg-month-event-status-color:`)
      );
    });
    expect(IMS_CSS).toMatch(/__dot \{[^}]*background-color: var\(--mg-month-event-status-color\);/);
    expect(IMS_CSS).not.toMatch(/__dot--booked \{/);
  });
});
