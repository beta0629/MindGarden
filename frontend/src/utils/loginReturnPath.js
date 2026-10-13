/**
 * 로그인 후 원래 화면으로 돌아가기 — 공통 로그인 착지점({@link redirectToDynamicDashboard})이 쓴다.
 *
 * <p>돌아갈 주소는 {@code /login?redirect=...} 쿼리, 또는 소셜 로그인처럼 외부 인증 화면을 다녀오는 동안
 * sessionStorage 에 잠깐 맡긴 값에서 읽는다. 두 경우 모두 {@link sanitizeSameOriginReturnPath} 를 통과한
 * 같은 오리진 내부 경로만 쓰며(외부 URL·{@code //}·스킴·역슬래시·인코딩 우회 차단), 로그인·로그아웃·OAuth 경로로는 돌려보내지 않는다.
 * 로그인한 사용자 역할의 허용 접두(예: 내담자 {@code /client/}) 밖이면 쓰지 않는다. 저장소에는 토큰을 뺀 경로만 남기고 쓰면 지운다.</p>
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

/** 돌아가면 다시 로그인·로그아웃 흐름이 되는 경로 — 복귀 대상에서 뺀다(무한 반복 방지) */
const LOGIN_FLOW_PATH_PREFIXES = Object.freeze([
  '/login', '/logout', '/auth', '/oauth2', '/oauth-account-selection', '/mobile-login', '/tenant-selection'
]);

/** 복귀 주소 쿼리에서 버리는 키(토큰·인증·개인정보). 소문자 비교 */
const SENSITIVE_QUERY_KEYS = Object.freeze([
  'token', 'access_token', 'accesstoken', 'refresh_token', 'refreshtoken', 'id_token', 'idtoken', 'jwt',
  'code', 'state', 'session', 'sessionid', 'password', 'pw', 'otp', 'phone', 'email', 'auth', 'authorization',
  'secret', 'key', 'apikey', 'api_key', 'signature', 'sig'
]);

/** 인코딩을 여러 겹 풀어도 이런 모양이면 막는다: //, 역슬래시, 스킴(xxx:), 경로 상위 이동 */
const ENCODED_DECODE_DEPTH = 3;
const isUnsafeDecoded = (value) => /^\s*\/\/|\\|^[a-z][a-z0-9+.-]*:|(^|\/)\.\.(\/|$)/i.test(value);

const hasUnsafeEncoding = (value) => {
  let current = value;
  for (let i = 0; i < ENCODED_DECODE_DEPTH; i += 1) {
    let decoded;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      return true;
    }
    if (isUnsafeDecoded(decoded)) return true;
    if (decoded === current) return false;
    current = decoded;
  }
  return /%[0-9a-f]{2}/i.test(current);
};

const isLoginFlowPath = (pathname) => {
  const lower = pathname.toLowerCase();
  return LOGIN_FLOW_PATH_PREFIXES.some((prefix) => lower === prefix || lower.startsWith(`${prefix}/`));
};

const stripSensitiveQuery = (search) => {
  const params = new URLSearchParams(search);
  [...params.keys()].forEach((k) => {
    const lower = k.toLowerCase();
    if (SENSITIVE_QUERY_KEYS.some((s) => lower === s || lower.endsWith(`_${s}`) || lower.includes('token'))) {
      params.delete(k);
    }
  });
  const out = params.toString();
  return out ? `?${out}` : '';
};

/**
 * 돌아갈 주소로 쓸 수 있는 내부 경로만 남긴다(역할 검사 전 단계).
 * 같은 오리진·{@code /}로 시작·{@code //}·역슬래시·스킴·여러 겹 인코딩 우회 차단, 로그인·로그아웃 경로 제외,
 * 토큰·개인정보 쿼리와 해시(#)는 버린다.
 *
 * @param {unknown} value
 * @returns {string} 안전한 내부 경로, 아니면 빈 문자열
 */
export const sanitizeLoginReturnPath = (value) => {
  if (typeof value !== 'string' || hasUnsafeEncoding(value.trim())) return '';
  const safe = sanitizeSameOriginReturnPath(value);
  if (!safe) return '';
  let url;
  try {
    url = new URL(safe, window.location.origin);
  } catch {
    return '';
  }
  if (hasUnsafeEncoding(url.pathname) || isLoginFlowPath(url.pathname)) return '';
  return `${url.pathname}${stripSensitiveQuery(url.search)}`;
};

/**
 * 역할 허용 목록 검사: 경로가 허용 접두(예: 내담자 {@code /client/}) 아래일 때만 통과.
 *
 * @param {string} path {@link sanitizeLoginReturnPath} 를 지난 경로
 * @param {ReadonlyArray<string>} allowedPrefixes 예: ['/client/']
 * @returns {boolean}
 */
export const isReturnPathAllowedForPrefixes = (path, allowedPrefixes) => {
  if (!path || !Array.isArray(allowedPrefixes) || allowedPrefixes.length === 0) return false;
  const pathname = path.split('?')[0];
  return allowedPrefixes.some((prefix) => typeof prefix === 'string' && prefix.endsWith('/')
    && (pathname.startsWith(prefix) || `${pathname}/` === prefix));
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
 * 역할 허용 접두 밖이면 빈 문자열(호출자가 역할 기본 화면으로 보낸다).
 *
 * @param {ReadonlyArray<string>} allowedPrefixes 이 사용자에게 허용된 경로 접두
 * @returns {string} 내부 경로, 없거나 허용 밖이면 빈 문자열
 */
export const consumeLoginReturnPath = (allowedPrefixes) => {
  const fromUrl = readLoginReturnPathFromUrl();
  const fromStorage = readStored();
  removeStored();
  const path = fromUrl || fromStorage;
  return isReturnPathAllowedForPrefixes(path, allowedPrefixes) ? path : '';
};
