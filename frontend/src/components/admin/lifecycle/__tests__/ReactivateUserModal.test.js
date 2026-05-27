/**
 * ReactivateUserModal 테스트 — Phase 4 어드민 휴면 사용자 복귀 확인 모달.
 *
 * 검증 시나리오:
 *  1) isOpen=false → 미렌더
 *  2) isOpen=true → UnifiedModal 단일 dialog + 확인/취소 노출
 *  3) 확인 클릭 → onConfirm(user) 호출
 *  4) 취소 클릭 → onClose 호출 + onConfirm 미호출
 *  5) loading=true → 확인 비활성 + 처리 중 텍스트
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReactivateUserModal from '../ReactivateUserModal';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    i18n: { language: 'ko', changeLanguage: () => Promise.resolve() }
  }),
  Trans: ({ children }) => children,
  initReactI18next: { type: '3rdParty', init: () => {} }
}));

describe('ReactivateUserModal', () => {
  const user = {
    userId: 4242,
    maskedUserId: 'clie*****',
    role: 'CLIENT'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('isOpen=false 면 null 반환 (미렌더)', () => {
    const { container } = render(
      <ReactivateUserModal isOpen={false} onClose={() => {}} onConfirm={() => {}} user={user} />
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UnifiedModal 단일 dialog 로 렌더링되고 확인/취소 버튼 노출', () => {
    render(
      <ReactivateUserModal
        isOpen
        onClose={() => {}}
        onConfirm={() => {}}
        user={user}
      />
    );
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByTestId('reactivate-confirm')).toBeInTheDocument();
    expect(screen.getByTestId('reactivate-cancel')).toBeInTheDocument();
  });

  it('확인 클릭 → onConfirm(user) 호출 1회', async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    render(
      <ReactivateUserModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        user={user}
      />
    );

    await userEvent.click(screen.getByTestId('reactivate-confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(user);
  });

  it('취소 클릭 → onClose 호출 + onConfirm 미호출', async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    render(
      <ReactivateUserModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        user={user}
      />
    );

    await userEvent.click(screen.getByTestId('reactivate-cancel'));

    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('loading=true → 확인 버튼 비활성 + onConfirm 미호출', async () => {
    const onConfirm = jest.fn();
    render(
      <ReactivateUserModal
        isOpen
        onClose={() => {}}
        onConfirm={onConfirm}
        user={user}
        loading
      />
    );

    const confirmBtn = screen.getByTestId('reactivate-confirm');
    expect(confirmBtn).toBeDisabled();

    await userEvent.click(confirmBtn);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
