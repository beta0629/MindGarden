/**
 * CardActionGroup — 통합 스케줄 사이드바 카드 액션 분기 단위 테스트.
 *
 * 옵션 B (예약 우선 매칭) — paymentTiming=SAME_DAY_CARD 분기 검증.
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md.
 *
 * 검증:
 *  - PENDING_PAYMENT + SAME_DAY_CARD → "당일 결제" 버튼 + onCheckoutSameDay 호출
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

jest.mock('../../../../../common/ActionBar', () => ({
  __esModule: true,
  default: ({ children, className }) => (
    <div data-testid="action-bar" className={className}>{children}</div>
  )
}));

jest.mock('../../../../../common/ActionBarButton', () => ({
  __esModule: true,
  default: ({ children, onClick, 'aria-label': ariaLabel, disabled, loading, 'data-testid': testId, className }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-testid={testId}
      className={className}
    >
      {children}
    </button>
  )
}));

jest.mock('../../../../../common', () => ({
  __esModule: true,
  CardActionGroup: ({ children }) => <div data-testid="common-card-actions">{children}</div>
}));

import CardActionGroup from '../CardActionGroup';
import { mergeUnpaidSoftMappings } from '../../../../../../utils/pendingPaymentAggregation';

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
  test('PENDING_PAYMENT + SAME_DAY_CARD → "당일 결제" 버튼 렌더 + 클릭 시 onCheckoutSameDay 호출', () => {
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

  test('가예약 + 예약 확정 + 입금 미확인 + 잔여 0 → 당일 결제(입금 확인 원샷) 표시', () => {
    const onCheckoutSameDay = jest.fn();
    const mapping = {
      id: 80,
      status: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      paymentTiming: 'SAME_DAY_CARD',
      depositConfirmed: false,
      totalSessions: 1,
      usedSessions: 0,
      remainingSessions: 0,
      consultationSchedules: [{ id: 1, status: 'CONFIRMED' }]
    };
    render(
      <CardActionGroup
        mapping={mapping}
        onCheckoutSameDay={onCheckoutSameDay}
        onDeposit={jest.fn()}
        onScheduleFromCard={jest.fn()}
        onChangePendingPackage={jest.fn()}
        onCancelPendingMapping={jest.fn()}
      />
    );
    const checkoutBtn = screen.getByLabelText('admin:mapping.card.actions.checkoutSameDayPayment');
    expect(checkoutBtn).toBeInTheDocument();
    fireEvent.click(checkoutBtn);
    expect(onCheckoutSameDay).toHaveBeenCalledWith(mapping);
    expect(screen.getByLabelText('일정 등록')).toBeInTheDocument();
    expect(screen.getByLabelText('admin:mapping.card.actions.changePackage')).toBeInTheDocument();
    expect(screen.getByLabelText('admin:mapping.card.actions.cancel')).toBeInTheDocument();
  });

  test('unpaid soft merge 후(ACTIVE page row → PENDING_PAYMENT) 당일 결제 CTA · 회기남음 액션 세트 아님', () => {
    const base = [{
      id: 279,
      status: 'ACTIVE',
      clientName: 'SoftUnpaidClient',
      remainingSessions: 1,
      consultantName: 'c',
      packageName: 'pkg',
      usedSessions: 0,
      totalSessions: 1,
      paymentTiming: 'SAME_DAY_CARD',
      hasConsultationSchedule: true,
      nextConsultationDate: '2026-09-20',
      createdAt: '2026-09-01',
      consultantId: 1,
      clientId: 2
    }];
    const pending = {
      mappings: [{
        id: 279,
        status: 'PENDING_PAYMENT',
        clientName: 'SoftUnpaidClient',
        paymentTiming: 'SAME_DAY_CARD',
        remainingSessions: 1
      }]
    };
    const [merged] = mergeUnpaidSoftMappings(base, pending);
    expect(merged.status).toBe('PENDING_PAYMENT');

    const onCheckoutSameDay = jest.fn();
    const onSessionExtension = jest.fn();
    const onSessionSuccession = jest.fn();
    const onPackagePaymentHistory = jest.fn();
    render(
      <CardActionGroup
        mapping={merged}
        onScheduleFromCard={jest.fn()}
        onCheckoutSameDay={onCheckoutSameDay}
        onSessionExtension={onSessionExtension}
        onSessionSuccession={onSessionSuccession}
        onPackagePaymentHistory={onPackagePaymentHistory}
        onCancelPendingMapping={jest.fn()}
      />
    );

    expect(screen.getByLabelText('admin:mapping.card.actions.checkoutSameDayPayment')).toBeInTheDocument();
    expect(screen.getByLabelText('일정 등록')).toBeInTheDocument();
    expect(screen.queryByLabelText('회기 추가')).toBeNull();
    expect(screen.queryByLabelText('회기 승계')).toBeNull();
    expect(screen.queryByLabelText('패키지내역')).toBeNull();
    expect(screen.queryByTestId(/mapping-package-payment-history/)).toBeNull();
    expect(screen.queryByTestId(/mapping-session-succession/)).toBeNull();
  });

  test('PENDING_PAYMENT + ADVANCE → "입금 확인 후 활성화" + onCheckoutSameDay 호출', () => {
    const onCheckoutSameDay = jest.fn();
    const onPayment = jest.fn();
    render(
      <CardActionGroup
        mapping={ADVANCE}
        onPayment={onPayment}
        onCheckoutSameDay={onCheckoutSameDay}
      />
    );
    const confirmBtn = screen.getByLabelText('admin:mapping.card.actions.confirmAndActivate');
    expect(confirmBtn).toBeInTheDocument();
    // 당일 결제 / stepwise 결제 확인은 노출되지 않아야 함
    expect(screen.queryByLabelText('admin:mapping.card.actions.checkoutSameDayPayment')).toBeNull();
    expect(screen.queryByLabelText('admin.actions.paymentConfirm')).toBeNull();

    fireEvent.click(confirmBtn);
    expect(onCheckoutSameDay).toHaveBeenCalledTimes(1);
    expect(onCheckoutSameDay).toHaveBeenCalledWith(ADVANCE);
    expect(onPayment).not.toHaveBeenCalled();
  });

  test('paymentTiming 미지정(PENDING_PAYMENT, 레거시) + onCheckoutSameDay → confirmAndActivate', () => {
    const onCheckoutSameDay = jest.fn();
    const onPayment = jest.fn();
    render(
      <CardActionGroup
        mapping={{ id: 13, status: 'PENDING_PAYMENT', consultantId: 1, packageName: 'p' }}
        onPayment={onPayment}
        onCheckoutSameDay={onCheckoutSameDay}
      />
    );
    expect(screen.getByLabelText('admin:mapping.card.actions.confirmAndActivate')).toBeInTheDocument();
    expect(screen.queryByLabelText('admin:mapping.card.actions.checkoutSameDayPayment')).toBeNull();
    expect(screen.queryByLabelText('admin.actions.paymentConfirm')).toBeNull();
  });

  test('PENDING_PAYMENT + onPayment만(onCheckoutSameDay 없음) → stepwise "결제 확인"', () => {
    const onPayment = jest.fn();
    render(
      <CardActionGroup
        mapping={ADVANCE}
        onPayment={onPayment}
      />
    );
    const paymentBtn = screen.getByLabelText('admin.actions.paymentConfirm');
    expect(paymentBtn).toBeInTheDocument();
    fireEvent.click(paymentBtn);
    expect(onPayment).toHaveBeenCalledWith(ADVANCE);
  });

  test('PAYMENT_CONFIRMED → "입금 확인" 버튼', () => {
    const onDeposit = jest.fn();
    render(
      <CardActionGroup
        mapping={{ id: 14, status: 'PAYMENT_CONFIRMED', remainingSessions: 0, totalSessions: 1 }}
        onDeposit={onDeposit}
      />
    );
    const depositBtn = screen.getByLabelText('입금 확인');
    expect(depositBtn).toBeInTheDocument();
    fireEvent.click(depositBtn);
    expect(onDeposit).toHaveBeenCalled();
  });

  test('DEPOSIT_PENDING → "배정 활성화" 버튼 + onApprove(id) 호출', () => {
    const onApprove = jest.fn();
    render(
      <CardActionGroup
        mapping={{ id: 15, status: 'DEPOSIT_PENDING' }}
        onApprove={onApprove}
      />
    );
    const approveBtn = screen.getByLabelText('admin:mapping.card.actions.activateMapping');
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

  test('onOpenPeek 제공 시에도 face 「상세」 버튼 미렌더 (v2.1 peek via card body)', () => {
    render(
      <CardActionGroup
        mapping={{ id: 17, status: 'ACTIVE' }}
        onOpenPeek={jest.fn()}
        onScheduleFromCard={jest.fn()}
      />
    );
    expect(screen.queryByText('상세')).toBeNull();
    expect(screen.queryByTestId(/mapping-detail-peek/)).toBeNull();
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
  describe('R4 — PENDING_PAYMENT 배정 취소 보조 액션', () => {
    test('PENDING_PAYMENT + SAME_DAY_CARD + onCancelPendingMapping 제공 → "배정 취소" 텍스트 링크 노출 + 클릭 콜백', () => {
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

    test('ACTIVE 배정 → "배정 취소" 미노출 (회귀 0)', () => {
      render(
        <CardActionGroup
          mapping={{ id: 70, status: 'ACTIVE', remainingSessions: 3 }}
          onCancelPendingMapping={jest.fn()}
        />
      );
      expect(screen.queryByTestId('mapping-cancel-pending-trigger')).toBeNull();
    });

    test('TERMINATED 배정 → "배정 취소" 미노출 (이미 종료)', () => {
      render(
        <CardActionGroup
          mapping={{ id: 71, status: 'TERMINATED' }}
          onCancelPendingMapping={jest.fn()}
        />
      );
      expect(screen.queryByTestId('mapping-cancel-pending-trigger')).toBeNull();
    });

    test('PAYMENT_CONFIRMED 배정 → "배정 취소" 미노출 (입금 확인 흐름이 정식 종료 사용)', () => {
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

  describe('가계약 패키지 변경 CTA', () => {
    test('PENDING_PAYMENT + onChangePendingPackage → 패키지 변경 + 취소 동시 노출', () => {
      const onChangePendingPackage = jest.fn();
      const onCancelPendingMapping = jest.fn();
      render(
        <CardActionGroup
          mapping={SAME_DAY_CARD}
          onCheckoutSameDay={jest.fn()}
          onChangePendingPackage={onChangePendingPackage}
          onCancelPendingMapping={onCancelPendingMapping}
        />
      );
      const changeBtn = screen.getByTestId('mapping-pending-package-edit-trigger');
      expect(changeBtn).toBeInTheDocument();
      expect(changeBtn).toHaveAttribute('aria-label', 'admin:mapping.card.actions.changePackage');
      expect(screen.getByTestId('mapping-cancel-pending-trigger')).toBeInTheDocument();
      fireEvent.click(changeBtn);
      expect(onChangePendingPackage).toHaveBeenCalledTimes(1);
      expect(onChangePendingPackage).toHaveBeenCalledWith(SAME_DAY_CARD);
    });

    test('ACTIVE / TERMINATED / SESSIONS_EXHAUSTED → 패키지 변경 미노출', () => {
      ['ACTIVE', 'TERMINATED', 'SESSIONS_EXHAUSTED', 'CANCELLED'].forEach((status) => {
        const { unmount } = render(
          <CardActionGroup
            mapping={{ id: 90, status }}
            onChangePendingPackage={jest.fn()}
            onCancelPendingMapping={jest.fn()}
          />
        );
        expect(screen.queryByTestId('mapping-pending-package-edit-trigger')).toBeNull();
        unmount();
      });
    });

    test('onChangePendingPackage 미제공 → PENDING 이라도 패키지 변경 렌더 0', () => {
      render(
        <CardActionGroup
          mapping={ADVANCE}
          onPayment={jest.fn()}
          onCancelPendingMapping={jest.fn()}
        />
      );
      expect(screen.queryByTestId('mapping-pending-package-edit-trigger')).toBeNull();
    });
  });

  describe('desync Danger CTA', () => {
    test('TERMINATED + nextConsultationDate → 일정 정리 CTA', () => {
      const onDesyncAction = jest.fn();
      render(
        <CardActionGroup
          mapping={{
            id: 99,
            status: 'TERMINATED',
            nextConsultationDate: '2026-07-22',
            remainingSessions: 0
          }}
          onDesyncAction={onDesyncAction}
        />
      );
      fireEvent.click(screen.getByTestId('mapping-desync-cleanup-99'));
      expect(onDesyncAction).toHaveBeenCalledTimes(1);
      expect(onDesyncAction.mock.calls[0][0].id).toBe(99);
      expect(onDesyncAction.mock.calls[0][1].kind).toBe('desync-cleanup');
    });

    test('ACTIVE + remaining 0 → 완료 처리 CTA', () => {
      const onDesyncAction = jest.fn();
      render(
        <CardActionGroup
          mapping={{
            id: 88,
            status: 'ACTIVE',
            remainingSessions: 0
          }}
          onDesyncAction={onDesyncAction}
        />
      );
      fireEvent.click(screen.getByTestId('mapping-desync-complete-88'));
      expect(onDesyncAction).toHaveBeenCalledTimes(1);
      expect(onDesyncAction.mock.calls[0][1].kind).toBe('desync-status');
    });

    test('SESSIONS_EXHAUSTED + nextDate → Danger CTA 없음', () => {
      render(
        <CardActionGroup
          mapping={{
            id: 77,
            status: 'SESSIONS_EXHAUSTED',
            remainingSessions: 0,
            nextConsultationDate: '2026-07-20'
          }}
          onDesyncAction={jest.fn()}
        />
      );
      expect(screen.queryByTestId('mapping-desync-cleanup-77')).toBeNull();
      expect(screen.queryByTestId('mapping-desync-complete-77')).toBeNull();
    });
  });

  describe('회기 승계 CTA', () => {
    test('ACTIVE + remaining > 0 + onSessionSuccession → 회기 승계 버튼', () => {
      const onSessionSuccession = jest.fn();
      render(
        <CardActionGroup
          mapping={{ id: 55, status: 'ACTIVE', remainingSessions: 3 }}
          onSessionSuccession={onSessionSuccession}
        />
      );
      fireEvent.click(screen.getByTestId('mapping-session-succession-55'));
      expect(onSessionSuccession).toHaveBeenCalledTimes(1);
      expect(onSessionSuccession.mock.calls[0][0].id).toBe(55);
    });

    test('ACTIVE + remaining 0 → 회기 승계 미노출', () => {
      render(
        <CardActionGroup
          mapping={{ id: 56, status: 'ACTIVE', remainingSessions: 0 }}
          onSessionSuccession={jest.fn()}
        />
      );
      expect(screen.queryByTestId('mapping-session-succession-56')).toBeNull();
    });

    test('CANCELLED + remaining > 0 + onSessionSuccession → 회기 승계 버튼', () => {
      const onSessionSuccession = jest.fn();
      render(
        <CardActionGroup
          mapping={{ id: 227, status: 'CANCELLED', remainingSessions: 5 }}
          onSessionSuccession={onSessionSuccession}
          onScheduleFromCard={jest.fn()}
        />
      );
      expect(screen.getByLabelText('일정 등록')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('mapping-session-succession-227'));
      expect(onSessionSuccession).toHaveBeenCalledTimes(1);
    });

    test('CANCELLED + remaining 0 → 회기 승계·일정 등록 없음(콜백 미전달)', () => {
      render(
        <CardActionGroup
          mapping={{ id: 228, status: 'CANCELLED', remainingSessions: 0 }}
          onSessionSuccession={jest.fn()}
        />
      );
      expect(screen.queryByTestId('mapping-session-succession-228')).toBeNull();
      expect(screen.queryByLabelText('일정 등록')).toBeNull();
    });
  });
});
