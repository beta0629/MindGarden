/**
 * ScheduleCalendarView 단위 테스트 — 2026-05-23 옵션 A 적용 후
 *
 * - TC1: 일요일과 공휴일 셀이 동일 토큰(`--mg-calendar-holiday-bg = --mg-calendar-weekend-sun-bg`) 으로 분홍 배경
 * - TC2: 토요일+공휴일 겹침 시 공휴일 배경(분홍)이 토요일(파랑)을 덮어쓴다(CSS override 블록)
 *
 * SSOT: docs/project-management/2026-05-23/CALENDAR_OPTION_A_DESIGN_HANDOFF.md §2,
 *       docs/project-management/2026-05-23/CALENDAR_HOLIDAY_BG_REGRESSION_ANALYSIS.md §5
 */
import fs from 'fs';
import path from 'path';

const CSS_PATH = path.resolve(__dirname, '..', 'ScheduleCalendarView.css');
const TOKEN_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'styles',
  'unified-design-tokens.css'
);

const readFile = (filePath) => fs.readFileSync(filePath, 'utf8');

describe('공휴일 셀 배경 SSOT (옵션 A)', () => {
  let css;
  let tokens;

  beforeAll(() => {
    css = readFile(CSS_PATH);
    tokens = readFile(TOKEN_PATH);
  });

  test('TC1: 일요일 셀과 공휴일 셀이 동일 톤(--mg-calendar-holiday-bg = --mg-calendar-weekend-sun-bg) 으로 분홍 배경을 받는다', () => {
    // 토큰 alias 검증
    expect(tokens).toMatch(/--mg-calendar-weekend-sun-bg:/);
    expect(tokens).toMatch(
      /--mg-calendar-holiday-bg:\s*var\(--mg-calendar-weekend-sun-bg\)/
    );

    // 공휴일 셀에 토큰 적용
    const holidayCellRule = css.match(
      /td\.fc-daygrid-day\.mg-v2-ad-calendar-day--kr-public-holiday\s*\{[^}]*background-color:\s*var\(--mg-calendar-holiday-bg\)[^}]*\}/
    );
    expect(holidayCellRule).not.toBeNull();

    // 일요일 셀에 토큰 적용
    const sundayCellRule = css.match(
      /td\.fc-daygrid-day\.mg-v2-ad-calendar-day--weekend-sun\s*\{[^}]*background-color:\s*var\(--mg-calendar-weekend-sun-bg\)[^}]*\}/
    );
    expect(sundayCellRule).not.toBeNull();

    // `transparent !important` 가 공휴일 셀에서 제거되었는지 검증
    expect(css).not.toMatch(
      /td\.fc-daygrid-day\.mg-v2-ad-calendar-day--kr-public-holiday\s*\{[^}]*transparent\s*!important/
    );
  });

  test('TC2: 토요일+공휴일 겹침 시 공휴일 배경(분홍)이 토요일(파랑)을 덮어쓴다 — CSS override 선언 순서 검증', () => {
    // 셀 배경 토큰 rule 만 매칭 (트레일링 `{`)
    const holidayBgRulePattern = /td\.fc-daygrid-day\.mg-v2-ad-calendar-day--kr-public-holiday\s*\{/g;
    const satBgRulePattern = /td\.fc-daygrid-day\.mg-v2-ad-calendar-day--weekend-sat\s*\{/g;
    const sunBgRulePattern = /td\.fc-daygrid-day\.mg-v2-ad-calendar-day--weekend-sun\s*\{/g;

    const lastIndex = (pattern) => {
      const matches = [...css.matchAll(pattern)];
      return matches.length > 0 ? matches[matches.length - 1].index : -1;
    };

    const holidayLast = lastIndex(holidayBgRulePattern);
    const satLast = lastIndex(satBgRulePattern);
    const sunLast = lastIndex(sunBgRulePattern);

    expect(holidayLast).toBeGreaterThan(-1);
    expect(satLast).toBeGreaterThan(-1);
    expect(sunLast).toBeGreaterThan(-1);

    // 마지막 holiday 배경 rule 이 weekend 배경 rule 뒤에 있어야 cascade 우선
    expect(holidayLast).toBeGreaterThan(satLast);
    expect(holidayLast).toBeGreaterThan(sunLast);

    // 마지막 holiday 배경 rule 이 --mg-calendar-holiday-bg 토큰을 사용
    const overrideBlock = css.slice(holidayLast, holidayLast + 250);
    expect(overrideBlock).toMatch(/background-color:\s*var\(--mg-calendar-holiday-bg\)/);
  });
});
