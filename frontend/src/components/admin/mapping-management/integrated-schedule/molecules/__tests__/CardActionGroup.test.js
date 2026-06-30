/**
 * CardActionGroup — 통합 스케줄 사이드바 compact row 액션 분기 단위 테스트.
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
  default: ({ children, onClick, 'aria-label': ariaLabel, disabled, loading }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled || loading}
    >
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
  EntityRowActions: ({ items }) => (
    <div data-testid="entity-row-overflow">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          data-testid={item.testId}
          aria-label={item.label}
          disabled={item.disabled}
          aria-busy={item.busy ? 'true' : undefined}
          onClick={item.onClick}
        >
          {item.label}
        </button>
      ))}
    </div>
  ),
  ENTITY_ROW_ACTIONS_LAYOUT: { TABLE: 'table', CARD: 'card', CORNER: 'corner' }
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

describe('CardActionGroup — compact row primary + overflow', () => {
  test('PENDING_PAYMENT + SAME_DAY_CARD → primary "당일 결제 + 활성화" + overflow 취소', () => {
    const onCheckoutSameDay = jest.fn();
    const onPayment = jest.fn();
    render(
      <CardActionGroup
        mapping={SAME_DAY_CARD}
        onPayment={onPayment}
        onCheckoutSameDay={onCheckoutSameDay}
        onCancelPendingMapping={jest.fn()}
      />
    );
    const checkoutBtn = screen.getByLabelText('admin:mapping.card.actions.checkoutSameDayPayment');
    expect(checkoutBtn).toBeInTheDocument();
    expect(screen.queryByLabelText('admin.actions.paymentConfirm')).toBeNull();
    expect(screen.getByTestId('mapping-cancel-pending-trigger')).toBeInTheDocument();

    fireEvent.click(checkoutBtn);
    expect(onCheckoutSameDay).toHaveBeenCalledTimes(1);
    expect(onCheckoutSameDay).toHaveBeenCalledWith(SAME_DAY_CARD);
    expect(onPayment).not.toHaveBeenCalled();
  });

  test('PENDING_PAYMENT + ADVANCE → primary "결제 확인" + overflow 취소', () => {
    const onCheckoutSameDay = jest.fn();
    const onPayment = jest.fn();
    render(
      <CardActionGroup
        mapping={ADVANCE}
        onPayment={onPayment}
        onCheckoutSameDay={onCheckoutSameDay}
        onCancelPendingMapping={jest.fn()}
      />
    );
    const paymentBtn = screen.getByLabelText('admin.actions.paymentConfirm');
    expect(paymentBtn).toBeInTheDocument();
    expect(screen.queryByLabelText('admin:mapping.card.actions.checkoutSameDayPayment')).toBeNull();
    expect(screen.getByTestId('mapping-cancel-pending-trigger')).toBeInTheDocument();

    fireEvent.click(paymentBtn);
    expect(onPayment).toHaveBeenCalledTimes(1);
    expect(onPayment).toHaveBeenCalledWith(ADVANCE);
    expect(onCheckoutSameDay).not.toHaveBeenCalled();
  });

  test('paymentTiming 미지정(PENDING_PAYMENT) → "결제 확인" primary 유지', () => {
    render(
      <CardActionGroup
        mapping={{ id: 13, status: 'PENDING_PAYMENT', consultantId: 1, packageName: 'p' }}
        onPayment={jest.fn()}
        onCheckoutSameDay={jest.fn()}
        onCancelPendingMapping={jest.fn()}
      />
    );
    expect(screen.getByLabelText('admin.actions.paymentConfirm')).toBeInTheDocument();
    expect(screen.queryByLabelText('admin:mapping.card.actions.checkoutSameDayPayment')).toBeNull();
  });

  test('PAYMENT_CONFIRMED → primary "입금 확인"', () => {
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

  test('DEPOSIT_PENDING → primary "승인" + onApprove(id)', () => {
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

  test('onScheduleFromCard → primary "일정 등록"', () => {
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

  test('ACTIVE + onSessionExtension → overflow "회기 추가"', () => {
    const onSessionExtension = jest.fn();
    render(
      <CardActionGroup
        mapping={{ id: 17, status: 'ACTIVE', remainingSessions: 3 }}
        onScheduleFromCard={jest.fn()}
        onSessionExtension={onSessionExtension}
      />
    );
    const extBtn = screen.getByLabelText('admin:sessionManagement.quickAdd.addBtn');
    expect(extBtn).toBeInTheDocument();
    fireEvent.click(extBtn);
    expect(onSessionExtension).toHaveBeenCalledWith(
      expect.objectContaining({ id: 17, status: 'ACTIVE' })
    );
  });

  test('mapping 없으면 액션 없음', () => {
    render(
      <CardActionGroup mapping={null} onPayment={jest.fn()} onCheckoutSameDay={jest.fn()} />
    );
    expect(screen.queryByLabelText('admin.actions.paymentConfirm')).toBeNull();
    expect(screen.queryByTestId('mapping-match-actions')).toBeNull();
  });

  describe('PENDING_PAYMENT 매칭 취소 overflow', () => {
    test('SAME_DAY_CARD + onCancelPendingMapping → overflow 취소 클릭 콜백', () => {
      const onCancelPendingMapping = jest.fn();
      render(
        <CardActionGroup
          mapping={SAME_DAY_CARD}
          onCheckoutSameDay={jest.fn()}
          onCancelPendingMapping={onCancelPendingMapping}
        />
      );
      const cancelBtn = screen.getByTestId('mapping-cancel-pending-trigger');
      expect(cancelBtn).toHaveAttribute('aria-label', 'admin:mapping.card.actions.cancel');
      fireEvent.click(cancelBtn);
      expect(onCancelPendingMapping).toHaveBeenCalledTimes(1);
      expect(onCancelPendingMapping).toHaveBeenCalledWith(SAME_DAY_CARD);
    });

    test('cancelPendingProcessing → overflow 취소 disabled', () => {
      render(
        <CardActionGroup
          mapping={SAME_DAY_CARD}
          onCheckoutSameDay={jest.fn()}
          onCancelPendingMapping={jest.fn()}
          cancelPendingProcessing
        />
      );
      const cancelBtn = screen.getByTestId('mapping-cancel-pending-trigger');
      expect(cancelBtn).toBeDisabled();
      expect(cancelBtn).toHaveAttribute('aria-busy', 'true');
    });

    test('ACTIVE → overflow 취소 미노출', () => {
      render(
        <CardActionGroup
          mapping={{ id: 70, status: 'ACTIVE', remainingSessions: 3 }}
          onCancelPendingMapping={jest.fn()}
        />
      );
      expect(screen.queryByTestId('mapping-cancel-pending-trigger')).toBeNull();
    });

    test('onCancelPendingMapping 미제공 → overflow 취소 미노출', () => {
      render(
        <CardActionGroup
          mapping={SAME_DAY_CARD}
          onCheckoutSameDay={jest.fn()}
        />
      );
      expect(screen.queryByTestId('mapping-cancel-pending-trigger')).toBeNull();
    });
  });
});
