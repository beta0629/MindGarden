/**
 * SessionExtensionModal — requesterId 세션 사용자 사용·하드코딩 금지 검증.
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
    warn: jest.fn()
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

jest.mock('../../../common/PackageSelector', () => ({
  __esModule: true,
  default: ({ onChange }) => (
    <button
      type="button"
      data-testid="package-selector-mock"
      onClick={() => onChange({
        value: 'PKG_BASIC',
        label: '기본 패키지',
        sessions: 4,
        price: 100000
      })}
    >
      select-package
    </button>
  )
}));

jest.mock('../../../common/BadgeSelect', () => ({
  __esModule: true,
  default: ({ value, onChange, options = [] }) => (
    <select
      data-testid="badge-select-mock"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
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
  packageName: '기존패키지',
  packagePrice: 80000
};

describe('SessionExtensionModal — requesterId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.post.mockResolvedValue({ success: true });
    mockGetUser.mockReturnValue({ id: 99, name: '관리자' });
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

    fireEvent.click(screen.getByTestId('package-selector-mock'));
    await act(async () => {
      fireEvent.click(screen.getByText('4회기 추가 요청'));
    });

    expect(notificationManager.error).toHaveBeenCalledWith(
      '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.'
    );
    expect(StandardizedApi.post).not.toHaveBeenCalled();
  });

  test('세션 사용자 id를 requesterId로 전달하고 packageName에 label을 사용한다', async () => {
    render(
      <SessionExtensionModal
        isOpen
        mapping={mapping}
        onClose={jest.fn()}
        onSessionExtensionRequested={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('package-selector-mock'));
    await act(async () => {
      fireEvent.click(screen.getByText('4회기 추가 요청'));
    });

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalledTimes(1);
    });

    const [endpoint, body] = StandardizedApi.post.mock.calls[0];
    expect(endpoint).toBe('/api/v1/admin/session-extensions/requests');
    expect(body.requesterId).toBe(99);
    expect(body.requesterId).not.toBe(1);
    expect(body.packageName).toBe('기본 패키지');
    expect(body.mappingId).toBe(42);
    expect(body.additionalSessions).toBe(4);
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

    fireEvent.click(screen.getByTestId('package-selector-mock'));
    await act(async () => {
      fireEvent.click(screen.getByText('4회기 추가 요청'));
    });

    await waitFor(() => {
      expect(notificationManager.error).toHaveBeenCalledWith('요청자를 찾을 수 없습니다: 1');
    });
  });
});
