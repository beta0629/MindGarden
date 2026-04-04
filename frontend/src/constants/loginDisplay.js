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
