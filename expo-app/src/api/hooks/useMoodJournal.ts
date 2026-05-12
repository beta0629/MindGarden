/**
 * 감정 일기 TanStack Query 커스텀 훅
 * API 미구현 → MMKV 로컬 저장 + Mock 데이터로 동작
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createMMKV } from 'react-native-mmkv';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import type { EmotionTag, MoodStatPeriod } from '@/constants/moodConstants';
import { MOOD_STORAGE_KEY, MOOD_EMOJIS } from '@/constants/moodConstants';

const mmkv = createMMKV({ id: MOOD_STORAGE_KEY });

export interface MoodJournalEntry {
  date: string;
  moodValue: number;
  emoji: string;
  tags: EmotionTag[];
  memo: string;
  sharedWithConsultant: boolean;
  createdAt: string;
}

export interface MoodStat {
  date: string;
  value: number;
}

const MOOD_QUERY_KEYS = {
  all: ['mood-journal'] as const,
  monthly: (month: string) => [...MOOD_QUERY_KEYS.all, 'monthly', month] as const,
  detail: (date: string) => [...MOOD_QUERY_KEYS.all, 'detail', date] as const,
  stats: (period: MoodStatPeriod) => [...MOOD_QUERY_KEYS.all, 'stats', period] as const,
};

function getAllEntries(): Record<string, MoodJournalEntry> {
  const raw = mmkv.getString('entries');
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, MoodJournalEntry>;
  } catch {
    return {};
  }
}

function saveAllEntries(entries: Record<string, MoodJournalEntry>) {
  mmkv.set('entries', JSON.stringify(entries));
}

export function useMoodJournals(month: string) {
  return useQuery<Record<string, MoodJournalEntry>>({
    queryKey: MOOD_QUERY_KEYS.monthly(month),
    queryFn: () => {
      const all = getAllEntries();
      const filtered: Record<string, MoodJournalEntry> = {};
      for (const [date, entry] of Object.entries(all)) {
        if (date.startsWith(month)) {
          filtered[date] = entry;
        }
      }
      return filtered;
    },
    staleTime: 0,
  });
}

export function useMoodJournalDetail(date: string) {
  return useQuery<MoodJournalEntry | null>({
    queryKey: MOOD_QUERY_KEYS.detail(date),
    queryFn: () => {
      const all = getAllEntries();
      return all[date] ?? null;
    },
    enabled: !!date,
    staleTime: 0,
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
    mutationFn: async (params) => {
      const emojiDef = MOOD_EMOJIS.find((m) => m.value === params.moodValue);
      const entry: MoodJournalEntry = {
        date: params.date,
        moodValue: params.moodValue,
        emoji: emojiDef?.emoji ?? '😐',
        tags: params.tags,
        memo: params.memo,
        sharedWithConsultant: params.sharedWithConsultant,
        createdAt: new Date().toISOString(),
      };
      const all = getAllEntries();
      all[params.date] = entry;
      saveAllEntries(all);
      return entry;
    },
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
    mutationFn: async (date) => {
      const all = getAllEntries();
      delete all[date];
      saveAllEntries(all);
    },
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
    queryFn: () => {
      const all = getAllEntries();
      const today = new Date();
      let start: Date;
      let end: Date;

      if (period === 'weekly') {
        start = subDays(today, 6);
        end = today;
      } else {
        start = startOfMonth(today);
        end = endOfMonth(today);
      }

      const days = eachDayOfInterval({ start, end });
      return days.map((d) => {
        const key = format(d, 'yyyy-MM-dd');
        return {
          date: key,
          value: all[key]?.moodValue ?? 0,
        };
      });
    },
    staleTime: 0,
  });
}

export { MOOD_QUERY_KEYS };
