/**
 * 통합 스케줄 매칭 카드 — 스케줄↔매칭 desync SSOT
 * 스펙: docs/design-system/v2/INTEGRATED_SCHEDULE_CARD_DESYNC_SPEC.md
 *
 * 점유 판별은 mappingId 기준 nextConsultationDate / hasConsultationSchedule 만 사용.
 * hasUpcomingConsultationSchedule 혼용 금지.
 *
 * @author CoreSolution
 * @since 2026-07-18
 */

import { toDisplayString } from '../../../../../utils/safeDisplay';
import {
  MAPPING_STATUS_ACTIVE,
  MAPPING_STATUS_PENDING_PAYMENT,
  isSameDayCardPending,
  normalizedRemainingSessions
} from '../../constants/integratedScheduleSidebarFilterConstants';

export const MAPPING_DESYNC_KIND = {
  NONE: 'none',
  /** SESSIONS_EXHAUSTED + 미래 점유 — 정상(CTA 금지), 툴팁만 */
  SESSIONS_IN_PROGRESS: 'sessions-in-progress',
  CLEANUP: 'desync-cleanup',
  CANCEL: 'desync-cancel',
  STATUS: 'desync-status'
};

export const MAPPING_DESYNC_BADGE_VARIANT = {
  WARNING: 'warning',
  ERROR: 'error'
};

export const MAPPING_DESYNC_CTA_TYPE = {
  CLEANUP: 'cleanup',
  CANCEL: 'cancel',
  COMPLETE: 'complete'
};

const CLOSED_WITH_FUTURE = new Set(['TERMINATED', 'INACTIVE', 'SUSPENDED']);

const LABEL = {
  SESSIONS_IN_PROGRESS_TOOLTIP: '예정 상담 진행 중',
  CLEANUP_BADGE: '일정 정리 필요',
  CLEANUP_TOOLTIP: '잔여 일정 정리 필요',
  CLEANUP_CTA: '일정 정리',
  CLEANUP_MODAL_TITLE: '잔여 일정 정리',
  CLEANUP_MODAL_SUBTITLE:
    '매칭이 종료되었으나 미래 일정이 남아있습니다. 일정을 정리하시겠습니까?',
  CANCEL_BADGE: '매칭 취소 필요',
  CANCEL_TOOLTIP: '매칭을 취소해 주세요',
  CANCEL_CTA: '매칭 취소',
  CANCEL_MODAL_TITLE: '매칭 취소',
  CANCEL_MODAL_SUBTITLE: '결제 대기 중인 가예약 매칭입니다. 취소하시겠습니까?',
  STATUS_BADGE: '상태 불일치',
  STATUS_TOOLTIP: '완료 처리해 주세요',
  STATUS_CTA: '완료 처리',
  STATUS_MODAL_TITLE: '완료 처리',
  STATUS_MODAL_SUBTITLE: '남은 회기가 없습니다. 매칭을 완료 처리하시겠습니까?'
};

const emptyResult = () => ({
  kind: MAPPING_DESYNC_KIND.NONE,
  isDesync: false,
  tooltip: '',
  ctaType: null,
  ctaLabel: '',
  badgeLabel: '',
  badgeVariant: null,
  modalTitle: '',
  modalSubtitle: ''
});

/**
 * 미래 점유 일정 여부 — nextConsultationDate 만 사용 (페어 기준 필드 금지)
 * @param {object} [mapping]
 * @returns {boolean}
 */
export const hasFutureOccupyingSchedule = (mapping) => {
  const next = toDisplayString(mapping?.nextConsultationDate, '').trim();
  return Boolean(next);
};

/**
 * mapping enrich 필드 → desync kind + UX 메타
 * @param {object} [mapping]
 * @returns {{
 *   kind: string,
 *   isDesync: boolean,
 *   tooltip: string,
 *   ctaType: string|null,
 *   ctaLabel: string,
 *   badgeLabel: string,
 *   badgeVariant: string|null,
 *   modalTitle: string,
 *   modalSubtitle: string
 * }}
 */
export const resolveMappingScheduleDesync = (mapping) => {
  if (!mapping || typeof mapping !== 'object') {
    return emptyResult();
  }

  const status = toDisplayString(mapping.status, '').trim();
  const hasNext = hasFutureOccupyingSchedule(mapping);

  // 정상: SESSIONS_EXHAUSTED + 미래 점유 — CTA·desync 배지 절대 금지
  if (status === 'SESSIONS_EXHAUSTED' && hasNext) {
    return {
      kind: MAPPING_DESYNC_KIND.SESSIONS_IN_PROGRESS,
      isDesync: false,
      tooltip: LABEL.SESSIONS_IN_PROGRESS_TOOLTIP,
      ctaType: null,
      ctaLabel: '',
      badgeLabel: '',
      badgeVariant: null,
      modalTitle: '',
      modalSubtitle: ''
    };
  }

  if (CLOSED_WITH_FUTURE.has(status) && hasNext) {
    return {
      kind: MAPPING_DESYNC_KIND.CLEANUP,
      isDesync: true,
      tooltip: LABEL.CLEANUP_TOOLTIP,
      ctaType: MAPPING_DESYNC_CTA_TYPE.CLEANUP,
      ctaLabel: LABEL.CLEANUP_CTA,
      badgeLabel: LABEL.CLEANUP_BADGE,
      badgeVariant: MAPPING_DESYNC_BADGE_VARIANT.WARNING,
      modalTitle: LABEL.CLEANUP_MODAL_TITLE,
      modalSubtitle: LABEL.CLEANUP_MODAL_SUBTITLE
    };
  }

  // 비 Option-B PENDING_PAYMENT + 미래 점유
  if (
    status === MAPPING_STATUS_PENDING_PAYMENT
    && !isSameDayCardPending(mapping)
    && hasNext
  ) {
    return {
      kind: MAPPING_DESYNC_KIND.CANCEL,
      isDesync: true,
      tooltip: LABEL.CANCEL_TOOLTIP,
      ctaType: MAPPING_DESYNC_CTA_TYPE.CANCEL,
      ctaLabel: LABEL.CANCEL_CTA,
      badgeLabel: LABEL.CANCEL_BADGE,
      badgeVariant: MAPPING_DESYNC_BADGE_VARIANT.ERROR,
      modalTitle: LABEL.CANCEL_MODAL_TITLE,
      modalSubtitle: LABEL.CANCEL_MODAL_SUBTITLE
    };
  }

  // ACTIVE + remaining <= 0 (SESSIONS_EXHAUSTED 미전이)
  if (
    status === MAPPING_STATUS_ACTIVE
    && normalizedRemainingSessions(mapping) <= 0
  ) {
    return {
      kind: MAPPING_DESYNC_KIND.STATUS,
      isDesync: true,
      tooltip: LABEL.STATUS_TOOLTIP,
      ctaType: MAPPING_DESYNC_CTA_TYPE.COMPLETE,
      ctaLabel: LABEL.STATUS_CTA,
      badgeLabel: LABEL.STATUS_BADGE,
      badgeVariant: MAPPING_DESYNC_BADGE_VARIANT.WARNING,
      modalTitle: LABEL.STATUS_MODAL_TITLE,
      modalSubtitle: LABEL.STATUS_MODAL_SUBTITLE
    };
  }

  return emptyResult();
};
