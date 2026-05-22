/**
 * 상담사 상담일지 모바일 노출·편집 정책
 *
 * @author MindGarden
 * @since 2026-05-22
 */
export type ConsultantRecordMobileStatus = 'DRAFT' | 'COMPLETED' | 'PENDING';

function normalizeRecordStatus(
  status: ConsultantRecordMobileStatus | string | undefined | null,
): string {
  return typeof status === 'string' ? status.trim().toUpperCase() : '';
}

/**
 * 모바일 목록·상세에 노출 가능한 일지 상태인지 판별한다.
 * 작성 완료(COMPLETED) 일지도 읽기 전용 조회는 허용한다.
 */
export function isConsultantRecordVisibleOnMobile(
  status: ConsultantRecordMobileStatus | string | undefined | null,
): boolean {
  const normalized = normalizeRecordStatus(status);
  if (!normalized) {
    return false;
  }
  return normalized === 'DRAFT' || normalized === 'PENDING' || normalized === 'COMPLETED';
}

/**
 * 모바일에서 편집 가능한 일지 상태인지 판별한다.
 */
export function isConsultantRecordEditableOnMobile(
  status: ConsultantRecordMobileStatus | string | undefined | null,
): boolean {
  return normalizeRecordStatus(status) === 'DRAFT';
}
