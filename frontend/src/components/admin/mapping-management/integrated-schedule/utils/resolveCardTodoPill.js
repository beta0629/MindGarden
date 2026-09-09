/**
 * Clinic-OS 사이드바 카드 — amber 할 일 필 단일 선택 SSOT
 * 스펙: docs/design-system/clinic-os-sidebar-cards.md
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import { toDisplayString, toSafeNumber } from '../../../../../utils/safeDisplay';
import { SESSION_EXTENSION_UI } from '../../../../../utils/sessionExtensionPending';
import { MAPPING_STATUS_PENDING_PAYMENT } from '../../constants/integratedScheduleSidebarFilterConstants';
import {
  MAPPING_DESYNC_KIND,
  resolveMappingScheduleDesync
} from './mappingScheduleDesync';

export const CARD_TODO_LABEL = Object.freeze({
  PENDING_PAYMENT: '결제 대기'
});

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
    return {
      label: CARD_TODO_LABEL.PENDING_PAYMENT,
      title: CARD_TODO_LABEL.PENDING_PAYMENT
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
