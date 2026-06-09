import { computeChartLabelDisplayMask } from '../chartLabelStride';

function shownIndices(mask: readonly boolean[]): number[] {
  const out: number[] = [];
  mask.forEach((v, i) => {
    if (v) {
      out.push(i);
    }
  });
  return out;
}

describe('computeChartLabelDisplayMask', () => {
  it('빈 배열은 빈 마스크를 반환한다', () => {
    expect(computeChartLabelDisplayMask({ count: 0, plotWidth: 280 })).toEqual([]);
  });

  it('count가 음수/NaN이면 빈 마스크를 반환한다', () => {
    expect(computeChartLabelDisplayMask({ count: -1, plotWidth: 280 })).toEqual([]);
    expect(computeChartLabelDisplayMask({ count: Number.NaN, plotWidth: 280 })).toEqual([]);
  });

  it('라벨이 1개면 항상 표시한다', () => {
    expect(computeChartLabelDisplayMask({ count: 1, plotWidth: 280 })).toEqual([true]);
  });

  it('주간(7개) 라벨은 모두 표시한다 (감정일기 기본 폭 296)', () => {
    const mask = computeChartLabelDisplayMask({ count: 7, plotWidth: 296 });
    expect(mask).toHaveLength(7);
    expect(mask.every((v) => v === true)).toBe(true);
  });

  it('월간(31개) 라벨은 첫/마지막 + 5일 간격으로 솎아낸다 (감정일기 폭 296)', () => {
    const mask = computeChartLabelDisplayMask({ count: 31, plotWidth: 296 });
    expect(mask).toHaveLength(31);
    expect(mask[0]).toBe(true);
    expect(mask[30]).toBe(true);
    const indices = shownIndices(mask);
    expect(indices).toEqual([0, 5, 10, 15, 20, 25, 30]);
  });

  it('월간(30개) 라벨도 첫/마지막을 포함하고 균등 간격으로 표시한다', () => {
    const mask = computeChartLabelDisplayMask({ count: 30, plotWidth: 296 });
    expect(mask[0]).toBe(true);
    expect(mask[29]).toBe(true);
    const indices = shownIndices(mask);
    expect(indices.length).toBeGreaterThanOrEqual(5);
    expect(indices.length).toBeLessThanOrEqual(8);
  });

  it('마지막 라벨 직전 표시 라벨이 너무 가까우면 직전 라벨을 숨겨 겹침을 방지한다', () => {
    const mask = computeChartLabelDisplayMask({ count: 12, plotWidth: 296 });
    const indices = shownIndices(mask);
    expect(indices[0]).toBe(0);
    expect(indices[indices.length - 1]).toBe(11);
    for (let i = 1; i < indices.length; i++) {
      const cur = indices[i] as number;
      const prev = indices[i - 1] as number;
      expect(cur - prev).toBeGreaterThanOrEqual(2);
    }
  });

  it('작은 화면(plotWidth=240)에서도 라벨이 겹치지 않게 더 많이 솎아낸다', () => {
    const mask = computeChartLabelDisplayMask({ count: 31, plotWidth: 240 });
    const indices = shownIndices(mask);
    expect(indices[0]).toBe(0);
    expect(indices[indices.length - 1]).toBe(30);
    expect(indices.length).toBeLessThanOrEqual(8);
  });

  it('plotWidth가 0 또는 음수여도 안전하게 동작한다', () => {
    const mask = computeChartLabelDisplayMask({ count: 5, plotWidth: 0 });
    expect(mask).toHaveLength(5);
    expect(mask[0]).toBe(true);
    expect(mask[4]).toBe(true);
  });

  it('minLabelGapPx 옵션으로 라벨 밀도를 조절할 수 있다', () => {
    const denser = computeChartLabelDisplayMask({
      count: 31,
      plotWidth: 600,
      minLabelGapPx: 20,
    });
    const sparser = computeChartLabelDisplayMask({
      count: 31,
      plotWidth: 600,
      minLabelGapPx: 80,
    });
    const denserCount = shownIndices(denser).length;
    const sparserCount = shownIndices(sparser).length;
    expect(denserCount).toBeGreaterThan(sparserCount);
  });
});
