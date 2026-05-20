import { ADMIN_MAPPING_COPY } from '@/constants/adminMappingCopy';
import type { AdminMappingListItem } from '@/utils/adminMappingNormalize';
import {
  canScheduleAdminMapping,
  generateMappingDepositReference,
  getAdminMappingPrimaryActionKind,
  getAdminMappingPrimaryCtaLabel,
  getScheduleBlockedPaymentHint,
  isScheduleBlockedByPaymentStatus,
  shouldShowAdminMappingPrimaryCta,
  shouldShowWebPaymentCta,
} from '../adminMappingSettlement';

function row(
  partial: Partial<AdminMappingListItem> & Pick<AdminMappingListItem, 'status' | 'remainingSessions'>,
): AdminMappingListItem {
  return {
    id: 1,
    consultantId: 1,
    consultantName: '상담사',
    clientId: 2,
    clientName: '내담자',
    totalSessions: 10,
    packageName: '패키지',
    packagePrice: 500_000,
    paymentMethod: 'BANK_TRANSFER',
    createdAt: null,
    ...partial,
  };
}

describe('canScheduleAdminMapping', () => {
  it('allows schedule only for ACTIVE with remaining sessions', () => {
    expect(canScheduleAdminMapping(row({ status: 'ACTIVE', remainingSessions: 3 }))).toBe(true);
    expect(canScheduleAdminMapping(row({ status: 'ACTIVE', remainingSessions: 0 }))).toBe(false);
    expect(canScheduleAdminMapping(row({ status: 'PENDING_PAYMENT', remainingSessions: 10 }))).toBe(
      false,
    );
    expect(canScheduleAdminMapping(row({ status: 'DEPOSIT_PENDING', remainingSessions: 5 }))).toBe(
      false,
    );
  });
});

describe('isScheduleBlockedByPaymentStatus', () => {
  it('blocks non-ACTIVE statuses', () => {
    expect(isScheduleBlockedByPaymentStatus('PENDING_PAYMENT')).toBe(true);
    expect(isScheduleBlockedByPaymentStatus('PAYMENT_CONFIRMED')).toBe(true);
    expect(isScheduleBlockedByPaymentStatus('DEPOSIT_PENDING')).toBe(true);
  });

  it('blocks ACTIVE without remaining sessions', () => {
    expect(isScheduleBlockedByPaymentStatus('ACTIVE', 0)).toBe(true);
    expect(isScheduleBlockedByPaymentStatus('ACTIVE', 2)).toBe(false);
  });

  it('uses mapping row when object passed', () => {
    expect(isScheduleBlockedByPaymentStatus(row({ status: 'ACTIVE', remainingSessions: 1 }))).toBe(
      false,
    );
    expect(
      isScheduleBlockedByPaymentStatus(row({ status: 'PAYMENT_CONFIRMED', remainingSessions: 10 })),
    ).toBe(true);
  });
});

describe('primary CTA visibility', () => {
  it('maps settlement and ACTIVE statuses to schedule primary (Sprint 1c hybrid)', () => {
    expect(getAdminMappingPrimaryActionKind('PENDING_PAYMENT')).toBe('schedule');
    expect(getAdminMappingPrimaryActionKind('PAYMENT_CONFIRMED')).toBe('schedule');
    expect(getAdminMappingPrimaryActionKind('DEPOSIT_PENDING')).toBe('schedule');
    expect(getAdminMappingPrimaryActionKind('ACTIVE')).toBe('schedule');
    expect(getAdminMappingPrimaryActionKind('TERMINATED')).toBeNull();
  });

  it('shows primary CTA only when manage allowed', () => {
    expect(shouldShowAdminMappingPrimaryCta('PENDING_PAYMENT', true)).toBe(true);
    expect(shouldShowAdminMappingPrimaryCta('PENDING_PAYMENT', false)).toBe(false);
  });

  it('returns localized primary labels', () => {
    expect(getAdminMappingPrimaryCtaLabel('payment')).toBe(ADMIN_MAPPING_COPY.CONFIRM_PAYMENT_CTA);
    expect(getAdminMappingPrimaryCtaLabel('deposit')).toBe(ADMIN_MAPPING_COPY.CONFIRM_DEPOSIT_CTA);
    expect(getAdminMappingPrimaryCtaLabel('approve')).toBe(ADMIN_MAPPING_COPY.APPROVE_MAPPING_CTA);
    expect(getAdminMappingPrimaryCtaLabel('schedule')).toBe(
      ADMIN_MAPPING_COPY.ACTION_SCHEDULE_FROM_MAPPING,
    );
  });
});

describe('web fallback CTA', () => {
  it('shows only for PENDING_PAYMENT and DEPOSIT_PENDING (§5.3)', () => {
    expect(shouldShowWebPaymentCta('PENDING_PAYMENT')).toBe(true);
    expect(shouldShowWebPaymentCta('PAYMENT_CONFIRMED')).toBe(false);
    expect(shouldShowWebPaymentCta('DEPOSIT_PENDING')).toBe(true);
    expect(shouldShowWebPaymentCta('ACTIVE')).toBe(false);
  });
});

describe('schedule blocked hints', () => {
  it('returns status-specific hints', () => {
    expect(
      getScheduleBlockedPaymentHint(row({ status: 'PENDING_PAYMENT', remainingSessions: 10 })),
    ).toBe(ADMIN_MAPPING_COPY.SCHEDULE_BLOCKED_PENDING_PAYMENT_HINT);
    expect(
      getScheduleBlockedPaymentHint(row({ status: 'ACTIVE', remainingSessions: 0 })),
    ).toBe(ADMIN_MAPPING_COPY.SCHEDULE_BLOCKED_NO_SESSIONS_HINT);
  });
});

describe('generateMappingDepositReference', () => {
  it('matches DEPOSIT_yyyyMMdd_HHmmss pattern', () => {
    expect(generateMappingDepositReference()).toMatch(/^DEPOSIT_\d{8}_\d{6}$/);
  });
});
