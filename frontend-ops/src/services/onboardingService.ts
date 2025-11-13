import { apiFetch } from "@/services/apiClient";
import { OnboardingRequest } from "@/types/onboarding";

export async function fetchPendingOnboarding(): Promise<OnboardingRequest[]> {
  return apiFetch<OnboardingRequest[]>("/onboarding/requests/pending");
}

export async function fetchOnboardingDetail(
  id: string
): Promise<OnboardingRequest> {
  return apiFetch<OnboardingRequest>(`/onboarding/requests/${id}`);
}

