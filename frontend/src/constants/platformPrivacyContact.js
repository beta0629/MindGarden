/**
 * 플랫폼 개인정보처리방침 문의처 — 빌드 환경변수로만 주입한다.
 *
 * 특정 테넌트(센터) 연락처를 소스에 두지 않는다. 값이 없으면 안내 문구만 노출한다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

/** 값이 비어 있을 때 노출하는 안내 */
export const PRIVACY_CONTACT_FALLBACK_TEXT = '이용 중인 센터 또는 플랫폼 고객센터로 문의해 주세요.';

const readEnv = (value) => (typeof value === 'string' ? value.trim() : '');

/**
 * @returns {{ email: string, phone: string }} 비어 있으면 안내 문구
 */
export function getPlatformPrivacyContact() {
  const email = readEnv(process.env.REACT_APP_PRIVACY_CONTACT_EMAIL);
  const phone = readEnv(process.env.REACT_APP_PRIVACY_CONTACT_PHONE);
  return {
    email: email || PRIVACY_CONTACT_FALLBACK_TEXT,
    phone: phone || PRIVACY_CONTACT_FALLBACK_TEXT
  };
}
