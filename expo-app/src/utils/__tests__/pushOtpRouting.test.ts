import {
  OTP_CURRENT_ROUTE,
  OTP_DELIVERY_PUSH_TYPE,
  buildOtpRouteHref,
  extractOtpToken,
  isOtpDeliveryPushData,
  maskOtpTokenForLog,
  normalizeOtpPurpose,
} from '@/utils/pushOtpRouting';

describe('isOtpDeliveryPushData', () => {
  it('백엔드 canonical type otp_delivery 는 true', () => {
    expect(isOtpDeliveryPushData({ type: OTP_DELIVERY_PUSH_TYPE })).toBe(true);
  });

  it('purpose=login_verification 만 와도 OTP 로 인식', () => {
    expect(isOtpDeliveryPushData({ purpose: 'login_verification' })).toBe(true);
  });

  it('purpose=phone_change 도 OTP 로 인식', () => {
    expect(isOtpDeliveryPushData({ purpose: 'phone_change' })).toBe(true);
  });

  it('purpose 대문자 alias "OTP" 호환 (사용자 표기)', () => {
    expect(isOtpDeliveryPushData({ purpose: 'OTP' })).toBe(true);
    expect(isOtpDeliveryPushData({ purpose: ' otp ' })).toBe(true);
  });

  it('일반 booking_reminder 는 false', () => {
    expect(isOtpDeliveryPushData({ type: 'booking_reminder' })).toBe(false);
  });

  it('data 가 null/undefined 면 false', () => {
    expect(isOtpDeliveryPushData(null)).toBe(false);
    expect(isOtpDeliveryPushData(undefined)).toBe(false);
  });

  it('비문자열 type/purpose 는 false', () => {
    expect(isOtpDeliveryPushData({ type: 123 } as unknown as Record<string, unknown>)).toBe(false);
    expect(
      isOtpDeliveryPushData({ purpose: { code: 'phone_change' } } as unknown as Record<
        string,
        unknown
      >),
    ).toBe(false);
  });
});

describe('extractOtpToken', () => {
  it('정상 토큰 trim', () => {
    expect(extractOtpToken({ otpToken: '  tok-abcde  ' })).toBe('tok-abcde');
  });

  it('빈 문자열·미존재는 null', () => {
    expect(extractOtpToken({ otpToken: '   ' })).toBeNull();
    expect(extractOtpToken({})).toBeNull();
    expect(extractOtpToken(null)).toBeNull();
  });

  it('비문자열은 null', () => {
    expect(extractOtpToken({ otpToken: 12345 } as unknown as Record<string, unknown>)).toBeNull();
  });
});

describe('normalizeOtpPurpose', () => {
  it('알 수 없는 purpose 는 generic', () => {
    expect(normalizeOtpPurpose({ purpose: 'something_else' })).toBe('generic');
    expect(normalizeOtpPurpose({})).toBe('generic');
    expect(normalizeOtpPurpose(null)).toBe('generic');
  });

  it('소문자 표준 코드는 그대로', () => {
    expect(normalizeOtpPurpose({ purpose: 'phone_change' })).toBe('phone_change');
    expect(normalizeOtpPurpose({ purpose: 'LOGIN_VERIFICATION' })).toBe('login_verification');
  });
});

describe('buildOtpRouteHref', () => {
  it('otpToken·purpose 동봉 시 모두 라우트 params 에 전달', () => {
    const href = buildOtpRouteHref({
      type: OTP_DELIVERY_PUSH_TYPE,
      otpToken: 'token-abc',
      purpose: 'phone_change',
    });
    expect(href.pathname).toBe(OTP_CURRENT_ROUTE);
    expect(href.params.otpToken).toBe('token-abc');
    expect(href.params.purpose).toBe('phone_change');
  });

  it('otpToken 부재 시에도 라우트는 항상 반환 (화면 폴백 분기)', () => {
    const href = buildOtpRouteHref({ type: OTP_DELIVERY_PUSH_TYPE });
    expect(href.pathname).toBe(OTP_CURRENT_ROUTE);
    expect(href.params.otpToken).toBeUndefined();
    expect(href.params.purpose).toBe('generic');
  });
});

describe('maskOtpTokenForLog', () => {
  it('null/undefined 는 (none)', () => {
    expect(maskOtpTokenForLog(null)).toBe('(none)');
    expect(maskOtpTokenForLog(undefined)).toBe('(none)');
  });

  it('6자 이하는 ***', () => {
    expect(maskOtpTokenForLog('abc')).toBe('***');
    expect(maskOtpTokenForLog('abcdef')).toBe('***');
  });

  it('7자 이상은 앞 4자만 노출', () => {
    expect(maskOtpTokenForLog('abcdefghij')).toBe('abcd…(10)');
  });
});
