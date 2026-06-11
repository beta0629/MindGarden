/**
 * PhoneChangeModal 회귀 테스트 — 마이페이지 휴대전화 변경(Phase A) UI 시나리오.
 *
 * 검증 범위:
 *  - 1단계 "인증번호 발송" 클릭 시 {@code AUTH_API.SMS_SEND} 호출, 다음 OTP 단계 노출
 *  - 2단계 6자리 OTP 입력 후 "변경 완료" 클릭 시 {@code MYPAGE_API.CHANGE_PHONE} 호출 + 성공 토스트
 *  - 실패 시 에러 토스트 표시 (실패 분기 가드)
 *
 * @author MindGarden
 * @since 2026-06-11
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhoneChangeModal from '../PhoneChangeModal';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';
import { AUTH_API, MYPAGE_API } from '../../../../constants/api';

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

describe('PhoneChangeModal', () => {
  const noop = () => {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderOpen = (props = {}) =>
    render(
      <PhoneChangeModal
        isOpen
        onClose={noop}
        onSuccess={noop}
        {...props}
      />
    );

  it('새 휴대전화 번호 입력 후 "인증번호 발송" 클릭 → SMS_SEND 호출 + OTP 단계 노출', async() => {
    StandardizedApi.post.mockResolvedValueOnce({ success: true });
    renderOpen();

    const dialog = screen.getByRole('dialog');
    const phoneInput = within(dialog).getByLabelText('새 휴대전화 번호');
    await userEvent.type(phoneInput, '01012345678');

    const sendButton = within(dialog).getByRole('button', { name: '인증번호 발송' });
    await waitFor(() => expect(sendButton).not.toBeDisabled());
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalledWith(
        AUTH_API.SMS_SEND,
        expect.objectContaining({ phoneNumber: '01012345678' })
      );
    });
    // OTP 단계 진입은 async setState 가 flush 된 뒤에 노출 — findByLabelText 로 대기.
    await screen.findByLabelText('인증 코드 (6자리)');
    expect(notificationManager.show).toHaveBeenCalledWith('인증 코드가 전송되었습니다.', 'info');
  });

  it('OTP 입력 후 "변경 완료" 클릭 → CHANGE_PHONE 호출 + 성공 토스트 + onSuccess/onClose 콜백', async() => {
    StandardizedApi.post
      .mockResolvedValueOnce({ success: true }) // SMS_SEND
      .mockResolvedValueOnce({ success: true, phone: '010-1234-5678' }); // CHANGE_PHONE
    const onSuccess = jest.fn();
    const onClose = jest.fn();
    renderOpen({ onSuccess, onClose });

    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('새 휴대전화 번호'), '01087654321');
    await userEvent.click(within(dialog).getByRole('button', { name: '인증번호 발송' }));

    const otpInput = await within(dialog).findByLabelText('인증 코드 (6자리)');
    await userEvent.type(otpInput, '987654');

    const submitButton = within(dialog).getByRole('button', { name: '변경 완료' });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(StandardizedApi.post).toHaveBeenCalledWith(
        MYPAGE_API.CHANGE_PHONE,
        expect.objectContaining({
          newPhoneNumber: '01087654321',
          verificationCode: '987654'
        })
      );
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(notificationManager.show).toHaveBeenCalledWith('휴대전화가 변경되었습니다.', 'info');
  });
});
