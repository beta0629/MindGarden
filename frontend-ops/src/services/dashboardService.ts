import { clientApiFetch } from "@/services/clientApi";
import { DashboardMetrics } from "@/types/dashboard";

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  return clientApiFetch<DashboardMetrics>("/ops/dashboard/metrics");
}

