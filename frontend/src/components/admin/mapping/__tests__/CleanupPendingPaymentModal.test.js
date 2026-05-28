/**
 * CleanupPendingPaymentModal — 옵션 B R4 디러티 PENDING_PAYMENT 매칭 정리 모달 단위 테스트.
 *
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md.
 *
 * 검증 (5 시나리오):
 *  - 모달 열림 (single / bulk 모드 타이틀)
 *  - 사유 미입력 검증 (10자 미만 → API 호출 0회)
 *  - 정상 single 확인 → /cleanup-pending-payment 호출
 *  - 정상 bulk 확인 → /bulk-cleanup 호출
 *  - API 에러 처리 (alert 표시 + notification.error)
 *
 * @author MindGarden
 * @since 2026-05-28
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key, opts) => {
    if (opts && typeof opts === 'object') {
      return `${key}:${Object.values(opts).join(',')}`;
    }
    return key;
  } }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn().mockResolvedValue({ success: true }),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children, actions, title }) => (
    isOpen ? (
      <div role="dialog" aria-label={title} data-testid="unified-modal-mock">
        <div data-testid="modal-title">{title}</div>
        {children}
        <div data-testid="modal-actions">{actions}</div>
      </div>
    ) : null
  )
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, type = 'button' }) => (
    <button type={type} onClick={onClick} disabled={disabled}>{children}</button>
  )
}));

jest.mock('../../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

import CleanupPendingPaymentModal from '../CleanupPendingPaymentModal';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';

const VALID_REASON = '결제 미입금 24시간 경과로 정리합니다';

const baseTarget = {
  mappingId: 7001,
  consultantName: '상담사A',
  clientName: '내담자A'
};

describe('CleanupPendingPaymentModal — 옵션 B R4 디러티 매칭 정리 모달', () => {
  beforeEach(() => {
    StandardizedApi.post.mockClear();
    StandardizedApi.post.mockResolvedValue({ success: true });
    notificationManager.success.mockClear();
    notificationManager.error.mockClear();
  });

  test('isOpen=false 면 렌더되지 않는다', () => {
    const { container } = render(
      <CleanupPendingPaymentModal
        isOpen={false}
        mode="single"
        target={baseTarget}
        onClose={jest.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('모달 열림 — single 모드는 단건 타이틀 키, bulk 모드는 일괄 타이틀 키를 사용한다', () => {
    const { rerender } = render(
      <CleanupPendingPaymentModal
        isOpen
        mode="single"
        target={baseTarget}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByTestId('modal-title').textContent)
      .toContain('admin:mappings.pendingPaymentCleanup.modal.titleSingle');

    rerender(
      <CleanupPendingPaymentModal
        isOpen
        mode="bulk"
        target={null}
        selectedIds={[1, 2, 3]}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByTestId('modal-title').textContent)
      .toContain('admin:mappings.pendingPaymentCleanup.modal.titleBulk');
  });

  test('사유 미입력 검증 — 10자 미만이면 API 호출 0회 + 에러 메시지 표시', async () => {
    render(
      <CleanupPendingPaymentModal
        isOpen
        mode="single"
        target={baseTarget}
        onClose={jest.fn()}
      />
    );
    const textarea = screen.getByLabelText('admin:mappings.pendingPaymentCleanup.modal.reason');
    fireEvent.change(textarea, { target: { value: '짧음' } });

    const confirmButton = screen.getByText('admin:mappings.pendingPaymentCleanup.modal.confirm');
    await act(async () => { fireEvent.click(confirmButton); });

    expect(StandardizedApi.post).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent)
      .toContain('admin:mappings.pendingPaymentCleanup.modal.error.reasonTooShort');
  });

  test('단건 정리 확인 — /cleanup-pending-payment 엔드포인트로 POST 호출 + onCompleted 콜백', async () => {
    const onCompleted = jest.fn();
    render(
      <CleanupPendingPaymentModal
        isOpen
        mode="single"
        target={baseTarget}
        onClose={jest.fn()}
        onCompleted={onCompleted}
      />
    );
    fireEvent.change(
      screen.getByLabelText('admin:mappings.pendingPaymentCleanup.modal.reason'),
      { target: { value: VALID_REASON } }
    );

    await act(async () => {
      fireEvent.click(screen.getByText('admin:mappings.pendingPaymentCleanup.modal.confirm'));
    });

    expect(StandardizedApi.post).toHaveBeenCalledTimes(1);
    const [calledPath, payload] = StandardizedApi.post.mock.calls[0];
    expect(calledPath).toBe('/api/v1/admin/mappings/7001/cleanup-pending-payment');
    expect(payload).toEqual({ reason: VALID_REASON, notifyClient: true });
    expect(notificationManager.success).toHaveBeenCalled();
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });

  test('일괄 정리 확인 — /bulk-cleanup 엔드포인트로 POST + mappingIds 페이로드', async () => {
    const onCompleted = jest.fn();
    render(
      <CleanupPendingPaymentModal
        isOpen
        mode="bulk"
        target={null}
        selectedIds={[100, 101, 102]}
        onClose={jest.fn()}
        onCompleted={onCompleted}
      />
    );
    fireEvent.change(
      screen.getByLabelText('admin:mappings.pendingPaymentCleanup.modal.reason'),
      { target: { value: VALID_REASON } }
    );
    fireEvent.click(
      screen.getByLabelText('admin:mappings.pendingPaymentCleanup.modal.notifyClient')
    );

    await act(async () => {
      fireEvent.click(screen.getByText('admin:mappings.pendingPaymentCleanup.modal.confirm'));
    });

    expect(StandardizedApi.post).toHaveBeenCalledTimes(1);
    const [calledPath, payload] = StandardizedApi.post.mock.calls[0];
    expect(calledPath).toBe('/api/v1/admin/mappings/pending-payment-dirty/bulk-cleanup');
    expect(payload).toEqual({
      mappingIds: [100, 101, 102],
      reason: VALID_REASON,
      notifyClient: false
    });
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });

  test('API 에러 처리 — 실패 응답 시 알림 + 모달 내 에러 메시지 표시', async () => {
    StandardizedApi.post.mockRejectedValueOnce({
      response: { data: { message: 'PENDING_PAYMENT 상태 아님' } }
    });
    render(
      <CleanupPendingPaymentModal
        isOpen
        mode="single"
        target={baseTarget}
        onClose={jest.fn()}
      />
    );
    fireEvent.change(
      screen.getByLabelText('admin:mappings.pendingPaymentCleanup.modal.reason'),
      { target: { value: VALID_REASON } }
    );

    await act(async () => {
      fireEvent.click(screen.getByText('admin:mappings.pendingPaymentCleanup.modal.confirm'));
    });

    expect(notificationManager.error).toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('PENDING_PAYMENT');
  });
});
