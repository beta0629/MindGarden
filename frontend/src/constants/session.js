import { SESSION_CHECK_INTERVAL_MS } from './clientPollingIntervals';

/**
 * 세션 관리 상수 — 세션 확인 간격, 타임아웃, idle 경고 임계값 등.
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2024-12-19
 */

// 세션 확인 간격 (밀리초)
export const SESSION_CHECK_INTERVAL = SESSION_CHECK_INTERVAL_MS;

/**
 * HTTP 세션 **만료 시각** 기준 idle 경고: 모달은
 * `만료 시각 - SESSION_IDLE_WARNING_MS`(기본 **만료 1분 전**)에 표시.
 * (SessionIdleWarningModal: `warnAtMs = expiryMs - SESSION_IDLE_WARNING_MS`)
 */
export const SESSION_IDLE_WARNING_MS = 60 * 1000;

// 세션 확인 타임아웃 (밀리초)
export const SESSION_CHECK_TIMEOUT = 10 * 1000; // 10초

/**
 * checkSession 호출자가 기다리는 상한.
 * fetch AbortSignal(SESSION_CHECK_TIMEOUT)이 안 풀리는 경우(중복 in-flight, refresh 대기)에도
 * 로그인 버튼의 '처리중'이 이 시간 넘게 고정되지 않게 한다.
 */
export const SESSION_CHECK_CALLER_CAP_MS = SESSION_CHECK_TIMEOUT + 2 * 1000;

/** 401/403 후 current-user 재확인 fetch 재시도 간격(백오프). 횟수 = 배열 길이만큼 재시도. */
export const SESSION_VERIFY_FETCH_RETRY_DELAYS_MS = [300, 700];

// 로그인 후 세션 확인 지연 시간 (밀리초)
export const LOGIN_SESSION_CHECK_DELAY = 100; // 100ms

// remount 시 최근 체크 후 이 시간 이내면 checkSession 스킵 (무한루프 방지)
export const SESSION_CHECK_RECENT_SKIP_MS = 1000; // 1초

// SessionContext/sessionManager 공통: 이 시간 이내 중복 checkSession 완전 차단 (무한루프 근본 방지)
export const SESSION_CHECK_COOLDOWN_MS = 3000; // 3초

/**
 * 타이핑·포인터·이동 등 활동 시 서버 HttpSession lastAccessedTime 갱신용 스로틀 간격.
 * SESSION_CHECK_COOLDOWN_MS(3s)보다 길고, 키보드·마우스 어느 쪽이든 UI 리필이 체감되도록 30–60초 구간을 사용한다.
 * mousemove/pointermove도 동일 간격으로만 ping한다(픽셀 단위 API 금지).
 */
export const SESSION_ACTIVITY_PING_INTERVAL_MS = 45 * 1000;

/**
 * SessionContext 활동 ping에 등록하는 DOM 이벤트(공유 스로틀).
 * 키보드·마우스·터치·스크롤·휠 모두 동일 onActivity → silent checkSession.
 * (일부 환경에서 scroll이 document에 전달되지 않아 wheel로 보완)
 */
export const SESSION_ACTIVITY_EVENTS = Object.freeze([
  'keydown',
  'input',
  'pointerdown',
  'click',
  'scroll',
  'wheel',
  'touchstart',
  'mousemove',
  'pointermove'
]);

/**
 * 로그인·회원가입·OAuth 콜백 등 — 세션 연장 ping·idle 경고에서 제외할 공개 경로.
 * @param {string} pathname
 * @returns {boolean}
 */
export function isSessionPublicPath(pathname) {
  if (pathname == null || typeof pathname !== 'string') {
    return true;
  }
  return (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/landing' ||
    pathname === '/' ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/tablet/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth/oauth2/callback')
  );
}

// 기존 세션 확인 지연 시간 (밀리초) - 로그인 페이지에서 세션 체크
export const EXISTING_SESSION_CHECK_DELAY = 500; // OAuth2 콜백 후 세션 쿠키 설정 대기

