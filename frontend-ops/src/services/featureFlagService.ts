import { apiFetch } from "@/services/apiClient";
import { FeatureFlag } from "@/types/featureFlag";

export async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  return apiFetch<FeatureFlag[]>("/ops/feature-flags");
}

