/**
 * 상담사 수입 리포트 TanStack Query 커스텀 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiGet } from '../client';
import { PAYMENT_API, RATING_API } from '../endpoints';

export interface IncomeSummary {
  totalIncome: number;
  totalSessions: number;
  avgRating: number;
  monthlyTrend: MonthlyIncome[];
  sessionTypeDistribution: SessionTypeDistribution[];
}

export interface MonthlyIncome {
  month: string;
  label: string;
  income: number;
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

const INCOME_QUERY_KEYS = {
  all: ['income'] as const,
  report: (consultantId: string | number, month: string) =>
    [...INCOME_QUERY_KEYS.all, 'report', consultantId, month] as const,
  details: (consultantId: string | number, month: string) =>
    [...INCOME_QUERY_KEYS.all, 'details', consultantId, month] as const,
};

export function useIncomeReport(
  consultantId: string | number | undefined,
  month: string,
  options?: Partial<UseQueryOptions<IncomeSummary>>,
) {
  const [year, mon] = month.split('-');

  return useQuery<IncomeSummary>({
    queryKey: INCOME_QUERY_KEYS.report(consultantId!, month),
    queryFn: async () => {
      const [paymentsRes, ratingRes] = await Promise.all([
        apiGet<IncomeDetailItem[]>(PAYMENT_API.GET_PAYMENTS, {
          consultantId,
          year,
          month: mon,
          status: 'COMPLETED',
        }).catch(() => [] as IncomeDetailItem[]),
        apiGet<{ averageRating: number }>(
          RATING_API.consultantStats(consultantId!),
        ).catch(() => ({ averageRating: 0 })),
      ]);

      const payments = Array.isArray(paymentsRes) ? paymentsRes : [];
      const totalIncome = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);

      const typeMap = new Map<string, { count: number; amount: number }>();
      payments.forEach((p) => {
        const key = p.consultationType ?? '상담';
        const prev = typeMap.get(key) ?? { count: 0, amount: 0 };
        typeMap.set(key, { count: prev.count + 1, amount: prev.amount + (p.amount ?? 0) });
      });

      const sessionTypeDistribution: SessionTypeDistribution[] = [];
      typeMap.forEach((v, k) => {
        sessionTypeDistribution.push({ type: k, count: v.count, amount: v.amount });
      });

      const monthlyTrend: MonthlyIncome[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(Number(year), Number(mon) - 1 - i, 1);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const lbl = `${d.getMonth() + 1}월`;
        const income = m === month ? totalIncome : 0;
        monthlyTrend.push({ month: m, label: lbl, income });
      }

      return {
        totalIncome,
        totalSessions: payments.length,
        avgRating: ratingRes?.averageRating ?? 0,
        monthlyTrend,
        sessionTypeDistribution,
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
  const [year, mon] = month.split('-');

  return useQuery<IncomeDetailItem[]>({
    queryKey: INCOME_QUERY_KEYS.details(consultantId!, month),
    queryFn: async () => {
      const res = await apiGet<IncomeDetailItem[]>(PAYMENT_API.GET_PAYMENTS, {
        consultantId,
        year,
        month: mon,
        status: 'COMPLETED',
      });
      const payments = Array.isArray(res) ? res : [];
      return payments.map((p) => ({
        id: p.id,
        date: p.date ?? '',
        clientName: p.clientName ?? '내담자',
        consultationType: p.consultationType ?? '상담',
        amount: p.amount ?? 0,
        status: p.status ?? 'COMPLETED',
      }));
    },
    enabled: !!consultantId && !!month,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export { INCOME_QUERY_KEYS };
