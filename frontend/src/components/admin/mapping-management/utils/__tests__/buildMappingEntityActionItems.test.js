/**
 * buildMappingEntityActionItems — overflow items 단위 테스트
 */

import {
  buildMappingEntityActionItems,
  splitMappingActionItems
} from '../buildMappingEntityActionItems';

const t = (key) => {
  const labels = {
    'admin.actions.paymentConfirm': '결제 확인',
    'common.actions.edit': '수정',
    'admin:mapping.card.actions.checkoutSameDayPayment': '당일 결제 + 활성화',
    'admin:mapping.card.actions.confirmAndActivate': '입금 확인 후 활성화',
    'admin:mapping.card.actions.activateMapping': '배정 활성화',
    'admin:mapping.card.actions.cancel': '배정 취소',
    'admin:mapping.card.actions.changePackage': '패키지 변경'
  };
  return labels[key] || key;
};

describe('buildMappingEntityActionItems', () => {
  const baseMapping = {
    id: 1,
    status: 'ACTIVE',
    clientName: '테스트 내담자'
  };

  it('returns edit and refund items for active mapping', () => {
    const onEdit = jest.fn();
    const onRefund = jest.fn();

    const items = buildMappingEntityActionItems({
      mapping: baseMapping,
      t,
      onView: jest.fn(),
      onEdit,
      onRefund
    });

    expect(items.map((item) => item.id)).toEqual(['detail', 'edit', 'refund']);
    expect(items.find((item) => item.id === 'refund').variant).toBe('destructive');
  });

  it('PENDING_PAYMENT + onCheckoutSameDay (ADVANCE) → confirm-and-activate primary', () => {
    const onCheckoutSameDay = jest.fn();

    const items = buildMappingEntityActionItems({
      mapping: { ...baseMapping, status: 'PENDING_PAYMENT', paymentTiming: 'ADVANCE' },
      t,
      onCheckoutSameDay,
      onPayment: jest.fn(),
      onEdit: jest.fn()
    });

    expect(items[0]).toMatchObject({ id: 'confirm-and-activate', label: '입금 확인 후 활성화' });
    expect(items.find((item) => item.id === 'payment')).toBeUndefined();
  });

  it('PENDING_PAYMENT + SAME_DAY_CARD → checkout-same-day primary', () => {
    const onCheckoutSameDay = jest.fn();

    const items = buildMappingEntityActionItems({
      mapping: { ...baseMapping, status: 'PENDING_PAYMENT', paymentTiming: 'SAME_DAY_CARD' },
      t,
      onCheckoutSameDay
    });

    expect(items[0]).toMatchObject({ id: 'checkout-same-day', label: '당일 결제 + 활성화' });
  });

  it('includes payment confirm escape when only onPayment (no one-shot callback)', () => {
    const onPayment = jest.fn();

    const items = buildMappingEntityActionItems({
      mapping: { ...baseMapping, status: 'PENDING_PAYMENT' },
      t,
      onPayment,
      onEdit: jest.fn()
    });

    expect(items[0]).toMatchObject({ id: 'payment', label: '결제 확인' });
  });

  it('PENDING_PAYMENT shows changePackage + cancel, hides generic edit', () => {
    const onChangePendingPackage = jest.fn();
    const onCancelPendingMapping = jest.fn();
    const onEdit = jest.fn();

    const items = buildMappingEntityActionItems({
      mapping: { ...baseMapping, status: 'PENDING_PAYMENT' },
      t,
      onCheckoutSameDay: jest.fn(),
      onChangePendingPackage,
      onCancelPendingMapping,
      onEdit,
      onView: jest.fn()
    });

    expect(items.map((item) => item.id)).toEqual([
      'confirm-and-activate',
      'change-pending-package',
      'cancel-pending',
      'detail'
    ]);
    expect(items.find((item) => item.id === 'change-pending-package')).toMatchObject({
      label: '패키지 변경'
    });
    expect(items.find((item) => item.id === 'edit')).toBeUndefined();
  });

  it('hides changePackage and cancel for ACTIVE / TERMINATED / SESSIONS_EXHAUSTED', () => {
    ['ACTIVE', 'TERMINATED', 'CANCELLED', 'SESSIONS_EXHAUSTED'].forEach((status) => {
      const items = buildMappingEntityActionItems({
        mapping: { ...baseMapping, status },
        t,
        onChangePendingPackage: jest.fn(),
        onCancelPendingMapping: jest.fn(),
        onEdit: jest.fn()
      });
      expect(items.find((item) => item.id === 'change-pending-package')).toBeUndefined();
      expect(items.find((item) => item.id === 'cancel-pending')).toBeUndefined();
    });
  });

  it('DEPOSIT_PENDING primary is activateMapping', () => {
    const items = buildMappingEntityActionItems({
      mapping: { ...baseMapping, status: 'DEPOSIT_PENDING' },
      t,
      onApprove: jest.fn()
    });

    expect(items[0]).toMatchObject({ id: 'approve', label: '배정 활성화' });
  });

  it('places refund last as destructive', () => {
    const items = buildMappingEntityActionItems({
      mapping: { ...baseMapping, status: 'PAYMENT_CONFIRMED' },
      t,
      onDeposit: jest.fn(),
      onEdit: jest.fn(),
      onRefund: jest.fn()
    });

    expect(items[items.length - 1]).toMatchObject({ id: 'refund', variant: 'destructive' });
  });

  it('splitMappingActionItems extracts workflow primary and keeps rest in overflow', () => {
    const items = buildMappingEntityActionItems({
      mapping: { ...baseMapping, status: 'PENDING_PAYMENT' },
      t,
      onCheckoutSameDay: jest.fn(),
      onChangePendingPackage: jest.fn(),
      onCancelPendingMapping: jest.fn(),
      onView: jest.fn(),
      onEdit: jest.fn()
    });

    const { primaryAction, overflowItems } = splitMappingActionItems(items);

    expect(primaryAction).toMatchObject({ label: '입금 확인 후 활성화' });
    expect(overflowItems.map((item) => item.id)).toEqual([
      'change-pending-package',
      'cancel-pending',
      'detail'
    ]);
  });

  it('splitMappingActionItems returns null primary when no workflow action', () => {
    const items = buildMappingEntityActionItems({
      mapping: baseMapping,
      t,
      onView: jest.fn(),
      onEdit: jest.fn()
    });

    const { primaryAction, overflowItems } = splitMappingActionItems(items);

    expect(primaryAction).toBeNull();
    expect(overflowItems.map((item) => item.id)).toEqual(['detail', 'edit']);
  });
});
