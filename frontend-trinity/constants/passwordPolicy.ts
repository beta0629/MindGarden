/**
 * 로그인 비밀번호 저장 정책 UI·클라이언트 검증
 * SSOT: frontend/src/constants/passwordPolicyUi.js
 * 백엔드: com.coresolution.core.security.PasswordPolicy
 *
 * @author CoreSolution
 */

/** @see PasswordPolicy.LOGIN_PASSWORD_MIN_LENGTH */
export const LOGIN_PASSWORD_MIN_LENGTH = 8;

/** @see PasswordPolicy.LOGIN_PASSWORD_MAX_LENGTH */
export const LOGIN_PASSWORD_MAX_LENGTH = 100;

/** @see PasswordPolicy.LOGIN_PASSWORD_ALLOWED_SPECIALS */
export const LOGIN_PASSWORD_ALLOWED_SPECIALS = '@$!%*?&';

const LOGIN_CHARSET_PATTERN = /^[A-Za-z\d@$!%*?&]+$/;

const COMMON_SUBSTRINGS = [
  'password', '123456', 'qwerty', 'admin', 'user',
  'password123', 'admin123', 'test123', 'hello123',
  'welcome', 'login', 'letmein', 'master', 'secret',
];

export const LOGIN_PASSWORD_POLICY_HINT_ONE_LINE =
  `8~${LOGIN_PASSWORD_MAX_LENGTH}자, 영문 대·소문자·숫자·특수문자(${LOGIN_PASSWORD_ALLOWED_SPECIALS}) 각 1자 이상, `
  + '연속 문자(예: abc, 123)·동일 문자 3회 반복·일반적인 단어·패턴은 사용할 수 없습니다.';

export const LOGIN_PASSWORD_FIELD_PLACEHOLDER =
  `영문 대·소문자·숫자·${LOGIN_PASSWORD_ALLOWED_SPECIALS} 포함 8~${LOGIN_PASSWORD_MAX_LENGTH}자`;

export type LoginPasswordViolationCode =
  | 'tooShort'
  | 'tooLong'
  | 'invalidCharacters'
  | 'lowercaseRequired'
  | 'uppercaseRequired'
  | 'digitRequired'
  | 'specialRequired'
  | 'consecutiveForbidden'
  | 'repeatedForbidden'
  | 'commonPattern';

export interface LoginPasswordViolation {
  code: LoginPasswordViolationCode;
  message: string;
}

export interface LoginPasswordChecklistItem {
  id: string;
  label: string;
  met: boolean;
}

export const PASSWORD_STRENGTH_LEVELS = {
  NONE: 0,
  WEAK: 1,
  FAIR: 2,
  STRONG: 3,
} as const;

export type PasswordStrengthLevel =
  typeof PASSWORD_STRENGTH_LEVELS[keyof typeof PASSWORD_STRENGTH_LEVELS];

export interface PasswordStrengthMeta {
  label: string;
  className: 'weak' | 'fair' | 'strong';
}

export const PASSWORD_STRENGTH_META: Record<
  Exclude<PasswordStrengthLevel, typeof PASSWORD_STRENGTH_LEVELS.NONE>,
  PasswordStrengthMeta
> = {
  [PASSWORD_STRENGTH_LEVELS.WEAK]: { label: '취약', className: 'weak' },
  [PASSWORD_STRENGTH_LEVELS.FAIR]: { label: '보통', className: 'fair' },
  [PASSWORD_STRENGTH_LEVELS.STRONG]: { label: '안전', className: 'strong' },
};

export const PASSWORD_STRENGTH_BAR_COUNT = 4;

function hasSequentialCharacters(password: string): boolean {
  for (let i = 0; i < password.length - 2; i += 1) {
    const c1 = password.charCodeAt(i);
    const c2 = password.charCodeAt(i + 1);
    const c3 = password.charCodeAt(i + 2);
    if (c1 + 1 === c2 && c2 + 1 === c3) {
      return true;
    }
    if (c1 - 1 === c2 && c2 - 1 === c3) {
      return true;
    }
  }
  return false;
}

function hasRepeatedCharacters(password: string): boolean {
  return /(.)\1{2,}/.test(password);
}

function isCommonPattern(password: string): boolean {
  if (password == null) {
    return false;
  }
  const lower = password.toLowerCase();
  return COMMON_SUBSTRINGS.some((p) => lower.includes(p));
}

/**
 * 로그인 저장 정책 위반 목록 (우선순위·메시지는 PasswordPolicy.collectLoginStorageViolations 와 동일).
 */
