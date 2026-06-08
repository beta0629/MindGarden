/**
 * OtpCodeInput — 순수 함수 utility 분리.
 *
 * <p>OtpCodeInput.tsx 가 React Native 모듈을 import 하므로 node 환경 jest 에서 무겁다.
 * sanitization·완료 판정 함수만 별도 모듈로 분리하여 단위 테스트가 컴포넌트 import 없이
 * 가능하도록 한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-08
 */

export const OTP_CODE_LENGTH = 6;

/** 입력 문자열에서 숫자만 추출하고 OTP_CODE_LENGTH 까지 자른다. */
export function sanitizeOtpInput(raw: string): string {
  return (raw ?? '').replace(/\D/g, '').slice(0, OTP_CODE_LENGTH);
}

/** 6자리 숫자 완성 여부. */
export function isOtpComplete(value: string): boolean {
  return /^\d{6}$/.test(value);
}
