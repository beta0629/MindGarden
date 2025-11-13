import { FeeType } from "@/types/sharedPricing";

export interface PricingPlan {
  id: string;
  planCode: string;
  displayName: string;
  displayNameKo?: string | null;
  baseFee: number;
  currency: string;
  description?: string | null;
  descriptionKo?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PricingAddon {
  id: string;
  addonCode: string;
  displayName: string;
  displayNameKo?: string | null;
  category?: string | null;
  categoryKo?: string | null;
  feeType: FeeType;
  unitPrice: number;
  unit?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanAddonAttachPayload {
  addonCode: string;
  notes?: string;
}

