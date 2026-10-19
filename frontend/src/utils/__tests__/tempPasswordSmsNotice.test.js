/**
 * 문자 발송 결과 문구는 번역 키만 반환하고 응답 필드를 그대로 싣지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-19
 */

import { tempPasswordSmsNotice } from '../tempPasswordSmsNotice';

const t = (key) => key;

const CREDENTIAL_FIELDS = ['accessToken', 'refreshToken', 'smsSkipReason'];

describe('tempPasswordSmsNotice', () => {
  test('payload 가 없거나 smsSent 키가 없으면 null', () => {
    expect(tempPasswordSmsNotice(t, null)).toBeNull();
    expect(tempPasswordSmsNotice(t, undefined)).toBeNull();
    expect(tempPasswordSmsNotice(t, {})).toBeNull();
    expect(tempPasswordSmsNotice(t, { smsSkipReason: 'PHONE_MISSING' })).toBeNull();
  });

  test('smsSent true 이면 발송 완료 키', () => {
    expect(tempPasswordSmsNotice(t, { smsSent: true })).toBe('auth:tempPasswordSms.sent');
  });

  test('전화번호 없음이면 phoneMissing 키', () => {
    expect(tempPasswordSmsNotice(t, { smsSent: false, smsSkipReason: 'PHONE_MISSING' }))
      .toBe('auth:tempPasswordSms.phoneMissing');
  });

  test('발송 실패이면 failed 키', () => {
    expect(tempPasswordSmsNotice(t, { smsSent: false, smsSkipReason: 'SEND_FAILED' }))
      .toBe('auth:tempPasswordSms.failed');
  });

  test('반환 문자열에 자격 증명 필드가 없다', () => {
    const samples = [
      null,
      {},
      { smsSent: true, accessToken: 'access-1', refreshToken: 'refresh-1' },
      { smsSent: false, smsSkipReason: 'PHONE_MISSING', accessToken: 'access-1' },
      { smsSent: false, smsSkipReason: 'SEND_FAILED', refreshToken: 'refresh-1' }
    ];

    samples.forEach((payload) => {
      const text = tempPasswordSmsNotice(t, payload);
      if (text == null) {
        return;
      }
      CREDENTIAL_FIELDS.forEach((field) => {
        expect(text).not.toContain(field);
      });
      expect(text).not.toContain('access-1');
      expect(text).not.toContain('refresh-1');
    });
  });
});
