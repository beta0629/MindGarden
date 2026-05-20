/**
 * 어드민 매칭 결제·입금·승인 — 웹 MappingCard / IntegratedMatchingSchedule SSOT
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { ADMIN_MAPPING_COPY } from '@/constants/adminMappingCopy';
import type { AdminMappingListItem } from '@/utils/adminMappingNormalize';

export type AdminMappingSettlementTarget = Pick<
  AdminMappingListItem,
  'id' | 'status' | 'remainingSessions' | 'consultantName' | 'clientName' | 'packageName' | 'packagePrice' | 'paymentMethod'
>;

export type AdminMappingPrimaryActionKind = 'payment' | 'deposit' | 'approve' | 'schedule';

/** 일정 등록 — ACTIVE + 잔여 회기 1 이상 (웹 canConfirmedScheduleForMapping) */
export function canScheduleAdminMapping(
  mapping: Pick<AdminMappingListItem, 'status' | 'remainingSessions'>,
): boolean {
  const status = mapping.status.trim().toUpperCase();
  return status === 'ACTIVE' && mapping.remainingSessions > 0;
}

/**
 * 일정 CTA 비활성 — ACTIVE가 아니거나 잔여 회기 없음
 * @param statusOrMapping 상태 문자열(레거시) 또는 매칭 행
 * @param remainingSessions status만 전달 시 ACTIVE 판별용(선택)
 */
export function isScheduleBlockedByPaymentStatus(
  statusOrMapping: string | Pick<AdminMappingListItem, 'status' | 'remainingSessions'>,
  remainingSessions?: number,
): boolean {
  if (typeof statusOrMapping === 'string') {
    const status = statusOrMapping.trim().toUpperCase();
    if (status !== 'ACTIVE') {
      return true;
    }
    if (remainingSessions != null) {
      return remainingSessions <= 0;
    }
    return false;
  }
  return !canScheduleAdminMapping(statusOrMapping);
}

export function getAdminMappingPrimaryActionKind(status: string): AdminMappingPrimaryActionKind | null {
  const key = status.trim().toUpperCase();
  if (
    key === 'PENDING_PAYMENT' ||
    key === 'PAYMENT_CONFIRMED' ||
    key === 'DEPOSIT_PENDING' ||
    key === 'ACTIVE'
  ) {
    return 'schedule';
  }
  return null;
}

export function getAdminMappingPrimaryCtaLabel(kind: AdminMappingPrimaryActionKind): string {
  if (kind === 'payment') {
    return ADMIN_MAPPING_COPY.CONFIRM_PAYMENT_CTA;
  }
  if (kind === 'deposit') {
    return ADMIN_MAPPING_COPY.CONFIRM_DEPOSIT_CTA;
  }
  if (kind === 'approve') {
    return ADMIN_MAPPING_COPY.APPROVE_MAPPING_CTA;
  }
  return ADMIN_MAPPING_COPY.ACTION_SCHEDULE_FROM_MAPPING;
}

export function shouldShowAdminMappingPrimaryCta(
  status: string,
  canManage: boolean,
): boolean {
  if (!canManage) {
    return false;
  }
  return getAdminMappingPrimaryActionKind(status) != null;
}

/** 웹 브릿지 Secondary — `PENDING_PAYMENT` · `DEPOSIT_PENDING` (§5.3; `PAYMENT_CONFIRMED` 숨김) */
export function shouldShowWebPaymentCta(status: string): boolean {
  const key = status.trim().toUpperCase();
  return key === 'PENDING_PAYMENT' || key === 'DEPOSIT_PENDING';
}

export function getWebPaymentCtaLabel(status: string): string {
  const key = status.trim().toUpperCase();
  if (key === 'DEPOSIT_PENDING') {
    return ADMIN_MAPPING_COPY.DEPOSIT_PENDING_WEB_CTA;
  }
  if (key === 'PAYMENT_CONFIRMED') {
    return ADMIN_MAPPING_COPY.OPEN_WEB_DEPOSIT_CTA;
  }
  return ADMIN_MAPPING_COPY.OPEN_WEB_PAYMENT_CTA;
}

export function getScheduleBlockedPaymentHint(
  mapping: Pick<AdminMappingListItem, 'status' | 'remainingSessions'>,
): string {
  const status = mapping.status.trim().toUpperCase();
  if (status === 'PENDING_PAYMENT') {
    return ADMIN_MAPPING_COPY.SCHEDULE_BLOCKED_PENDING_PAYMENT_HINT;
  }
  if (status === 'PAYMENT_CONFIRMED') {
    return ADMIN_MAPPING_COPY.SCHEDULE_BLOCKED_PAYMENT_CONFIRMED_HINT;
  }
  if (status === 'DEPOSIT_PENDING') {
    return ADMIN_MAPPING_COPY.SCHEDULE_BLOCKED_DEPOSIT_PENDING_HINT;
  }
  if (status === 'ACTIVE' && mapping.remainingSessions <= 0) {
    return ADMIN_MAPPING_COPY.SCHEDULE_BLOCKED_NO_SESSIONS_HINT;
  }
  return ADMIN_MAPPING_COPY.SCHEDULE_BLOCKED_PAYMENT_HINT;
}

/** 웹 MappingDepositModal — DEPOSIT_yyyyMMdd_HHmmss */
export function generateMappingDepositReference(): string {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `DEPOSIT_${y}${mo}${d}_${h}${mi}${s}`;
}

export function resolveAdminApproveName(
  user: { name?: string; id?: number } | null | undefined,
): string {
  const name = user?.name?.trim();
  if (name) {
    return name;
  }
  if (user?.id != null && Number.isFinite(user.id)) {
    return String(user.id);
  }
  return '관리자';
}
