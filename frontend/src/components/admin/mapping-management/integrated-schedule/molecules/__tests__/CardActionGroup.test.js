/**
 * CardActionGroup — 통합 스케줄 사이드바 카드 액션 분기 단위 테스트.
 *
 * 옵션 B (예약 우선 매칭) — paymentTiming=SAME_DAY_CARD 분기 검증.
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md.
 *
 * 검증:
 *  - PENDING_PAYMENT + SAME_DAY_CARD → "당일 결제 + 활성화" 버튼 + onCheckoutSameDay 호출
 *  - PENDING_PAYMENT + ADVANCE → 기존 "결제 확인" 버튼 + onPayment 호출
 *  - PAYMENT_CONFIRMED → "입금 확인" 버튼
 *  - DEPOSIT_PENDING → "승인" 버튼
 *  - 일정 등록 onScheduleFromCard 콜백
 *
 * @author MindGarden
 * @since 2026-05-28
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key) => key }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('../../../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, 'aria-label': ariaLabel, disabled }) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel} disabled={disabled}>
      {children}
    </button>
  )
}));

jest.mock('../../../../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'mg-erp-mock-btn',
  ERP_MG_BUTTON_LOADING_TEXT: 'loading...'
}));

jest.mock('../../../../../common', () => ({
  __esModule: true,
  CardActionGroup: ({ children }) => <div data-testid="common-card-actions">{children}</div>
}));

import CardActionGroup from '../CardActionGroup';

const ADVANCE = {
  id: 11,
  status: 'PENDING_PAYMENT',
  paymentTiming: 'ADVANCE',
  consultantId: 22,
  packageName: 'pkg'
};

const SAME_DAY_CARD = {
  id: 12,
  status: 'PENDING_PAYMENT',
  paymentTiming: 'SAME_DAY_CARD',
  consultantId: 23,
  packageName: 'pkg'
};

describe('CardActionGroup — 옵션 B SAME_DAY_CARD 분기', () => {
  test('PENDING_PAYMENT + SAME_DAY_CARD → "당일 결제 + 활성화" 버튼 렌더 + 클릭 시 onCheckoutSameDay 호출', () => {
    const onCheckoutSameDay = jest.fn();
    const onPayment = jest.fn();
    render(
      <CardActionGroup
        mapping={SAME_DAY_CARD}
        onPayment={onPayment}
        onCheckoutSameDay={onCheckoutSameDay}
      />
    );
    const checkoutBtn = screen.getByLabelText('admin:mapping.card.actions.checkoutSameDayPayment');
    expect(checkoutBtn).toBeInTheDocument();
    // 결제 확인 버튼은 노출되지 않아야 함
    expect(screen.queryByLabelText('admin.actions.paymentConfirm')).toBeNull();

    fireEvent.click(checkoutBtn);
    expect(onCheckoutSameDay).toHaveBeenCalledTimes(1);
    expect(onCheckoutSameDay).toHaveBeenCalledWith(SAME_DAY_CARD);
    expect(onPayment).not.toHaveBeenCalled();
  });

  test('PENDING_PAYMENT + ADVANCE → 기존 "결제 확인" 버튼 + onPayment 호출', () => {
    const onCheckoutSameDay = jest.fn();
    const onPayment = jest.fn();
    render(
      <CardActionGroup
        mapping={ADVANCE}
        onPayment={onPayment}
        onCheckoutSameDay={onCheckoutSameDay}
      />
    );
    const paymentBtn = screen.getByLabelText('admin.actions.paymentConfirm');
    expect(paymentBtn).toBeInTheDocument();
    // 당일 결제 + 활성화 버튼은 노출되지 않아야 함
    expect(screen.queryByLabelText('admin:mapping.card.actions.checkoutSameDayPayment')).toBeNull();

    fireEvent.click(paymentBtn);
    expect(onPayment).toHaveBeenCalledTimes(1);
    expect(onPayment).toHaveBeenCalledWith(ADVANCE);
    expect(onCheckoutSameDay).not.toHaveBeenCalled();
  });

  test('paymentTiming 미지정(PENDING_PAYMENT, 레거시) → 기존 "결제 확인" 흐름 유지', () => {
    const onCheckoutSameDay = jest.fn();
    const onPayment = jest.fn();
    render(
      <CardActionGroup
        mapping={{ id: 13, status: 'PENDING_PAYMENT', consultantId: 1, packageName: 'p' }}
        onPayment={onPayment}
        onCheckoutSameDay={onCheckoutSameDay}
      />
    );
    expect(screen.getByLabelText('admin.actions.paymentConfirm')).toBeInTheDocument();
    expect(screen.queryByLabelText('admin:mapping.card.actions.checkoutSameDayPayment')).toBeNull();
  });

  test('PAYMENT_CONFIRMED → "입금 확인" 버튼', () => {
    const onDeposit = jest.fn();
    render(
      <CardActionGroup
        mapping={{ id: 14, status: 'PAYMENT_CONFIRMED' }}
        onDeposit={onDeposit}
      />
    );
    const depositBtn = screen.getByLabelText('입금 확인');
    expect(depositBtn).toBeInTheDocument();
    fireEvent.click(depositBtn);
    expect(onDeposit).toHaveBeenCalled();
  });

  test('DEPOSIT_PENDING → "승인" 버튼 + onApprove(id) 호출', () => {
    const onApprove = jest.fn();
    render(
      <CardActionGroup
        mapping={{ id: 15, status: 'DEPOSIT_PENDING' }}
        onApprove={onApprove}
      />
    );
    const approveBtn = screen.getByLabelText('승인');
    expect(approveBtn).toBeInTheDocument();
    fireEvent.click(approveBtn);
    expect(onApprove).toHaveBeenCalledWith(15);
  });

  test('onScheduleFromCard 제공 시 "일정 등록" 버튼 렌더 + 클릭 콜백', () => {
    const onScheduleFromCard = jest.fn();
    render(
      <CardActionGroup
        mapping={{ id: 16, status: 'ACTIVE' }}
        onScheduleFromCard={onScheduleFromCard}
      />
    );
    const scheduleBtn = screen.getByLabelText('일정 등록');
    expect(scheduleBtn).toBeInTheDocument();
    fireEvent.click(scheduleBtn);
    expect(onScheduleFromCard).toHaveBeenCalled();
  });

  test('mapping 없으면 액션 버튼 없음 (안전)', () => {
    render(
      <CardActionGroup mapping={null} onPayment={jest.fn()} onCheckoutSameDay={jest.fn()} />
    );
    expect(screen.queryByLabelText('admin.actions.paymentConfirm')).toBeNull();
    expect(screen.queryByLabelText('admin:mapping.card.actions.checkoutSameDayPayment')).toBeNull();
  });
});
