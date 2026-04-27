/**
 * PasswordResetModal 회귀 테스트 — 정책 힌트 노출·클라이언트 검증 메시지
 * @see docs/standards/TESTING_STANDARD.md
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordResetModal from '../PasswordResetModal';
import { LOGIN_PASSWORD_POLICY_HINT_ONE_LINE } from '../../../constants/passwordPolicyUi';

describe('PasswordResetModal', () => {
  const userFixture = { id: '550e8400-e29b-41d4-a716-446655440000', name: '회귀 테스트 사용자' };

  it('LOGIN_PASSWORD_POLICY_HINT_ONE_LINE 안내가 노출된다', () => {
    render(
      <PasswordResetModal
        user={userFixture}
        userType="client"
        onClose={() => {}}
        onConfirm={jest.fn()}
      />
    );
    const dialog = screen.getByRole('dialog');
    const infoPs = dialog.querySelectorAll('.mg-v2-info-text');
    const hintP = [...infoPs].find((el) =>
      (el.textContent || '').includes(LOGIN_PASSWORD_POLICY_HINT_ONE_LINE)
    );
    expect(hintP).toBeTruthy();
  });

  it('약한 새 비밀번호 제출 시 정책 위반 클라이언트 메시지를 표시한다', async() => {
    const onConfirm = jest.fn();

    render(
      <PasswordResetModal
        user={userFixture}
        userType="client"
        onClose={() => {}}
        onConfirm={onConfirm}
      />
    );

    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('새 비밀번호'), 'weak');
    await userEvent.type(within(dialog).getByLabelText('비밀번호 확인'), 'weak');
    await userEvent.click(within(dialog).getByRole('button', { name: '비밀번호 초기화' }));

    await waitFor(() => {
      expect(
        within(dialog).getByText('비밀번호는 최소 8자 이상이어야 합니다.')
      ).toBeInTheDocument();
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('primary 비밀번호 초기화 버튼이 DOM에 보인다', () => {
    render(
      <PasswordResetModal
        user={userFixture}
        userType="consultant"
        onClose={() => {}}
        onConfirm={jest.fn()}
      />
    );
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: '비밀번호 초기화' })
    ).toBeVisible();
  });
});
