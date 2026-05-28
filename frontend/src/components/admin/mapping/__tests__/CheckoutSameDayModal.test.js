/**
 * CheckoutSameDayModal — 옵션 B (예약 우선 매칭) 당일 카드 결제 모달 단위 테스트.
 *
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md.
 * 후속 UX 개선 (2026-05-28): feature/checkout-same-day-modal-ux-improvement-2026-05-28
 *
 * 검증:
 *  - 라디오 버튼 3종(신용카드/체크카드/기타) 렌더 + 선택 변경
 *  - 결제 금액·승인번호 미입력 시 에러 알림 + API 호출 없음
 *  - 정상 입력 시 StandardizedApi.post가 정확한 엔드포인트와 페이로드로 호출
 *  - 성공 시 onCheckoutCompleted 콜백 호출
 *  - 헤더 subtitle 에 consultantName/clientName/packageName/totalSessions 표시
 *  - 가예약 일정 드롭다운 (0건 / N건)
 *  - 결제 승인번호 자동 재생성 버튼
 *  - 결제 금액 콤마 표시 + 음수/문자 입력 차단
 *  - 결제 완료 후 success 알림 표시
 *
 * @author MindGarden
 * @since 2026-05-28
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

jest.mock('react-i18next', () => {
  // 변수가 있는 경우 key 와 변수값을 함께 노출하여 테스트에서 substring 검증이 가능하도록 한다.
  const stableT = (key, optsOrDefault) => {
    if (typeof optsOrDefault === 'string') {
      return optsOrDefault;
    }
    if (optsOrDefault && typeof optsOrDefault === 'object') {
      const parts = Object.entries(optsOrDefault)
        .map(([k, v]) => `${k}=${v}`)
        .join(' ');
      return parts ? `${key}|${parts}` : key;
    }
    return key;
  };
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
    post: jest.fn(),
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
  default: ({ isOpen, children, actions, title, subtitle }) => (
    isOpen ? (
      <div role="dialog" aria-label={title} data-testid="unified-modal-mock">
        <div data-testid="unified-modal-subtitle">{subtitle}</div>
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
// 정상 시나리오 테스트는 consultantId/clientId/패키지 정보를 모두 함께 전달한다.
const baseMapping = {
  id: 1001,
  consultantId: 2002,
  consultantName: '김상담사',
  clientId: 3003,
  clientName: '박내담자',
  packageName: '기본 10회기 패키지',
  packagePrice: 800000,
  totalSessions: 10
};

// 미세 마이크로태스크 큐를 비우는 헬퍼 (jsdom 환경에서 동작).
// setImmediate 가 없는 환경(JSDOM 30+)을 위해 microtask 와 macrotask 를 순차 처리한다.
const flushPromises = () => new Promise((resolve) => {
  Promise.resolve().then(() => Promise.resolve().then(() => resolve()));
});

describe('CheckoutSameDayModal — 옵션 B 당일 카드 결제 모달', () => {
  beforeEach(() => {
    jest.useRealTimers();
    mockStandardizedApi.post.mockReset();
    mockStandardizedApi.post.mockResolvedValue({
      success: true,
      data: { id: 1001, status: 'ACTIVE', totalSessions: 10, remainingSessions: 9 }
    });
    mockStandardizedApi.get.mockReset();
    mockStandardizedApi.get.mockResolvedValue({
      success: true,
      data: { schedules: [], count: 0 }
    });
    mockNotificationManager.success.mockClear();
    mockNotificationManager.error.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('isOpen=false 일 때 렌더되지 않는다', () => {
    const { container } = render(
      <CheckoutSameDayModal isOpen={false} onClose={jest.fn()} mapping={baseMapping} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('라디오 3종 렌더 + 기본값 CREDIT_CARD', async () => {
    await act(async () => {
      render(
        <CheckoutSameDayModal isOpen onClose={jest.fn()} mapping={baseMapping} />
      );
      await flushPromises();
    });
    const creditCard = screen.getByDisplayValue('CREDIT_CARD');
    const debitCard = screen.getByDisplayValue('DEBIT_CARD');
    const other = screen.getByDisplayValue('OTHER');
    expect(creditCard).toBeChecked();
    expect(debitCard).not.toBeChecked();
    expect(other).not.toBeChecked();
  });

  test('subtitle 에 consultantName / clientName / packageName / totalSessions 모두 표시', async () => {
    await act(async () => {
      render(
        <CheckoutSameDayModal isOpen onClose={jest.fn()} mapping={baseMapping} />
      );
      await flushPromises();
    });
    const subtitle = screen.getByTestId('unified-modal-subtitle');
    expect(subtitle.textContent).toContain('김상담사');
    expect(subtitle.textContent).toContain('박내담자');
    expect(subtitle.textContent).toContain('기본 10회기 패키지');
    expect(subtitle.textContent).toContain('10');
  });

  test('승인번호 비우면 submit 시 에러 + API 호출 0회', async () => {
    await act(async () => {
      render(
        <CheckoutSameDayModal isOpen onClose={jest.fn()} mapping={baseMapping} onCheckoutCompleted={jest.fn()} />
      );
      await flushPromises();
    });
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
    await act(async () => {
      render(
        <CheckoutSameDayModal isOpen onClose={jest.fn()} mapping={baseMapping} onCheckoutCompleted={jest.fn()} />
      );
      await flushPromises();
    });
    const amountInput = screen.getByTestId('checkout-amount-input');
    // 0 입력 → 콤마 포맷 후 표시값은 빈 문자열이 되며 내부값은 ''.
    fireEvent.change(amountInput, { target: { value: '0' } });
    // 직접 입력으로 ''에 진입하기 어려우므로 의도적으로 빈 값으로 변경.
    fireEvent.change(amountInput, { target: { value: '' } });

    const submitButton = screen.getByText('admin:mapping.checkout.sameDay.submit');
    await act(async () => {
      fireEvent.click(submitButton);
    });
    expect(mockStandardizedApi.post).not.toHaveBeenCalled();
    expect(mockNotificationManager.error).toHaveBeenCalled();
  });

  test('정상 입력 → API 호출 1회, 페이로드 정확, 성공 알림 표시', async () => {
    const onCheckoutCompleted = jest.fn();
    await act(async () => {
      render(
        <CheckoutSameDayModal
          isOpen
          onClose={jest.fn()}
          mapping={baseMapping}
          onCheckoutCompleted={onCheckoutCompleted}
        />
      );
      await flushPromises();
    });

    fireEvent.click(screen.getByDisplayValue('DEBIT_CARD'));
    const referenceInput = screen.getByLabelText('admin:mapping.checkout.sameDay.paymentReference.label');
    fireEvent.change(referenceInput, { target: { value: 'AUTH-OPTION-B-1' } });

    await act(async () => {
      fireEvent.click(screen.getByText('admin:mapping.checkout.sameDay.submit'));
      await flushPromises();
    });

    expect(mockStandardizedApi.post).toHaveBeenCalledTimes(1);
    const [calledPath, calledPayload] = mockStandardizedApi.post.mock.calls[0];
    expect(calledPath).toBe('/api/v1/admin/mappings/1001/checkout-same-day');
    expect(calledPayload).toEqual({
      paymentMethod: 'DEBIT_CARD',
      paymentReference: 'AUTH-OPTION-B-1',
      paymentAmount: 800000,
      sameDaySessionScheduleId: null
    });
    expect(mockNotificationManager.success).toHaveBeenCalled();
    // 모달 내 success 박스가 표시되었는지 확인 (자동 닫기 타이머는 별도로 검증하지 않음).
    expect(screen.getByTestId('checkout-success-detail')).toBeInTheDocument();

    // 자동 닫기 타이머(1.6초) 진행을 real timer 로 기다린다.
    await waitFor(() => {
      expect(onCheckoutCompleted).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });
  });

  describe('가예약 일정 드롭다운 (UX 개선 2-2)', () => {
    test('모달 열림 시 GET pending-schedules 호출 + 빈 옵션 + auto 옵션 표시', async () => {
      await act(async () => {
        render(
          <CheckoutSameDayModal isOpen onClose={jest.fn()} mapping={baseMapping} />
        );
        await flushPromises();
      });
      expect(mockStandardizedApi.get).toHaveBeenCalledWith(
        '/api/v1/admin/mappings/1001/pending-schedules'
      );
      const select = await screen.findByTestId('checkout-schedule-select');
      const options = select.querySelectorAll('option');
      expect(options.length).toBe(1);
      expect(options[0].value).toBe('');
      expect(options[0].textContent).toMatch(
        /admin:mapping\.checkout\.sameDay\.sameDaySession\.optionAuto/
      );
    });

    test('일정 3건 → 드롭다운에 3개 옵션 + auto 옵션', async () => {
      mockStandardizedApi.get.mockResolvedValueOnce({
        success: true,
        data: {
          schedules: [
            {
              id: 7771,
              scheduleDate: '2026-05-29',
              startTime: '14:00:00',
              endTime: '15:00:00',
              status: 'TENTATIVE_PENDING_PAYMENT'
            },
            {
              id: 7772,
              scheduleDate: '2026-05-30',
              startTime: '10:00:00',
              endTime: '11:00:00',
              status: 'TENTATIVE_PENDING_PAYMENT'
            },
            {
              id: 7773,
              scheduleDate: '2026-06-01',
              startTime: '16:00:00',
              endTime: '17:00:00',
              status: 'BOOKED'
            }
          ],
          count: 3
        }
      });
      await act(async () => {
        render(
          <CheckoutSameDayModal isOpen onClose={jest.fn()} mapping={baseMapping} />
        );
        await flushPromises();
      });
      const select = await screen.findByTestId('checkout-schedule-select');
      await waitFor(() => {
        expect(select.querySelectorAll('option').length).toBe(4);
      });
      const options = select.querySelectorAll('option');
      expect(options[1].value).toBe('7771');
      expect(options[1].textContent).toContain('5/29');
      expect(options[1].textContent).toContain('14:00');
      expect(options[2].value).toBe('7772');
      expect(options[3].value).toBe('7773');
    });

    test('드롭다운 선택값 → submit 페이로드의 sameDaySessionScheduleId 에 number 로 전달', async () => {
      mockStandardizedApi.get.mockResolvedValueOnce({
        success: true,
        data: {
          schedules: [
            {
              id: 9999,
              scheduleDate: '2026-05-29',
              startTime: '14:00:00',
              endTime: '15:00:00',
              status: 'TENTATIVE_PENDING_PAYMENT'
            }
          ],
          count: 1
        }
      });
      const onCheckoutCompleted = jest.fn();
      await act(async () => {
        render(
          <CheckoutSameDayModal
            isOpen
            onClose={jest.fn()}
            mapping={baseMapping}
            onCheckoutCompleted={onCheckoutCompleted}
          />
        );
        await flushPromises();
      });
      const select = await screen.findByTestId('checkout-schedule-select');
      await waitFor(() => {
        expect(select.querySelectorAll('option').length).toBe(2);
      });
      fireEvent.change(select, { target: { value: '9999' } });

      await act(async () => {
        fireEvent.click(screen.getByText('admin:mapping.checkout.sameDay.submit'));
        await flushPromises();
      });

      expect(mockStandardizedApi.post).toHaveBeenCalledTimes(1);
      const [, payload] = mockStandardizedApi.post.mock.calls[0];
      expect(payload.sameDaySessionScheduleId).toBe(9999);
    });
  });

  describe('결제 승인번호 자동 재생성 버튼 (UX 개선 2-3)', () => {
    test('재생성 버튼 클릭 시 새 reference 가 생성되어 input 값이 변경된다', async () => {
      await act(async () => {
        render(
          <CheckoutSameDayModal isOpen onClose={jest.fn()} mapping={baseMapping} />
        );
        await flushPromises();
      });
      const referenceInput = screen.getByLabelText(
        'admin:mapping.checkout.sameDay.paymentReference.label'
      );
      const initial = referenceInput.value;
      expect(initial.startsWith('CARD_')).toBe(true);

      fireEvent.change(referenceInput, { target: { value: 'MANUAL-OVERRIDE-001' } });
      expect(referenceInput.value).toBe('MANUAL-OVERRIDE-001');

      const regenerateButton = screen.getByTestId('reference-regenerate-button');
      await act(async () => {
        fireEvent.click(regenerateButton);
      });
      expect(referenceInput.value.startsWith('CARD_')).toBe(true);
      expect(referenceInput.value).not.toBe('MANUAL-OVERRIDE-001');
    });
  });

  describe('결제 금액 콤마 표시 + 음수/문자 입력 차단 (UX 개선 2-4)', () => {
    test('packagePrice 800000 → 입력 표시값이 "800,000"', async () => {
      await act(async () => {
        render(
          <CheckoutSameDayModal isOpen onClose={jest.fn()} mapping={baseMapping} />
        );
        await flushPromises();
      });
      const amountInput = screen.getByTestId('checkout-amount-input');
      expect(amountInput.value).toBe('800,000');
    });

    test('문자/특수기호/음수 입력 시 숫자만 남는다', async () => {
      await act(async () => {
        render(
          <CheckoutSameDayModal isOpen onClose={jest.fn()} mapping={baseMapping} />
        );
        await flushPromises();
      });
      const amountInput = screen.getByTestId('checkout-amount-input');
      fireEvent.change(amountInput, { target: { value: '-1abc23!@#' } });
      expect(amountInput.value).toBe('123');
    });

    test('정가와 동일 금액 → match 라벨 표시', async () => {
      await act(async () => {
        render(
          <CheckoutSameDayModal isOpen onClose={jest.fn()} mapping={baseMapping} />
        );
        await flushPromises();
      });
      const hint = screen.getByTestId('checkout-list-price-hint');
      expect(hint.textContent).toMatch(
        /admin:mapping\.checkout\.sameDay\.paymentAmount\.match/
      );
    });

    test('정가 대비 할인된 금액 → discount 라벨 표시', async () => {
      await act(async () => {
        render(
          <CheckoutSameDayModal isOpen onClose={jest.fn()} mapping={baseMapping} />
        );
        await flushPromises();
      });
      const amountInput = screen.getByTestId('checkout-amount-input');
      fireEvent.change(amountInput, { target: { value: '700000' } });
      const hint = screen.getByTestId('checkout-list-price-hint');
      expect(hint.textContent).toMatch(/discount/);
    });
  });

  describe('결제 완료 후 success 알림 (UX 개선 2-5)', () => {
    test('결제 성공 시 모달 내 success 박스가 표시된다', async () => {
      mockStandardizedApi.post.mockResolvedValueOnce({
        success: true,
        data: { id: 1001, status: 'ACTIVE', totalSessions: 10, remainingSessions: 9 }
      });
      await act(async () => {
        render(
          <CheckoutSameDayModal
            isOpen
            onClose={jest.fn()}
            mapping={baseMapping}
            onCheckoutCompleted={jest.fn()}
          />
        );
        await flushPromises();
      });
      await act(async () => {
        fireEvent.click(screen.getByText('admin:mapping.checkout.sameDay.submit'));
        await flushPromises();
      });
      const successBox = screen.getByTestId('checkout-success-detail');
      expect(successBox).toBeInTheDocument();
      expect(successBox.textContent).toMatch(
        /admin:mapping\.checkout\.sameDay\.successDetail\.session/
      );
    });
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
      // mock t() 는 default value 를 받으면 그 값을 반환하므로 한국어 fallback 문구가 표시된다.
      expect(alertBox.textContent).toMatch(/매칭 정보가 누락되었습니다/);
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

    test('mapping 모두 정상 → 결제 폼(라디오·승인번호 입력) 정상 표시', async () => {
      await act(async () => {
        render(
          <CheckoutSameDayModal isOpen onClose={jest.fn()} mapping={baseMapping} />
        );
        await flushPromises();
      });
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getByDisplayValue('CREDIT_CARD')).toBeInTheDocument();
      expect(screen.getByLabelText('admin:mapping.checkout.sameDay.paymentReference.label'))
        .toBeInTheDocument();
    });
  });
});
