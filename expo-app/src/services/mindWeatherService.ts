/**
 * 마음 날씨 — Phase 4-A 분석·공유 서비스 레이어.
 *
 * - **API 우선**: `apiPost(MIND_WEATHER_API.ANALYZE)` 등이 성공하면 서버 응답을 그대로 사용.
 * - **폴백**: 백엔드(Spring) 미부착 단계에서는 키워드 휴리스틱 + MMKV 캐시로 동일한 인터페이스를 제공.
 *
 * SSOT:
 * - `docs/project-management/CONSULTANT_CLIENT_APP_PLAN.md` Phase 4 A절
 * - `docs/design-system/v2/MIND_WEATHER_UI_UX_SPEC.md`
 *
 * @author MindGarden
 * @since 2026-05-13 — 목록·인박스 로컬 병합으로 폴백·서버 반영 전 카드 누락 방지
 */
import { getMmkv } from '@/lib/getMmkv';
import { apiDelete, apiGet, apiPost } from '@/api/client';
import { MIND_WEATHER_API } from '@/api/endpoints';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import {
  MIND_WEATHER_KEYWORDS,
  MIND_WEATHER_KEYWORD_DISPLAY_LIMIT,
  MIND_WEATHER_SOURCES,
  MIND_WEATHER_STORAGE_KEY,
  MIND_WEATHER_SUMMARY_TONE,
  type MindWeatherKeywordDef,
  type MindWeatherSource,
  type MindWeatherTone,
} from '@/constants/mindWeatherKeywords';
import { toDisplayString } from '@/utils/toDisplayString';
import { toSafeNumber } from '@/utils/safeDisplay';

const mmkv = getMmkv(MIND_WEATHER_STORAGE_KEY);

const STORAGE_CARDS_KEY = 'cards';
const STORAGE_INBOX_KEY = 'inbox';

export interface MindWeatherKeyword {
  /** 안정 식별자(영문 키 또는 백엔드 응답 코드) */
  readonly key: string;
  /** 화면에 표시되는 한국어 라벨 */
  readonly label: string;
  /** 0~1 사이. mock 환경에서는 매칭 횟수 비율로 산출 */
  readonly weight: number;
  readonly polarity: -1 | 0 | 1;
}

export interface MindWeatherShareConsent {
  /** AI 요약·키워드 공유(필수 동의) */
  readonly summary: boolean;
  /** 원문(메모/일기) 함께 공유(선택 동의) */
  readonly original: boolean;
  /** 공유 대상 상담사 — 미지정 시 매칭된 담당 상담사 자동 라우팅 */
  readonly consultantId?: number;
  /** 마지막 동의·철회 시각(ISO) */
  readonly updatedAt: string;
}

export interface MindWeatherCard {
  readonly id: string;
  readonly clientId?: number;
  readonly clientName?: string;
  readonly source: MindWeatherSource;
  readonly text: string;
  readonly summary: string;
  readonly tone: MindWeatherTone;
  readonly keywords: MindWeatherKeyword[];
  /** 옵트인 동의 상태(공유 안 했으면 `null`) */
  readonly share: MindWeatherShareConsent | null;
  readonly createdAt: string;
}

export interface MindWeatherAnalyzeRequest {
  readonly text: string;
  readonly source: MindWeatherSource;
  readonly sourceRefId?: string;
}

export interface MindWeatherListPayload {
  readonly items: MindWeatherCard[];
  readonly source: 'api' | 'cache';
}

function nowIso(): string {
  return new Date().toISOString();
}

function getAllCardsLocal(): MindWeatherCard[] {
  const raw = mmkv.getString(STORAGE_CARDS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MindWeatherCard[]) : [];
  } catch {
    return [];
  }
}

function saveAllCardsLocal(cards: MindWeatherCard[]): void {
  mmkv.set(STORAGE_CARDS_KEY, JSON.stringify(cards));
}

function getInboxLocal(): MindWeatherCard[] {
  const raw = mmkv.getString(STORAGE_INBOX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MindWeatherCard[]) : [];
  } catch {
    return [];
  }
}

function saveInboxLocal(cards: MindWeatherCard[]): void {
  mmkv.set(STORAGE_INBOX_KEY, JSON.stringify(cards));
}

/** 동일 카드를 카드/인박스 양쪽에서 일관되게 갱신한다. mock 환경 한정. */
function syncInboxLocal(card: MindWeatherCard): void {
  const inbox = getInboxLocal();
  const next = inbox.filter((c) => c.id !== card.id);
  if (card.share?.summary) {
    next.unshift(card);
  }
  saveInboxLocal(next);
}

function generateLocalId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `local-${ts}-${rand}`;
}

