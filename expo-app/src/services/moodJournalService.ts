/**
 * 감정 일기 — **MMKV 로컬 Mock** + REST (`EXPO_NATIVE_APP_PLAN.md` §11.1·§13 Phase 3-B).
 *
 * **원장(Mock vs API)** — 표기: `WELLNESS_PHASE_3B_DATA_SOURCE.moodJournal`:
 * - **읽기(월·상세·통계)**: `try` 안에서 `apiGet`이 **예외 없이** 끝나고 페이로드를 **알려진 형태로 정규화**할 수 있으면 그 결과만 반환(서버 권위). `catch`에서만 MMKV/로컬 재계산 분기.
 * - **월별 `fetchMoodJournalMonth`**: HTTP 성공이나 본문을 월 맵으로 해석할 수 없으면 **빈 객체** `{}`(Mock 아님, “해당 월 서버 데이터 없음” 취급).
 * - **통계 `fetchMoodStats`**: HTTP 성공이나 통계 배열이 아니면 **MMKV 기반 로컬 재계산**(요청 실패와 동일 폴백 경로).
 * - **쓰기(CUD)**: 원격 성공 시 서버 반영 가정; **catch 시에만** MMKV에 반영.
 * - **표시 경계**: `normalizeEntry` 등에서 `toDisplayString`·`toSafeNumber`(`COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`).
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { getMmkv } from '@/lib/getMmkv';
import { apiDelete, apiGet, apiPost, apiPut } from '@/api/client';
import { MOOD_JOURNAL_API } from '@/api/endpoints';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import type { EmotionTag, MoodStatPeriod } from '@/constants/moodConstants';
import { MOOD_STORAGE_KEY, MOOD_EMOJIS } from '@/constants/moodConstants';
import { toDisplayString } from '@/utils/toDisplayString';
import { toSafeNumber } from '@/utils/safeDisplay';

const mmkv = getMmkv(MOOD_STORAGE_KEY);

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

function getAllEntriesLocal(): Record<string, MoodJournalEntry> {
  const raw = mmkv.getString('entries');
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, MoodJournalEntry>;
  } catch {
    return {};
  }
}

function saveAllEntriesLocal(entries: Record<string, MoodJournalEntry>) {
  mmkv.set('entries', JSON.stringify(entries));
}

function filterMonth(
  all: Record<string, MoodJournalEntry>,
  month: string,
): Record<string, MoodJournalEntry> {
  const filtered: Record<string, MoodJournalEntry> = {};
  for (const [date, entry] of Object.entries(all)) {
    if (date.startsWith(month)) {
      filtered[date] = entry;
    }
  }
  return filtered;
}

function normalizeEntry(raw: unknown): MoodJournalEntry | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const date = toDisplayString(o.date ?? o.journalDate, '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const moodValue = toSafeNumber(o.moodValue ?? o.mood ?? o.score, 0);
  const emojiDef = MOOD_EMOJIS.find((m) => m.value === moodValue);
  const tagsRaw = o.tags ?? o.emotionTags;
  const tags: EmotionTag[] = Array.isArray(tagsRaw)
    ? (tagsRaw.filter((t) => typeof t === 'string') as EmotionTag[])
    : [];
  return {
    date,
    moodValue,
    emoji: toDisplayString(o.emoji, emojiDef?.emoji ?? '😐'),
    tags,
    memo: toDisplayString(o.memo ?? o.note, ''),
    sharedWithConsultant: Boolean(o.sharedWithConsultant ?? o.shareWithConsultant),
    createdAt: toDisplayString(o.createdAt ?? o.created_at, new Date().toISOString()),
  };
}

function normalizeMonthlyPayload(
  raw: unknown,
  month: string,
): Record<string, MoodJournalEntry> | null {
  const body = unwrapApiResponse<unknown>(raw) ?? raw;
  if (body == null) return null;
  if (Array.isArray(body)) {
    const out: Record<string, MoodJournalEntry> = {};
    for (const row of body) {
      const e = normalizeEntry(row);
      if (e && e.date.startsWith(month)) out[e.date] = e;
    }
    return out;
  }
  if (typeof body === 'object') {
    const o = body as Record<string, unknown>;
    if (Array.isArray(o.content)) {
      return normalizeMonthlyPayload(o.content, month);
    }
    if (Array.isArray(o.journals)) {
      return normalizeMonthlyPayload(o.journals, month);
    }
    const out: Record<string, MoodJournalEntry> = {};
    for (const [k, v] of Object.entries(o)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && v && typeof v === 'object') {
        const e = normalizeEntry({ ...(v as object), date: k });
        if (e) out[k] = e;
      }
    }
    if (Object.keys(out).length > 0) return out;
  }
  return null;
}

export async function fetchMoodJournalMonth(
  month: string,
): Promise<Record<string, MoodJournalEntry>> {
  try {
    const raw = await apiGet<unknown>(MOOD_JOURNAL_API.GET_MONTHLY, {
      month,
    });
    const normalized = normalizeMonthlyPayload(raw, month);
    if (normalized != null) {
      return normalized;
    }
    /* 본문은 왔으나 월별 맵으로 해석 불가 → 서버에 해당 월 데이터 없음으로 간주 */
    return {};
  } catch {
    /* MMKV Mock: 요청 실패 시에만 */
  }
  return filterMonth(getAllEntriesLocal(), month);
}

