import { clientApiFetch } from "@/services/clientApi";
import { PricingAddon, PricingPlan } from "@/types/pricing";

export async function fetchPricingPlans(): Promise<PricingPlan[]> {
  return clientApiFetch<PricingPlan[]>("/ops/plans");
}

export async function fetchPricingAddons(): Promise<PricingAddon[]> {
  return clientApiFetch<PricingAddon[]>("/ops/plans/addons");
}