// 정기 세션 확인 간격 (밀리초)
export const PERIODIC_SESSION_CHECK_INTERVAL = 10 * 60 * 1000; // 10분

// 세션 만료 시간 폴백 (밀리초) — SSOT: HTTP_SESSION_MAX_INACTIVE / server.servlet.session.timeout(기본 4h).
// 런타임 idle 경고는 session-info.maxInactiveInterval 우선 (SessionIdleWarningModal).
export const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4시간 (14400000ms)

/**
 * 세션 잔여/만료 시각 UI 표시 상수
 * (UnifiedHeader·ProfileDropdown GNB·MyPage·SessionIdleWarningModal).
 * JWT·쿠키 원문은 표시하지 않는다.
 */
export const SESSION_REMAINING_DISPLAY = Object.freeze({
  LABEL_PREFIX: '세션 잔여',
  EXPIRY_PREFIX: '만료 시각',
  COUNTDOWN_LABEL: '남은 시간',
  TICK_MS: 1000,
  ARIA_LABEL: '세션 잔여 시간',
  CLASS_NAME: 'mg-header__session-remaining',
  MODAL_EXPIRY_CLASS: 'session-idle-warning__expiry'
});

// 세션 키 상수
export const SESSION_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_INFO: 'user',
  LOGIN_TIME: 'loginTime',
  SESSION_EXPIRY: 'sessionExpiry'
};

// 역할별 대시보드 경로 (권한 격리: 링크만으로 타 역할 대시보드 접근 방지용)
export const DASHBOARD_PATHS = {
  CLIENT: '/client/dashboard',
  CONSULTANT: '/consultant/dashboard',
  ADMIN: '/admin/dashboard',
  STAFF: '/admin/dashboard',
  BRANCH_SUPER_ADMIN: '/super_admin/dashboard',
  SUPER_ADMIN: '/super_admin/dashboard'
};

/**
 * 레거시 role → DASHBOARD_PATHS 키 (roles.js import 금지: ajax/session ESLint 순환 방지).
 * HQ_ADMIN/TENANT_ADMIN 등은 ADMIN 대시보드로 매핑.
 */
const LEGACY_ROLE_TO_DASHBOARD_KEY = Object.freeze({
  SUPER_ADMIN: 'ADMIN',
  HQ_ADMIN: 'ADMIN',
  HQ_MASTER: 'ADMIN',
  SUPER_HQ_ADMIN: 'ADMIN',
  BRANCH_ADMIN: 'ADMIN',
  TENANT_ADMIN: 'ADMIN',
  PRINCIPAL: 'ADMIN',
  OWNER: 'ADMIN',
  PLAY_THERAPIST: 'CONSULTANT',
  SPEECH_THERAPIST: 'CONSULTANT',
  ROLE_CONSULTANT: 'CONSULTANT',
  ROLE_CLIENT: 'CLIENT'
});

const resolveDashboardRoleKey = (role) => {
  if (role == null || role === '') {
    return 'CLIENT';
  }
  const normalized = String(role).trim().toUpperCase();
  if (DASHBOARD_PATHS[normalized]) {
    return normalized;
  }
  return LEGACY_ROLE_TO_DASHBOARD_KEY[normalized] || 'ADMIN';
};

/** 역할에 맞는 대시보드 경로 반환 (세션/권한 체크 후 리다이렉트용) */
export function getDashboardPathByRole(role) {
  const dashboardKey = resolveDashboardRoleKey(role);
  return DASHBOARD_PATHS[dashboardKey] || DASHBOARD_PATHS.CLIENT;
}

// 기본 대시보드 경로
export const DEFAULT_DASHBOARD_PATH = DASHBOARD_PATHS.CLIENT;

