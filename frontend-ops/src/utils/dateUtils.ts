/**
 * 날짜 포맷 유틸리티 함수
 * 하드코딩 금지 원칙에 따라 상수 사용
 */

import { ONBOARDING_MESSAGES, DATE_FORMAT_OPTIONS, LOCALE } from "@/constants/onboarding";

/**
 * 온보딩 날짜 포맷
 */
export function formatOnboardingDate(value?: string | null): string {
  if (!value) {
    return ONBOARDING_MESSAGES.EMPTY_DATE;
  }
  
  const date = new Date(value);
  return date.toLocaleString(LOCALE, DATE_FORMAT_OPTIONS);
}

