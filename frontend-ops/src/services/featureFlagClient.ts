import { clientApiFetch } from "@/services/clientApi";
import { OPS_API_PATHS } from "@/constants/api";
import { FeatureFlag } from "@/types/featureFlag";
import { FeatureFlagState } from "@/types/shared";

export async function createFeatureFlag(payload: {
  flagKey: string;
  description?: string;
  targetScope?: string;
  expiresAt?: string;
}): Promise<FeatureFlag> {
  return clientApiFetch<FeatureFlag>(OPS_API_PATHS.FEATURE_FLAGS.CREATE, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function toggleFeatureFlag(
  flagId: string,
  state: FeatureFlagState
): Promise<FeatureFlag> {
  return clientApiFetch<FeatureFlag>(OPS_API_PATHS.FEATURE_FLAGS.TOGGLE(flagId), {
    method: "POST",
    body: JSON.stringify({ state })
  });
}

