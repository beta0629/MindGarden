/**
 * 추이 차트 X축 라벨 자동 솎아내기 유틸
 *
 * 라벨 수가 차트 가로 폭에 비해 너무 많을 때(예: 월간 30~31개) 모든 라벨을 표시하면
 * 서로 겹쳐 가독성이 무너진다. 이 함수는 데이터 점은 그대로 유지한 채
 * 라벨만 일정 간격으로 솎아내는 표시 마스크(boolean[])를 계산한다.
 *
 * 정책:
 * - 라벨이 적은 경우(주간 7개 등)에는 모든 라벨을 표시한다.
 * - 라벨이 많은 경우 균등 간격(stride)으로 솎고, 첫/마지막 라벨은 항상 표시한다.
 * - 마지막 라벨 직전 표시 라벨이 stride 미만으로 너무 가까우면 직전 라벨을 숨겨 겹침을 방지한다.
 *
 * @author MindGarden
 * @since 2026-06-09
 */

export interface ChartLabelDisplayMaskOptions {
  readonly count: number;
  readonly plotWidth: number;
  readonly minLabelGapPx?: number;
}

const DEFAULT_MIN_LABEL_GAP_PX = 40;

/**
 * 라벨 표시 여부 마스크를 계산한다.
 *
 * @param options.count 전체 라벨 개수
 * @param options.plotWidth 라벨이 분포할 가로 영역(px)
 * @param options.minLabelGapPx 라벨 간 최소 간격(px). 기본 40.
 * @returns 길이 count의 boolean 배열(true=표시, false=숨김)
 */
export function computeChartLabelDisplayMask(options: ChartLabelDisplayMaskOptions): boolean[] {
  const { count, plotWidth, minLabelGapPx = DEFAULT_MIN_LABEL_GAP_PX } = options;

  if (!Number.isFinite(count) || count <= 0) {
    return [];
  }
  if (count === 1) {
    return [true];
  }

  const safePlotWidth = Math.max(0, plotWidth);
  const safeMinGap = Math.max(1, minLabelGapPx);
  const maxLabels = Math.max(2, Math.floor((safePlotWidth + safeMinGap) / safeMinGap));

  if (count <= maxLabels) {
    return Array.from({ length: count }, () => true);
  }

  const stride = Math.max(1, Math.ceil((count - 1) / (maxLabels - 1)));
  const mask = Array.from({ length: count }, (_, i) => i % stride === 0);

  const lastIdx = count - 1;
  mask[lastIdx] = true;

  for (let i = lastIdx - 1; i >= 0; i--) {
    if (mask[i]) {
      if (lastIdx - i < stride) {
        mask[i] = false;
      }
      break;
    }
  }

  return mask;
}
