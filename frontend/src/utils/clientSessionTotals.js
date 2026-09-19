/**
 * 회기 SSOT (Single Source Of Truth) 합계 계산 유틸.
 *
 * <p>SSOT 핫픽스 2026-05-26 (P1-C): 클라이언트 화면에서 회기 카운트를 표시할 때
 * 백엔드 SSOT (`consultant_client_mappings.total_sessions / used_sessions / remaining_sessions`)
 * 를 우회하여 schedules 배열에서 `status === '완료'` 로 직접 계산하던 로직을 제거한다.</p>
 *
 * <p>백엔드 {@code Schedule.status} 는 enum {@code COMPLETED} 인데 한글 리터럴 '완료' 와
 * 비교하면 항상 0 이 반환되어 화면 카운트가 깨졌다. 본 유틸은 mapping SSOT 만 합산한다.</p>
 *
 * <p>2026-09-19: 홈·회기 상세 동일 — {@code countsTowardClientRemainingSessions} 인
 * shop-paid 상태(ACTIVE / PAYMENT_CONFIRMED / DEPOSIT_*)만 합산.
 * PENDING_PAYMENT(미결제)는 제외.</p>
 *
 * @author MindGarden
 * @since 2026-05-26
 */

import { countsTowardClientRemainingSessions } from '../constants/mapping';

/**
 * 홈·회기 잔여 KPI에 합산할 매핑만 남긴다.
 *
 * @param {Array<object>|null|undefined} mappings
 * @returns {Array<object>}
 */
export function filterMappingsForClientRemainingSessions(mappings) {
  if (!Array.isArray(mappings) || mappings.length === 0) {
    return [];
  }
  return mappings.filter(
    (mapping) => mapping != null && countsTowardClientRemainingSessions(mapping.status)
  );
}

/**
 * mapping 목록에서 안전하게 정수 필드를 합산한다.
 *
 * @param {Array<object>} mappings — `/api/v1/admin/mappings/client?clientId=...` 응답 정규화 결과
 * @param {string} field — `totalSessions` | `usedSessions` | `remainingSessions`
 * @returns {number} 합계 (mapping이 비어 있거나 필드가 누락되면 0)
 */
function sumMappingField(mappings, field) {
  if (!Array.isArray(mappings) || mappings.length === 0) {
    return 0;
  }
  return mappings.reduce((sum, mapping) => {
    const raw = mapping == null ? 0 : mapping[field];
    const value = Number(raw);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

/**
 * 회기 SSOT 합계를 일관된 형태로 반환한다 (홈·session-detail 동일).
 *
 * @param {Array<object>} mappings — mapping 목록
 * @returns {{ totalSessions: number, usedSessions: number, remainingSessions: number }}
 *   - totalSessions: shop-paid 매핑 totalSessions 합
 *   - usedSessions: shop-paid 매핑 usedSessions 합 (SSOT)
 *   - remainingSessions: shop-paid 매핑 remainingSessions 합 (SSOT)
 */
export function calculateClientSessionTotalsFromMappings(mappings) {
  const eligible = filterMappingsForClientRemainingSessions(mappings);
  const totalSessions = sumMappingField(eligible, 'totalSessions');
  const usedSessions = sumMappingField(eligible, 'usedSessions');
  const remainingSessions = sumMappingField(eligible, 'remainingSessions');
  return {
    totalSessions,
    usedSessions,
    remainingSessions
  };
}
