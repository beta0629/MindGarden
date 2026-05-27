/**
 * RestoreUserModal 단위 테스트.
 *
 * 검증 시나리오:
 *  - 사유(textarea) 필수 검증 → 빈 입력 시 confirm 차단 + 에러 메시지 노출
 *  - 사유 입력 후 confirm → POST /api/v1/admin/users/{userId}/restore 호출
 *  - 성공 시 onRestored(userId) + onClose 호출 + toast 표시
 *  - 409 응답 시 "이미 익명화 진입, 복원 불가" 에러 노출 + 모달 유지
 *
 * @author Core Solution
 * @since 2026-06-06
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showWarning: jest.fn()
}));

jest.mock('../../../utils/safeDisplay', () => ({
  __esModule: true,
  toDisplayString: (value, fallback) =>
    value == null || value === '' ? (fallback || '-') : String(value)
}));

jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, subtitle, children, actions }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <h2 data-testid="restore-modal-title">{title}</h2>
        <p data-testid="restore-modal-subtitle">{subtitle}</p>
        <div data-testid="restore-modal-body">{children}</div>
        <div data-testid="restore-modal-actions">{actions}</div>
      </div>
    ) : null
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, loading, type = 'button', ...rest }) => (
    // eslint-disable-next-line react/button-has-type
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-loading={loading ? 'true' : 'false'}
      {...rest}
    >
      {children}
    </button>
  )
}));

jest.mock('react-i18next', () => {
  const KEY_MAP = {
    'userManagement.pendingDeletion.modal.title': '되돌리기 확인',
    'userManagement.pendingDeletion.modal.subtitle': '{name} 사용자 되돌리기',
    'userManagement.pendingDeletion.modal.cancel': '취소',
    'userManagement.pendingDeletion.modal.confirm': '되돌리기',
    'userManagement.pendingDeletion.modal.reasonLabel': '되돌리기 사유',
    'userManagement.pendingDeletion.modal.reasonPlaceholder': '사유를 입력하세요',
    'userManagement.pendingDeletion.modal.reasonHint': '최대 500자',
    'userManagement.pendingDeletion.error.reasonRequired': '되돌리기 사유는 필수입니다.',
    'userManagement.pendingDeletion.error.reasonTooLong': '사유는 500자 이내로 입력해 주세요.',
    'userManagement.pendingDeletion.error.expired': '이미 익명화 진입, 복원 불가',
    'userManagement.pendingDeletion.toast.success': '사용자 되돌리기 완료',
    'userManagement.pendingDeletion.toast.failure': '되돌리기 실패'
  };
  const mockT = (key, options) => {
    const base = KEY_MAP[key] || key;
    if (options && typeof base === 'string') {
      return Object.keys(options).reduce(
        (acc, k) => acc.replace(`{${k}}`, String(options[k])),
        base
      );
    }
    return base;
  };
  const mockTranslation = { t: mockT };
  return {
    __esModule: true,
    useTranslation: () => mockTranslation
  };
});

import StandardizedApi from '../../../utils/standardizedApi';
import { showSuccess, showError } from '../../../utils/notification';
import RestoreUserModal from '../RestoreUserModal';

const TEST_USER = { userId: 1234, name: '홍길동' };

describe('RestoreUserModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('isOpen=false 시 모달이 렌더되지 않는다', () => {
    render(
      <RestoreUserModal
        isOpen={false}
        onClose={jest.fn()}
        user={TEST_USER}
      />
    );
    expect(screen.queryByTestId('restore-modal-title')).toBeNull();
  });

  it('빈 사유로 확인 클릭 시 에러 메시지를 표시하고 API 를 호출하지 않는다', async() => {
    const onClose = jest.fn();
    const onRestored = jest.fn();
    render(
      <RestoreUserModal
        isOpen
        onClose={onClose}
        user={TEST_USER}
        onRestored={onRestored}
      />
    );

    fireEvent.click(screen.getByTestId('restore-user-modal-confirm'));

    await waitFor(() => {
      expect(screen.getByTestId('restore-user-modal-error')).toHaveTextContent(
        '되돌리기 사유는 필수입니다.'
      );
    });
    expect(StandardizedApi.post).not.toHaveBeenCalled();
    expect(onRestored).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('정상 사유 입력 후 확인 시 POST /restore 호출 → 성공 콜백 + 모달 닫힘', async() => {
    StandardizedApi.post.mockResolvedValue({ success: true, data: { userId: TEST_USER.userId } });

    const onClose = jest.fn();
    const onRestored = jest.fn();
    render(
      <RestoreUserModal
        isOpen
        onClose={onClose}
        user={TEST_USER}
        onRestored={onRestored}
      />
    );

    fireEvent.change(screen.getByTestId('restore-user-modal-reason'), {
      target: { value: '운영 오인 해제' }
    });
    fireEvent.click(screen.getByTestId('restore-user-modal-confirm'));

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalledTimes(1);
    });
    expect(StandardizedApi.post).toHaveBeenCalledWith(
      `/api/v1/admin/users/${TEST_USER.userId}/restore`,
      { reason: '운영 오인 해제' }
    );
    await waitFor(() => expect(onRestored).toHaveBeenCalledWith(TEST_USER.userId));
    expect(onClose).toHaveBeenCalled();
    expect(showSuccess).toHaveBeenCalledWith('사용자 되돌리기 완료');
  });

  it('409 응답 시 "이미 익명화 진입, 복원 불가" 에러 노출 + 모달 유지', async() => {
    const error = new Error('409');
    error.response = { status: 409 };
    StandardizedApi.post.mockRejectedValue(error);

    const onClose = jest.fn();
    const onRestored = jest.fn();
    render(
      <RestoreUserModal
        isOpen
        onClose={onClose}
        user={TEST_USER}
        onRestored={onRestored}
      />
    );

    fireEvent.change(screen.getByTestId('restore-user-modal-reason'), {
      target: { value: '복원 시도' }
    });
    fireEvent.click(screen.getByTestId('restore-user-modal-confirm'));

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByTestId('restore-user-modal-error')).toHaveTextContent(
        '이미 익명화 진입, 복원 불가'
      );
    });
    expect(showError).toHaveBeenCalledWith('이미 익명화 진입, 복원 불가');
    expect(onRestored).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
