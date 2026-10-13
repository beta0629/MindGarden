/**
 * 로그인 후 원래 화면으로 돌아가기 — 공통 로그인 착지점({@link redirectToDynamicDashboard})이 쓴다.
 *
 * <p>돌아갈 주소는 {@code /login?redirect=...} 쿼리, 또는 소셜 로그인처럼 외부 인증 화면을 다녀오는 동안
 * sessionStorage 에 잠깐 맡긴 값에서 읽는다. 두 경우 모두 {@link sanitizeSameOriginReturnPath} 를 통과한
 * 같은 오리진 내부 경로만 쓰며(외부 URL·{@code //}·스킴·역슬래시 차단), 로그인·OAuth 콜백 경로로는 돌려보내지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-13
 */

import { LOGIN_RETURN_URL_PARAM } from '../constants/consultationLogAutosaveConstants';
import { sanitizeSameOriginReturnPath } from './sessionRedirect';

/** 소셜 로그인 왕복 동안 돌아갈 주소를 맡기는 sessionStorage 키 */
export const LOGIN_RETURN_PATH_STORAGE_KEY = 'mg.loginReturnPath';

/** 맡긴 주소 유효 시간 — 지나면 버린다(오래된 값이 다음 로그인 착지를 바꾸지 않게) */
export const LOGIN_RETURN_PATH_TTL_MS = 10 * 60 * 1000;

/** 돌아가면 다시 로그인 흐름이 되는 경로 — 복귀 대상에서 뺀다 */
const LOGIN_FLOW_PATH_PREFIXES = Object.freeze(['/login', '/auth/oauth2', '/oauth2/callback', '/oauth-account-selection']);

const isLoginFlowPath = (path) => {
  const pathname = path.split(/[?#]/)[0];
  return LOGIN_FLOW_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
};

/**
 * 돌아갈 주소로 쓸 수 있는 내부 경로만 남긴다.
 *
 * @param {unknown} value
 * @returns {string} 안전한 내부 경로, 아니면 빈 문자열
 */
export const sanitizeLoginReturnPath = (value) => {
  const safe = sanitizeSameOriginReturnPath(value);
  if (!safe || isLoginFlowPath(safe)) return '';
  return safe;
};

/** @returns {string} 현재 주소의 {@code ?redirect=} 값(검증 통과분), 없으면 빈 문자열 */
export const readLoginReturnPathFromUrl = () => {
  try {
    return sanitizeLoginReturnPath(new URLSearchParams(window.location.search || '').get(LOGIN_RETURN_URL_PARAM));
  } catch {
    return '';
  }
};

const removeStored = () => {
  try {
    window.sessionStorage.removeItem(LOGIN_RETURN_PATH_STORAGE_KEY);
  } catch {
    /* private mode 등 */
  }
};

/**
 * 외부 인증 화면으로 떠나기 직전, 현재 주소의 {@code ?redirect=} 를 맡긴다. 값이 없거나 안전하지 않으면 지운다.
 */
export const rememberLoginReturnPathFromUrl = () => {
  const path = readLoginReturnPathFromUrl();
  if (!path) {
    removeStored();
    return;
  }
  try {
    window.sessionStorage.setItem(LOGIN_RETURN_PATH_STORAGE_KEY, JSON.stringify({ path, savedAt: Date.now() }));
  } catch {
    /* 저장 불가면 기존 동작(역할 대시보드) */
  }
};

const readStored = () => {
  try {
    const raw = window.sessionStorage.getItem(LOGIN_RETURN_PATH_STORAGE_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    const savedAt = Number(parsed?.savedAt);
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > LOGIN_RETURN_PATH_TTL_MS || Date.now() < savedAt) return '';
    return sanitizeLoginReturnPath(parsed?.path);
  } catch {
    return '';
  }
};

/**
 * 로그인 성공 직후 돌아갈 주소를 꺼낸다(한 번 쓰면 맡긴 값은 지운다). 주소 쿼리가 맡긴 값보다 우선한다.
 *
 * @returns {string} 내부 경로, 없으면 빈 문자열
 */
export const consumeLoginReturnPath = () => {
  const fromUrl = readLoginReturnPathFromUrl();
  const fromStorage = readStored();
  removeStored();
  return fromUrl || fromStorage;
};
