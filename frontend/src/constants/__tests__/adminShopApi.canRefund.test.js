/**
 * canAdminShopOrderPrimaryRefund / isAdminShopPgCancelled — PG 기취소 시 전액환불 CTA 게이트
 *
 * Hardcode gates cited:
 * - docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md §17
 * - docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md §1.3
 *
 * @author CoreSolution
 * @since 2026-09-22
 */

import {
  ADMIN_SHOP_PG_CANCELLED_STATUSES,
  ADMIN_SHOP_REFUND_ALREADY_CANCELLED_COPY,
  ADMIN_SHOP_REFUND_CLINIC_INCOMPLETE_CODE,
  ADMIN_SHOP_REFUND_CLINIC_INCOMPLETE_COPY,
  ADMIN_SHOP_RECONCILE_REFUND_COPY,
  canAdminShopOrderPrimaryRefund,
  isAdminShopPgCancelled,
  resolveAdminShopRefundErrorCopy
} from '../adminShopApi';

describe('canAdminShopOrderPrimaryRefund', () => {
  test('PAID + CANCELLED → false', () => {
    expect(canAdminShopOrderPrimaryRefund({ status: 'PAID', pgStatus: 'CANCELLED' })).toBe(false);
  });

  test('PAID + PARTIAL_CANCELLED → false', () => {
    expect(
      canAdminShopOrderPrimaryRefund({ status: 'PAID', pgStatus: 'PARTIAL_CANCELLED' })
    ).toBe(false);
  });

  test('PAID + cancelled (case-insensitive) → false', () => {
    expect(canAdminShopOrderPrimaryRefund({ status: 'PAID', pgStatus: 'cancelled' })).toBe(false);
    expect(
      canAdminShopOrderPrimaryRefund({ status: 'PAID', pgStatus: ' Partial_Cancelled ' })
    ).toBe(false);
  });

  test('PAID + PAID → true', () => {
    expect(canAdminShopOrderPrimaryRefund({ status: 'PAID', pgStatus: 'PAID' })).toBe(true);
  });

  test('PAID + null pgStatus → true (unknown PG keeps primary CTA)', () => {
    expect(canAdminShopOrderPrimaryRefund({ status: 'PAID', pgStatus: null })).toBe(true);
  });

  test('REFUNDED + CANCELLED → false', () => {
    expect(
      canAdminShopOrderPrimaryRefund({ status: 'REFUNDED', pgStatus: 'CANCELLED' })
    ).toBe(false);
  });

  test('null detail → false', () => {
    expect(canAdminShopOrderPrimaryRefund(null)).toBe(false);
  });
});

describe('isAdminShopPgCancelled', () => {
  test('mirrors PortOne CANCELLED / PARTIAL_CANCELLED constants', () => {
    expect(ADMIN_SHOP_PG_CANCELLED_STATUSES).toEqual(['CANCELLED', 'PARTIAL_CANCELLED']);
    expect(isAdminShopPgCancelled('CANCELLED')).toBe(true);
    expect(isAdminShopPgCancelled('PARTIAL_CANCELLED')).toBe(true);
    expect(isAdminShopPgCancelled('PAID')).toBe(false);
    expect(isAdminShopPgCancelled(null)).toBe(false);
    expect(isAdminShopPgCancelled('')).toBe(false);
  });
});

describe('ADMIN_SHOP_RECONCILE_REFUND_COPY / refund already-cancelled copy', () => {
  test('exposes ALREADY_PG_CANCELLED_SYNC without secrets', () => {
    expect(ADMIN_SHOP_RECONCILE_REFUND_COPY.ALREADY_PG_CANCELLED_SYNC).toBe(
      '이미 PG 취소됨 — Clinic 동기화'
    );
    expect(ADMIN_SHOP_RECONCILE_REFUND_COPY.ALREADY_PG_CANCELLED_SYNC).not.toMatch(/paymentId/i);
  });

  test('resolveAdminShopRefundErrorCopy maps already-cancelled / duplicate', () => {
    expect(resolveAdminShopRefundErrorCopy({ message: '이미 취소된 결제입니다' })).toBe(
      ADMIN_SHOP_REFUND_ALREADY_CANCELLED_COPY.ALREADY_CANCELLED
    );
    expect(resolveAdminShopRefundErrorCopy({ message: 'Payment already cancelled' })).toBe(
      ADMIN_SHOP_REFUND_ALREADY_CANCELLED_COPY.ALREADY_CANCELLED
    );
    expect(resolveAdminShopRefundErrorCopy({ message: '기취소 상태' })).toBe(
      ADMIN_SHOP_REFUND_ALREADY_CANCELLED_COPY.ALREADY_CANCELLED
    );
    expect(resolveAdminShopRefundErrorCopy({ message: 'duplicate cancel request' })).toBe(
      ADMIN_SHOP_REFUND_ALREADY_CANCELLED_COPY.DUPLICATE_CANCEL
    );
    expect(resolveAdminShopRefundErrorCopy({ message: '이미 처리된 취소' })).toBe(
      ADMIN_SHOP_REFUND_ALREADY_CANCELLED_COPY.DUPLICATE_CANCEL
    );
    expect(resolveAdminShopRefundErrorCopy({ message: '네트워크 오류' })).toBeNull();
  });

  test('resolveAdminShopRefundErrorCopy prefers clinic-incomplete over already-cancelled substring', () => {
    const clinicMsg =
      '환불 Clinic 체인(회기 원복·ERP 환불·주문 REFUNDED)이 완료되지 않았습니다'
      + '(orderPublicId=x). PG가 이미 취소됐다면 동일 환불 재시도 또는 reconcile-refund로 Clinic을 맞추세요.';
    expect(resolveAdminShopRefundErrorCopy({ message: clinicMsg })).toBe(
      ADMIN_SHOP_REFUND_CLINIC_INCOMPLETE_COPY
    );
    expect(
      resolveAdminShopRefundErrorCopy({
        message: clinicMsg,
        errorCode: ADMIN_SHOP_REFUND_CLINIC_INCOMPLETE_CODE
      })
    ).toBe(ADMIN_SHOP_REFUND_CLINIC_INCOMPLETE_COPY);
    expect(
      resolveAdminShopRefundErrorCopy({
        message: 'anything',
        response: { data: { errorCode: ADMIN_SHOP_REFUND_CLINIC_INCOMPLETE_CODE } }
      })
    ).toBe(ADMIN_SHOP_REFUND_CLINIC_INCOMPLETE_COPY);
  });
});
