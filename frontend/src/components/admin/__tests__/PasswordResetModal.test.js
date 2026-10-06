/**
 * PasswordResetModal 회귀 테스트 — 정책 힌트 노출·클라이언트 검증 메시지·primary 버튼 클래스 계약
 * @see docs/standards/TESTING_STANDARD.md
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordResetModal from '../PasswordResetModal';
import { getPasswordPolicyHint } from '../../../utils/loginPasswordPolicy';
import '../../../i18n';

describe('PasswordResetModal', () => {
  const userFixture = { id: '550e8400-e29b-41d4-a716-446655440000', name: '회귀 테스트 사용자' };

  it('공통 정책 힌트(i18n) 안내가 노출된다', () => {
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
      (el.textContent || '').includes(getPasswordPolicyHint())
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
        within(dialog).getByText(/비밀번호는 최소 8자 이상이어야 합니다\./)
      ).toBeInTheDocument();
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('대문자 없는 새 비밀번호는 onConfirm(초기화 API)을 부르지 않고 정책 안내를 표시한다', async() => {
    const onConfirm = jest.fn();
    render(
      <PasswordResetModal user={userFixture} userType="consultant" onClose={() => {}} onConfirm={onConfirm} />
    );
    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByLabelText('새 비밀번호');
    await userEvent.type(input, 'noupper1!x');
    await userEvent.type(within(dialog).getByLabelText('비밀번호 확인'), 'noupper1!x');
    await userEvent.click(within(dialog).getByRole('button', { name: '비밀번호 초기화' }));

    const alert = await within(dialog).findByText(/대문자를 포함해야/);
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveTextContent('특수문자');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('확인 불일치는 막고, 일치하면 onConfirm 에 새 비밀번호를 넘긴다', async() => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    render(
      <PasswordResetModal user={userFixture} userType="client" onClose={() => {}} onConfirm={onConfirm} />
    );
    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('새 비밀번호'), 'Fake7!Qzm');
    await userEvent.type(within(dialog).getByLabelText('비밀번호 확인'), 'Fake7!Qzx');
    await userEvent.click(within(dialog).getByRole('button', { name: '비밀번호 초기화' }));
    expect(await within(dialog).findByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    await userEvent.clear(within(dialog).getByLabelText('비밀번호 확인'));
    await userEvent.type(within(dialog).getByLabelText('비밀번호 확인'), 'Fake7!Qzm');
    await userEvent.click(within(dialog).getByRole('button', { name: '비밀번호 초기화' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('Fake7!Qzm'));
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
    const submitBtn = within(screen.getByRole('dialog')).getByRole('button', { name: '비밀번호 초기화' });
    expect(submitBtn).toBeVisible();
    expect(submitBtn).toHaveClass('mg-v2-button-primary');
  });
});
