import { apiFetch } from "@/services/apiClient";
import { PricingAddon, PricingPlan } from "@/types/pricing";

export async function fetchPricingPlans(): Promise<PricingPlan[]> {
  return apiFetch<PricingPlan[]>("/ops/plans");
}

export async function fetchPricingAddons(): Promise<PricingAddon[]> {
  return apiFetch<PricingAddon[]>("/ops/plans/addons");
}

