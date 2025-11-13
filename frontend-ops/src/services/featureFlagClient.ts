import { clientApiFetch } from "@/services/clientApi";
import { FeatureFlag } from "@/types/featureFlag";
import { FeatureFlagState } from "@/types/shared";

export async function createFeatureFlag(payload: {
  flagKey: string;
  description?: string;
  targetScope?: string;
  expiresAt?: string;
}): Promise<FeatureFlag> {
  return clientApiFetch<FeatureFlag>("/feature-flags", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function toggleFeatureFlag(
  flagId: string,
  state: FeatureFlagState
): Promise<FeatureFlag> {
  return clientApiFetch<FeatureFlag>(`/feature-flags/${flagId}/toggle`, {
    method: "POST",
    body: JSON.stringify({ state })
  });
}

