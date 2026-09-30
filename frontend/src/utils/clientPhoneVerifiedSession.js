/**
 * 휴대폰 인증 성공 → 세션 사용자에 번호·인증 플래그 반영 (결제 게이트가 같은 user 를 읽도록).
 * sessionManager 는 서버가 verified 를 생략하면 이전 true 를 보존한다.
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import sessionManager from './sessionManager';

/**
 * @param {{
 *   phoneDigits: string,
 *   phoneVerifiedAt?: string|null,
 *   checkSession?: (force?: boolean, options?: object) => Promise<*>
 * }} params
 * @returns {Promise<void>}
 */
export const applyVerifiedPhoneToSession = async({ phoneDigits, phoneVerifiedAt = null, checkSession }) => {
  const base = sessionManager.getUser?.() || sessionManager.user || {};
  const patched = {
    ...base,
    phone: phoneDigits,
    phoneNumber: phoneDigits,
    mobile: phoneDigits,
    isPhoneVerified: true,
    phoneVerified: true,
    ...(phoneVerifiedAt != null ? { phoneVerifiedAt } : {})
  };
  if (typeof sessionManager.setUser === 'function') {
    sessionManager.setUser(patched);
  } else {
    sessionManager.user = patched;
    if (typeof sessionManager.notifyListeners === 'function') {
      sessionManager.notifyListeners();
    }
  }
  if (typeof checkSession === 'function') {
    await checkSession(true, { silent: true });
  }
};
