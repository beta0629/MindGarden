/**
 * 일괄 매칭 결제 확인·취소 응답 해석 (순수 함수).
 *
 * 성공 응답(200)과 오류 응답(409·422 — 커밋된 매칭 0건) 모두 data.results 를 담는다.
 * StandardizedApi 오류는 err.response.data 에 본문이 붙는다.
 *
 * @author MindGarden
 * @since 2026-10-04
 */

import {
  BULK_MAPPING_ITEM_STATUS,
  BULK_MAPPING_PENDING_STATUS
} from '../constants/bulkMappingPayment';

const toArray = (value) => (Array.isArray(value) ? value : []);

/**
 * 응답 본문(또는 그 data)에서 매칭별 결과를 꺼낸다.
 *
 * @param {object|null|undefined} payload ApiResponse 본문 또는 그 data
 * @returns {{ results: Array<{mappingId: number, status: string, code: ?string, message: ?string}>,
 *   summary: {total: number, succeeded: number, failed: number, skipped: number} } | null}
 */
export const extractBulkMappingResults = (payload) => {
  if (payload == null || typeof payload !== 'object') {
    return null;
  }
  const data = Array.isArray(payload.results) ? payload : payload.data;
  if (data == null || !Array.isArray(data.results)) {
    return null;
  }
  const results = toArray(data.results)
    .filter((item) => item != null && item.mappingId != null)
    .map((item) => ({
      mappingId: Number(item.mappingId),
      status: String(item.status || ''),
      code: item.code != null ? String(item.code) : null,
      message: item.message != null ? String(item.message) : null
    }));
  const count = (status) => results.filter((item) => item.status === status).length;
  return {
    results,
    summary: {
      total: results.length,
      succeeded: count(BULK_MAPPING_ITEM_STATUS.SUCCEEDED),
      failed: count(BULK_MAPPING_ITEM_STATUS.FAILED),
      skipped: count(BULK_MAPPING_ITEM_STATUS.SKIPPED)
    }
  };
};

/**
 * StandardizedApi 오류에서 매칭별 결과를 꺼낸다 (409·422 본문).
 *
 * @param {Error} error StandardizedApi 오류
 * @returns {ReturnType<typeof extractBulkMappingResults>}
 */
export const extractBulkMappingResultsFromError = (error) =>
  extractBulkMappingResults(error?.response?.data ?? error?.response ?? null);

/**
 * 결제 대기 매칭인지 (목록 응답의 매칭 상태 또는 결제 상태).
 *
 * @param {object} mapping 매칭 목록 항목
 * @returns {boolean}
 */
export const isPendingPaymentMapping = (mapping) => {
  if (mapping == null) {
    return false;
  }
  const status = String(mapping.status || '').toUpperCase();
  const paymentStatus = String(mapping.paymentStatus || '').toUpperCase();
  return status === BULK_MAPPING_PENDING_STATUS.MAPPING_STATUS
    || paymentStatus === BULK_MAPPING_PENDING_STATUS.PAYMENT_STATUS;
};

/**
 * 매칭 결제 금액 (목록 항목의 amount, 없으면 패키지 금액).
 *
 * @param {object} mapping 매칭 목록 항목
 * @returns {number}
 */
export const resolveMappingPaymentAmount = (mapping) => {
  const raw = mapping?.amount ?? mapping?.packagePrice;
  const amount = Number(raw);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};
