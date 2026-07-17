/**
 * 회기추가 PENDING 요청을 매핑 카드에 부착하기 위한 유틸.
 *
 * @author Core Solution
 * @since 2026-07-17
 */

export const SESSION_EXTENSION_PENDING_STATUS = 'PENDING';

export const SESSION_EXTENSION_UI = Object.freeze({
  BADGE_LABEL: '회기추가 입금대기',
  CONFIRM_LABEL: '입금 확인',
  CANCEL_LABEL: '요청 취소',
  ADD_LABEL: '회기 추가',
  SUCCESS_HINT: '회기 추가가 요청되었습니다. 통합 스케줄 카드에서 입금 확인·취소를 진행하세요.',
  CANCEL_SUCCESS: '회기 추가 요청이 취소되었습니다.',
  CANCEL_CONFIRM_MESSAGE: '이 회기 추가 요청을 취소할까요? 회기는 합산되지 않습니다.',
  CANCEL_REASON: '관리자 요청 취소',
  DUPLICATE_PENDING: '이미 입금 대기 중인 회기 추가 요청이 있습니다. 통합 스케줄에서 입금 확인 또는 취소를 진행해 주세요.'
});

/**
 * @param {Object} request - session-extension API 응답 항목
 * @returns {{ id: number|string, mappingId: number|string|null, additionalSessions: number|null, amount: number|null, status: string, clientName: string|null, consultantName: string|null }}
 */
export const normalizePendingSessionExtension = (request) => ({
  id: request.id,
  mappingId: request.mappingId ?? request.mapping?.id ?? null,
  additionalSessions: request.additionalSessions ?? null,
  amount: request.packagePrice ?? null,
  status: request.status ?? SESSION_EXTENSION_PENDING_STATUS,
  clientName: request.mapping?.clientName ?? null,
  consultantName: request.mapping?.consultantName ?? null,
  packageName: request.packageName ?? null,
  createdAt: request.createdAt ?? null
});

/**
 * 매핑 목록에 PENDING 회기추가 요청을 부착한다.
 *
 * @param {Array<Object>} mappings
 * @param {Array<Object>} pendingRequests
 * @returns {Array<Object>}
 */
export const attachPendingSessionExtensions = (mappings = [], pendingRequests = []) => {
  const byMappingId = new Map();
  (Array.isArray(pendingRequests) ? pendingRequests : []).forEach((raw) => {
    const pending = normalizePendingSessionExtension(raw);
    if (pending.mappingId == null) {
      return;
    }
    const key = String(pending.mappingId);
    if (!byMappingId.has(key)) {
      byMappingId.set(key, pending);
    }
  });

  return (Array.isArray(mappings) ? mappings : []).map((mapping) => ({
    ...mapping,
    pendingSessionExtension: byMappingId.get(String(mapping.id)) || null
  }));
};
