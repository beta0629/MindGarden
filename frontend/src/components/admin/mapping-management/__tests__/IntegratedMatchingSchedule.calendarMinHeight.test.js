/**
 * IntegratedMatchingSchedule — 캘린더 최소 높이 · 범례 기본 접힘 배선 잠금
 *
 * 첫 로드 캘린더 높이 0px 회귀 방지:
 *  - 캘린더 그리드(fc-view-harness) min-height = 화면 로컬 변수 (≥768px 25rem, ≤767px 17.5rem)
 *  - 헤더·범례는 flex-shrink:0, 공간 부족 시 캘린더 카드 안에서 세로 스크롤
 *  - 페이지(main) overflow:hidden 유지 — 이중 스크롤 없음
 *
 * @author CoreSolution
 * @since 2026-09-30
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ruleBody = (css, selector) => {
  const match = css.match(new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`));
  return match ? match[1] : null;
};

describe('IntegratedMatchingSchedule 캘린더 최소 높이', () => {
  const css = read('src/components/admin/mapping-management/IntegratedMatchingSchedule.css');
  const scheduleJs = read('src/components/admin/mapping-management/IntegratedMatchingSchedule.js');
  const unifiedJs = read('src/components/schedule/UnifiedScheduleComponent.js');

  test('데스크톱 최소 높이 25rem(400px) 변수 정의', () => {
    expect(css).toMatch(
      /\.integrated-schedule\.integrated-schedule--clinic-os\s*\{\s*--integrated-schedule-calendar-min-height:\s*25rem;/
    );
  });

  test('≤767px 최소 높이 17.5rem(280px) 변수 정의', () => {
    expect(css).toMatch(
      /@media \(max-width: 767px\)\s*\{\s*\.integrated-schedule\.integrated-schedule--clinic-os\s*\{\s*--integrated-schedule-calendar-min-height:\s*17\.5rem;/
    );
  });

  test('캘린더 그리드(fc-view-harness)가 최소 높이를 받고, 캘린더 뷰는 줄어들지 않는다', () => {
    const harness = ruleBody(
      css,
      '.integrated-schedule--clinic-os .integrated-schedule__calendar-wrapper .fc .fc-view-harness'
    );
    expect(harness).not.toBeNull();
    expect(harness).toMatch(/min-height:\s*var\(--integrated-schedule-calendar-min-height\)/);

    const view = ruleBody(
      css,
      '.integrated-schedule--clinic-os .integrated-schedule__calendar-wrapper .mg-v2-schedule-calendar > .mg-v2-schedule-calendar-view'
    );
    expect(view).not.toBeNull();
    expect(view).toMatch(/flex:\s*1 0 auto/);
    expect(view).not.toMatch(/(^|[^-])height:\s*0/);
  });

  test('헤더·범례는 캘린더 높이를 먹지 않고, 캘린더 카드 안에서 세로 스크롤', () => {
    const children = ruleBody(
      css,
      '.integrated-schedule--clinic-os .integrated-schedule__calendar-wrapper .mg-v2-schedule-calendar > *'
    );
    expect(children).toMatch(/flex-shrink:\s*0/);

    const container = ruleBody(
      css,
      '.integrated-schedule--clinic-os .integrated-schedule__calendar-wrapper .mg-v2-ad-b0kla.mg-v2-schedule-calendar'
    );
    expect(container).toMatch(/overflow-y:\s*auto/);
  });

  test('페이지 main overflow:hidden 유지 (이중 스크롤 없음)', () => {
    expect(ruleBody(css, '.mg-v2-desktop-layout__main:has(> .integrated-schedule--clinic-os)')).toMatch(
      /overflow:\s*hidden/
    );
    expect(ruleBody(css, '.mg-v2-mobile-layout__main:has(> .integrated-schedule--clinic-os)')).toMatch(
      /overflow:\s*hidden/
    );
  });

  test('통합 스케줄은 범례 강제 펼침을 끄고 UnifiedScheduleComponent 가 전달한다', () => {
    expect(scheduleJs).toMatch(/legendAutoExpandOnCounts=\{false\}/);
    expect(unifiedJs).toMatch(/autoExpandOnCounts=\{legendAutoExpandOnCounts\}/);
  });
});
