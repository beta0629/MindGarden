/**
 * 상담사 본인 급여 정산 목록 — `GET /api/v1/consultants/me/salary-calculations`
 * (관리자 급여 모듈에서 승인·지급 완료된 건만 백엔드가 반환)
 *
 * @author MindGarden
 * @since 2026-05-15
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { CONSULTANT_SALARY_SETTLEMENT_COPY } from '@/constants/consultantSalarySettlementCopy';
import { toDisplayString } from '@/utils/safeDisplay';
import { apiGet } from '../client';
import { CONSULTANT_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';

export interface ConsultantSalarySettlementRow {
  id?: number | string;
  calculationPeriod?: string | null;
  calculationPeriodStart?: string | null;
  calculationPeriodEnd?: string | null;
  status?: string | null;
  netSalary?: number | string | null;
  grossSalary?: number | string | null;
  deductions?: number | string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
}

const SALARY_SETTLEMENT_QUERY_BASE = ['consultantSalarySettlements'] as const;

const QUERY_KEYS = {
  all: SALARY_SETTLEMENT_QUERY_BASE,
  list: () => [...SALARY_SETTLEMENT_QUERY_BASE, 'list'] as const,
};

function normalizeList(raw: unknown): ConsultantSalarySettlementRow[] {
  const data = unwrapApiResponse<unknown>(raw);
  if (Array.isArray(data)) {
    return data as ConsultantSalarySettlementRow[];
  }
  if (
    data != null &&
    typeof data === 'object' &&
    Array.isArray((data as { data?: unknown }).data)
  ) {
    return (data as { data: ConsultantSalarySettlementRow[] }).data;
  }
  return [];
}

export function useConsultantSalarySettlements(
  options?: Pick<UseQueryOptions<ConsultantSalarySettlementRow[], Error>, 'enabled' | 'staleTime'>,
) {
  return useQuery({
    queryKey: QUERY_KEYS.list(),
    queryFn: async () => {
      const raw = await apiGet(CONSULTANT_API.MY_SALARY_CALCULATIONS);
      if (raw != null && typeof raw === 'object') {
        const root = raw as Record<string, unknown>;
        if (root.success === false) {
          throw new Error(
            toDisplayString(
              root.message ?? root.error ?? root.code,
              CONSULTANT_SALARY_SETTLEMENT_COPY.LIST_FETCH_FAILED,
            ),
          );
        }
      }
      return normalizeList(raw);
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 60_000,
  });
}
