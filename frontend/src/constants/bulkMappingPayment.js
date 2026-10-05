/**
 * 일괄 매칭 결제 확인·취소 (POST /api/v1/admin/mapping/payment/{confirm,cancel}) 응답 상수.
 *
 * 처리는 매칭마다 독립 트랜잭션이며 응답 data.results 에 매칭별 결과가 온다.
 * 앞 매칭이 커밋된 뒤 뒤 매칭이 실패해도 요청 전체가 실패로 바뀌지 않는다.
 *
 * @author MindGarden
 * @since 2026-10-04
 */

export const BULK_MAPPING_ITEM_STATUS = Object.freeze({
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED'
});

export const BULK_MAPPING_ITEM_STATUS_LABEL = Object.freeze({
  [BULK_MAPPING_ITEM_STATUS.SUCCEEDED]: '처리됨',
  [BULK_MAPPING_ITEM_STATUS.FAILED]: '실패',
  [BULK_MAPPING_ITEM_STATUS.SKIPPED]: '건너뜀'
});

/** 매칭 목록 응답의 결제 대기 표지 (매칭 상태·결제 상태) */
export const BULK_MAPPING_PENDING_STATUS = Object.freeze({
  MAPPING_STATUS: 'PENDING_PAYMENT',
  PAYMENT_STATUS: 'PENDING'
});

export const BULK_MAPPING_RESULT_MESSAGES = Object.freeze({
  RESULT_TITLE: '처리 결과',
  PARTIAL_NOTICE: '일부 매칭만 처리되었습니다. 매칭별 결과를 확인하세요.',
  NONE_PROCESSED_NOTICE: '처리된 매칭이 없습니다. 매칭별 결과를 확인하세요.',
  SUMMARY: ({ succeeded, failed, skipped }) =>
    `처리 ${succeeded}건 · 실패 ${failed}건 · 건너뜀 ${skipped}건`
});
