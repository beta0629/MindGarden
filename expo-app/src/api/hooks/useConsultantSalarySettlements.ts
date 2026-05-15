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
  /** `SalaryCalculationResponseMapper` — 세금·공제( `deductions` 와 동일 값 ) */
  taxAmount?: number | string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
}

const SALARY_SETTLEMENT_QUERY_BASE = ['consultantSalarySettlements'] as const;

const QUERY_KEYS = {
  all: SALARY_SETTLEMENT_QUERY_BASE,
  list: () => [...SALARY_SETTLEMENT_QUERY_BASE, 'list'] as const,
};

/** Spring `ApiResponse.data` 및 변형 키에서 목록 배열 후보 추출 */
const SALARY_LIST_PAYLOAD_KEYS = ['data', 'calculationDtos', 'items', 'content'] as const;

function tryReadListArray(obj: Record<string, unknown>): ConsultantSalarySettlementRow[] | null {
  for (const key of SALARY_LIST_PAYLOAD_KEYS) {
    const v = obj[key];
    if (Array.isArray(v)) {
      return v as ConsultantSalarySettlementRow[];
    }
  }
  return null;
}

/**
 * `ConsultantSalarySelfController#getMySalaryCalculations` → `success(message, calculationDtos)` 가
 * JSON에서는 `data` 배열로 직렬화됩니다. axios `response.data` 한 겹 + `ApiResponse` 이중 래핑 등
 * `unwrapApiResponse` 전후 모두에서 배열을 안정적으로 추출합니다.
 */
function normalizeList(raw: unknown): ConsultantSalarySettlementRow[] {
  if (Array.isArray(raw)) {
    return raw as ConsultantSalarySettlementRow[];
  }

  let cursor: unknown = raw;
  for (let depth = 0; depth < 4; depth += 1) {
    if (cursor == null || typeof cursor !== 'object') {
      return [];
    }

    const fromKeys = tryReadListArray(cursor as Record<string, unknown>);
    if (fromKeys != null) {
      return fromKeys;
    }

    const unwrapped = unwrapApiResponse<unknown>(cursor);
    if (unwrapped == null || unwrapped === cursor) {
      return [];
    }
    cursor = unwrapped;
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
    /** 웹 승인 직후 앱 복귀 시 캐시가 오래 남지 않도록 기본값을 짧게 둠(포커스 refetch와 병행) */
    staleTime: options?.staleTime ?? 30_000,
  });
}
