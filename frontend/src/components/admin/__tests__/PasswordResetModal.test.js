/**
 * PasswordResetModal — 임시 비밀번호는 서버가 만들어 문자로만 보낸다.
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordResetModal from '../PasswordResetModal';
import '../../../i18n';

describe('PasswordResetModal', () => {
  const userFixture = { id: '550e8400-e29b-41d4-a716-446655440000', name: '회귀 테스트 사용자' };

  it('비밀번호 입력 없이 문자 발송을 확인한다', async() => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    render(
      <PasswordResetModal
        user={userFixture}
        userType="client"
        onClose={() => {}}
        onConfirm={onConfirm}
      />
    );
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByLabelText('새 비밀번호')).not.toBeInTheDocument();
    expect(dialog).toHaveTextContent('화면에는 비밀번호를 표시하지 않습니다');
    await userEvent.click(within(dialog).getByRole('button', { name: '임시 비밀번호 문자 발송' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith());
  });

  it('primary 문자 발송 버튼이 DOM에 보인다', () => {
    render(
      <PasswordResetModal
        user={userFixture}
        userType="consultant"
        onClose={() => {}}
        onConfirm={jest.fn()}
      />
    );
    const submitBtn = within(screen.getByRole('dialog')).getByRole('button', { name: '임시 비밀번호 문자 발송' });
    expect(submitBtn).toBeVisible();
    expect(submitBtn).toHaveClass('mg-v2-button-primary');
  });
});
