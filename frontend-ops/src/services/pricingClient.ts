import { clientApiFetch } from "@/services/clientApi";
import { OPS_API_PATHS } from "@/constants/api";
import {
  PlanAddonAttachPayload,
  PricingAddon,
  PricingPlan
} from "@/types/pricing";

type CreatePlanPayload = Pick<
  PricingPlan,
  | "planCode"
  | "displayName"
  | "displayNameKo"
  | "baseFee"
  | "currency"
  | "description"
  | "descriptionKo"
>;

type UpdatePlanPayload = Pick<
  PricingPlan,
  | "displayName"
  | "displayNameKo"
  | "baseFee"
  | "currency"
  | "description"
  | "descriptionKo"
  | "active"
>;

type CreateAddonPayload = Pick<
  PricingAddon,
  | "addonCode"
  | "displayName"
  | "displayNameKo"
  | "category"
  | "categoryKo"
  | "feeType"
  | "unitPrice"
  | "unit"
>;

type UpdateAddonPayload = Pick<
  PricingAddon,
  | "displayName"
  | "displayNameKo"
  | "category"
  | "categoryKo"
  | "feeType"
  | "unitPrice"
  | "unit"
  | "active"
>;

export async function createPricingPlan(
  payload: CreatePlanPayload
): Promise<PricingPlan> {
  return clientApiFetch<PricingPlan>(OPS_API_PATHS.PRICING.PLANS, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updatePricingPlan(
  planId: string,
  payload: UpdatePlanPayload
): Promise<PricingPlan> {
  return clientApiFetch<PricingPlan>(OPS_API_PATHS.PRICING.PLAN_DETAIL(planId), {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deactivatePricingPlan(planId: string): Promise<void> {
  await clientApiFetch(OPS_API_PATHS.PRICING.PLAN_DEACTIVATE(planId), {
    method: "DELETE"
  });
}

export async function createPricingAddon(
  payload: CreateAddonPayload
): Promise<PricingAddon> {
  return clientApiFetch<PricingAddon>(OPS_API_PATHS.PRICING.ADDONS, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updatePricingAddon(
  addonId: string,
  payload: UpdateAddonPayload
): Promise<PricingAddon> {
  return clientApiFetch<PricingAddon>(OPS_API_PATHS.PRICING.ADDON_DETAIL(addonId), {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deactivatePricingAddon(addonId: string): Promise<void> {
  await clientApiFetch(OPS_API_PATHS.PRICING.ADDON_DEACTIVATE(addonId), {
    method: "DELETE"
  });
}

export async function attachAddonToPlan(
  planId: string,
  payload: PlanAddonAttachPayload
): Promise<void> {
  await clientApiFetch(OPS_API_PATHS.PRICING.ATTACH_ADDON(planId), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}