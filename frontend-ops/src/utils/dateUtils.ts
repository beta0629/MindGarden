/**
 * 날짜 포맷 유틸리티 함수
 * 하드코딩 금지 원칙에 따라 상수 사용
 */

import { ONBOARDING_MESSAGES, DATE_FORMAT_OPTIONS, LOCALE } from "@/constants/onboarding";

/**
 * 온보딩 날짜 포맷
 * 한국 표준시(KST, UTC+9)로 표시
 */
export function formatOnboardingDate(value?: string | null): string {
  if (!value) {
    return ONBOARDING_MESSAGES.EMPTY_DATE;
  }
  
  // ISO-8601 문자열을 파싱하고 한국 시간대로 변환
  const date = new Date(value);
  
  // 한국 시간대(Asia/Seoul)로 변환하여 표시
  return date.toLocaleString(LOCALE, {
    ...DATE_FORMAT_OPTIONS,
    timeZone: "Asia/Seoul"
  });
}

