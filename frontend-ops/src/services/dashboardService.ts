import { clientApiFetch } from "@/services/clientApi";
import { OPS_API_PATHS } from "@/constants/api";
import { DashboardMetrics } from "@/types/dashboard";

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  return clientApiFetch<DashboardMetrics>(OPS_API_PATHS.DASHBOARD.METRICS);
}

