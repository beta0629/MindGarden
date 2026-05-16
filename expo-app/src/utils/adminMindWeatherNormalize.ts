/**
 * 어드민 마음날씨 관측 API 응답 정규화 — 웹 `adminWebScaffold.js`와 정합
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { toDisplayString, toSafeNumber } from '@/utils/safeDisplay';

export interface AdminMindWeatherCardItem {
  readonly id: number;
  readonly clientUserId: number;
  readonly tone: string;
  readonly shareSummaryLabel: string;
  readonly createdAt: string;
}

export interface AdminMindWeatherSummary {
  readonly totalCards: number;
  readonly cardsWithShareSummary: number;
  readonly cardsCreatedLast24Hours: number;
  readonly newestCardCreatedAt: string;
}

export interface AdminMindWeatherCardsPage {
  readonly items: AdminMindWeatherCardItem[];
  readonly totalElements: number;
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

const LIST_PAYLOAD_KEYS = ['data', 'content', 'items', 'cards', 'list', 'elements'] as const;

function normalizeApiListPayload(payload: unknown): unknown[] {
  if (payload == null) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (typeof payload !== 'object') {
    return [];
  }
  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj.content)) {
    return obj.content;
  }
  for (const key of LIST_PAYLOAD_KEYS) {
    const v = obj[key];
    if (Array.isArray(v)) {
      return v;
    }
  }
  return [];
}

/** Spring Data `Page` JSON 또는 일반 목록에서 행 배열 추출 */
export function normalizeSpringPageRows(payload: unknown): unknown[] {
  if (
    payload != null &&
    typeof payload === 'object' &&
    Array.isArray((payload as { content?: unknown }).content)
  ) {
    return (payload as { content: unknown[] }).content;
  }
  return normalizeApiListPayload(payload);
}

export function pickSpringPageMeta(payload: unknown): {
  totalElements: number;
  number: number;
  size: number;
  totalPages: number;
} {
  if (payload == null || typeof payload !== 'object') {
    return { totalElements: 0, number: 0, size: 20, totalPages: 0 };
  }
  const o = payload as Record<string, unknown>;
  return {
    totalElements: toSafeNumber(o.totalElements, 0),
    number: toSafeNumber(o.number, 0),
    size: toSafeNumber(o.size, 20),
    totalPages: toSafeNumber(o.totalPages, 0),
  };
}

function shareSummaryLabel(shareSummary: unknown): string {
  if (shareSummary === true) {
    return 'Y';
  }
  if (shareSummary === false) {
    return 'N';
  }
  return '—';
}

function mapCardRow(row: unknown, _index: number): AdminMindWeatherCardItem | null {
  if (row == null || typeof row !== 'object') {
    return null;
  }
  const o = row as Record<string, unknown>;
  const id = toSafeNumber(o.id, Number.NaN);
  if (!Number.isFinite(id)) {
    return null;
  }
  const clientUserId = toSafeNumber(o.clientUserId, 0);
  const createdAt =
    typeof o.createdAt === 'string' ? o.createdAt : o.createdAt != null ? String(o.createdAt) : '';
  return {
    id,
    clientUserId: Number.isFinite(clientUserId) ? clientUserId : 0,
    tone: toDisplayString(o.tone, '—'),
    shareSummaryLabel: shareSummaryLabel(o.shareSummary),
    createdAt,
  };
}

export function normalizeAdminMindWeatherCardsPage(raw: unknown): AdminMindWeatherCardsPage {
  const unwrapped =
    raw != null && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)
      ? (raw as Record<string, unknown>).data
      : raw;
  const rows = normalizeSpringPageRows(unwrapped);
  const meta = pickSpringPageMeta(unwrapped);
  const items: AdminMindWeatherCardItem[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const mapped = mapCardRow(rows[i], i);
    if (mapped) {
      items.push(mapped);
    }
  }
  return {
    items,
    totalElements: meta.totalElements,
    pageNumber: meta.number,
    pageSize: meta.size,
    totalPages: meta.totalPages,
  };
}

export function normalizeAdminMindWeatherSummary(raw: unknown): AdminMindWeatherSummary | null {
  if (raw == null) {
    return null;
  }
  let payload: unknown = raw;
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (obj.success === false) {
      return null;
    }
    if ('data' in obj && obj.data !== undefined) {
      payload = obj.data;
    }
  }
  if (payload == null || typeof payload !== 'object') {
    return null;
  }
  const o = payload as Record<string, unknown>;
  const newestRaw = o.newestCardCreatedAt;
  const newest =
    typeof newestRaw === 'string' ? newestRaw : newestRaw != null ? String(newestRaw) : '';
  return {
    totalCards: toSafeNumber(o.totalCards, 0),
    cardsWithShareSummary: toSafeNumber(o.cardsWithShareSummary, 0),
    cardsCreatedLast24Hours: toSafeNumber(o.cardsCreatedLast24Hours, 0),
    newestCardCreatedAt: newest,
  };
}
