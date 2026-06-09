/**
 * 소셜 SDK·서버 응답에서 들어온 표시명/닉네임 같은 식별 문자열에 대한 공용 정리 헬퍼.
 *
 * <p>외부 SDK 또는 BE 가 nickname/name 을 null·undefined 로 반환할 때 일부 직렬화 경로에서
 * "null"·"undefined" 문자열 리터럴로 변환되어 입력 필드에 그대로 노출되는 사고를 방지한다
 * (P1: 카카오 간편가입 화면 이름 필드에 "null" 노출 차단). 공백, "null", "undefined"는 모두
 * 미입력으로 간주한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */

const NULL_LITERALS = new Set(['null', 'undefined']);

/**
 * 입력 값이 사용 가능한 식별 문자열이면 trim 결과를 반환, 그렇지 않으면 빈 문자열을 반환한다.
 *
 * @param value 외부 SDK/응답에서 받은 임의 값
 * @returns 안전 trim 문자열 (미입력 시 빈 문자열)
 */
export function sanitizeSocialIdentityString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (NULL_LITERALS.has(trimmed.toLowerCase())) {
    return '';
  }
  return trimmed;
}

/**
 * 라우터 파라미터 등 옵셔널 입력에서 사용 가능한 식별 문자열만 추출한다.
 *
 * @param value 외부 SDK/응답/라우터 파라미터에서 받은 임의 값
 * @returns 안전 trim 문자열 또는 undefined
 */
export function readSocialIdentityOptional(value: unknown): string | undefined {
  const sanitized = sanitizeSocialIdentityString(value);
  return sanitized.length > 0 ? sanitized : undefined;
}
