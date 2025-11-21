import { apiFetch } from "@/services/apiClient";
import { DashboardMetrics } from "@/types/dashboard";

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  return apiFetch<DashboardMetrics>("/ops/dashboard/metrics");
}

