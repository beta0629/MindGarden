/**
 * EmailChangeModal 회귀 테스트 — 마이페이지 이메일 변경(Phase B) UI 시나리오.
 *
 * 검증 범위:
 *  - 1단계 "인증 메일 발송" 클릭 시 {@code MYPAGE_API.EMAIL_SEND} 호출, OTP 단계 노출
 *  - 2단계 6자리 OTP 입력 후 "변경 완료" 클릭 시 {@code MYPAGE_API.CHANGE_EMAIL} 호출
 *    + 성공 토스트(정보) + 재로그인 안내 토스트(경고) + onSuccess/onClose 콜백
 *
 * @author MindGarden
 * @since 2026-06-11
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailChangeModal from '../EmailChangeModal';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';
import { MYPAGE_API } from '../../../../constants/api';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'ko', changeLanguage: () => Promise.resolve() }
  }),
  Trans: ({ children }) => children,
  initReactI18next: { type: '3rdParty', init: () => {} }
}));

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

describe('EmailChangeModal', () => {
  const noop = () => {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderOpen = (props = {}) =>
    render(
      <EmailChangeModal
        isOpen
        onClose={noop}
        onSuccess={noop}
        {...props}
      />
    );

  it('새 이메일 입력 후 "인증 메일 발송" 클릭 → EMAIL_SEND 호출 + OTP 단계 노출', async() => {
    StandardizedApi.post.mockResolvedValueOnce({ success: true });
    renderOpen();

    const dialog = screen.getByRole('dialog');
    const emailInput = within(dialog).getByLabelText('새 이메일');
    await userEvent.type(emailInput, 'New.User@Example.com');

    const sendButton = within(dialog).getByRole('button', { name: '인증 메일 발송' });
    await waitFor(() => expect(sendButton).not.toBeDisabled());
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalledWith(
        MYPAGE_API.EMAIL_SEND,
        expect.objectContaining({ email: 'new.user@example.com' })
      );
    });
    await screen.findByLabelText('인증 코드 (6자리)');
    expect(notificationManager.show).toHaveBeenCalledWith(
      '인증 코드가 전송되었습니다. 메일함을 확인해 주세요.',
      'info'
    );
  });

  it('OTP 입력 후 "변경 완료" → CHANGE_EMAIL 호출 + 성공·재로그인 토스트 + 콜백', async() => {
    StandardizedApi.post
      .mockResolvedValueOnce({ success: true }) // EMAIL_SEND
      .mockResolvedValueOnce({ success: true, email: 'new@example.com' }); // CHANGE_EMAIL
    const onSuccess = jest.fn();
    const onClose = jest.fn();
    renderOpen({ onSuccess, onClose });

    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('새 이메일'), 'new@example.com');
    await userEvent.click(within(dialog).getByRole('button', { name: '인증 메일 발송' }));

    const otpInput = await within(dialog).findByLabelText('인증 코드 (6자리)');
    await userEvent.type(otpInput, '654321');

    const submitButton = within(dialog).getByRole('button', { name: '변경 완료' });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalledWith(
        MYPAGE_API.CHANGE_EMAIL,
        expect.objectContaining({
          newEmail: 'new@example.com',
          verificationCode: '654321'
        })
      );
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(notificationManager.show).toHaveBeenCalledWith('이메일이 변경되었습니다.', 'info');
    expect(notificationManager.show).toHaveBeenCalledWith(
      '보안상 재로그인이 필요합니다. 잠시 후 로그인 화면으로 이동합니다.',
      'warning'
    );
  });
});
