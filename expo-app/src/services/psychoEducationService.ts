/**
 * 심리 교육 카탈로그 — `GET /api/v1/psycho-education` + **번들 Mock 폴백** (`EXPO_NATIVE_APP_PLAN.md` §11.1 API·§13).
 *
 * **원장(Mock vs API)** — 표기는 `WELLNESS_PHASE_3B_DATA_SOURCE.psychoEducationCatalog`와 동일 의미:
 * - **API 경로**: LIST가 예외 없이 끝나고 정규화 배열 **길이 > 0**이면 `{ source: 'api', articles, usedFallbackDueToError: false }` — `MOCK_PSYCHO_ARTICLES` 미사용.
 * - **로컬 폴백**: `fetchPsychoEducationListOrThrow` 예외 → `{ source: 'demo', usedFallbackDueToError: true }`.
 * - **빈 목록(HTTP 성공)**: 정상 응답이나 0건이면 `{ source: 'demo', usedFallbackDueToError: false }`(오류 플래그와 구분).
 * - **표시 경계**: `normalizeArticle` 등에서 `toDisplayString`·`toSafeNumber` 사용(`COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`).
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { apiGet } from '@/api/client';
import { PSYCHO_EDUCATION_API } from '@/api/endpoints';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import type { PsychoArticle, PsychoCategory, PsychoPage } from '@/constants/psychoEducationData';
import { MOCK_PSYCHO_ARTICLES, PSYCHO_GRADIENT_MAP } from '@/constants/psychoEducationData';
import { toDisplayString } from '@/utils/toDisplayString';
import { toSafeNumber } from '@/utils/safeDisplay';

function mapPsychoCategory(raw: unknown): PsychoCategory {
  const s = toDisplayString(raw, '').toLowerCase();
  if (s.includes('stress') || s.includes('스트레스')) return 'stress';
  if (s.includes('emotion') || s.includes('감정')) return 'emotion';
  if (s.includes('relation') || s.includes('관계')) return 'relationship';
  if (s.includes('self') || s.includes('돌봄')) return 'selfcare';
  return 'selfcare';
}

function categoryLabel(cat: PsychoCategory): string {
  switch (cat) {
    case 'stress':
      return '스트레스 관리';
    case 'emotion':
      return '감정 이해';
    case 'relationship':
      return '관계';
    case 'selfcare':
      return '자기돌봄';
    default:
      return '심리 교육';
  }
}

function normalizePages(raw: unknown, titleFallback: string, bodyFallback: string): PsychoPage[] {
  if (Array.isArray(raw)) {
    const pages: PsychoPage[] = [];
    for (const row of raw) {
      if (row && typeof row === 'object') {
        const o = row as Record<string, unknown>;
        pages.push({
          title: toDisplayString(o.title ?? o.heading, titleFallback),
          body: toDisplayString(o.body ?? o.content ?? o.text, bodyFallback),
        });
      }
    }
    if (pages.length > 0) return pages;
  }
  return [{ title: titleFallback, body: bodyFallback }];
}

function normalizeArticle(raw: unknown, index: number): PsychoArticle | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = toSafeNumber(o.id ?? o.articleId ?? index + 1, index + 1);
  const title = toDisplayString(o.title ?? o.name, '');
  const summary = toDisplayString(o.summary ?? o.description ?? o.subtitle, '');
  const body = toDisplayString(o.body ?? o.content ?? o.text, '');
  if (!title && !body && !summary) return null;
  const category = mapPsychoCategory(o.category ?? o.topic);
  const readMinutes = toSafeNumber(o.readMinutes ?? o.estimatedMinutes ?? 3, 3);
  const pages = normalizePages(
    o.pages ?? o.cards ?? o.slides,
    title || '심리 교육',
    body || summary || '내용을 준비 중입니다.',
  );
  return {
    id,
    category,
    categoryLabel: toDisplayString(o.categoryLabel, categoryLabel(category)),
    title: title || summary.slice(0, 60) || '제목 없음',
    summary: summary || body.slice(0, 120) || '요약 없음',
    readMinutes,
    pages,
    gradientColors: PSYCHO_GRADIENT_MAP[category],
  };
}

function normalizeArticleList(raw: unknown): PsychoArticle[] | null {
  const body = unwrapApiResponse<unknown>(raw) ?? raw;
  if (!Array.isArray(body)) {
    if (body && typeof body === 'object') {
      const obj = body as Record<string, unknown>;
      if (Array.isArray(obj.content)) return normalizeArticleList(obj.content);
      if (Array.isArray(obj.items)) return normalizeArticleList(obj.items);
    }
    return null;
  }
  const out: PsychoArticle[] = [];
  let i = 0;
  for (const row of body) {
    const a = normalizeArticle(row, i);
    if (a) out.push(a);
    i += 1;
  }
  return out.length > 0 ? out : [];
}

/**
 * @throws 네트워크·HTTP 오류 시 (TanStack Query가 isError 처리)
 */
export async function fetchPsychoEducationListOrThrow(): Promise<PsychoArticle[]> {
  const raw = await apiGet<unknown>(PSYCHO_EDUCATION_API.LIST);
  const list = normalizeArticleList(raw);
  if (list == null) {
    throw new Error('INVALID_PSYCHO_RESPONSE');
  }
  return list;
}

export type PsychoCatalogSource = 'api' | 'demo';

export interface PsychoEducationCatalogState {
  source: PsychoCatalogSource;
  articles: PsychoArticle[];
  /** LIST 호출 실패·파싱 오류 시 true — 샘플로 대체됨 */
  usedFallbackDueToError: boolean;
}

/**
 * 성공·비어 있지 않으면 API 권위; 그 외는 `MOCK_PSYCHO_ARTICLES`(플래그는 파일머리 원장).
 */
export async function fetchPsychoEducationCatalog(): Promise<PsychoEducationCatalogState> {
  try {
    const list = await fetchPsychoEducationListOrThrow();
    if (list.length > 0) {
      return {
        source: 'api',
        articles: list,
        usedFallbackDueToError: false,
      };
    }
  } catch {
    return {
      source: 'demo',
      articles: [...MOCK_PSYCHO_ARTICLES],
      usedFallbackDueToError: true,
    };
  }
  return {
    source: 'demo',
    articles: [...MOCK_PSYCHO_ARTICLES],
    usedFallbackDueToError: false,
  };
}
