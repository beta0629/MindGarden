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

