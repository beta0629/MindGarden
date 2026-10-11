/**
 * 상담일지 필터 폭·정렬 선택 표시 계약.
 * 레이아웃은 CSS 변수이고, 날짜 칸만 내용 너비 아래로 줄어들지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */

const fs = require('fs');
const path = require('path');

const read = (relativePath) => fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');

describe('상담일지 필터·정렬 시안', () => {
  const pageCss = read('../../ConsultationLogViewPage.css');
  const timelineCss = read('../ConsultationLogTimelineBlock.css');
  const tokens = read('../../../../styles/tokens/design-v2-tokens.css');

  it('기간 15rem·선택 8.5rem·검색어만 가변이고 날짜 칸은 줄어들지 않는다', () => {
    expect(tokens).toMatch(/--mg-consultation-log-filter-period:\s*calc\(var\(--mg-v2-space-20\) \* 3\)/);
    expect(tokens).toMatch(
      /--mg-consultation-log-filter-select:\s*calc\(\s*var\(--mg-v2-space-16\) \+ var\(--mg-v2-space-8\) \+ var\(--mg-v2-space-6\) \+ var\(--mg-v2-space-4\)\s*\)/
    );
    expect(tokens).toMatch(/--mg-consultation-log-filter-keyword:\s*calc\(var\(--mg-v2-space-12\) \* 3\)/);
    expect(tokens).toMatch(/--mg-consultation-log-filter-date:\s*calc\(\s*10ch/);
    expect(pageCss).toContain('flex: 0 0 var(--mg-consultation-log-filter-period)');
    expect(pageCss).toContain('flex: 0 0 var(--mg-consultation-log-filter-select)');
    expect(pageCss).toContain('flex: 1 1 var(--mg-consultation-log-filter-keyword)');
    expect(pageCss).toContain('flex: 1 0 var(--mg-consultation-log-filter-date)');
    expect(pageCss).toContain('min-width: max(var(--mg-consultation-log-filter-period), min-content)');
    expect(pageCss).not.toMatch(/\.mg-v2-consultation-log-query__period-inputs \.mg-v2-consultation-log-filter__input \{\s*flex:\s*1 1 0/);
    expect(pageCss).not.toContain('!important');
    expect(timelineCss).not.toContain('!important');
  });

  it('눌린 정렬만 카드 채움과 기본 테두리를 쓴다', () => {
    expect(timelineCss).toContain('border-color: transparent');
    expect(timelineCss).toContain("[aria-pressed='true']");
    expect(timelineCss).toContain('background-color: var(--mg-v2-color-surface-card)');
    expect(timelineCss).toContain('border-color: var(--mg-v2-color-border-default)');
  });
});
