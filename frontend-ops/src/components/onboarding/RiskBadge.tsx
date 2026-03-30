/**
 * 리스크 레벨 배지 컴포넌트
 * 하드코딩 금지 원칙에 따라 상수 사용
 */

import { RISK_LEVEL_LABELS } from "@/constants/onboarding";

interface RiskBadgeProps {
  level: "LOW" | "MEDIUM" | "HIGH";
}

export default function RiskBadge({ level }: RiskBadgeProps) {
  const label = RISK_LEVEL_LABELS[level];
  const className = `risk-badge risk-badge--${level.toLowerCase()}`;
  
  return <span className={className}>{label}</span>;
}