/* -------------------------------------------------------------------------- */
/*                            mock 분석 휴리스틱                              */
/* -------------------------------------------------------------------------- */

interface KeywordHit {
  readonly def: MindWeatherKeywordDef;
  hits: number;
}

function detectKeywords(text: string): MindWeatherKeyword[] {
  const lowered = text.toLowerCase();
  const hits: KeywordHit[] = [];
  for (const def of MIND_WEATHER_KEYWORDS) {
    let count = 0;
    for (const matcher of def.matchers) {
      if (matcher && lowered.includes(matcher)) {
        count += 1;
      }
    }
    if (count > 0) {
      hits.push({ def, hits: count });
    }
  }
  if (hits.length === 0) return [];
  const total = hits.reduce((acc, h) => acc + h.hits, 0);
  hits.sort((a, b) => b.hits - a.hits);
  return hits.slice(0, MIND_WEATHER_KEYWORD_DISPLAY_LIMIT).map((h) => ({
    key: h.def.key,
    label: h.def.label,
    polarity: h.def.polarity,
    weight: total > 0 ? h.hits / total : 0,
  }));
}

function pickTone(keywords: MindWeatherKeyword[]): MindWeatherTone {
  if (keywords.length === 0) return 'empty';
  let positive = 0;
  let negative = 0;
  for (const k of keywords) {
    if (k.polarity === 1) positive += k.weight;
    if (k.polarity === -1) negative += k.weight;
  }
  if (positive > 0 && negative > 0 && Math.abs(positive - negative) < 0.2) {
    return 'mixed';
  }
  if (positive > negative) return 'positive';
  if (negative > positive) return 'negative';
  return 'mixed';
}

function buildSummary(keywords: MindWeatherKeyword[], tone: MindWeatherTone): string {
  const base = MIND_WEATHER_SUMMARY_TONE[tone];
  if (keywords.length === 0) return base;
  const lead = keywords[0]?.label ?? '';
  if (!lead) return base;
  if (tone === 'positive') {
    return `${base} 특히 '${lead}' 결이 두드러져요.`;
  }
  if (tone === 'negative') {
    return `${base} '${lead}' 키워드가 자주 보였어요.`;
  }
  if (tone === 'mixed') {
    return `${base} '${lead}' 등 여러 감정이 함께 보여요.`;
  }
  return base;
}

function isMindWeatherSource(value: unknown): value is MindWeatherSource {
  return typeof value === 'string' && (MIND_WEATHER_SOURCES as readonly string[]).includes(value);
}

function normalizeKeyword(raw: unknown): MindWeatherKeyword | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const key = toDisplayString(o.key ?? o.code ?? o.id, '');
  const label = toDisplayString(o.label ?? o.name ?? key, '');
  if (!key || !label) return null;
  const def = MIND_WEATHER_KEYWORDS.find((d) => d.key === key);
  const polarityRaw = toSafeNumber(o.polarity, def?.polarity ?? 0);
  let polarity: -1 | 0 | 1 = 0;
  if (polarityRaw > 0) polarity = 1;
  else if (polarityRaw < 0) polarity = -1;
  return {
    key,
    label,
    polarity,
    weight: Math.max(0, Math.min(1, toSafeNumber(o.weight ?? o.score, 0))),
  };
}

function pickConsultantId(raw: unknown): number | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const n = toSafeNumber(raw, 0);
    return n || undefined;
  }
  return undefined;
}

/** 카드 JSON에서 내담자 회원 id 추출 (`clientId`, snake_case, `client.id` 등). */
function pickClientIdFromCardRaw(o: Record<string, unknown>): number | undefined {
  const direct = pickConsultantId(o.clientId ?? o.client_id);
  if (direct != null) {
    return direct;
  }
  const nested = o.client;
  if (nested != null && typeof nested === 'object') {
    const nc = nested as Record<string, unknown>;
    return pickConsultantId(nc.id ?? nc.userId ?? nc.clientId);
  }
  return undefined;
}

function pickClientNameFromCardRaw(o: Record<string, unknown>): string | undefined {
  const n = toDisplayString(o.clientName ?? o.client_name ?? o.userName, '').trim();
  if (n) {
    return n;
  }
  const nested = o.client;
  if (nested != null && typeof nested === 'object') {
    const nm = toDisplayString((nested as Record<string, unknown>).name, '').trim();
    return nm || undefined;
  }
  return undefined;
}

function normalizeShareConsent(raw: unknown): MindWeatherShareConsent | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (!('summary' in o) && !('shareSummary' in o)) return null;
  return {
    summary: Boolean(o.summary ?? o.shareSummary),
    original: Boolean(o.original ?? o.shareOriginal),
    consultantId: pickConsultantId(o.consultantId),
    updatedAt: toDisplayString(o.updatedAt ?? o.changedAt, nowIso()),
  };
}