export function getLoginPasswordViolations(plain: string | null | undefined): LoginPasswordViolation[] {
  const password = plain == null ? '' : String(plain);
  const out: LoginPasswordViolation[] = [];

  if (password.length < LOGIN_PASSWORD_MIN_LENGTH) {
    out.push({
      code: 'tooShort',
      message: `비밀번호는 최소 ${LOGIN_PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`,
    });
    return out;
  }
  if (password.length > LOGIN_PASSWORD_MAX_LENGTH) {
    out.push({
      code: 'tooLong',
      message: `비밀번호는 최대 ${LOGIN_PASSWORD_MAX_LENGTH}자 이하여야 합니다.`,
    });
    return out;
  }
  if (!LOGIN_CHARSET_PATTERN.test(password)) {
    out.push({
      code: 'invalidCharacters',
      message:
        '비밀번호에 허용되지 않은 문자가 포함되어 있습니다. 특수문자는 '
        + `${LOGIN_PASSWORD_ALLOWED_SPECIALS}만 사용할 수 있습니다.`,
    });
    return out;
  }
  if (!/[a-z]/.test(password)) {
    out.push({ code: 'lowercaseRequired', message: '비밀번호는 최소 1개의 소문자를 포함해야 합니다.' });
    return out;
  }
  if (!/[A-Z]/.test(password)) {
    out.push({ code: 'uppercaseRequired', message: '비밀번호는 최소 1개의 대문자를 포함해야 합니다.' });
    return out;
  }
  if (!/\d/.test(password)) {
    out.push({ code: 'digitRequired', message: '비밀번호는 최소 1개의 숫자를 포함해야 합니다.' });
    return out;
  }
  if (!/[@$!%*?&]/.test(password)) {
    out.push({
      code: 'specialRequired',
      message: `비밀번호는 특수문자(${LOGIN_PASSWORD_ALLOWED_SPECIALS})를 최소 1개 포함해야 합니다.`,
    });
    return out;
  }
  if (hasSequentialCharacters(password)) {
    out.push({
      code: 'consecutiveForbidden',
      message: '비밀번호에 연속된 문자(abc, 123 등)를 사용할 수 없습니다.',
    });
    return out;
  }
  if (hasRepeatedCharacters(password)) {
    out.push({
      code: 'repeatedForbidden',
      message: '비밀번호에 동일한 문자가 3회 이상 반복될 수 없습니다.',
    });
    return out;
  }
  if (isCommonPattern(password)) {
    out.push({
      code: 'commonPattern',
      message: '일반적인 패턴의 비밀번호는 사용할 수 없습니다.',
    });
    return out;
  }
  return out;
}

export function getFirstLoginPasswordViolationMessage(plain: string | null | undefined): string | null {
  const list = getLoginPasswordViolations(plain);
  return list.length === 0 ? null : list[0].message;
}

export function isLoginPasswordValid(plain: string | null | undefined): boolean {
  return getLoginPasswordViolations(plain).length === 0;
}

/**
 * 온보딩 UI용 실시간 체크리스트 (Core Solution 공통 정책).
 */
export function getLoginPasswordChecklistItems(plain: string | null | undefined): LoginPasswordChecklistItem[] {
  const password = plain == null ? '' : String(plain);

  return [
    {
      id: 'length',
      label: `${LOGIN_PASSWORD_MIN_LENGTH}~${LOGIN_PASSWORD_MAX_LENGTH}자`,
      met: password.length >= LOGIN_PASSWORD_MIN_LENGTH && password.length <= LOGIN_PASSWORD_MAX_LENGTH,
    },
    {
      id: 'uppercase',
      label: '영문 대문자 1자 이상',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'lowercase',
      label: '영문 소문자 1자 이상',
      met: /[a-z]/.test(password),
    },
    {
      id: 'digit',
      label: '숫자 1자 이상',
      met: /\d/.test(password),
    },
    {
      id: 'special',
      label: `특수문자(${LOGIN_PASSWORD_ALLOWED_SPECIALS}) 1자 이상`,
      met: /[@$!%*?&]/.test(password),
    },
    {
      id: 'charset',
      label: `허용 문자만 사용 (특수문자 ${LOGIN_PASSWORD_ALLOWED_SPECIALS})`,
      met: password.length === 0 || LOGIN_CHARSET_PATTERN.test(password),
    },
    {
      id: 'noSequential',
      label: '연속 문자(abc, 123 등) 없음',
      met: password.length < LOGIN_PASSWORD_MIN_LENGTH || !hasSequentialCharacters(password),
    },
    {
      id: 'noRepeated',
      label: '동일 문자 3회 이상 반복 없음',
      met: password.length < LOGIN_PASSWORD_MIN_LENGTH || !hasRepeatedCharacters(password),
    },
    {
      id: 'noCommonPattern',
      label: '일반적인 단어·패턴 없음',
      met: password.length < LOGIN_PASSWORD_MIN_LENGTH || !isCommonPattern(password),
    },
  ];
}

/** Core Solution onboarding strength indicator (OnboardingStepForm.jsx 와 동일). */
export function getLoginPasswordStrengthLevel(password: string): PasswordStrengthLevel {
  if (!password) {
    return PASSWORD_STRENGTH_LEVELS.NONE;
  }
  let score = 0;
  if (password.length >= LOGIN_PASSWORD_MIN_LENGTH) {
    score += 1;
  }
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
    score += 1;
  }
  if (/\d/.test(password)) {
    score += 1;
  }
  if (/[@$!%*?&]/.test(password)) {
    score += 1;
  }
  if (score <= 1) {
    return PASSWORD_STRENGTH_LEVELS.WEAK;
  }
  if (score <= 2) {
    return PASSWORD_STRENGTH_LEVELS.FAIR;
  }
  return PASSWORD_STRENGTH_LEVELS.STRONG;
}
