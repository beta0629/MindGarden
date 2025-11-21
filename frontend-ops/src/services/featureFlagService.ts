import { clientApiFetch } from "@/services/clientApi";
import { FeatureFlag } from "@/types/featureFlag";

export async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  return clientApiFetch<FeatureFlag[]>("/ops/feature-flags");
}

