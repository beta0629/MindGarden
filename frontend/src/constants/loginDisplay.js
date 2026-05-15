/**
 * 표준 로그인 화면 문구 (하드코딩 분산 방지)
 */
export const LOGIN_IDENTIFIER_LABEL = '이메일 또는 휴대폰 번호';
export const LOGIN_IDENTIFIER_PLACEHOLDER = '이메일 또는 휴대폰 번호를 입력하세요';
export const LOGIN_IDENTIFIER_PASSWORD_REQUIRED =
  '이메일 또는 휴대폰 번호와 비밀번호를 입력해주세요.';

/** 접근성·헬퍼: 단일 필드에 이메일·휴대폰 모두 입력 가능함을 안내 */
export const LOGIN_IDENTIFIER_FIELD_HINT =
  '같은 칸에 이메일 또는 휴대폰 번호(숫자)를 입력할 수 있습니다.';

/**
 * 이메일·휴대폰 또는 비밀번호 불일치 시 안내 (보안상 어느 쪽이 틀렸는지 구분하지 않음)
 * 로그인 UI·AUTH_MESSAGES·태블릿 상수 등에서 동일 문구로 사용
 */
export const LOGIN_CREDENTIALS_MISMATCH_MESSAGE =
  '이메일(또는 휴대폰 번호) 또는 비밀번호가 올바르지 않습니다. 입력하신 정보를 다시 확인해 주세요.';

/** 마이페이지 등: 소셜 → 기존 계정 연결(통합) 모드 안내 */
export const OAUTH_ACCOUNT_LINK_PROMPT =
  '소셜 인증이 완료되었습니다. 아래에서 기존 계정과 연결해 주세요.';

/** 웹 OAuth 콜백: (a)~(d) 매칭 등 기존 계정으로 세션이 완료된 경우 — “신규 가입” 오해 완화 */
export const OAUTH_WEB_LOGIN_SUCCESS_LINKED_ACCOUNT =
  '기존 계정으로 로그인되었습니다. 이후에는 같은 카카오·네이버 버튼으로 로그인해 주세요.';

/** 소셜 인증은 됐으나 테넌트 미등록 등으로 간편가입(약관)만 남은 경우 — success 토스트 금지 */
export const OAUTH_SIGNUP_REQUIRED_PROMPT =
  '소셜 인증은 완료되었습니다. 아래에서 간편 가입(약관 동의)을 마쳐 주세요.';

/** 소셜 간편가입 제출 성공 후 — JWT 없이 로그인 화면으로 보낼 때(SSOT §4.1) */
export const OAUTH_POST_SIGNUP_LOGIN_REMINDER =
  '가입이 반영되었습니다. 방금 사용한 소셜 버튼으로 다시 로그인해 주세요.';

/** 통합·모바일 로그인 허브 소셜 버튼 라벨(태블릿·데스크톱과 통일) */
export const OAUTH_SOCIAL_BUTTON_KAKAO = '카카오로 로그인';
export const OAUTH_SOCIAL_BUTTON_NAVER = '네이버로 로그인';

/** 로그인 허브: SNS 우선 정책(SSOT §4.3·§4.4) 한 줄 안내 */
export const LOGIN_HUB_SNS_PRIMARY_HINT =
  '로그인은 카카오·네이버 버튼을 기본으로 이용해 주세요.';

/** 간편가입 모달: SNS 재방문 vs 이메일 로그인 보조 */
export const SOCIAL_SIGNUP_CHANNEL_HELP =
  '이후 로그인은 동일 소셜 버튼을 이용합니다. 이메일·비밀번호 로그인은 보조 수단입니다.';
