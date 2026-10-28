/**
 * PasswordChangeModal 회귀 테스트 — 비밀번호 정책 힌트·클라이언트 검증·제출 버튼 DOM 가시성
 * MG 모달 primary "빈 박스" 회귀 방지: jsdom은 외부 CSS를 완전 적용하지 않아 getComputedStyle(배경 채움)은
 * 불안정하므로, 역할+접근 가능한 이름+`mg-v2-button-primary` 등 DOM 클래스 계약으로 primary를 검증한다.
 * 첫 로그인(tempPassword) — 휴대폰 OTP 발송·제출 본문 verificationCode 포함.
 * @see docs/standards/TESTING_STANDARD.md
 */
import '../../../../i18n';
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordChangeModal from '../PasswordChangeModal';
import { getPasswordPolicyHint } from '../../../../utils/loginPasswordPolicy';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';
import { AUTH_API } from '../../../../constants/api';
import { sessionManager } from '../../../../utils/sessionManager';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    post: jest.fn()
  }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    show: jest.fn()
  }
}));

jest.mock('../../../../utils/sessionManager', () => ({
  sessionManager: {
    getUser: jest.fn(() => ({ phone: '01012345678' }))
  }
}));

describe('PasswordChangeModal', () => {
  const noop = () => {};

  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.post.mockResolvedValue({ success: true });
    sessionManager.getUser.mockReturnValue({ phone: '01012345678' });
  });

  const renderOpen = (props = {}) =>
    render(
      <PasswordChangeModal
        isOpen
        onClose={noop}
        onSuccess={noop}
        tempPassword={undefined}
        {...props}
      />
    );

  it('공통 정책 힌트 한 줄이 노출된다', () => {
    renderOpen();
    const dialog = screen.getByRole('dialog');
    const hintParagraph = dialog.querySelector('.mg-mypage-password-form__hint');
    expect(hintParagraph).toBeTruthy();
    expect(hintParagraph.textContent).toContain(getPasswordPolicyHint());
  });

  it('정책에 맞지 않는 새 비밀번호 입력 시 클라이언트 오류 메시지를 표시한다', async() => {
    renderOpen();

    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('현재 비밀번호'), 'Current1@');
    await userEvent.type(within(dialog).getByLabelText('새 비밀번호'), 'short');

    await waitFor(() => {
      expect(
        within(dialog).getByText(/비밀번호는 최소 8자 이상이어야 합니다\./)
      ).toBeInTheDocument();
    });
  });

  it('대문자 없는 새 비밀번호는 변경 API 를 부르지 않고 정책 안내를 표시한다', async() => {
    renderOpen();
    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('현재 비밀번호'), 'Oldfake7!Q');
    const input = within(dialog).getByLabelText('새 비밀번호');
    await userEvent.type(input, 'noupper1!x');
    await userEvent.type(within(dialog).getByLabelText('새 비밀번호 확인'), 'noupper1!x');

    const alert = await within(dialog).findByText(/대문자를 포함해야/);
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveTextContent('특수문자');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const submitBtn = within(dialog).getByRole('button', { name: '비밀번호 변경' });
    expect(submitBtn).toBeDisabled();
    await userEvent.click(submitBtn);
    expect(StandardizedApi.post).not.toHaveBeenCalled();
  });

  it('제출(비밀번호 변경) primary 버튼이 DOM에 보인다 — 폼 유효 시 활성화되어 제출 가능', async() => {
    const onSuccess = jest.fn();
    const onClose = jest.fn();
    renderOpen({ onSuccess, onClose });

    const dialog = screen.getByRole('dialog');
    const submitBtn = within(dialog).getByRole('button', { name: '비밀번호 변경' });

    expect(submitBtn).toBeVisible();
    expect(submitBtn).toHaveClass('mg-v2-button', 'mg-v2-button-primary');
    expect(submitBtn).not.toHaveClass('mg-v2-button-outline');
    const cancelBtn = within(dialog).getAllByRole('button').find(
      (btn) => btn.getAttribute('type') === 'button' && !btn.textContent?.includes('비밀번호 변경')
    );
    expect(cancelBtn).toBeTruthy();
    expect(cancelBtn).not.toHaveClass('mg-v2-button-primary');
    expect(submitBtn).toBeDisabled();

    await userEvent.type(within(dialog).getByLabelText('현재 비밀번호'), 'Oldpass1@');
    await userEvent.type(within(dialog).getByLabelText('새 비밀번호'), 'Newpass1@');
    await userEvent.type(within(dialog).getByLabelText('새 비밀번호 확인'), 'Newpass1@');

    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
    });

    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalled();
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(notificationManager.show).toHaveBeenCalledWith(expect.any(String), 'info');
  });

  it('입력 직후 즉시 제출하면 POST 본문에 입력한 새 비밀번호가 들어간다', async() => {
    renderOpen();
    const dialog = screen.getByRole('dialog');
    const currentInput = within(dialog).getByLabelText('현재 비밀번호');
    expect(currentInput).toHaveValue('');
    fireEvent.change(currentInput, {
      target: { name: 'currentPassword', value: 'x'.repeat(3) }
    });
    fireEvent.change(within(dialog).getByLabelText('새 비밀번호'), {
      target: { name: 'newPassword', value: 'Newfake8@Z' }
    });
    fireEvent.change(within(dialog).getByLabelText('새 비밀번호 확인'), {
      target: { name: 'confirmPassword', value: 'Newfake8@Z' }
    });
    fireEvent.submit(dialog.querySelector('form'));

    await waitFor(() => expect(StandardizedApi.post).toHaveBeenCalledTimes(1));
    expect(StandardizedApi.post.mock.calls[0][1]).toEqual(expect.objectContaining({
      newPassword: 'Newfake8@Z',
      confirmPassword: 'Newfake8@Z'
    }));
    expect(StandardizedApi.post.mock.calls[0][1].verificationCode).toBeUndefined();
  });

  it('새 비밀번호가 빈 값이면 제출해도 POST 하지 않는다', async() => {
    renderOpen({ tempPassword: true });
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('현재 비밀번호')).toHaveValue('');
    fireEvent.submit(dialog.querySelector('form'));

    expect(await within(dialog).findByText('비밀번호를 입력해주세요.')).toBeInTheDocument();
    expect(StandardizedApi.post).not.toHaveBeenCalled();
  });

  it('변경 요구로 열려도 현재 비밀번호 칸은 비어 있고 autocomplete 은 유지된다', () => {
    renderOpen({ tempPassword: true });
    const dialog = screen.getByRole('dialog');
    const currentInput = within(dialog).getByLabelText('현재 비밀번호');
    const newInput = within(dialog).getByLabelText('새 비밀번호');

    expect(currentInput).toHaveValue('');
    expect(currentInput).toBeEnabled();
    expect(currentInput).toHaveAttribute('autoComplete', 'current-password');
    expect(newInput).toHaveAttribute('autoComplete', 'new-password');
    expect(within(dialog).getByText(/임시 비밀번호로 로그인하셨습니다/)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/등록 휴대폰/)).toBeInTheDocument();

    const hint = dialog.querySelector('#mypage-pw-new-policy-hint');
    expect(hint).toBeTruthy();
    expect(hint.textContent).toContain(getPasswordPolicyHint());
  });

  it('첫 로그인: 인증번호 발송 후 비밀번호 변경 본문에 verificationCode 를 포함한다', async() => {
    StandardizedApi.post
      .mockResolvedValueOnce({ success: true, deliveryChannel: 'SMS' })
      .mockResolvedValueOnce({ success: true });

    renderOpen({ tempPassword: true });
    const dialog = screen.getByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: /인증번호 발송/ }));

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalledWith(
        AUTH_API.SMS_SEND,
        expect.objectContaining({
          phoneNumber: '01012345678',
          purpose: 'FIRST_LOGIN_VERIFICATION'
        })
      );
    });

    const otpInput = within(dialog).getByLabelText(/인증 코드/);
    await waitFor(() => expect(otpInput).not.toBeDisabled());
    fireEvent.change(otpInput, { target: { value: '654321' } });
    fireEvent.change(within(dialog).getByLabelText('현재 비밀번호'), {
      target: { name: 'currentPassword', value: 'TempPass1@' }
    });
    fireEvent.change(within(dialog).getByLabelText('새 비밀번호'), {
      target: { name: 'newPassword', value: 'NewPass1@x' }
    });
    fireEvent.change(within(dialog).getByLabelText('새 비밀번호 확인'), {
      target: { name: 'confirmPassword', value: 'NewPass1@x' }
    });

    const submitBtn = within(dialog).getByRole('button', { name: '비밀번호 변경' });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    fireEvent.submit(dialog.querySelector('form'));

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalledWith(
        AUTH_API.PASSWORD_CHANGE,
        expect.objectContaining({
          verificationCode: '654321',
          newPassword: 'NewPass1@x'
        })
      );
    });
  });

  it('첫 로그인: OTP 없이 제출하면 PASSWORD_CHANGE 를 호출하지 않는다', async() => {
    renderOpen({ tempPassword: true });
    const dialog = screen.getByRole('dialog');

    fireEvent.change(within(dialog).getByLabelText('현재 비밀번호'), {
      target: { name: 'currentPassword', value: 'TempPass1@' }
    });
    fireEvent.change(within(dialog).getByLabelText('새 비밀번호'), {
      target: { name: 'newPassword', value: 'NewPass1@x' }
    });
    fireEvent.change(within(dialog).getByLabelText('새 비밀번호 확인'), {
      target: { name: 'confirmPassword', value: 'NewPass1@x' }
    });
    fireEvent.submit(dialog.querySelector('form'));

    expect(StandardizedApi.post).not.toHaveBeenCalledWith(
      AUTH_API.PASSWORD_CHANGE,
      expect.anything()
    );
  });
});
