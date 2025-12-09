import { clientApiFetch } from "@/services/clientApi";
import { OPS_API_PATHS } from "@/constants/api";
import { FeatureFlag } from "@/types/featureFlag";

export async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  return clientApiFetch<FeatureFlag[]>(OPS_API_PATHS.FEATURE_FLAGS.ALL);
}

