/**
 * 명상 카탈로그 — `GET /api/v1/meditations` + **번들 Mock 폴백** (`EXPO_NATIVE_APP_PLAN.md` §11.1 API·§13).
 *
 * **원장(Mock vs API)** — 표기는 `WELLNESS_PHASE_3B_DATA_SOURCE.meditationCatalog`와 동일 의미:
 * - **API 경로**: `apiGet` 성공 후 `normalizeTrackList`가 **1건 이상**이면 `{ source: 'api', tracks }` — 서버 권위, `MOCK_MEDITATION_TRACKS` 미사용.
 * - **로컬 폴백**: GET 예외(catch)·정규화 결과 `null`/빈 배열이면 `getDemoMeditationCatalogState()` — TanStack 캐시에 `tracks: []`가
 *   들어간 경우(영속화 등) UI에서도 `??`만으로는 복구되지 않으므로 화면은 `tracks.length`로 폴백한다.
 * - **오디오**: 트랙에 스트림 URI가 없으면 `MEDITATION_DEFAULT_STREAM_URI` → `MEDITATION_LOCAL_DEMO_SILENCE` (`meditationData` 주석).
 * - **표시 경계**: 제목·설명 등은 `normalizeTrack`에서 `toDisplayString`·`toSafeNumber`로 스칼라화(`COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`).
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
  MEDITATION_LOCAL_DEMO_SILENCE,
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
  const title = toDisplayString(o.title ?? o.name ?? o.headline ?? o.contentTitle, '');
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

function resolveFallbackStreamSource(): string | number {
  if (MEDITATION_DEFAULT_STREAM_URI) {
    return MEDITATION_DEFAULT_STREAM_URI;
  }
  return MEDITATION_LOCAL_DEMO_SILENCE;
}

function trackHasAudioSource(t: MeditationTrack): boolean {
  if (t.audioUri == null) {
    return false;
  }
  if (typeof t.audioUri === 'number') {
    return true;
  }
  return t.audioUri.trim().length > 0;
}

function applyDefaultAudio(tracks: MeditationTrack[]): MeditationTrack[] {
  return tracks.map((t) =>
    trackHasAudioSource(t)
      ? t
      : {
          ...t,
          audioUri: resolveFallbackStreamSource(),
        },
  );
}

/** 쿼리 placeholder·UI 폴백용 — 항상 비지 않은 데모 카탈로그 */
export function getDemoMeditationCatalogState(): {
  source: MeditationCatalogSource;
  tracks: MeditationTrack[];
} {
  return {
    source: 'demo',
    tracks: applyDefaultAudio([...MOCK_MEDITATION_TRACKS]),
  };
}

/**
 * @returns `source: 'api'` = 서버 목록만; `source: 'demo'` = `MOCK_MEDITATION_TRACKS` + 데모 오디오 규칙(원장은 파일머리).
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
  return getDemoMeditationCatalogState();
}
