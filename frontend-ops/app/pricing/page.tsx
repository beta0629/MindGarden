import {
  fetchPricingAddons,
  fetchPricingPlans
} from "@/services/pricingService";
import { PricingManagement } from "@/components/pricing/PricingManagement";

export default async function PricingPage() {
  const [plans, addons] = await Promise.all([
    fetchPricingPlans(),
    fetchPricingAddons()
  ]);

  return <PricingManagement plans={plans} addons={addons} />;
}
