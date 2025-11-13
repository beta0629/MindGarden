import { apiFetch } from "@/services/apiClient";
import { PricingAddon, PricingPlan } from "@/types/pricing";

export async function fetchPricingPlans(): Promise<PricingPlan[]> {
  return apiFetch<PricingPlan[]>("/plans");
}

export async function fetchPricingAddons(): Promise<PricingAddon[]> {
  return apiFetch<PricingAddon[]>("/plans/addons");
}

