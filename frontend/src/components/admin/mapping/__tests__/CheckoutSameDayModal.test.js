/**
 * CheckoutSameDayModal — 옵션 B (예약 우선 매칭) 당일 카드 결제 모달 단위 테스트.
 *
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md.
 *
 * 검증:
 *  - 라디오 버튼 3종(신용카드/체크카드/기타) 렌더 + 선택 변경
 *  - 결제 금액·승인번호 미입력 시 에러 알림 + API 호출 없음
 *  - 정상 입력 시 StandardizedApi.post가 정확한 엔드포인트와 페이로드로 호출
 *  - 성공 시 onCheckoutCompleted 콜백 호출
 *
 * @author MindGarden
 * @since 2026-05-28
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

jest.mock('react-i18next', () => {
  const stableT = (key) => key;
  return {
    __esModule: true,
    useTranslation: () => ({ t: stableT }),
    initReactI18next: { type: '3rdParty', init: jest.fn() }
  };
});

jest.mock('../../../../utils/ajax', () => ({
  __esModule: true,
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn()
}));

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn().mockResolvedValue({ success: true, data: { id: 1001, status: 'ACTIVE' } }),
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

jest.mock('../../../../contexts/SessionContext', () => ({
  __esModule: true,
  SessionContext: { Provider: ({ children }) => children },
  useSession: () => ({ user: { id: 1 }, sessionInfo: {}, isLoggedIn: true })
}));

import CheckoutSameDayModal from '../CheckoutSameDayModal';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';

const mockStandardizedApi = StandardizedApi;
const mockNotificationManager = notificationManager;

// P0 핫픽스 2026-05-28: 모달이 진입 가드(consultantId/packageName 필수)를 체크하므로
// 정상 시나리오 테스트는 consultantId 도 함께 전달한다.
const baseMapping = {
  id: 1001,
  consultantId: 2002,
  packageName: 'test-package',
  packagePrice: 500000
};

describe('CheckoutSameDayModal — 옵션 B 당일 카드 결제 모달', () => {
  beforeEach(() => {
    mockStandardizedApi.post.mockClear();
    mockStandardizedApi.post.mockResolvedValue({ success: true, data: { id: 1001, status: 'ACTIVE' } });
    mockNotificationManager.success.mockClear();
    mockNotificationManager.error.mockClear();
  });

  test('isOpen=false 일 때 렌더되지 않는다', () => {
    const { container } = render(
      <CheckoutSameDayModal isOpen={false} onClose={jest.fn()} mapping={baseMapping} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('라디오 3종 렌더 + 기본값 CREDIT_CARD', () => {
    render(
      <CheckoutSameDayModal isOpen onClose={jest.fn()} mapping={baseMapping} />
    );
    const creditCard = screen.getByDisplayValue('CREDIT_CARD');
    const debitCard = screen.getByDisplayValue('DEBIT_CARD');
    const other = screen.getByDisplayValue('OTHER');
    expect(creditCard).toBeChecked();
    expect(debitCard).not.toBeChecked();
    expect(other).not.toBeChecked();
  });

  test('승인번호 비우면 submit 시 에러 + API 호출 0회', async () => {
    render(
      <CheckoutSameDayModal isOpen onClose={jest.fn()} mapping={baseMapping} onCheckoutCompleted={jest.fn()} />
    );
    // 자동 생성된 reference를 비움
    const referenceInput = screen.getByLabelText('admin:mapping.checkout.sameDay.paymentReference.label');
    fireEvent.change(referenceInput, { target: { value: '   ' } });

    const submitButton = screen.getByText('admin:mapping.checkout.sameDay.submit');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(mockStandardizedApi.post).not.toHaveBeenCalled();
    expect(mockNotificationManager.error).toHaveBeenCalled();
  });

  test('금액 0 이하 submit 시 에러 + API 호출 0회', async () => {
    render(
      <CheckoutSameDayModal isOpen onClose={jest.fn()} mapping={baseMapping} onCheckoutCompleted={jest.fn()} />
    );
    const amountInput = screen.getByLabelText('admin:mapping.checkout.sameDay.paymentAmount.label');
    fireEvent.change(amountInput, { target: { value: '0' } });

    const submitButton = screen.getByText('admin:mapping.checkout.sameDay.submit');
    await act(async () => {
      fireEvent.click(submitButton);
    });
    expect(mockStandardizedApi.post).not.toHaveBeenCalled();
    expect(mockNotificationManager.error).toHaveBeenCalled();
  });

  test('정상 입력 → API 호출 1회, 페이로드 정확, 성공 콜백', async () => {
    const onCheckoutCompleted = jest.fn();
    render(
      <CheckoutSameDayModal
        isOpen
        onClose={jest.fn()}
        mapping={baseMapping}
        onCheckoutCompleted={onCheckoutCompleted}
      />
    );

    // 라디오 변경: DEBIT_CARD
    fireEvent.click(screen.getByDisplayValue('DEBIT_CARD'));
    // 승인번호 명시
    const referenceInput = screen.getByLabelText('admin:mapping.checkout.sameDay.paymentReference.label');
    fireEvent.change(referenceInput, { target: { value: 'AUTH-OPTION-B-1' } });
    // 가예약 일정 ID 명시
    const scheduleInput = screen.getByLabelText('admin:mapping.checkout.sameDay.sameDaySession.label');
    fireEvent.change(scheduleInput, { target: { value: '777' } });

    await act(async () => {
      fireEvent.click(screen.getByText('admin:mapping.checkout.sameDay.submit'));
    });

    expect(mockStandardizedApi.post).toHaveBeenCalledTimes(1);
    const [calledPath, calledPayload] = mockStandardizedApi.post.mock.calls[0];
    expect(calledPath).toBe('/api/v1/admin/mappings/1001/checkout-same-day');
    expect(calledPayload).toEqual({
      paymentMethod: 'DEBIT_CARD',
      paymentReference: 'AUTH-OPTION-B-1',
      paymentAmount: 500000,
      sameDaySessionScheduleId: 777
    });
    expect(mockNotificationManager.success).toHaveBeenCalled();
    expect(onCheckoutCompleted).toHaveBeenCalledTimes(1);
  });

  // P0 핫픽스 2026-05-28: 진입 가드 — 매핑 정보 누락 시 결제 폼 대신 alert 박스 표시.
  describe('P0 핫픽스 — 매핑 정보 누락 진입 가드', () => {
    test('mapping.consultantId 누락 → alert 박스 표시 + 결제 폼 미렌더', () => {
      render(
        <CheckoutSameDayModal
          isOpen
          onClose={jest.fn()}
          mapping={{ id: 1001, packageName: 'test-package' /* consultantId 누락 */ }}
        />
      );
      const alertBox = screen.getByRole('alert');
      expect(alertBox).toBeInTheDocument();
      expect(alertBox.textContent).toMatch(/admin:mapping\.checkout\.sameDay\.error\.invalidMapping/);
      // 결제 폼 라디오 미렌더 확인
      expect(screen.queryByDisplayValue('CREDIT_CARD')).toBeNull();
    });

    test('mapping.packageName 누락 → alert 박스 표시 + 결제 폼 미렌더', () => {
      render(
        <CheckoutSameDayModal
          isOpen
          onClose={jest.fn()}
          mapping={{ id: 1001, consultantId: 2002 /* packageName 누락 */ }}
        />
      );
      const alertBox = screen.getByRole('alert');
      expect(alertBox).toBeInTheDocument();
      expect(screen.queryByDisplayValue('CREDIT_CARD')).toBeNull();
    });

    test('mapping.id 누락 → alert 박스 표시', () => {
      render(
        <CheckoutSameDayModal
          isOpen
          onClose={jest.fn()}
          mapping={{ consultantId: 2002, packageName: 'test-package' /* id 누락 */ }}
        />
      );
      const alertBox = screen.getByRole('alert');
      expect(alertBox).toBeInTheDocument();
    });

    test('mapping 모두 정상 → 결제 폼(라디오·승인번호 입력) 정상 표시', () => {
      render(
        <CheckoutSameDayModal isOpen onClose={jest.fn()} mapping={baseMapping} />
      );
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getByDisplayValue('CREDIT_CARD')).toBeInTheDocument();
      expect(screen.getByLabelText('admin:mapping.checkout.sameDay.paymentReference.label'))
        .toBeInTheDocument();
    });
  });
});
