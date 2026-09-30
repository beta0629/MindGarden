/**
 * 주문 목록 상태 칸 — 장부 칩과 「환불 필요」 칩을 세로 스택으로 렌더(좁은 칸 잘림 방지).
 *
 * @author CoreSolution
 * @since 2026-09-30
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdminShopOrderStatusChips } from '../shop/AdminShopSuiteParts';
import { ADMIN_PAYMENT_STATUS_REFUND_REQUIRED } from '../../../constants/adminShopApi';
import { ADMIN_SHOP_LEDGER_STATE } from '../../../constants/adminShopSuite';

describe('AdminShopOrderStatusChips', () => {
  it('장부 칩과 환불 필요 칩을 같은 세로 스택 안에 각각 렌더', () => {
    const { container } = render(
      <AdminShopOrderStatusChips
        state={ADMIN_SHOP_LEDGER_STATE.PAID}
        paymentStatus={ADMIN_PAYMENT_STATUS_REFUND_REQUIRED}
      />
    );

    const stack = container.querySelector('.admin-shop-suite__cell-stack');
    expect(stack).not.toBeNull();
    expect(stack.classList.contains('admin-shop-suite__cell-stack--chips')).toBe(true);
    const chips = stack.querySelectorAll('.admin-shop-suite__chip');
    expect(chips).toHaveLength(2);
    expect(screen.getByText('환불 필요')).toBeInTheDocument();
    expect(chips[1].classList.contains('admin-shop-suite__chip--amber')).toBe(true);
  });

  it('결제 상태 라벨이 없으면 장부 칩만 렌더', () => {
    const { container } = render(
      <AdminShopOrderStatusChips state={ADMIN_SHOP_LEDGER_STATE.PAID} paymentStatus="APPROVED" />
    );

    expect(container.querySelectorAll('.admin-shop-suite__chip')).toHaveLength(1);
    expect(screen.queryByText('환불 필요')).toBeNull();
  });
});