function normalizeCard(raw: unknown): MindWeatherCard | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = toDisplayString(o.id ?? o.cardId, '');
  if (!id) return null;
  const sourceRaw = o.source;
  const source: MindWeatherSource = isMindWeatherSource(sourceRaw) ? sourceRaw : 'memo';
  const keywordsRaw = Array.isArray(o.keywords) ? o.keywords : [];
  const keywords = keywordsRaw
    .map(normalizeKeyword)
    .filter((k): k is MindWeatherKeyword => k != null);
  const tone = (() => {
    const t = toDisplayString(o.tone, '');
    if (t === 'positive' || t === 'negative' || t === 'mixed' || t === 'empty') {
      return t as MindWeatherTone;
    }
    return pickTone(keywords);
  })();
  const summary = toDisplayString(o.summary, buildSummary(keywords, tone));
  const text = toDisplayString(o.text ?? o.note ?? o.bodyText, '');
  const createdAt = toDisplayString(o.createdAt ?? o.created_at, nowIso());
  const clientId = pickClientIdFromCardRaw(o);
  const clientName = pickClientNameFromCardRaw(o);
  return {
    id,
    clientId,
    clientName,
    source,
    text,
    summary,
    tone,
    keywords,
    share: normalizeShareConsent(o.share ?? o.shareConsent ?? o.consent),
    createdAt,
  };
}

function normalizeListPayload(raw: unknown): MindWeatherCard[] | null {
  const body = unwrapApiResponse<unknown>(raw) ?? raw;
  if (body == null) return null;
  if (Array.isArray(body)) {
    return body.map(normalizeCard).filter((c): c is MindWeatherCard => c != null);
  }
  if (typeof body === 'object') {
    const o = body as Record<string, unknown>;
    if (Array.isArray(o.content)) return normalizeListPayload(o.content);
    if (Array.isArray(o.items)) return normalizeListPayload(o.items);
  }
  return null;
}

