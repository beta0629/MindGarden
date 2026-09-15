/**
 * 배정 카드/Peek 패키지 표시명. 기관연동은 prepaid_amount 선납 라벨, 일반은 packageName.
 * 표시 전용 — 금액 UPDATE/DATAFIX 없음.
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import { toDisplayString, toSafeNumber } from '../../../../../utils/safeDisplay';
import { isInstitutionLinkEngagement } from '../../../../../constants/mappingEngagementType';

/** i18n short key (namespace admin) */
export const IL_PREPAID_PACKAGE_I18N_KEY =
  'integratedSchedule.packageDisplay.prepaidInitialConsultation';

/** 테스트·폴백용 한국어 접두 (i18n 미주입 시) */
export const IL_PREPAID_PACKAGE_LABEL_PREFIX = '초기상담료(선납)';

/**
 * @param {unknown} amount
 * @returns {string|null} e.g. "100,000원"
 */
export function formatPrepaidAmountWon(amount) {
  const n = toSafeNumber(amount, null);
  if (n == null || n <= 0) {
    return null;
  }
  return `${new Intl.NumberFormat('ko-KR').format(n)}원`;
}

/**
 * @param {object|null|undefined} mapping
 * @returns {boolean}
 */
export function isInstitutionLinkMapping(mapping) {
  if (mapping == null || typeof mapping !== 'object') {
    return false;
  }
  return isInstitutionLinkEngagement(mapping.paymentTiming)
    || isInstitutionLinkEngagement(mapping.clientEngagementType)
    || isInstitutionLinkEngagement(mapping.engagementType)
    || isInstitutionLinkEngagement(mapping.mappingEngagementType);
}

/**
 * @param {object|null|undefined} mapping
 * @param {(key: string, opts?: object) => string} [t] i18n t
 * @returns {string} 표시용 패키지명 (없으면 '')
 */
export function resolveMappingPackageDisplayName(mapping, t) {
  if (mapping == null || typeof mapping !== 'object') {
    return '';
  }
  if (isInstitutionLinkMapping(mapping)) {
    const won = formatPrepaidAmountWon(mapping.institutionLinkPrepaidAmount);
    if (won) {
      if (typeof t === 'function') {
        let label = t(IL_PREPAID_PACKAGE_I18N_KEY, { amount: won });
        if (!label || label === IL_PREPAID_PACKAGE_I18N_KEY
          || String(label).includes('prepaidInitialConsultation')) {
          label = t(`admin:${IL_PREPAID_PACKAGE_I18N_KEY}`, { amount: won });
        }
        if (label && !String(label).includes('prepaidInitialConsultation')) {
          return toDisplayString(label, '');
        }
      }
      return `${IL_PREPAID_PACKAGE_LABEL_PREFIX} ${won}`;
    }
    // 기관연동 + 선납 없음: 단회기 packageName(예: 90,000원) 숨김
    return '';
  }
  return toDisplayString(mapping.packageName, '').trim();
}
