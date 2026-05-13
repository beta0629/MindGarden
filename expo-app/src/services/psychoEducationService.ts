/**
 * 심리 교육 — `GET /api/v1/psycho-education` 시도·정규화
 *
 * SSOT: `docs/project-management/EXPO_NATIVE_APP_PLAN.md` Phase 3-C·§13
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
  return [
    { title: titleFallback, body: bodyFallback },
  ];
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
 * `GET /api/v1/psycho-education` 성공·비어 있지 않으면 API, 그 외 샘플(§13 Phase 3-C)
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
