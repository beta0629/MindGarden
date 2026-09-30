/**
 * 설정 화면 인증 경로 returnTo — 인증 성공 후 원래 화면으로 돌아가기.
 * 외부 URL·프로토콜 상대 경로는 허용하지 않는다 (오픈 리다이렉트 방지).
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import { CLIENT_MALL_QUERY, CLIENT_MALL_ROUTES } from '../constants/clientMallConstants';

const CLIENT_PATH_PREFIX = '/client/';

/**
 * @param {string|null|undefined} value
 * @returns {string} 안전한 내부 경로 또는 ''
 */
export const sanitizeClientReturnTo = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith(CLIENT_PATH_PREFIX) || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return '';
  }
  return trimmed;
};

/**
 * @param {string} returnTo 현재 화면 경로(쿼리 포함 가능)
 * @returns {string} /client/settings?returnTo=...
 */
export const buildSettingsPathWithReturnTo = (returnTo) => {
  const safe = sanitizeClientReturnTo(returnTo);
  if (!safe) {
    return CLIENT_MALL_ROUTES.SETTINGS;
  }
  return `${CLIENT_MALL_ROUTES.SETTINGS}?${CLIENT_MALL_QUERY.RETURN_TO}=${encodeURIComponent(safe)}`;
};

/**
 * @param {string} search location.search
 * @returns {string} 안전한 returnTo 또는 ''
 */
export const readReturnToFromSearch = (search) => {
  try {
    const params = new URLSearchParams(search || '');
    return sanitizeClientReturnTo(params.get(CLIENT_MALL_QUERY.RETURN_TO));
  } catch {
    return '';
  }
};
