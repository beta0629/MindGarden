const REASON_PHONE_MISSING = 'PHONE_MISSING';

/**
 * 등록·초기화 응답의 문자 발송 결과 문구. 비밀번호는 포함하지 않는다.
 *
 * @param {(key: string) => string} t i18n
 * @param {{ smsSent?: boolean, smsSkipReason?: string } | null | undefined} payload
 * @returns {string | null} 결과에 문자 필드가 없으면 null
 */
export function tempPasswordSmsNotice(t, payload) {
  if (!payload || typeof payload !== 'object' || !('smsSent' in payload)) {
    return null;
  }
  if (payload.smsSent === true) {
    return t('auth:tempPasswordSms.sent');
  }
  if (payload.smsSkipReason === REASON_PHONE_MISSING) {
    return t('auth:tempPasswordSms.phoneMissing');
  }
  return t('auth:tempPasswordSms.failed');
}
