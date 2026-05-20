jest.mock('@/config/webBaseUrl', () => ({
  buildAdminWebUrl: (relativePath: string) => {
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `https://mindgarden.example.com${path}`;
  },
}));

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Linking: {
    canOpenURL: jest.fn().mockResolvedValue(true),
    openURL: jest.fn().mockResolvedValue(undefined),
  },
}));

import {
  ADMIN_MOBILE_WEB_ROUTES,
  adminIntegratedScheduleWebUrl,
  adminMappingManagementPendingPaymentPath,
  adminMappingManagementPendingPaymentUrl,
} from '@/constants/adminMobileScreensCopy';
import { ADMIN_MAPPING_COPY } from '@/constants/adminMappingCopy';
import {
  extractCreatedMappingId,
  resolveAdminMappingPaymentWebUrl,
} from '../openAdminWebMappingPayment';
import {
  getWebPaymentCtaLabel,
  isScheduleBlockedByPaymentStatus,
  shouldShowWebPaymentCta,
} from '../adminMappingSettlement';

describe('openAdminWebMappingPayment URL builders', () => {

  it('builds integrated schedule absolute URL', () => {
    expect(adminIntegratedScheduleWebUrl()).toBe(
      `https://mindgarden.example.com${ADMIN_MOBILE_WEB_ROUTES.INTEGRATED_SCHEDULE}`,
    );
  });

  it('builds mapping management pending payment URL with query', () => {
    expect(adminMappingManagementPendingPaymentPath()).toBe(
      `${ADMIN_MOBILE_WEB_ROUTES.MAPPING_MANAGEMENT}?status=PENDING_PAYMENT`,
    );
    expect(adminMappingManagementPendingPaymentUrl()).toBe(
      `https://mindgarden.example.com${ADMIN_MOBILE_WEB_ROUTES.MAPPING_MANAGEMENT}?status=PENDING_PAYMENT`,
    );
  });

  it('resolveAdminMappingPaymentWebUrl targets integrated by default', () => {
    expect(resolveAdminMappingPaymentWebUrl()).toBe(adminIntegratedScheduleWebUrl());
    expect(resolveAdminMappingPaymentWebUrl('mappingManagementPending')).toBe(
      adminMappingManagementPendingPaymentUrl(),
    );
  });
});

describe('extractCreatedMappingId', () => {
  it('extracts id from ApiResponse envelope', () => {
    expect(
      extractCreatedMappingId({
        success: true,
        data: { id: 42, status: 'PENDING_PAYMENT' },
      }),
    ).toBe(42);
  });

  it('extracts id from bare mapping object', () => {
    expect(extractCreatedMappingId({ id: 7 })).toBe(7);
  });

  it('returns null for invalid id', () => {
    expect(extractCreatedMappingId({ success: true, data: { id: 0 } })).toBeNull();
    expect(extractCreatedMappingId(null)).toBeNull();
  });
});

describe('mapping payment CTA visibility (re-exported settlement SSOT)', () => {
  it('blocks schedule unless ACTIVE with sessions', () => {
    expect(isScheduleBlockedByPaymentStatus('PENDING_PAYMENT')).toBe(true);
    expect(isScheduleBlockedByPaymentStatus('PAYMENT_CONFIRMED')).toBe(true);
    expect(isScheduleBlockedByPaymentStatus('deposit_pending')).toBe(true);
    expect(isScheduleBlockedByPaymentStatus('ACTIVE')).toBe(false);
    expect(isScheduleBlockedByPaymentStatus('ACTIVE', 0)).toBe(true);
  });

  it('shows web CTA for PENDING_PAYMENT and DEPOSIT_PENDING only', () => {
    expect(shouldShowWebPaymentCta('PENDING_PAYMENT')).toBe(true);
    expect(shouldShowWebPaymentCta('PAYMENT_CONFIRMED')).toBe(false);
    expect(shouldShowWebPaymentCta('DEPOSIT_PENDING')).toBe(true);
    expect(shouldShowWebPaymentCta('ACTIVE')).toBe(false);
  });

  it('returns status-specific web CTA labels', () => {
    expect(getWebPaymentCtaLabel('PENDING_PAYMENT')).toBe(ADMIN_MAPPING_COPY.OPEN_WEB_PAYMENT_CTA);
    expect(getWebPaymentCtaLabel('PAYMENT_CONFIRMED')).toBe(ADMIN_MAPPING_COPY.OPEN_WEB_DEPOSIT_CTA);
    expect(getWebPaymentCtaLabel('DEPOSIT_PENDING')).toBe(
      ADMIN_MAPPING_COPY.DEPOSIT_PENDING_WEB_CTA,
    );
  });
});
