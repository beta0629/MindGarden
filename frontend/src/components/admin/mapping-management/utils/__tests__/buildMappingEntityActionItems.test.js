/**
 * buildMappingEntityActionItems — overflow items 단위 테스트
 */

import { buildMappingEntityActionItems } from '../buildMappingEntityActionItems';

const t = (key) => {
  const labels = {
    'admin.actions.paymentConfirm': '결제 확인',
    'common.actions.edit': '수정',
    'admin:mapping.card.actions.checkoutSameDayPayment': '당일 결제 + 활성화',
    'admin:mapping.card.actions.cancel': '매칭 취소'
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

  it('includes payment confirm for pending payment status', () => {
    const onPayment = jest.fn();

    const items = buildMappingEntityActionItems({
      mapping: { ...baseMapping, status: 'PENDING_PAYMENT' },
      t,
      onPayment,
      onEdit: jest.fn()
    });

    expect(items[0]).toMatchObject({ id: 'payment', label: '결제 확인' });
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
});
