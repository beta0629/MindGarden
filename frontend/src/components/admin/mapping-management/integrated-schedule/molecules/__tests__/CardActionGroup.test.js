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

  /*
   * R4 (옵션 B 디러티 PENDING_PAYMENT 정리) — 사이드바 카드 "매칭 취소" 보조 액션 노출 매트릭스.
   * 합의서: docs/project-management/2026-05-28/R4_PENDING_PAYMENT_CLEANUP_UI_PLAN.md.
   * 디자이너 시안: docs/project-management/2026-05-28/R4_DESIGN_HANDOFF_DETAIL.md (옵션 A 텍스트 링크).
   */
  describe('R4 — PENDING_PAYMENT 매칭 취소 보조 액션', () => {
    test('PENDING_PAYMENT + SAME_DAY_CARD + onCancelPendingMapping 제공 → "매칭 취소" 텍스트 링크 노출 + 클릭 콜백', () => {
      const onCancelPendingMapping = jest.fn();
      render(
        <CardActionGroup
          mapping={SAME_DAY_CARD}
          onCheckoutSameDay={jest.fn()}
          onCancelPendingMapping={onCancelPendingMapping}
        />
      );
      const cancelLink = screen.getByTestId('mapping-cancel-pending-trigger');
      expect(cancelLink).toBeInTheDocument();
      expect(cancelLink).toHaveAttribute('aria-label', 'admin:mapping.card.actions.cancel');
      // 텍스트 링크는 button 으로 렌더되어 modal 트리거 역할만 수행 (실제 API 호출은 부모 핸들러에서).
      fireEvent.click(cancelLink);
      expect(onCancelPendingMapping).toHaveBeenCalledTimes(1);
      expect(onCancelPendingMapping).toHaveBeenCalledWith(SAME_DAY_CARD);
    });

    test('PENDING_PAYMENT + ADVANCE + onCancelPendingMapping 제공 → 옵션 A 잔존 정리 케이스에서도 노출', () => {
      const onCancelPendingMapping = jest.fn();
      render(
        <CardActionGroup
          mapping={ADVANCE}
          onPayment={jest.fn()}
          onCancelPendingMapping={onCancelPendingMapping}
        />
      );
      expect(screen.getByTestId('mapping-cancel-pending-trigger')).toBeInTheDocument();
    });

    test('PENDING_PAYMENT + cancelPendingProcessing=true → 링크 disabled (중복 클릭 차단)', () => {
      const onCancelPendingMapping = jest.fn();
      render(
        <CardActionGroup
          mapping={SAME_DAY_CARD}
          onCheckoutSameDay={jest.fn()}
          onCancelPendingMapping={onCancelPendingMapping}
          cancelPendingProcessing
        />
      );
      const cancelLink = screen.getByTestId('mapping-cancel-pending-trigger');
      expect(cancelLink).toBeDisabled();
      expect(cancelLink).toHaveAttribute('aria-busy', 'true');
      fireEvent.click(cancelLink);
      expect(onCancelPendingMapping).not.toHaveBeenCalled();
    });

    test('ACTIVE 매칭 → "매칭 취소" 미노출 (회귀 0)', () => {
      render(
        <CardActionGroup
          mapping={{ id: 70, status: 'ACTIVE', remainingSessions: 3 }}
          onCancelPendingMapping={jest.fn()}
        />
      );
      expect(screen.queryByTestId('mapping-cancel-pending-trigger')).toBeNull();
    });

    test('TERMINATED 매칭 → "매칭 취소" 미노출 (이미 종료)', () => {
      render(
        <CardActionGroup
          mapping={{ id: 71, status: 'TERMINATED' }}
          onCancelPendingMapping={jest.fn()}
        />
      );
      expect(screen.queryByTestId('mapping-cancel-pending-trigger')).toBeNull();
    });

    test('PAYMENT_CONFIRMED 매칭 → "매칭 취소" 미노출 (입금 확인 흐름이 정식 종료 사용)', () => {
      render(
        <CardActionGroup
          mapping={{ id: 72, status: 'PAYMENT_CONFIRMED' }}
          onDeposit={jest.fn()}
          onCancelPendingMapping={jest.fn()}
        />
      );
      expect(screen.queryByTestId('mapping-cancel-pending-trigger')).toBeNull();
    });

    test('onCancelPendingMapping 콜백 미제공 → PENDING_PAYMENT 라도 링크 렌더 0', () => {
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
