import { clientApiFetch } from "@/services/clientApi";
import {
  OnboardingDecisionPayload,
  OnboardingRequest
} from "@/types/onboarding";

export async function decideOnboarding(
  id: string,
  payload: OnboardingDecisionPayload
): Promise<OnboardingRequest> {
  return clientApiFetch<OnboardingRequest>(`/onboarding/requests/${id}/decision`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function retryOnboardingApproval(
  id: string,
  note?: string
): Promise<OnboardingRequest> {
  return clientApiFetch<OnboardingRequest>(`/onboarding/requests/${id}/retry`, {
    method: "POST",
    body: JSON.stringify({
      actorId: process.env.NEXT_PUBLIC_OPS_ACTOR_ID ?? "SYSTEM_RETRY",
      note: note
    })
  });
}

