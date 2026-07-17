/**
 * SessionExtensionModal — 동일 패키지 승계·가변 회기/금액.
 *
 * @author Core Solution
 * @since 2026-07-16
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key) => key }),
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
    warn: jest.fn(),
    warning: jest.fn()
  }
}));

const mockGetUser = jest.fn();

jest.mock('../../../../utils/sessionManager', () => ({
  __esModule: true,
  sessionManager: {
    getUser: (...args) => mockGetUser(...args)
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
  default: ({ children, onClick, disabled, type = 'button', loading }) => (
    <button type={type} onClick={onClick} disabled={disabled || loading}>{children}</button>
  )
}));

jest.mock('lucide-react', () => ({
  Calendar: () => <span data-testid="icon-calendar" />
}));

import SessionExtensionModal from '../SessionExtensionModal';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';

const mapping = {
  id: 42,
  clientName: '내담자A',
  consultantName: '상담사B',
  usedSessions: 1,
  remainingSessions: 3,
  totalSessions: 4,
  packageName: '기존패키지(10회)',
  packagePrice: 800000
};

describe('SessionExtensionModal — 동일 패키지 승계', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.post.mockResolvedValue({ success: true });
    mockGetUser.mockReturnValue({ id: 99, name: '관리자' });
  });

  test('패키지 선택 UI 없이 현재 패키지를 read-only로 표시한다', () => {
    render(
      <SessionExtensionModal
        isOpen
        mapping={mapping}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('현재 패키지')).toBeInTheDocument();
    expect(screen.getByText('기존패키지(10회)')).toBeInTheDocument();
    expect(screen.queryByTestId('package-selector-mock')).not.toBeInTheDocument();
    expect(screen.queryByText('새로운 패키지를 선택')).not.toBeInTheDocument();
  });

  test('사용자 id 없으면 제출을 차단하고 API를 호출하지 않는다', async () => {
    mockGetUser.mockReturnValue(null);

    render(
      <SessionExtensionModal
        isOpen
        mapping={mapping}
        onClose={jest.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('추가 회기 수'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('추가분 결제 금액(원)'), { target: { value: '400000' } });
    await act(async () => {
      fireEvent.click(screen.getByText('5회기 추가 요청'));
    });

    expect(notificationManager.error).toHaveBeenCalledWith(
      '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.'
    );
    expect(StandardizedApi.post).not.toHaveBeenCalled();
  });

  test('가변 회기·금액으로 요청하고 packageName은 보내지 않는다', async () => {
    render(
      <SessionExtensionModal
        isOpen
        mapping={mapping}
        onClose={jest.fn()}
        onSessionExtensionRequested={jest.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('추가 회기 수'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('추가분 결제 금액(원)'), { target: { value: '400000' } });
    await act(async () => {
      fireEvent.click(screen.getByText('5회기 추가 요청'));
    });

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalledTimes(1);
    });

    const [endpoint, body] = StandardizedApi.post.mock.calls[0];
    expect(endpoint).toBe('/api/v1/admin/session-extensions/requests');
    expect(body.requesterId).toBe(99);
    expect(body.mappingId).toBe(42);
    expect(body.additionalSessions).toBe(5);
    expect(body.extensionAmount).toBe(400000);
    expect(body.packageName).toBeUndefined();
    expect(notificationManager.success).toHaveBeenCalled();
  });

  test('API 실패 시 BE message를 노출한다', async () => {
    StandardizedApi.post.mockRejectedValue({
      message: '요청자를 찾을 수 없습니다: 1',
      response: { data: { message: '요청자를 찾을 수 없습니다: 1' } }
    });

    render(
      <SessionExtensionModal
        isOpen
        mapping={mapping}
        onClose={jest.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('추가 회기 수'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('추가분 결제 금액(원)'), { target: { value: '400000' } });
    await act(async () => {
      fireEvent.click(screen.getByText('5회기 추가 요청'));
    });

    await waitFor(() => {
      expect(notificationManager.error).toHaveBeenCalledWith('요청자를 찾을 수 없습니다: 1');
    });
  });
});
