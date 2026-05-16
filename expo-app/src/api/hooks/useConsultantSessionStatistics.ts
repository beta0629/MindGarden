/**
 * 상담사 본인 완료 회기 KPI — `GET /api/v1/consultants/me/session-statistics`
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { CONSULTANT_SESSION_KPI_COPY } from '@/constants/consultantSessionKpiCopy';
import { toDisplayString, toSafeNumber } from '@/utils/safeDisplay';
import { apiGet } from '../client';
import { CONSULTANT_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';

export type SessionStatisticsGranularity = 'DAY' | 'WEEK' | 'MONTH';

export interface SessionStatisticsBucket {
  readonly label: string;
  readonly count: number;
}

export interface ConsultantSessionStatisticsNormalized {
  readonly totalCompleted: number;
  readonly buckets: SessionStatisticsBucket[];
  readonly previousPeriodTotal: number | null;
}

const QUERY_BASE = ['consultantSessionStatistics'] as const;

export const CONSULTANT_SESSION_STATISTICS_QUERY_KEYS = {
  all: QUERY_BASE,
  range: (startDate: string, endDate: string, granularity: SessionStatisticsGranularity) =>
    [...QUERY_BASE, startDate, endDate, granularity] as const,
};

const TOTAL_KEYS = [
  'totalCompleted',
  'completedSessions',
  'totalCompletedSessions',
  'completedCount',
  'total',
] as const;

const PREVIOUS_KEYS = [
  'previousPeriodTotal',
  'comparisonPeriodTotal',
  'priorPeriodCompleted',
  'previousTotal',
  'priorPeriodTotal',
] as const;

const BUCKET_ARRAY_KEYS = [
  'buckets',
  'series',
  'trend',
  'dailyBreakdown',
  'breakdown',
  'points',
  'items',
] as const;

function firstFiniteNumber(obj: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const k of keys) {
    if (!(k in obj)) {
      continue;
    }
    const n = toSafeNumber(obj[k], Number.NaN);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return null;
}

function readBucketArray(obj: Record<string, unknown>): unknown[] | null {
  for (const k of BUCKET_ARRAY_KEYS) {
    const v = obj[k];
    if (Array.isArray(v)) {
      return v;
    }
  }
  return null;
}

function normalizeBucketItem(item: unknown, index: number): SessionStatisticsBucket {
  if (item == null || typeof item !== 'object') {
    return { label: String(index + 1), count: 0 };
  }
  const row = item as Record<string, unknown>;
  const labelRaw =
    row.periodLabel ??
    row.label ??
    row.date ??
    row.bucketKey ??
    row.periodStart ??
    row.bucket ??
    row.bucketStart;
  let label: string;
  if (typeof labelRaw === 'string') {
    label = labelRaw.includes('T') ? (labelRaw.split('T')[0] ?? labelRaw) : labelRaw;
  } else {
    label = toDisplayString(labelRaw, String(index + 1));
  }
  const count = toSafeNumber(
    row.count ??
      row.completedCount ??
      row.value ??
      row.sessions ??
      row.completedSessions ??
      row.total,
    0,
  );
  return { label, count };
}

function normalizeFromObject(data: Record<string, unknown>): ConsultantSessionStatisticsNormalized {
  let buckets: SessionStatisticsBucket[] = [];
  let arr = readBucketArray(data);
  if (arr == null && data.statistics != null && typeof data.statistics === 'object') {
    arr = readBucketArray(data.statistics as Record<string, unknown>);
  }
  if (arr != null) {
    buckets = arr.map((item, i) => normalizeBucketItem(item, i));
  }

  const totalCompleted = firstFiniteNumber(data, TOTAL_KEYS) ?? 0;
  const previousPeriodTotal = firstFiniteNumber(data, PREVIOUS_KEYS);

  return {
    totalCompleted,
    buckets,
    previousPeriodTotal,
  };
}

export function normalizeConsultantSessionStatistics(
  raw: unknown,
): ConsultantSessionStatisticsNormalized {
  if (raw != null && typeof raw === 'object') {
    const root = raw as Record<string, unknown>;
    if (root.success === false) {
      throw new Error(
        toDisplayString(
          root.message ?? root.error ?? root.code,
          CONSULTANT_SESSION_KPI_COPY.FETCH_FAILED,
        ),
      );
    }
  }

  const direct = unwrapApiResponse<Record<string, unknown>>(raw);
  if (direct != null && typeof direct === 'object') {
    return normalizeFromObject(direct);
  }

  if (raw != null && typeof raw === 'object') {
    return normalizeFromObject(raw as Record<string, unknown>);
  }

  return {
    totalCompleted: 0,
    buckets: [],
    previousPeriodTotal: null,
  };
}

export function useConsultantSessionStatistics(
  params: {
    readonly startDate: string;
    readonly endDate: string;
    readonly granularity: SessionStatisticsGranularity;
  },
  options?: Pick<
    UseQueryOptions<ConsultantSessionStatisticsNormalized, Error>,
    'enabled' | 'staleTime'
  >,
) {
  const { startDate, endDate, granularity } = params;
  return useQuery({
    queryKey: CONSULTANT_SESSION_STATISTICS_QUERY_KEYS.range(startDate, endDate, granularity),
    queryFn: async () => {
      const raw = await apiGet<unknown>(CONSULTANT_API.MY_SESSION_STATISTICS, {
        startDate,
        endDate,
        granularity,
      });
      return normalizeConsultantSessionStatistics(raw);
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 60_000,
  });
}
