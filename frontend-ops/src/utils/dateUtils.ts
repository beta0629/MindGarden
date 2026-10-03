/**
 * 온보딩 날짜 포맷
 * 한국 표준시(KST, UTC+9), 심사 화면 스탬프 YYYY.MM.DD HH:mm
 */

import {
  DATE_FORMAT_OPTIONS,
  LOCALE,
  ONBOARDING_DATE_SEPARATOR,
  ONBOARDING_MESSAGES,
  ONBOARDING_TIME_ZONE
} from "@/constants/onboarding";

export function formatOnboardingDate(value?: string | null): string {
  if (!value) {
    return ONBOARDING_MESSAGES.EMPTY_DATE;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return ONBOARDING_MESSAGES.EMPTY_DATE;
  }

  const parts = new Intl.DateTimeFormat(LOCALE, {
    ...DATE_FORMAT_OPTIONS,
    timeZone: ONBOARDING_TIME_ZONE
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const year = read("year");
  const month = read("month");
  const day = read("day");
  const hour = read("hour");
  const minute = read("minute");

  if (!year || !month || !day) {
    return ONBOARDING_MESSAGES.EMPTY_DATE;
  }

  return `${year}${ONBOARDING_DATE_SEPARATOR}${month}${ONBOARDING_DATE_SEPARATOR}${day} ${hour}:${minute}`;
}
