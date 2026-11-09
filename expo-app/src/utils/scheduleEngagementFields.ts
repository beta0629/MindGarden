/**
 * 일정 API 행의 계약 유형 원값(engagementType · paymentTiming) 추출.
 * 해석(기관연계 여부)은 `coverChapterViewModel.resolveEngagementType` 이 담당한다.
 *
 * @author MindGarden
 * @since 2026-11-06
 */

export interface ScheduleEngagementFields {
  engagementType?: string;
  paymentTiming?: string;
}

/**
 * @param row BE `ScheduleResponse` 원본 행
 * @returns 문자열로 내려온 필드만 담은 객체 (없으면 키 생략)
 */
export function pickScheduleEngagementFields(
  row: Record<string, unknown>,
): ScheduleEngagementFields {
  return {
    ...(typeof row.engagementType === 'string' ? { engagementType: row.engagementType } : {}),
    ...(typeof row.paymentTiming === 'string' ? { paymentTiming: row.paymentTiming } : {}),
  };
}
