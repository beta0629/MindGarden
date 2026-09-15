/**
 * 회기권 패키지 만료 임박 판별 테스트
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import {
  PAYMENT_TIMING_ADVANCE,
  PAYMENT_TIMING_SAME_DAY_CARD
} from '../../../constants/integratedScheduleSidebarFilterConstants';
import { PACKAGE_EXPIRY_EXCLUDED_INSTITUTION_LINK_TIMING, PACKAGE_EXPIRY_EXCLUDED_VOUCHER_TIMING } from '../../constants/packageExpiryReminderConstants';
import {
  isPrepaidSessionPackageMapping,
  isSessionPackageExpiryImminent,
  resolveEventMappingId
} from '../packageExpiryReminderUtils';

describe('packageExpiryReminderUtils', () => {
  describe('isPrepaidSessionPackageMapping', () => {
    it('ADVANCE 회기권은 true', () => {
      expect(isPrepaidSessionPackageMapping({ paymentTiming: PAYMENT_TIMING_ADVANCE })).toBe(true);
    });

    it('레거시 paymentTiming null 은 회기권으로 본다', () => {
      expect(isPrepaidSessionPackageMapping({ paymentTiming: null })).toBe(true);
    });

    it('타기관 연계는 false', () => {
      expect(isPrepaidSessionPackageMapping({
        paymentTiming: PACKAGE_EXPIRY_EXCLUDED_INSTITUTION_LINK_TIMING
      })).toBe(false);
    });

    it('당일카드는 회기권이 아니므로 false', () => {
      expect(isPrepaidSessionPackageMapping({
        paymentTiming: PAYMENT_TIMING_SAME_DAY_CARD
      })).toBe(false);
    });

    it('바우처는 회기권 알림 대상이 아니다', () => {
      expect(isPrepaidSessionPackageMapping({
        paymentTiming: PACKAGE_EXPIRY_EXCLUDED_VOUCHER_TIMING
      })).toBe(false);
    });
  });

  describe('isSessionPackageExpiryImminent', () => {
    it('회기권 잔여 1~2회이면 true', () => {
      expect(isSessionPackageExpiryImminent({
        paymentTiming: PAYMENT_TIMING_ADVANCE,
        remainingSessions: 1
      })).toBe(true);
      expect(isSessionPackageExpiryImminent({
        paymentTiming: PAYMENT_TIMING_ADVANCE,
        remainingSessions: 2
      })).toBe(true);
    });

    it('잔여 3회 이상은 false', () => {
      expect(isSessionPackageExpiryImminent({
        paymentTiming: PAYMENT_TIMING_ADVANCE,
        remainingSessions: 3
      })).toBe(false);
    });

    it('잔여 0이면 false', () => {
      expect(isSessionPackageExpiryImminent({
        paymentTiming: PAYMENT_TIMING_ADVANCE,
        remainingSessions: 0
      })).toBe(false);
    });

    it('타기관 연계는 잔여 1회여도 false', () => {
      expect(isSessionPackageExpiryImminent({
        paymentTiming: PACKAGE_EXPIRY_EXCLUDED_INSTITUTION_LINK_TIMING,
        remainingSessions: 1
      })).toBe(false);
    });
  });

  describe('resolveEventMappingId', () => {
    it('extendedProps.mappingId 를 반환한다', () => {
      expect(resolveEventMappingId({
        extendedProps: { mappingId: 42 }
      })).toBe(42);
    });
  });
});
