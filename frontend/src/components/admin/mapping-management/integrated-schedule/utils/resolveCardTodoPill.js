/**
 * Clinic-OS 사이드바 카드 — amber 할 일 필 단일 선택 SSOT
 * 스펙: docs/design-system/clinic-os-sidebar-cards.md
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import {
  ASSIGNMENT_PAYMENT_TIMING,
  ASSIGNMENT_PAYMENT_TIMING_LABELS
} from '../../../../../constants/clientEngagementType';
import { toDisplayString, toSafeNumber } from '../../../../../utils/safeDisplay';
import { PENDING_PAYMENT_KPI_LABEL } from '../../../../../utils/pendingPaymentAggregation';
import { SESSION_EXTENSION_UI } from '../../../../../utils/sessionExtensionPending';
import {
  MAPPING_STATUS_PENDING_PAYMENT,
  PAYMENT_TIMING_SAME_DAY_CARD
} from '../../constants/integratedScheduleSidebarFilterConstants';
import {
  MAPPING_DESYNC_KIND,
  resolveMappingScheduleDesync
} from './mappingScheduleDesync';

export const CARD_TODO_LABEL = Object.freeze({
  PENDING_PAYMENT: PENDING_PAYMENT_KPI_LABEL
});

/**
 * PENDING_PAYMENT 할 일 필 라벨.
 * SAME_DAY_CARD(옵션 B dirty 동등) → 타이밍 SSOT 「가예약」.
 * 그 외(ADVANCE 등) → KPI SSOT 「결제 대기」.
 *
 * @param {object} mappingOrMeta
 * @returns {string}
 */
const resolvePendingPaymentPillLabel = (mappingOrMeta) => {
  const timing = String(mappingOrMeta.paymentTiming || '').toUpperCase();
  if (timing === PAYMENT_TIMING_SAME_DAY_CARD) {
    return ASSIGNMENT_PAYMENT_TIMING_LABELS[ASSIGNMENT_PAYMENT_TIMING.SAME_DAY_CARD];
  }
  return CARD_TODO_LABEL.PENDING_PAYMENT;
};

/**
 * @param {object} [mappingOrMeta]
 * @returns {{ label: string, title: string }|null}
 */
export const resolveCardTodoPill = (mappingOrMeta) => {
  if (!mappingOrMeta || typeof mappingOrMeta !== 'object') {
    return null;
  }

  const status = toDisplayString(mappingOrMeta.status, '').trim();
  if (status === MAPPING_STATUS_PENDING_PAYMENT) {
    const label = resolvePendingPaymentPillLabel(mappingOrMeta);
    return {
      label,
      title: label
    };
  }

  const desync = resolveMappingScheduleDesync(mappingOrMeta);
  if (
    desync.isDesync
    && (
      desync.kind === MAPPING_DESYNC_KIND.CANCEL
      || desync.kind === MAPPING_DESYNC_KIND.CLEANUP
      || desync.kind === MAPPING_DESYNC_KIND.STATUS
    )
    && desync.badgeLabel
  ) {
    return {
      label: toDisplayString(desync.badgeLabel, ''),
      title: toDisplayString(desync.tooltip, desync.badgeLabel)
    };
  }

  const pendingExtension = mappingOrMeta.pendingSessionExtension;
  if (pendingExtension) {
    const pendingSessions = toSafeNumber(pendingExtension.additionalSessions, null);
    const label = pendingSessions != null
      ? `${SESSION_EXTENSION_UI.BADGE_LABEL} +${pendingSessions}회기`
      : SESSION_EXTENSION_UI.BADGE_LABEL;
    return {
      label,
      title: label
    };
  }

  return null;
};
