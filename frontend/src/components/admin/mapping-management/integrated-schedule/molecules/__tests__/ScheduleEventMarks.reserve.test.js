/**
 * ScheduleEventMarks — 절대 위치 표식의 끝 여백 계약 (#1486 후속, gate-1486 항목 1)
 *
 * - 표식 폭은 토큰 하나(--mg-schedule-event-marks-size), 끝 여백은 그 토큰에서 계산
 * - 월간 칩 여백 선택자가 칩 기본 padding-inline 규칙보다 특이도가 높아야 실제로 적용된다
 * - 사이드바 행은 자기 자신을 컨테이너 쿼리할 수 없으므로 흐름 마지막 칸에 여백을 둔다
 *
 * @author CoreSolution
 * @since 2026-10-06
 */

import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '..', '..', '..', '..', '..', '..');
const read = (...parts) => fs.readFileSync(path.resolve(SRC, ...parts), 'utf8');

const MARKS_CSS = read(
  'components',
  'admin',
  'mapping-management',
  'integrated-schedule',
  'molecules',
  'ScheduleEventMarks.css'
);
const IMS_CSS = read('components', 'admin', 'mapping-management', 'IntegratedMatchingSchedule.css');
const TOKENS_CSS = read('styles', 'tokens', 'design-v2-tokens.css');

const CHIP_BASE_SELECTOR =
  '.integrated-schedule__calendar-wrapper--integrated .mg-v2-ad-calendar-event--compact.mg-v2-ad-calendar-event--integrated-month';
const CHIP_RESERVE_SELECTOR =
  '.mg-v2-ad-calendar-event.mg-v2-ad-calendar-event--compact.mg-v2-ad-calendar-event--integrated-month:has(.mg-schedule-event-marks)';

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

describe('ScheduleEventMarks 끝 여백', () => {
  test('표식 폭 토큰 하나에서 끝 여백을 계산한다', () => {
    expect(TOKENS_CSS).toMatch(/--mg-schedule-event-marks-size:\s*var\(--mg-size-dot-sm\);/);
    const reserve = TOKENS_CSS.match(/--mg-schedule-event-marks-reserve:\s*calc\(([^;]*)\);/);
    expect(reserve).not.toBeNull();
    expect(reserve[1]).toContain('var(--mg-schedule-event-marks-size)');
    expect(reserve[1]).toContain('var(--mg-v2-space-0-5)');
  });

  test('월간 칩·팝오버: 여백 규칙이 칩 기본 padding-inline 보다 특이도가 높다', () => {
    const block = extractContainerBlock(MARKS_CSS, '@container mg-month-event (width < 224px)');
    const body = ruleBody(block, CHIP_RESERVE_SELECTOR);
    expect(body).not.toBeNull();
    expect(body).toContain('padding-inline-end: var(--mg-schedule-event-marks-reserve)');

    expect(IMS_CSS).toContain(`${CHIP_BASE_SELECTOR} {`);
    expect(countClassSelectors(CHIP_RESERVE_SELECTOR)).toBeGreaterThan(
      countClassSelectors(CHIP_BASE_SELECTOR)
    );
  });

  test('절대 위치 표식 크기도 같은 토큰을 쓴다', () => {
    const block = extractContainerBlock(MARKS_CSS, '@container mg-month-event (width < 224px)');
    const badge = ruleBody(
      block,
      '.mg-v2-ad-calendar-event--integrated-month .mg-schedule-event-marks .mg-engagement-type-badge'
    );
    expect(badge).toContain('inline-size: var(--mg-schedule-event-marks-size)');
    expect(badge).toContain('block-size: var(--mg-schedule-event-marks-size)');
  });

  test('사이드바 행: 컨테이너 자신이 아니라 흐름 마지막 칸에 여백을 둔다', () => {
    const block = extractContainerBlock(MARKS_CSS, '@container mg-compact-row (width < 224px)');
    expect(block).not.toMatch(/\.integrated-schedule__compact-row:has\(\.mg-schedule-event-marks\)\s*\{/);
    const body = ruleBody(
      block,
      '.integrated-schedule__compact-row:has(.mg-schedule-event-marks) .integrated-schedule__compact-row-secondary'
    );
    expect(body).toContain('margin-inline-end: var(--mg-schedule-event-marks-reserve)');
  });

  test('당일 칩 변형도 같은 여백 토큰을 쓰고 예전 고정 calc 가 남지 않는다', () => {
    const block = extractContainerBlock(IMS_CSS, '@container mg-month-event (width < 249px)');
    expect(block).toContain('padding-inline-end: var(--mg-schedule-event-marks-reserve)');
    expect(MARKS_CSS).not.toContain('calc(var(--mg-v2-space-2) + var(--mg-v2-space-0-5))');
    expect(IMS_CSS).not.toContain('calc(var(--mg-v2-space-2) + var(--mg-v2-space-0-5))');
  });
});