function parseCreatedAtMs(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * 서버 목록이 비어 있거나 분석이 일시적으로 로컬 폴백만 된 경우에도
 * MMKV에만 있는 카드가 목록에서 사라지지 않도록 병합한다.
 */
function mergeMindWeatherListWithLocal(apiItems: MindWeatherCard[]): MindWeatherCard[] {
  const locals = getAllCardsLocal();
  if (locals.length === 0) {
    return apiItems;
  }
  const byId = new Map<string, MindWeatherCard>();
  for (const c of apiItems) {
    byId.set(c.id, c);
  }
  for (const c of locals) {
    if (!byId.has(c.id)) {
      byId.set(c.id, c);
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) => parseCreatedAtMs(b.createdAt) - parseCreatedAtMs(a.createdAt),
  );
}

/**
 * 상담사 수신함: API가 빈 배열이어도 MMKV `inbox`에만 있는 공유 카드가 누락되지 않게 병합한다.
 * 동일 `id`는 **서버(API) 응답을 우선**하고, 나머지는 `createdAt` 내림차순으로 정렬한다.
 */
function mergeConsultantInboxWithLocal(apiItems: MindWeatherCard[]): MindWeatherCard[] {
  const locals = getInboxLocal();
  if (locals.length === 0) {
    return apiItems;
  }
  const byId = new Map<string, MindWeatherCard>();
  for (const c of apiItems) {
    byId.set(c.id, c);
  }
  for (const c of locals) {
    if (!byId.has(c.id)) {
      byId.set(c.id, c);
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) => parseCreatedAtMs(b.createdAt) - parseCreatedAtMs(a.createdAt),
  );
}

/* -------------------------------------------------------------------------- */
/*                                 공개 API                                   */
/* -------------------------------------------------------------------------- */

export async function analyzeMindWeather(
  request: MindWeatherAnalyzeRequest,
): Promise<MindWeatherCard> {
  try {
    const raw = await apiPost<unknown>(MIND_WEATHER_API.ANALYZE, request);
    const body = unwrapApiResponse<unknown>(raw) ?? raw;
    const normalized = normalizeCard(body);
    if (normalized != null) {
      const cards = getAllCardsLocal();
      saveAllCardsLocal([normalized, ...cards.filter((c) => c.id !== normalized.id)]);
      return normalized;
    }
    /* 본문은 왔으나 기대 형태 아님 → mock fallback */
  } catch {
    /* mock fallback: 백엔드 미부착 또는 일시 오류 */
  }
  const keywords = detectKeywords(request.text);
  const tone = pickTone(keywords);
  const card: MindWeatherCard = {
    id: generateLocalId(),
    source: request.source,
    text: request.text,
    summary: buildSummary(keywords, tone),
    tone,
    keywords,
    share: null,
    createdAt: nowIso(),
  };
  const cards = getAllCardsLocal();
  saveAllCardsLocal([card, ...cards]);
  return card;
}

export async function fetchMindWeatherList(): Promise<MindWeatherListPayload> {
  try {
    const raw = await apiGet<unknown>(MIND_WEATHER_API.LIST);
    const items = normalizeListPayload(raw);
    if (items != null) {
      return { items: mergeMindWeatherListWithLocal(items), source: 'api' };
    }
  } catch {
    /* mock fallback */
  }
  return { items: getAllCardsLocal(), source: 'cache' };
}

export async function fetchMindWeatherDetail(id: string): Promise<MindWeatherCard | null> {
  try {
    const raw = await apiGet<unknown>(MIND_WEATHER_API.detail(id));
    const body = unwrapApiResponse<unknown>(raw) ?? raw;
    const normalized = normalizeCard(body);
    if (normalized != null) return normalized;
  } catch {
    /* mock fallback */
  }
  return getAllCardsLocal().find((c) => c.id === id) ?? null;
}

export interface MindWeatherShareInput {
  readonly cardId: string;
  readonly summary: boolean;
  readonly original: boolean;
  readonly consultantId?: number;
}

export async function shareMindWeatherCard(input: MindWeatherShareInput): Promise<MindWeatherCard> {
  const consent: MindWeatherShareConsent = {
    summary: input.summary,
    original: input.original,
    consultantId: input.consultantId,
    updatedAt: nowIso(),
  };
  try {
    const raw = await apiPost<unknown>(MIND_WEATHER_API.share(input.cardId), {
      shareSummary: consent.summary,
      shareOriginal: consent.original,
      consultantId: consent.consultantId,
    });
    const body = unwrapApiResponse<unknown>(raw) ?? raw;
    const normalized = normalizeCard(body);
    if (normalized != null) {
      const cards = getAllCardsLocal();
      const next = [normalized, ...cards.filter((c) => c.id !== normalized.id)];
      saveAllCardsLocal(next);
      syncInboxLocal(normalized);
      return normalized;
    }
  } catch {
    /* mock fallback */
  }
  const cards = getAllCardsLocal();
  const target = cards.find((c) => c.id === input.cardId);
  if (!target) {
    throw new Error('마음 날씨 카드를 찾지 못했습니다.');
  }
  const updated: MindWeatherCard = { ...target, share: consent };
  const next = cards.map((c) => (c.id === input.cardId ? updated : c));
  saveAllCardsLocal(next);
  syncInboxLocal(updated);
  return updated;
}

export async function unshareMindWeatherCard(cardId: string): Promise<MindWeatherCard> {
  try {
    await apiDelete<unknown>(MIND_WEATHER_API.unshare(cardId));
  } catch {
    /* mock fallback */
  }
  const cards = getAllCardsLocal();
  const target = cards.find((c) => c.id === cardId);
  if (!target) {
    throw new Error('마음 날씨 카드를 찾지 못했습니다.');
  }
  const updated: MindWeatherCard = { ...target, share: null };
  const next = cards.map((c) => (c.id === cardId ? updated : c));
  saveAllCardsLocal(next);
  syncInboxLocal(updated);
  return updated;
}

export async function fetchConsultantMindWeatherInbox(): Promise<MindWeatherListPayload> {
  try {
    const raw = await apiGet<unknown>(MIND_WEATHER_API.CONSULTANT_INBOX);
    const items = normalizeListPayload(raw);
    if (items != null) {
      return { items: mergeConsultantInboxWithLocal(items), source: 'api' };
    }
  } catch {
    /* mock fallback */
  }
  return { items: getInboxLocal(), source: 'cache' };
}

/**
 * 디자이너 §4.3 트렌드 알림 — 최근 N개 카드에서 동일 키워드가 임계 이상이면 첫 키워드를 반환.
 * 컴포넌트는 반환값이 있을 때만 부드러운 카피를 노출.
 */
export function detectTrendingKeyword(
  cards: readonly MindWeatherCard[],
  threshold: number,
): MindWeatherKeyword | null {
  if (cards.length === 0 || threshold <= 0) return null;
  const counts = new Map<string, { keyword: MindWeatherKeyword; count: number }>();
  for (const card of cards) {
    for (const kw of card.keywords) {
      const prev = counts.get(kw.key);
      if (prev) {
        prev.count += 1;
      } else {
        counts.set(kw.key, { keyword: kw, count: 1 });
      }
    }
  }
  let leading: { keyword: MindWeatherKeyword; count: number } | null = null;
  for (const value of counts.values()) {
    if (value.count >= threshold && (leading == null || value.count > leading.count)) {
      leading = value;
    }
  }
  return leading?.keyword ?? null;
}
