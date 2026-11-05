/**
 * 상담사 월간 integrated 칩 — 공용 ScheduleCalendarView.css 단계형 축소
 * 관리자 IntegratedMatchingSchedule.css 는 변경하지 않는다.
 */
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '..', '..', '..', '..');
const CALENDAR_CSS = fs.readFileSync(
  path.resolve(SRC, 'components', 'ui', 'Schedule', 'ScheduleCalendarView.css'),
  'utf8'
);
const IMS_CSS = fs.readFileSync(
  path.resolve(SRC, 'components', 'admin', 'mapping-management', 'IntegratedMatchingSchedule.css'),
  'utf8'
);

const extractBlock = (css, header) => {
  const start = css.indexOf(header);
  if (start < 0) return '';
  let depth = 0;
  for (let i = css.indexOf('{', start); i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(start, i + 1);
    }
  }
  return '';
};

describe('상담사 월간 칩 공용 단계 (관리자 무변경)', () => {
  test('IMS 관리자 파일에 mg-shared-month-event 를 넣지 않는다', () => {
    expect(IMS_CSS).not.toContain('mg-shared-month-event');
    expect(IMS_CSS).toContain('container: mg-month-event / inline-size');
  });

  test('상담사 패널에만 shared container 를 건다', () => {
    expect(CALENDAR_CSS).toMatch(
      /\.consultant-schedule__panel[\s\S]*?container:\s*mg-shared-month-event\s*\/\s*inline-size/
    );
    expect(CALENDAR_CSS).toMatch(
      /\.consultant-schedule__panel[\s\S]*?__time-short\s*\{\s*display:\s*none/
    );
  });

  test('< 191px 에서 짧은 시간 + 클라이언트 전폭 줄', () => {
    const stage = extractBlock(CALENDAR_CSS, '@container mg-shared-month-event (width < 191px)');
    expect(stage).not.toBe('');
    expect(stage).toMatch(/__time-full\s*\{\s*display:\s*none/);
    expect(stage).toMatch(/__time-short\s*\{\s*display:\s*inline/);
    expect(stage).toMatch(/__client\s*\{[^}]*flex-basis:\s*100%/);
    expect(stage).toMatch(/-webkit-line-clamp:\s*2/);
    expect(stage).toMatch(/white-space:\s*normal/);
    expect(stage).toMatch(/flex-wrap:\s*wrap/);
  });

  test('< 166px 회기 숨김 · < 146px 배지 숨김', () => {
    expect(extractBlock(CALENDAR_CSS, '@container mg-shared-month-event (width < 166px)')).toMatch(
      /__sessions\s*\{\s*display:\s*none/
    );
    expect(extractBlock(CALENDAR_CSS, '@container mg-shared-month-event (width < 146px)')).toMatch(
      /__badge--cancelled\s*\{\s*display:\s*none/
    );
  });
});
