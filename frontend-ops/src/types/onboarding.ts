import { OnboardingStatus } from "@/types/shared";

export interface OnboardingRequest {
  id: string;
  tenantId: string;
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
}

export interface OnboardingDecisionPayload {
  status: OnboardingStatus;
  actorId: string;
  note?: string;
}

