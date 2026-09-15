/**
 * 배정 카드/Peek 패키지 표시명 SSOT.
 * 금액 정본 = 재무 FT SELECT(최가을 FT#241 = 90,000)에 정합한 packageName.
 * contract prepaid_amount / institutionLinkPrepaidAmount(100000 DATAFIX)는 표시 정본이 아니다.
 * 표시 전용 — 금액 UPDATE/DATAFIX 없음.
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import { toDisplayString } from '../../../../../utils/safeDisplay';

/**
 * @param {object|null|undefined} mapping
 * @param {(key: string, opts?: object) => string} [t] unused — 시그니처 유지
 * @returns {string} 표시용 패키지명 (없으면 '')
 */
export function resolveMappingPackageDisplayName(mapping, t) {
  void t;
  if (mapping == null || typeof mapping !== 'object') {
    return '';
  }
  // institutionLinkPrepaidAmount 는 계약 denorm — FT 정본이 아니므로 무시한다.
  return toDisplayString(mapping.packageName, '').trim();
}
