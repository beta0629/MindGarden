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
  subdomain?: string | null;
  brandName?: string | null;
  region?: string | null;
  representativeName?: string | null;
  businessLandline?: string | null;
  businessAddress?: string | null;
  initializationStatusJson?: string | null; // 초기화 작업 단계별 상태 (JSON)
  /** 승인·로그인과 같은 checklist contactEmail. 암호문은 서버가 넣지 않는다. */
  contactEmail?: string | null;
}

export interface OnboardingDecisionPayload {
  status: OnboardingStatus;
  actorId: string;
  note?: string;
}

export interface OnboardingDecisionResponse {
  request: OnboardingRequest;
  adminAccount?: {
    email: string;
    tenantId: string;
    tenantName: string;
  } | null;
}

