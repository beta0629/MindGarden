import { clientApiFetch } from "@/services/clientApi";
import { OPS_API_PATHS } from "@/constants/api";
import {
  OnboardingDecisionPayload,
  OnboardingRequest
} from "@/types/onboarding";

export async function decideOnboarding(
  id: string,
  payload: OnboardingDecisionPayload
): Promise<OnboardingRequest> {
  console.log("[onboardingClient] decideOnboarding 호출:", { id, payload });
  const result = await clientApiFetch<OnboardingRequest>(OPS_API_PATHS.ONBOARDING.DECISION(id), {
    method: "POST",
    body: JSON.stringify(payload)
  });
  console.log("[onboardingClient] decideOnboarding 응답:", result);
  return result;
}

export async function retryOnboardingApproval(
  id: string,
  note?: string
): Promise<OnboardingRequest> {
  return clientApiFetch<OnboardingRequest>(OPS_API_PATHS.ONBOARDING.RETRY(id), {
    method: "POST",
    body: JSON.stringify({
      actorId: process.env.NEXT_PUBLIC_OPS_ACTOR_ID ?? "SYSTEM_RETRY",
      note: note
    })
  });
}

