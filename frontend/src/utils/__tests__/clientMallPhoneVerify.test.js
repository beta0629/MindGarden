/**
 * clientMallPhoneVerify — 서버 값 해석 · 오류 분류 (타이머·시도 횟수는 서버 값만)
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import {
  PHONE_VERIFY_ERROR,
  buildLockedMessage,
  buildWrongCodeMessage,
  classifyPhoneConfirmError,
  classifyPhoneSendError,
  parseOtpServerMeta
} from '../clientMallPhoneVerify';
import { CLIENT_MALL_PHONE_COPY } from '../../constants/clientMallConstants';

const apiError = (status, message, data) => {
  const err = new Error(message);
  err.status = status;
  err.response = { data };
  return err;
};

describe('clientMallPhoneVerify', () => {
  test('서버 값이 없으면 모두 null (기존 동작)', () => {
    expect(parseOtpServerMeta({ deliveryChannel: 'SMS' })).toEqual({
      expiresInSeconds: null,
      resendCooldownSeconds: null,
      remainingAttempts: null,
      retryAfterSeconds: null,
      locked: false
    });
    expect(parseOtpServerMeta({ expiresInSeconds: 300, remainingAttempts: 0 })).toMatchObject({
      expiresInSeconds: 300,
      remainingAttempts: 0
    });
  });

  test('BE 불일치 문구 → 틀린 번호', () => {
    const c = classifyPhoneConfirmError(
      apiError(400, '인증 코드가 올바르지 않거나 만료되었습니다. 다시 받아 주세요.', {})
    );
    expect(c.locked).toBe(false);
    expect(c.kind).toBe(PHONE_VERIFY_ERROR.WRONG_CODE);
    expect(buildWrongCodeMessage(null)).toBe(CLIENT_MALL_PHONE_COPY.WRONG_CODE);
    expect(buildWrongCodeMessage(3)).toContain('3');
  });

  test('429 또는 남은 시도 0 → 잠김', () => {
    expect(classifyPhoneConfirmError(apiError(429, 'x', {})).locked).toBe(true);
    expect(classifyPhoneConfirmError(apiError(400, 'x', { remainingAttempts: 0 })).locked).toBe(true);
    expect(classifyPhoneSendError(apiError(429, 'x', { retryAfterSeconds: 540 }))).toMatchObject({
      locked: true,
      meta: { retryAfterSeconds: 540 }
    });
    expect(classifyPhoneSendError(apiError(undefined, 'x', {
      success: false,
      data: { retryAfterSeconds: 600, remainingAttempts: 0 }
    }))).toMatchObject({ locked: true, meta: { retryAfterSeconds: 600 } });
    expect(classifyPhoneSendError(apiError(500, 'x', {})).locked).toBe(false);
    expect(buildLockedMessage(540).startsWith('9')).toBe(true);
    expect(buildLockedMessage(null)).toBe(CLIENT_MALL_PHONE_COPY.LOCKED_BODY_FALLBACK);
  });

  test('BE phone/change 오답(400 + data.remainingAttempts) → (c) 「n회 남았어요」', () => {
    const c = classifyPhoneConfirmError(apiError(400, '인증 코드가 올바르지 않거나 만료되었습니다. 다시 받아 주세요.', {
      success: false,
      errorCode: 'SMS_OTP_INVALID',
      data: { locked: false, remainingAttempts: 4 }
    }));
    expect(c.locked).toBe(false);
    expect(c.kind).toBe(PHONE_VERIFY_ERROR.WRONG_CODE);
    expect(c.meta.remainingAttempts).toBe(4);
    expect(buildWrongCodeMessage(c.meta.remainingAttempts))
      .toBe(`${CLIENT_MALL_PHONE_COPY.WRONG_CODE} 4회 남았어요.`);
  });

  test('BE phone/change 5번째 오답(429 + locked · retryAfterSeconds) → (f) 잠김, (c) 아님', () => {
    const c = classifyPhoneConfirmError(apiError(429, '인증 시도 횟수를 넘었습니다. 잠시 뒤에 다시 시도해 주세요.', {
      success: false,
      errorCode: 'SMS_OTP_LOCKED',
      data: { locked: true, remainingAttempts: 0, retryAfterSeconds: 600 }
    }));
    expect(c.locked).toBe(true);
    expect(c.kind).not.toBe(PHONE_VERIFY_ERROR.WRONG_CODE);
    expect(buildLockedMessage(c.meta.retryAfterSeconds).startsWith('10')).toBe(true);
    expect(classifyPhoneConfirmError(apiError(400, 'x', { data: { locked: true } })).locked).toBe(true);
  });

  test('그 외 서버 오류는 서버 메시지 유지', () => {
    const c = classifyPhoneConfirmError(apiError(400, '이미 사용 중인 휴대전화 번호입니다.', {}));
    expect(c.kind).toBe(PHONE_VERIFY_ERROR.OTHER);
    expect(c.message).toBe('이미 사용 중인 휴대전화 번호입니다.');
  });
});
