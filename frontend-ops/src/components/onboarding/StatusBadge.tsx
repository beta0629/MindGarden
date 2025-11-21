/**
 * 온보딩 상태 배지 컴포넌트
 * 하드코딩 금지 원칙에 따라 상수 사용
 */

import { ONBOARDING_STATUS_LABELS } from "@/constants/onboarding";
import { OnboardingStatus } from "@/types/shared";

interface StatusBadgeProps {
  status: string;
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  PENDING: "status-badge status-badge--pending",
  APPROVED: "status-badge status-badge--approved",
  REJECTED: "status-badge status-badge--rejected",
  ON_HOLD: "status-badge status-badge--on-hold",
  IN_REVIEW: "status-badge status-badge--in-review"
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusEnum = status as OnboardingStatus;
  const label = ONBOARDING_STATUS_LABELS[statusEnum] || status;
  const className = STATUS_BADGE_CLASSES[status] || "status-badge";
  
  return <span className={className}>{label}</span>;
}

