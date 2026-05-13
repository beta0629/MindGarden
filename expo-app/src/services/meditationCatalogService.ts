/**
 * 명상 카탈로그 — `GET /api/v1/meditations` 시도 후 데모 스트림·Mock 목록 단일 폴백
 *
 * SSOT: `docs/project-management/EXPO_NATIVE_APP_PLAN.md` Phase 3-C·§13
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { apiGet } from '@/api/client';
import { MEDITATION_API } from '@/api/endpoints';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import {
  MOCK_MEDITATION_TRACKS,
  MEDITATION_DEFAULT_STREAM_URI,
  MEDITATION_GRADIENT_MAP,
  type MeditationCategory,
  type MeditationTrack,
} from '@/constants/meditationData';
import { toDisplayString } from '@/utils/toDisplayString';
import { toSafeNumber } from '@/utils/safeDisplay';

export type MeditationCatalogSource = 'api' | 'demo';

function mapCategoryKey(raw: unknown): MeditationCategory {
  const s = toDisplayString(raw, '').toLowerCase();
  if (s.includes('sleep') || s.includes('수면')) return 'sleep';
  if (s.includes('nature') || s.includes('자연')) return 'nature';
  if (s.includes('mind') || s.includes('마음')) return 'mindfulness';
  if (s.includes('breath') || s.includes('호흡')) return 'breathing';
  return 'mindfulness';
}

function categoryLabel(cat: MeditationCategory): string {
  switch (cat) {
    case 'breathing':
      return '호흡';
    case 'mindfulness':
      return '마음챙김';
    case 'sleep':
      return '수면';
    case 'nature':
      return '자연소리';
    default:
      return '명상';
  }
}

function normalizeTrack(raw: unknown, index: number): MeditationTrack | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = toSafeNumber(o.id ?? o.meditationId ?? index + 1, index + 1);
  const title = toDisplayString(o.title ?? o.name, '');
  if (!title) return null;
  const description = toDisplayString(o.description ?? o.summary, '명상 가이드');
  const category = mapCategoryKey(o.category ?? o.categoryCode ?? o.type);
  const durationSeconds = toSafeNumber(
    o.durationSeconds ?? o.durationSec ?? (o.durationMinutes as number) * 60,
    300,
  );
  const audioUri = toDisplayString(o.contentUrl ?? o.audioUrl ?? o.streamUrl, '');
  const gradientColors = MEDITATION_GRADIENT_MAP[category];
  return {
    id,
    title,
    description,
    category,
    categoryLabel: toDisplayString(o.categoryLabel, categoryLabel(category)),
    durationSeconds,
    gradientColors,
    audioUri: audioUri || undefined,
  };
}

function normalizeTrackList(raw: unknown): MeditationTrack[] | null {
  const body = unwrapApiResponse<unknown>(raw) ?? raw;
  if (!Array.isArray(body)) {
    if (body && typeof body === 'object') {
      const obj = body as Record<string, unknown>;
      if (Array.isArray(obj.content)) {
        return normalizeTrackList(obj.content);
      }
      if (Array.isArray(obj.items)) {
        return normalizeTrackList(obj.items);
      }
    }
    return null;
  }
  const out: MeditationTrack[] = [];
  let i = 0;
  for (const row of body) {
    const t = normalizeTrack(row, i);
    if (t) out.push(t);
    i += 1;
  }
  return out.length > 0 ? out : null;
}

function applyDefaultAudio(tracks: MeditationTrack[]): MeditationTrack[] {
  return tracks.map((t) =>
    t.audioUri
      ? t
      : {
          ...t,
          audioUri: MEDITATION_DEFAULT_STREAM_URI,
        },
  );
}

/**
 * API 성공 시 정규화 목록, 그 외에는 Mock 목록 + 데모 스트림 URI를 동일 규칙으로 부여
 */
export async function fetchMeditationCatalog(): Promise<{
  source: MeditationCatalogSource;
  tracks: MeditationTrack[];
}> {
  try {
    const raw = await apiGet<unknown>(MEDITATION_API.LIST);
    const list = normalizeTrackList(raw);
    if (list != null && list.length > 0) {
      return { source: 'api', tracks: applyDefaultAudio(list) };
    }
  } catch {
    /* 단일 폴백 */
  }
  return {
    source: 'demo',
    tracks: applyDefaultAudio([...MOCK_MEDITATION_TRACKS]),
  };
}
