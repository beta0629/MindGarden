/**
 * 감정 일기 TanStack Query 훅
 * `moodJournalService` — API 우선, 실패 시 MMKV Mock (`§11.1` 표는 `src/constants/wellnessDataSource.ts`)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { EmotionTag, MoodStatPeriod } from '@/constants/moodConstants';
import {
  createMoodJournalRemote,
  deleteMoodJournalRemote,
  fetchMoodJournalDetail,
  fetchMoodJournalMonth,
  fetchMoodStats,
  updateMoodJournalRemote,
  type MoodJournalEntry,
  type MoodStat,
} from '@/services/moodJournalService';

export type { MoodJournalEntry, MoodStat } from '@/services/moodJournalService';

const MOOD_QUERY_KEYS = {
  all: ['mood-journal'] as const,
  monthly: (month: string) => [...MOOD_QUERY_KEYS.all, 'monthly', month] as const,
  detail: (date: string) => [...MOOD_QUERY_KEYS.all, 'detail', date] as const,
  stats: (period: MoodStatPeriod) => [...MOOD_QUERY_KEYS.all, 'stats', period] as const,
};

export function useMoodJournals(month: string) {
  return useQuery<Record<string, MoodJournalEntry>>({
    queryKey: MOOD_QUERY_KEYS.monthly(month),
    queryFn: () => fetchMoodJournalMonth(month),
    staleTime: 1000 * 60,
  });
}

export function useMoodJournalDetail(date: string) {
  return useQuery<MoodJournalEntry | null>({
    queryKey: MOOD_QUERY_KEYS.detail(date),
    queryFn: () => fetchMoodJournalDetail(date),
    enabled: !!date,
    staleTime: 1000 * 60,
  });
}

interface CreateMoodJournalParams {
  date: string;
  moodValue: number;
  tags: EmotionTag[];
  memo: string;
  sharedWithConsultant: boolean;
}

export function useCreateMoodJournal() {
  const queryClient = useQueryClient();

  return useMutation<MoodJournalEntry, Error, CreateMoodJournalParams>({
    mutationFn: (params) => createMoodJournalRemote(params),
    onSuccess: (_data, variables) => {
      const month = variables.date.substring(0, 7);
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.monthly(month) });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.detail(variables.date) });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.stats('weekly') });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.stats('monthly') });
    },
  });
}

export function useUpdateMoodJournal() {
  const queryClient = useQueryClient();

  return useMutation<MoodJournalEntry, Error, CreateMoodJournalParams>({
    mutationFn: (params) => updateMoodJournalRemote(params),
    onSuccess: (_data, variables) => {
      const month = variables.date.substring(0, 7);
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.monthly(month) });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.detail(variables.date) });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.stats('weekly') });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.stats('monthly') });
    },
  });
}

export function useDeleteMoodJournal() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (date) => deleteMoodJournalRemote(date),
    onSuccess: (_data, date) => {
      const month = date.substring(0, 7);
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.monthly(month) });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.detail(date) });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.stats('weekly') });
      queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEYS.stats('monthly') });
    },
  });
}

export function useMoodStats(period: MoodStatPeriod) {
  return useQuery<MoodStat[]>({
    queryKey: MOOD_QUERY_KEYS.stats(period),
    queryFn: () => fetchMoodStats(period),
    staleTime: 1000 * 60,
  });
}

export { MOOD_QUERY_KEYS };
