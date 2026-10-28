/**
 * OAuthPhoneVerificationModal — UI 단위 테스트 (RTL).
 *
 * 디자이너 산출 §2.4 (14 상태) 핵심 분기를 검증한다.
 * StandardizedApi 는 oauthPhoneVerificationApi 레벨에서 mock 한다.
 *
 * @author MindGarden
 * @since 2026-06-09
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import OAuthPhoneVerificationModal from '../OAuthPhoneVerificationModal';

jest.mock('../../../api/auth/oauthPhoneVerificationApi', () => {
  const actual = jest.requireActual('../../../api/auth/oauthPhoneVerificationApi');
  return {
    __esModule: true,
    ...actual,
    sendOAuthPhoneOtp: jest.fn(),
    verifyOAuthPhoneOtp: jest.fn()
  };
});

const apiModule = require('../../../api/auth/oauthPhoneVerificationApi');

const buildSocialUser = (overrides = {}) => ({
  provider: 'NAVER',
  phoneVerificationToken: 'phone-token-1',
  name: '홍길동',
  email: 'user@naver.com',
  ...overrides
});

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  onVerifiedSingle: jest.fn(),
  onRequiresAccountSelection: jest.fn(),
  onTokenExpired: jest.fn()
};

const setup = (extraProps = {}, socialUserOverrides = {}) =>
  render(
    <OAuthPhoneVerificationModal
      {...baseProps}
      {...extraProps}
      socialUser={buildSocialUser(socialUserOverrides)}
    />
  );

const typePhone = (value) => {
  fireEvent.change(screen.getByLabelText(/휴대폰 번호/), { target: { value } });
};

const clickSend = () => fireEvent.click(screen.getByRole('button', { name: /^인증번호 발송$/ }));

const typeOtp = (value) => {
  fireEvent.change(screen.getByTestId('mg-otp-hidden-input'), { target: { value } });
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

describe('OAuthPhoneVerificationModal — 진입·prefill', () => {
  test('isOpen=false 일 때 렌더하지 않는다', () => {
    setup({ isOpen: false });
    expect(screen.queryByText(/계정 연결$/)).not.toBeInTheDocument();
  });

  test('Naver 제목 / prefill 이름·이메일 노출', () => {
    setup();
    expect(screen.getByText('네이버 계정 연결')).toBeInTheDocument();
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('user@naver.com')).toBeInTheDocument();
    expect(screen.getByLabelText('네이버 계정 정보')).toBeInTheDocument();
  });

  test('Kakao name=null → prefillBox 이름 행을 숨긴다 (Kakao 버그 회피)', () => {
    setup({}, { provider: 'KAKAO', name: '', nickname: '', email: 'user@k.kr' });
    expect(screen.queryByText('이름')).not.toBeInTheDocument();
    expect(screen.getByText('user@k.kr')).toBeInTheDocument();
    expect(screen.getByText('카카오 계정 연결')).toBeInTheDocument();
  });
});

describe('OAuthPhoneVerificationModal — Step 1 휴대폰 검증', () => {
  test('빈 입력 + 발송 버튼 disabled', () => {
    setup();
    const sendBtn = screen.getByRole('button', { name: /^인증번호 발송$/ });
    expect(sendBtn).toBeDisabled();
  });

  test('11자리 휴대폰 입력 → 발송 활성화', () => {
    setup();
    typePhone('01012345678');
    const sendBtn = screen.getByRole('button', { name: /^인증번호 발송$/ });
    expect(sendBtn).not.toBeDisabled();
  });

  test('형식 오류 입력 후 발송 시도 → 친화 메시지 표시 (BE 호출 없음)', async () => {
    setup();
    typePhone('010');
    expect(screen.getByRole('button', { name: /^인증번호 발송$/ })).toBeDisabled();
    expect(apiModule.sendOAuthPhoneOtp).not.toHaveBeenCalled();
  });
});

describe('OAuthPhoneVerificationModal — sending → OTP 단계 전환', () => {
  test('BE 정상 발송 → OTP 단계 + 마스킹 표시 + 타이머 카운트다운', async () => {
    apiModule.sendOAuthPhoneOtp.mockResolvedValueOnce({
      success: true,
      challengeToken: 'c-1',
      expiresInSeconds: 180,
      resendCooldownSeconds: 60,
      maskedPhone: '010-****-5678'
    });
    setup();
    typePhone('01012345678');
    await act(async () => {
      clickSend();
    });

    expect(apiModule.sendOAuthPhoneOtp).toHaveBeenCalledWith({
      oauthProvider: 'NAVER',
      phoneVerificationToken: 'phone-token-1',
      phone: '01012345678'
    });
    expect(
      screen.getByText(/문자로 전송된 6자리 인증번호를 입력해 주세요\. \(010-\*\*\*\*-5678\)/)
    ).toBeInTheDocument();
    expect(screen.getByTestId('oauth-phone-modal-otp-timer')).toHaveTextContent(
      '남은 시간 3:00'
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('oauth-phone-modal-otp-timer')).toHaveTextContent(
      '남은 시간 2:59'
    );
  });
});

describe('OAuthPhoneVerificationModal — cooldown / daily-limit / token-expired', () => {
  test('cooldown 응답 → 에러 배너 + 발송 비활성 유지', async () => {
    apiModule.sendOAuthPhoneOtp.mockResolvedValueOnce({
      success: false,
      code: 'RESEND_COOLDOWN',
      retryAfterSeconds: 30,
      message: '잠시 후 다시 시도해 주세요.'
    });
    setup();
    typePhone('01012345678');
    await act(async () => {
      clickSend();
    });
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('잠시 후 다시 시도해 주세요.');
    expect(screen.queryByText(/^문자로 전송된/)).not.toBeInTheDocument();
  });

  test('DAILY_LIMIT_EXCEEDED → 영구 에러 배너 + 발송 disabled', async () => {
    apiModule.sendOAuthPhoneOtp.mockResolvedValueOnce({
      success: false,
      code: 'DAILY_LIMIT_EXCEEDED'
    });
    setup();
    typePhone('01012345678');
    await act(async () => {
      clickSend();
    });
    expect(
      screen.getAllByRole('alert').some((el) =>
        /오늘 인증 시도 횟수를 초과했습니다/.test(el.textContent)
      )
    ).toBe(true);
    expect(screen.getByRole('button', { name: /^인증번호 발송$/ })).toBeDisabled();
  });

  test('TOKEN_EXPIRED → 세션 만료 배너 + onTokenExpired 콜백', async () => {
    apiModule.sendOAuthPhoneOtp.mockResolvedValueOnce({
      success: false,
      code: 'TOKEN_EXPIRED'
    });
    setup();
    typePhone('01012345678');
    await act(async () => {
      clickSend();
    });
    expect(baseProps.onTokenExpired).toHaveBeenCalledWith({ code: 'TOKEN_EXPIRED' });
    expect(
      screen.getAllByRole('alert').some((el) =>
        /인증 세션이 만료되었습니다/.test(el.textContent)
      )
    ).toBe(true);
  });
});

describe('OAuthPhoneVerificationModal — OTP 자동 verify / 단일/다중 매칭', () => {
  const prepareOtpStep = async () => {
    apiModule.sendOAuthPhoneOtp.mockResolvedValueOnce({
      success: true,
      challengeToken: 'c-1',
      expiresInSeconds: 180,
      resendCooldownSeconds: 60,
      maskedPhone: '010-****-5678'
    });
    setup();
    typePhone('01012345678');
    await act(async () => {
      clickSend();
    });
  };

  test('OTP 6자리 완성 → 자동 verify → 단일 매칭 콜백', async () => {
    await prepareOtpStep();
    apiModule.verifyOAuthPhoneOtp.mockResolvedValueOnce({
      success: true,
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      matchedAccount: { userId: 7, tenantId: 'T1', role: 'CLIENT' }
    });
    await act(async () => {
      typeOtp('123456');
    });
    await waitFor(() =>
      expect(baseProps.onVerifiedSingle).toHaveBeenCalledWith({
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
        matchedAccount: { userId: 7, tenantId: 'T1', role: 'CLIENT' },
        provider: 'NAVER'
      })
    );
    expect(apiModule.verifyOAuthPhoneOtp).toHaveBeenCalledWith({
      oauthProvider: 'NAVER',
      phoneVerificationToken: 'phone-token-1',
      challengeToken: 'c-1',
      otpCode: '123456'
    });
  });

  test('다중 매칭 → onRequiresAccountSelection 콜백', async () => {
    await prepareOtpStep();
    apiModule.verifyOAuthPhoneOtp.mockResolvedValueOnce({
      success: true,
      requiresPhoneAccountSelection: true,
      phoneAccountSelectionToken: 'sel-token-1'
    });
    await act(async () => {
      typeOtp('123456');
    });
    await waitFor(() =>
      expect(baseProps.onRequiresAccountSelection).toHaveBeenCalledWith({
        phoneAccountSelectionToken: 'sel-token-1',
        provider: 'NAVER'
      })
    );
  });

  test('OTP_INVALID → cell error + inline alert + 자동 verify 1회 제한', async () => {
    await prepareOtpStep();
    apiModule.verifyOAuthPhoneOtp.mockResolvedValueOnce({
      success: false,
      code: 'OTP_INVALID'
    });
    await act(async () => {
      typeOtp('999999');
    });
    await waitFor(() =>
      expect(apiModule.verifyOAuthPhoneOtp).toHaveBeenCalledTimes(1)
    );
    expect(
      screen.getAllByRole('alert').some((el) =>
        /인증번호가 일치하지 않습니다/.test(el.textContent)
      )
    ).toBe(true);
  });
});

describe('OAuthPhoneVerificationModal — 휴대폰 변경 / 만료', () => {
  test('OTP 단계 → 휴대폰 변경 클릭 → phone 단계로 복귀, OTP 초기화', async () => {
    apiModule.sendOAuthPhoneOtp.mockResolvedValueOnce({
      success: true,
      challengeToken: 'c-1',
      expiresInSeconds: 180,
      resendCooldownSeconds: 60,
      maskedPhone: '010-****-5678'
    });
    setup();
    typePhone('01012345678');
    await act(async () => {
      clickSend();
    });

    fireEvent.click(screen.getByRole('button', { name: /^휴대폰 번호 변경$/ }));
    expect(screen.queryByText(/문자로 전송된/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/휴대폰 번호/)).toBeInTheDocument();
  });

  test('만료 도래 시 timer 가 expired 카피로 변경', async () => {
    apiModule.sendOAuthPhoneOtp.mockResolvedValueOnce({
      success: true,
      challengeToken: 'c-1',
      expiresInSeconds: 2,
      resendCooldownSeconds: 60,
      maskedPhone: '010-****-5678'
    });
    setup();
    typePhone('01012345678');
    await act(async () => {
      clickSend();
    });
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId('oauth-phone-modal-otp-timer')).toHaveTextContent(
      '인증번호가 만료되었습니다.'
    );
  });
});
