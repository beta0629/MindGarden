/**
 * 결제 행 상태 REFUND_REQUIRED 한글 라벨(환불 필요) — 관리자 주문 화면 칩.
 *
 * @author CoreSolution
 * @since 2026-09-30
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdminShopPaymentStatusChip } from '../shop/AdminShopSuiteParts';
import {
  ADMIN_PAYMENT_STATUS_LABELS,
  ADMIN_PAYMENT_STATUS_REFUND_REQUIRED,
  resolveAdminPaymentStatusLabel
} from '../../../constants/adminShopApi';

describe('AdminShopPaymentStatusChip', () => {
  it('REFUND_REQUIRED → 환불 필요 (기존 amber 칩 클래스 재사용)', () => {
    const { container } = render(
      <AdminShopPaymentStatusChip paymentStatus={ADMIN_PAYMENT_STATUS_REFUND_REQUIRED} />
    );

    expect(screen.getByText('환불 필요')).toBeInTheDocument();
    const chip = container.querySelector('.admin-shop-suite__chip');
    expect(chip).not.toBeNull();
    expect(chip.classList.contains('admin-shop-suite__chip--amber')).toBe(true);
  });

  it('라벨 없는 상태·빈 값은 렌더하지 않음', () => {
    const { container: approved } = render(<AdminShopPaymentStatusChip paymentStatus="APPROVED" />);
    const { container: empty } = render(<AdminShopPaymentStatusChip paymentStatus={null} />);

    expect(approved.firstChild).toBeNull();
    expect(empty.firstChild).toBeNull();
  });

  it('resolveAdminPaymentStatusLabel — 서버 상태값 키로만 라벨 반환', () => {
    expect(ADMIN_PAYMENT_STATUS_LABELS[ADMIN_PAYMENT_STATUS_REFUND_REQUIRED]).toBe('환불 필요');
    expect(resolveAdminPaymentStatusLabel(' refund_required ')).toBe('환불 필요');
    expect(resolveAdminPaymentStatusLabel('REFUNDED')).toBeNull();
    expect(resolveAdminPaymentStatusLabel(undefined)).toBeNull();
  });
});
