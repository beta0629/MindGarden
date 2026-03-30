import { clientApiFetch } from "@/services/clientApi";
import { OPS_API_PATHS } from "@/constants/api";
import { PricingAddon, PricingPlan } from "@/types/pricing";

export async function fetchPricingPlans(): Promise<PricingPlan[]> {
  return clientApiFetch<PricingPlan[]>(OPS_API_PATHS.PRICING.PLANS);
}

export async function fetchPricingAddons(): Promise<PricingAddon[]> {
  return clientApiFetch<PricingAddon[]>(OPS_API_PATHS.PRICING.ADDONS);
}

