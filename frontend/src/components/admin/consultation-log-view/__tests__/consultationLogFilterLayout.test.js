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
  const railCss = read('../../../common/timeline/Timeline.css');
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

  it('눌린 정렬만 stone 채움과 진한 테두리를 쓴다', () => {
    expect(timelineCss).toContain('border-color: transparent');
    expect(timelineCss).toContain('background: var(--mg-v2-color-neutral-200)');
    expect(timelineCss).toMatch(
      /\[aria-pressed='true'\][\s\S]*?background-color:\s*var\(--mg-v2-color-surface-stone\)/
    );
    expect(timelineCss).toMatch(
      /\[aria-pressed='true'\][\s\S]*?border-color:\s*var\(--mg-v2-color-border-strong\)/
    );
    expect(timelineCss).not.toMatch(
      /sort-button\[aria-pressed='true'\][\s\S]*?background-color:\s*var\(--mg-v2-color-surface-card\)/
    );
  });

  it('상담사 구간 라벨은 글자 오른쪽으로 가는 선이 이어지고 위쪽 전폭 선은 없다', () => {
    expect(tokens).toContain('--mg-timeline-label-gap: var(--mg-v2-space-3)');
    expect(railCss).toContain('gap: var(--mg-v2-space-3)');
    expect(railCss).toContain('margin: 0 0 var(--mg-timeline-label-gap)');
    expect(railCss).toMatch(/\.mg-v2-timeline__label::after\s*\{[^}]*height:\s*var\(--mg-v2-border-width-thin\)/);
    expect(railCss).toMatch(/\.mg-v2-timeline__label::after\s*\{[^}]*background:\s*var\(--mg-v2-color-border-default\)/);
    expect(railCss).not.toMatch(/\.mg-v2-timeline__label\s*\{[^}]*border-block-start/);
    expect(railCss).not.toContain('!important');
  });

  it('내담자 선택은 화살표 여백과 말줄임을 둔다', () => {
    expect(pageCss).toMatch(
      /\.mg-v2-consultation-log-query__field \.mg-v2-consultation-log-filter__select\s*\{[^}]*padding-inline-end:\s*var\(--mg-v2-space-6\)/
    );
    expect(pageCss).toMatch(
      /\.mg-v2-consultation-log-query__field \.mg-v2-consultation-log-filter__select\s*\{[^}]*text-overflow:\s*ellipsis/
    );
  });
});
