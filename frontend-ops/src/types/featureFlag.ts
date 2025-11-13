import { FeatureFlagState } from "@/types/shared";

export interface FeatureFlag {
  id: string;
  flagKey: string;
  description?: string | null;
  state: FeatureFlagState;
  targetScope?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

