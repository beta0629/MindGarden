/**
 * 상담사 수입·평점·상담 통계 TanStack Query 커스텀 훅
 *
 * 주의 (Phase 3-D):
 * - 백엔드 `/api/v1/payments` 는 관리자 전용(전체 결제 목록·통계)이므로 상담사 화면에서 호출 금지.
 *   대신 본인 권한이 보장된 `GET /api/v1/schedules/consultant/{id}` 와
 *   `GET /api/v1/ratings/consultant/{id}/stats` 만 사용한다.
 * - 백엔드에 상담사용 수입(amount) 집계 API가 아직 제공되지 않으므로
 *   `totalIncome` 및 `MonthlyIncome.income`, `SessionTypeDistribution.amount` 는 0 으로 반환한다.
 *   화면(`income.tsx`)은 `incomeAvailable` 플래그로 안내 카피를 분기 표시한다.
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiGet } from '../client';
import { SCHEDULE_API, RATING_API } from '../endpoints';

const MONTHLY_TREND_WINDOW = 6;
const COMPLETED_STATUS = 'COMPLETED';

export interface IncomeSummary {
  totalIncome: number;
  totalSessions: number;
  avgRating: number;
  totalRatings: number;
  monthlyTrend: MonthlyIncome[];
  sessionTypeDistribution: SessionTypeDistribution[];
  /** 백엔드 수입(amount) 데이터 제공 여부. false 면 화면에서 안내 카피 표시. */
  incomeAvailable: boolean;
}

export interface MonthlyIncome {
  month: string;
  label: string;
  income: number;
  sessions: number;
}

export interface SessionTypeDistribution {
  type: string;
  count: number;
  amount: number;
}

export interface IncomeDetailItem {
  id: number;
  date: string;
  clientName: string;
  consultationType: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED';
}

interface ConsultantScheduleRow {
  id?: number | string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  scheduleType?: string;
  consultationType?: string;
  clientName?: string;
}

const INCOME_QUERY_KEYS = {
  all: ['income'] as const,
  report: (consultantId: string | number, month: string) =>
    [...INCOME_QUERY_KEYS.all, 'report', consultantId, month] as const,
  details: (consultantId: string | number, month: string) =>
    [...INCOME_QUERY_KEYS.all, 'details', consultantId, month] as const,
};

function unwrapApiData<T = unknown>(raw: unknown): T {
  if (raw == null) {
    return raw as T;
  }
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (o.success === false) {
      const message = typeof o.message === 'string' ? o.message : '요청에 실패했습니다.';
      throw new Error(message);
    }
    if ('data' in o) {
      return o.data as T;
    }
  }
  return raw as T;
}

function unwrapScheduleList(raw: unknown): ConsultantScheduleRow[] {
  const data = unwrapApiData<unknown>(raw);
  if (Array.isArray(data)) {
    return data as ConsultantScheduleRow[];
  }
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.schedules)) {
      return o.schedules as ConsultantScheduleRow[];
    }
  }
  return [];
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function monthRange(month: string): { startDate: string; endDate: string } {
  const [y = 0, m = 1] = month.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  return {
    startDate: `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`,
    endDate: `${end.getFullYear()}-${pad2(end.getMonth() + 1)}-${pad2(end.getDate())}`,
  };
}

function buildSixMonthRange(baseMonth: string): { startDate: string; endDate: string } {
  const [y = 0, m = 1] = baseMonth.split('-').map(Number);
  const start = new Date(y, m - 1 - (MONTHLY_TREND_WINDOW - 1), 1);
  const end = new Date(y, m, 0);
  return {
    startDate: `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`,
    endDate: `${end.getFullYear()}-${pad2(end.getMonth() + 1)}-${pad2(end.getDate())}`,
  };
}

function isCompleted(row: ConsultantScheduleRow): boolean {
  return String(row.status ?? '').toUpperCase() === COMPLETED_STATUS;
}

