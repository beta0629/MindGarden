import { OnboardingStatus } from "@/types/shared";

export interface OnboardingRequest {
  id: number | string; // 백엔드는 Long (숫자)이지만, 문자열로도 처리 가능
  tenantId: string | null;
  tenantName: string;
  requestedBy: string;
  status: OnboardingStatus;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  checklistJson?: string | null;
  decidedBy?: string | null;
  decisionAt?: string | null;
  decisionNote?: string | null;
  createdAt: string;
  updatedAt: string;
  businessType?: string | null; // 업종 타입 추가
}

export interface OnboardingDecisionPayload {
  status: OnboardingStatus;
  actorId: string;
  note?: string;
}