/**
 * current-user 401 — 서버가 중복 로그인으로 기존 세션을 종료했을 때 errorCode.
 * BE {@code SessionManagementConstants.ERROR_CODE_SESSION_TERMINATED_DUPLICATE} 와 정합.
 */
export const SESSION_TERMINATED_DUPLICATE_ERROR_CODE = 'SESSION_TERMINATED_DUPLICATE';

/** 중복 로그인 피해 세션 로그인 리다이렉트 query (선행 ? 포함) */
export const DUPLICATE_LOGIN_REDIRECT_SEARCH = '?reason=duplicate-login';

/** URL searchParam {@code reason} 값 — 중복 로그인 안내 */
export const DUPLICATE_LOGIN_REASON_VALUE = 'duplicate-login';

/**
 * 로그인 직후 parallel XHR(브랜딩·LNB·공통코드) 401 레이스 완화용 TTL.
 * one-shot removeItem 대신 이 창 안에서는 /login 킥을 스킵한다.
 */
export const JUST_LOGGED_IN_TTL_MS = 20 * 1000;

/** sessionStorage 키 — 로그인 직후 플래그 */
export const JUST_LOGGED_IN_KEY = 'justLoggedIn';

/** sessionStorage 키 — justLoggedIn 설정 시각(ms epoch 문자열) */
export const JUST_LOGGED_IN_AT_KEY = 'justLoggedInAt';

/**
 * refresh-token 200 직후 burst(current-user 재검증 레이스) 완화용 TTL.
 * 이 창 안에서는 후속 current-user 401 로 /login 킥하지 않는다.
 */
export const JUST_REFRESHED_TTL_MS = 12 * 1000;

/** sessionStorage 키 — 토큰 갱신 직후 플래그 */
export const JUST_REFRESHED_KEY = 'justRefreshed';

/** sessionStorage 키 — justRefreshed 설정 시각(ms epoch 문자열) */
export const JUST_REFRESHED_AT_KEY = 'justRefreshedAt';

/**
 * shell chrome API — 401/403 이어도 /login 으로 리다이렉트하지 않음 (soft-fail).
 * path substring 매칭, query string 무시. 전체 API 로 확대 금지.
 * 회기(mappings)·샵(active-codes)·current-user 는 절대 포함하지 않는다.
 */
export const SESSION_SOFT_FAIL_URL_PATHS = Object.freeze([
  '/api/v1/admin/branding',
  '/api/admin/branding',
  '/api/v1/menus/lnb',
  '/api/v1/menus/user',
  '/api/v1/menus/admin',
  '/api/v1/common-codes',
  '/api/v1/consultation-messages/unread-count',
  '/api/v1/notifications/unread-count'
]);

/**
 * BE SessionSecurityFlagKeys 기본값과 정합 (로드 실패·캐시 전).
 * require-server-verify=true, background-401.keep-user=false, soft-fail=true.
 */
export const SESSION_SECURITY_FLAG_DEFAULTS = Object.freeze({
  oauthRequireServerVerify: true,
  background401KeepUser: false,
  softFailEnabled: true
});

/** FE 세션 보안 플래그 캐시 TTL — BE CACHE_TTL_MS(30s) 와 정합 */
export const SESSION_SECURITY_FLAGS_CACHE_TTL_MS = 30 * 1000;

/** 세션 보안 플래그 API (permitAll) */
export const SESSION_SECURITY_FLAGS_PATH = '/api/v1/auth/session-security-flags';

/**
 * OAuth 콜백 서버 검증 실패 시 사용자 안내.
 */
export const OAUTH_SERVER_VERIFY_FAILED_MESSAGE =
  '로그인 세션을 확인하지 못했습니다. 다시 로그인해 주세요.';

/**
 * 웹 SNS OAuth 성공 콜백에 accessToken 이 없을 때 (팬텀 로그인 차단).
 */
export const OAUTH_ACCESS_TOKEN_REQUIRED_MESSAGE =
  '로그인 토큰을 받지 못했습니다. 다시 로그인해 주세요.';