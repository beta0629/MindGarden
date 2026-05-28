/**
 * resolveCssColorTokensArray 단위 테스트
 *
 * 배경:
 * - Chart.js Canvas 차트는 backgroundColor 문자열을 ctx.fillStyle 에 그대로
 *   대입하므로 'var(--mg-...)' 문자열을 받으면 슬라이스가 검정/이전 색으로
 *   렌더되는 P1 시각 결함이 발생한다 (어드민 대시보드 5단계 도넛 결함).
 * - resolveCssColorTokensArray 는 SSOT 토큰을 유지하면서 :root cascade 값을
 *   읽어 Canvas 안전 배열을 반환해야 한다 (라이트/다크 자동).
 *
 * jsdom 은 documentElement 의 inline style 로 설정한 CSS 변수에 대해
 * getPropertyValue 를 정상 지원하므로, 본 테스트는 mock 없이 실 환경 cascade 를
 * 그대로 검증한다.
 *
 * @see frontend/src/components/dashboard-v2/AdminDashboardV2.js (도넛 차트 소비처)
 * @see frontend/src/constants/charts.js (B0KLA_STEP_CHART_HEX SSOT)
 */
import { resolveCssColorTokensArray } from '../resolveCssColorVarToHex';

describe('resolveCssColorTokensArray', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = '';
    document.documentElement.style.setProperty('--mg-color-b0kla-teal-500', '#0d9488');
    document.documentElement.style.setProperty('--mg-color-info', '#3B82F6');
  });

  afterAll(() => {
    document.documentElement.style.cssText = '';
  });

  it("'var(--...)' 항목은 :root 토큰 값으로, hex 리터럴은 그대로 유지된다", () => {
    const input = [
      'var(--mg-color-b0kla-teal-500)',
      '#fb923c',
      '#7c3aed',
      'var(--mg-color-info)',
      '#64748b'
    ];
    const out = resolveCssColorTokensArray(input);
    expect(out).toHaveLength(5);
    expect(out[0]).toBe('#0d9488');
    expect(out[1]).toBe('#fb923c');
    expect(out[2]).toBe('#7c3aed');
    expect(out[3]).toBe('#3B82F6');
    expect(out[4]).toBe('#64748b');
  });

  it('정의되지 않은 토큰은 fallback hex 로 대체된다 (Canvas 검정 방지)', () => {
    const input = ['var(--mg-color-missing-xyz)', '#fb923c'];
    const out = resolveCssColorTokensArray(input, '#FF00FF');
    expect(out[0]).toBe('#FF00FF');
    expect(out[1]).toBe('#fb923c');
  });

  it('비배열 입력은 그대로 통과한다 (방어적)', () => {
    expect(resolveCssColorTokensArray(null)).toBeNull();
    expect(resolveCssColorTokensArray(undefined)).toBeUndefined();
    expect(resolveCssColorTokensArray('var(--mg-color-info)')).toBe('var(--mg-color-info)');
  });

  it('비문자열 항목 (number/null) 은 변환 없이 통과한다', () => {
    const input = ['var(--mg-color-info)', null, 42];
    const out = resolveCssColorTokensArray(input);
    expect(out[0]).toBe('#3B82F6');
    expect(out[1]).toBeNull();
    expect(out[2]).toBe(42);
  });

  it('공백을 포함한 var() 표기도 해석한다', () => {
    const input = ['var(  --mg-color-info  )'];
    const out = resolveCssColorTokensArray(input);
    expect(out[0]).toBe('#3B82F6');
  });

  it('B0KLA_STEP_CHART_HEX SSOT 시나리오: 5단계 도넛 색상이 모두 Canvas-safe 한 값으로 해석된다', () => {
    // B0KLA_STEP_CHART_HEX (charts.js) 와 동일 구성. 어드민 대시보드 P1 결함 시나리오.
    const sourceFromCharts = [
      'var(--mg-color-b0kla-teal-500)', // 매칭
      '#fb923c',                         // 입금 확인
      '#7c3aed',                         // 회기 권한
      'var(--mg-color-info)',            // 스케줄 등록
      '#64748b'                          // 회계처리
    ];
    const out = resolveCssColorTokensArray(sourceFromCharts);
    // Canvas-safe: 모든 항목이 #hex 또는 rgb() 시작이어야 함 (var() 누수 0건)
    out.forEach((c) => {
      expect(typeof c).toBe('string');
      expect(c.startsWith('var(')).toBe(false);
      expect(c).toMatch(/^(#|rgb)/);
    });
  });
});