export async function fetchMoodJournalDetail(date: string): Promise<MoodJournalEntry | null> {
  try {
    const raw = await apiGet<unknown>(MOOD_JOURNAL_API.detail(date));
    const body = unwrapApiResponse<unknown>(raw) ?? raw;
    const e = normalizeEntry(body);
    if (e) return e;
    return null;
  } catch {
    /* MMKV Mock: 요청 실패 시에만 */
  }
  const all = getAllEntriesLocal();
  return all[date] ?? null;
}

export async function createMoodJournalRemote(params: {
  date: string;
  moodValue: number;
  tags: EmotionTag[];
  memo: string;
  sharedWithConsultant: boolean;
}): Promise<MoodJournalEntry> {
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
  try {
    await apiPost(MOOD_JOURNAL_API.CREATE, {
      date: params.date,
      moodValue: params.moodValue,
      tags: params.tags,
      memo: params.memo,
      sharedWithConsultant: params.sharedWithConsultant,
    });
    return entry;
  } catch {
    /* MMKV Mock: POST 실패 시에만 */
    const all = getAllEntriesLocal();
    all[params.date] = entry;
    saveAllEntriesLocal(all);
    return entry;
  }
}

export async function updateMoodJournalRemote(params: {
  date: string;
  moodValue: number;
  tags: EmotionTag[];
  memo: string;
  sharedWithConsultant: boolean;
}): Promise<MoodJournalEntry> {
  const prev = getAllEntriesLocal()[params.date];
  const emojiDef = MOOD_EMOJIS.find((m) => m.value === params.moodValue);
  const entry: MoodJournalEntry = {
    date: params.date,
    moodValue: params.moodValue,
    emoji: emojiDef?.emoji ?? '😐',
    tags: params.tags,
    memo: params.memo,
    sharedWithConsultant: params.sharedWithConsultant,
    createdAt: prev?.createdAt ?? new Date().toISOString(),
  };
  try {
    await apiPut(MOOD_JOURNAL_API.detail(params.date), {
      moodValue: params.moodValue,
      tags: params.tags,
      memo: params.memo,
      sharedWithConsultant: params.sharedWithConsultant,
    });
    return entry;
  } catch {
    /* MMKV Mock: PUT 실패 시에만 */
    const all = getAllEntriesLocal();
    all[params.date] = entry;
    saveAllEntriesLocal(all);
    return entry;
  }
}

export async function deleteMoodJournalRemote(date: string): Promise<void> {
  try {
    await apiDelete(MOOD_JOURNAL_API.delete(date));
  } catch {
    /* MMKV Mock: DELETE 실패 시에만 */
    const all = getAllEntriesLocal();
    delete all[date];
    saveAllEntriesLocal(all);
  }
}

function parseMoodStatRows(rows: unknown[]): MoodStat[] {
  return rows
    .map((row) => {
      if (row == null || typeof row !== 'object') return null;
      const r = row as Record<string, unknown>;
      const d = toDisplayString(r.date ?? r.statDate, '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
      return { date: d, value: toSafeNumber(r.value ?? r.moodValue ?? r.score, 0) };
    })
    .filter((x): x is MoodStat => x != null);
}

/** 배열(빈 배열 포함)·Page `content` 등 알려진 형태만 파싱. 미식별이면 null */
function tryParseMoodStatsPayload(raw: unknown): MoodStat[] | null {
  const body = unwrapApiResponse<unknown>(raw) ?? raw;
  if (body == null) return null;
  if (Array.isArray(body)) {
    return parseMoodStatRows(body);
  }
  if (typeof body === 'object') {
    const o = body as Record<string, unknown>;
    if (Array.isArray(o.content)) {
      return tryParseMoodStatsPayload(o.content);
    }
  }
  return null;
}

export async function fetchMoodStats(period: MoodStatPeriod): Promise<MoodStat[]> {
  try {
    const raw = await apiGet<unknown>(MOOD_JOURNAL_API.STATS, { period });
    const parsed = tryParseMoodStatsPayload(raw);
    if (parsed !== null) {
      return parsed;
    }
    /* HTTP 성공이나 본문이 통계 배열이 아님 → MMKV로 동일 기간 재계산 */
  } catch {
    /* MMKV 기반 로컬 계산: 요청 실패 시 */
  }

  const all = getAllEntriesLocal();
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
    return { date: key, value: all[key]?.moodValue ?? 0 };
  });
}
