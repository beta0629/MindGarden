/**
 * ScheduleEventMarks — 좁은 폭 표식 계약
 *
 * SSOT(2026-10-07): 기관연계는 어디서나 일정 상세와 같은 EngagementTypeBadge 글자 배지다.
 * #1486 의 @container < 224px ■ 축소(color: transparent, font-size: 0)는 폐기했다.
 * - 월간 칩·팝오버: 표식이 안 들어가면 다음 줄로 내린다(칩 기본 규칙보다 높은 특이도)
 * - 기관연계 배지는 말줄임하지 않는다. 칩이 줄바꿈·전폭 다음 줄로 높이를 키운다
 * - 사이드바 행·당일 칩: 표식을 절대 위치 ■ 로 바꾸는 규칙이 없다
 *
 * @author CoreSolution
 * @since 2026-10-06
 */

import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '..', '..', '..', '..', '..', '..');
const read = (...parts) => fs.readFileSync(path.resolve(SRC, ...parts), 'utf8');

const MOLECULES = ['components', 'admin', 'mapping-management', 'integrated-schedule', 'molecules'];
const MARKS_CSS = read(...MOLECULES, 'ScheduleEventMarks.css');
const COMPACT_ROW_CSS = read(...MOLECULES, 'MatchingScheduleCompactRow.css');
const IMS_CSS = read('components', 'admin', 'mapping-management', 'IntegratedMatchingSchedule.css');

const CHIP_BASE_SELECTOR =
  '.integrated-schedule__calendar-wrapper--integrated .mg-v2-ad-calendar-event--compact.mg-v2-ad-calendar-event--integrated-month';
const CHIP_WRAP_SELECTOR =
  '.mg-v2-ad-calendar-event.mg-v2-ad-calendar-event--compact.mg-v2-ad-calendar-event--integrated-month:has(.mg-schedule-event-marks)';
const MONTH_WRAP_QUERY = '@container mg-month-event (width >= 109px)';

const countClassSelectors = (selector) => (selector.match(/\.[A-Za-z_][\w-]*/g) || []).length;

const extractContainerBlock = (css, header) => {
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

const ruleBody = (block, selector) => {
  const at = block.indexOf(`${selector} {`);
  if (at < 0) {
    return null;
  }
  const open = block.indexOf('{', at);
  return block.slice(open + 1, block.indexOf('}', open));
};

/** 기관연계 배지를 대상으로 하는 규칙 본문만 모은다. */
const engagementBadgeRuleBodies = (css) => {
  const bodies = [];
  const pattern = /([^{}]*\.mg-engagement-type-badge[^{}]*)\{([^}]*)\}/g;
  let match = pattern.exec(css);
  while (match) {
    bodies.push({ selector: match[1].trim(), body: match[2] });
    match = pattern.exec(css);
  }
  return bodies;
};

describe('ScheduleEventMarks 좁은 폭 — 글자 배지 유지', () => {
  test.each([
    ['ScheduleEventMarks.css', MARKS_CSS],
    ['MatchingScheduleCompactRow.css', COMPACT_ROW_CSS],
    ['IntegratedMatchingSchedule.css', IMS_CSS]
  ])('%s: 기관연계 배지 글자를 숨기거나 ■ 크기로 줄이는 규칙이 없다', (name, css) => {
    const rules = engagementBadgeRuleBodies(css);
    rules.forEach(({ selector, body }) => {
      expect({ selector, hidesText: /color:\s*transparent/.test(body) }).toEqual({
        selector,
        hidesText: false
      });
      expect(body).not.toMatch(/font-size:\s*0/);
      expect(body).not.toContain('var(--mg-schedule-event-marks-size)');
    });
  });

  test('#1486 의 < 224px ■ 축소 쿼리와 당일 칩 < 249px 쿼리가 없다', () => {
    expect(MARKS_CSS).not.toContain('@container mg-month-event (width < 224px)');
    expect(MARKS_CSS).not.toContain('@container mg-compact-row (width < 224px)');
    expect(IMS_CSS).not.toContain('@container mg-month-event (width < 249px)');
    expect(MARKS_CSS).not.toContain('var(--mg-schedule-event-marks-reserve)');
    expect(IMS_CSS).not.toContain('var(--mg-schedule-event-marks-reserve)');
  });

  test('월간 칩: 표식이 안 들어가면 줄바꿈하고, 규칙 특이도가 칩 기본보다 높다', () => {
    const block = extractContainerBlock(MARKS_CSS, MONTH_WRAP_QUERY);
    const body = ruleBody(block, CHIP_WRAP_SELECTOR);
    expect(body).not.toBeNull();
    expect(body).toContain('flex-wrap: wrap');

    expect(IMS_CSS).toContain(`${CHIP_BASE_SELECTOR} {`);
    expect(countClassSelectors(CHIP_WRAP_SELECTOR)).toBeGreaterThan(
      countClassSelectors(CHIP_BASE_SELECTOR)
    );
  });

  test('폭이 끝까지 모자라면 글자 배지는 말줄임하지 않고 칩이 줄바꿈한다', () => {
    const body = ruleBody(MARKS_CSS, '.mg-schedule-event-marks .mg-engagement-type-badge');
    expect(body).not.toBeNull();
    expect(body).not.toMatch(/text-overflow:\s*ellipsis/);
    expect(body).not.toMatch(/overflow:\s*hidden/);
    expect(body).toContain('white-space: nowrap');
    expect(body).toMatch(/overflow:\s*visible/);

    const wrapBlock = extractContainerBlock(MARKS_CSS, MONTH_WRAP_QUERY);
    const wrapBody = ruleBody(wrapBlock, CHIP_WRAP_SELECTOR);
    expect(wrapBody).toContain('flex-wrap: wrap');
    expect(wrapBody).toMatch(/height:\s*auto/);
  });

  test('표식 묶음은 절대 위치로 바뀌지 않는다', () => {
    expect(MARKS_CSS).not.toMatch(/position:\s*absolute/);
    expect(COMPACT_ROW_CSS).not.toMatch(/\.mg-schedule-event-marks[^{]*\{[^}]*position:\s*absolute/);
  });
});