function buildMonthlyTrend(baseMonth: string, schedules: ConsultantScheduleRow[]): MonthlyIncome[] {
  const [y = 0, m = 1] = baseMonth.split('-').map(Number);
  const trend: MonthlyIncome[] = [];
  const counts = new Map<string, number>();
  for (const s of schedules) {
    if (!isCompleted(s) || !s.date) continue;
    const key = String(s.date).slice(0, 7);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (let i = MONTHLY_TREND_WINDOW - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
    trend.push({
      month: key,
      label: `${d.getMonth() + 1}월`,
      income: 0,
      sessions: counts.get(key) ?? 0,
    });
  }
  return trend;
}

function buildSessionTypeDistribution(
  monthSchedules: ConsultantScheduleRow[],
): SessionTypeDistribution[] {
  const map = new Map<string, number>();
  for (const s of monthSchedules) {
    if (!isCompleted(s)) continue;
    const key = (s.consultationType ?? '상담').trim() || '상담';
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const out: SessionTypeDistribution[] = [];
  map.forEach((count, type) => {
    out.push({ type, count, amount: 0 });
  });
  return out.sort((a, b) => b.count - a.count);
}

export function useIncomeReport(
  consultantId: string | number | undefined,
  month: string,
  options?: Partial<UseQueryOptions<IncomeSummary>>,
) {
  return useQuery<IncomeSummary>({
    queryKey: INCOME_QUERY_KEYS.report(consultantId ?? '', month),
    queryFn: async () => {
      if (!consultantId || !month) {
        throw new Error('상담사 정보가 필요합니다.');
      }
      const { startDate: trendStart, endDate: trendEnd } = buildSixMonthRange(month);
      const { startDate: monthStart, endDate: monthEnd } = monthRange(month);

      const [schedulesRaw, ratingRaw] = await Promise.all([
        apiGet<unknown>(
          `${SCHEDULE_API.SCHEDULES_BY_CONSULTANT}/${encodeURIComponent(String(consultantId))}`,
          { startDate: trendStart, endDate: trendEnd },
        ).catch(() => [] as unknown),
        apiGet<unknown>(RATING_API.consultantStats(consultantId)).catch(() => null),
      ]);

      const allSchedules = unwrapScheduleList(schedulesRaw);
      const monthSchedules = allSchedules.filter((s) => {
        if (!s.date) return false;
        const d = String(s.date).slice(0, 10);
        return d >= monthStart && d <= monthEnd;
      });

      const completedThisMonth = monthSchedules.filter(isCompleted);

      const ratingPayload = unwrapApiData<Record<string, unknown> | null>(ratingRaw);
      const avgRating = Number(ratingPayload?.averageHeartScore ?? 0);
      const totalRatings = Number(ratingPayload?.totalRatingCount ?? 0);

      return {
        totalIncome: 0,
        totalSessions: completedThisMonth.length,
        avgRating: Number.isFinite(avgRating) ? avgRating : 0,
        totalRatings: Number.isFinite(totalRatings) ? totalRatings : 0,
        monthlyTrend: buildMonthlyTrend(month, allSchedules),
        sessionTypeDistribution: buildSessionTypeDistribution(monthSchedules),
        incomeAvailable: false,
      };
    },
    enabled: !!consultantId && !!month,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export function useIncomeDetails(
  consultantId: string | number | undefined,
  month: string,
  options?: Partial<UseQueryOptions<IncomeDetailItem[]>>,
) {
  return useQuery<IncomeDetailItem[]>({
    queryKey: INCOME_QUERY_KEYS.details(consultantId ?? '', month),
    queryFn: async () => {
      if (!consultantId || !month) {
        return [];
      }
      const { startDate, endDate } = monthRange(month);
      const raw = await apiGet<unknown>(
        `${SCHEDULE_API.SCHEDULES_BY_CONSULTANT}/${encodeURIComponent(String(consultantId))}`,
        { startDate, endDate },
      ).catch(() => [] as unknown);

      const rows = unwrapScheduleList(raw);
      return rows
        .filter(isCompleted)
        .map((row) => ({
          id: Number(row.id ?? 0),
          date: String(row.date ?? '').slice(0, 10),
          clientName: row.clientName ?? '내담자',
          consultationType: row.consultationType ?? '상담',
          amount: 0,
          status: 'COMPLETED' as const,
        }))
        .filter((row) => Number.isFinite(row.id) && row.id > 0)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
    },
    enabled: !!consultantId && !!month,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export { INCOME_QUERY_KEYS };
