/**
 * 온보딩 관련 유틸리티 함수
 * 하드코딩 금지 원칙에 따라 상수 사용
 */

import { OnboardingStatus } from "@/types/shared";
import { ONBOARDING_STATUS_LABELS } from "@/constants/onboarding";

/**
 * 온보딩 상태 라벨 조회
 */
export function getStatusLabel(status: OnboardingStatus): string {
  return ONBOARDING_STATUS_LABELS[status] || status;
}

