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
  CONSULTANT_MIND_WEATHER_INBOX_FETCH_FAILED,
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
import {
  isGenericMindWeatherClientDisplayName,
  MIND_WEATHER_GENERIC_CLIENT_LABEL,
} from '@/utils/mindWeatherClientLabel';
import { useAuthStore } from '@/stores/useAuthStore';
import { syncTenantFromAccessToken } from '@/utils/syncTenantFromAccessToken';

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

/**
 * 카드 id는 항상 문자열로 통일한다.
 * Android 등에서 JSON 역직렬화 시 숫자 id가 되면 `===` 비교가 깨져 공유·병합이 실패할 수 있다.
 */
function normalizeMindWeatherCardId(id: string | number | undefined | null): string {
  return toDisplayString(id, '').trim();
}

function sameMindWeatherCardId(a: unknown, b: unknown): boolean {
  return (
    normalizeMindWeatherCardId(a as string | number) ===
    normalizeMindWeatherCardId(b as string | number)
  );
}

function withNormalizedMindWeatherCardId(card: MindWeatherCard): MindWeatherCard {
  const id = normalizeMindWeatherCardId(card.id);
  if (id === card.id) {
    return card;
  }
  return { ...card, id };
}

function getAllCardsLocal(): MindWeatherCard[] {
  const raw = mmkv.getString(STORAGE_CARDS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(normalizeCard).filter((c): c is MindWeatherCard => c != null);
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
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(normalizeCard).filter((c): c is MindWeatherCard => c != null);
  } catch {
    return [];
  }
}

function saveInboxLocal(cards: MindWeatherCard[]): void {
  mmkv.set(STORAGE_INBOX_KEY, JSON.stringify(cards));
}

/** 동일 카드를 카드/인박스 양쪽에서 일관되게 갱신한다. mock 환경 한정. */
function syncInboxLocal(card: MindWeatherCard): void {
  const normalized = withNormalizedMindWeatherCardId(card);
  const inbox = getInboxLocal();
  const next = inbox.filter((c) => !sameMindWeatherCardId(c.id, normalized.id));
  if (normalized.share?.summary) {
    next.unshift(normalized);
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
  if (typeof raw === 'bigint') {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  if (typeof raw === 'string') {
    const n = toSafeNumber(raw, 0);
    return n || undefined;
  }
  return undefined;
}

/** 카드 JSON에서 내담자 회원 id 추출 (`clientId`, snake_case, `client.id` 등). */
function pickClientIdFromCardRaw(o: Record<string, unknown>): number | undefined {
  const direct = pickConsultantId(
    o.clientId ??
      o.client_id ??
      o.clientUserId ??
      o.client_user_id ??
      o.memberId ??
      o.member_id ??
      o.userId ??
      o.user_id ??
      o.ownerId ??
      o.owner_id,
  );
  if (direct != null) {
    return direct;
  }
  const nested = o.client ?? o.clientUser ?? o.member ?? o.user;
  if (nested != null && typeof nested === 'object') {
    const nc = nested as Record<string, unknown>;
    return pickConsultantId(
      nc.id ??
        nc.userId ??
        nc.user_id ??
        nc.clientId ??
        nc.client_id ??
        nc.memberId ??
        nc.member_id,
    );
  }
  return undefined;
}

function pickClientNameFromCardRaw(o: Record<string, unknown>): string | undefined {
  const n = toDisplayString(
    o.clientName ?? o.client_name ?? o.userName ?? o.user_name ?? o.displayName ?? o.display_name,
    '',
  ).trim();
  if (n) {
    return n;
  }
  const nested = o.client ?? o.clientUser ?? o.member ?? o.user;
  if (nested != null && typeof nested === 'object') {
    const nc = nested as Record<string, unknown>;
    const nm = toDisplayString(
      nc.name ?? nc.nickname ?? nc.displayName ?? nc.display_name,
      '',
    ).trim();
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
  const id = normalizeMindWeatherCardId(o.id ?? o.cardId);
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
  let clientName = pickClientNameFromCardRaw(o);
  if (clientId != null && clientId > 0) {
    const trimmed = toDisplayString(clientName, '').trim();
    if (!trimmed || isGenericMindWeatherClientDisplayName(trimmed)) {
      clientName = `${MIND_WEATHER_GENERIC_CLIENT_LABEL} #${clientId}`;
    }
  } else {
    const trimmed = toDisplayString(clientName, '').trim();
    if (!trimmed || isGenericMindWeatherClientDisplayName(trimmed)) {
      clientName = undefined;
    }
  }
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

/** Spring `ApiResponse`·페이지 DTO 등에서 카드 배열 후보 추출 */
const MIND_WEATHER_LIST_ARRAY_KEYS = [
  'data',
  'content',
  'items',
  'rows',
  'results',
  'cards',
] as const;

function tryReadMindWeatherCardArray(obj: Record<string, unknown>): unknown[] | null {
  for (const key of MIND_WEATHER_LIST_ARRAY_KEYS) {
    const v = obj[key];
    if (Array.isArray(v)) {
      return v;
    }
  }
  return null;
}

/**
 * 목록 응답 본문에서 카드 배열을 추출한다.
 * `unwrapApiResponse` 전후·이중 래핑·`rows`/`results` 등 변형 키를 순회한다.
 */
function normalizeListPayload(raw: unknown): MindWeatherCard[] | null {
  let cursor: unknown = raw;
  for (let depth = 0; depth < 5; depth += 1) {
    if (cursor == null) {
      return null;
    }
    if (Array.isArray(cursor)) {
      const cards = cursor.map(normalizeCard).filter((c): c is MindWeatherCard => c != null);
      return cards;
    }
    if (typeof cursor === 'object') {
      const fromKeys = tryReadMindWeatherCardArray(cursor as Record<string, unknown>);
      if (fromKeys != null) {
        cursor = fromKeys;
        continue;
      }
    }
    const unwrapped = unwrapApiResponse<unknown>(cursor);
    if (unwrapped == null || unwrapped === cursor) {
      return null;
    }
    cursor = unwrapped;
  }
  return null;
}

function parseCreatedAtMs(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

function pickBetterMindWeatherClientName(a?: string, b?: string): string | undefined {
  const a1 = toDisplayString(a, '').trim();
  const b1 = toDisplayString(b, '').trim();
  const aOk = Boolean(a1) && !isGenericMindWeatherClientDisplayName(a1);
  const bOk = Boolean(b1) && !isGenericMindWeatherClientDisplayName(b1);
  if (aOk) {
    return a1;
  }
  if (bOk) {
    return b1;
  }
  return a1 || b1 || undefined;
}

/**
 * 로컬/mock 경로에서 로그인 역할이 내담자(`client`)면 카드에 `clientId`·실명을 보강한다.
 * `shareMindWeatherCard` mock 폴백과 동일 정책.
 */
function enrichMindWeatherCardWithClientAuth(card: MindWeatherCard): MindWeatherCard {
  const { user, role } = useAuthStore.getState();
  if (role !== 'client' || user == null) {
    return card;
  }
  const cid = toSafeNumber(user.id, Number.NaN);
  const hasCid = Number.isFinite(cid) && cid > 0;
  const displayName = toDisplayString(user.name, '').trim();
  const nameTrim = toDisplayString(card.clientName, '').trim();
  const needId = card.clientId == null && hasCid;
  const needName =
    displayName.length > 0 && (!nameTrim || isGenericMindWeatherClientDisplayName(card.clientName));
  if (!needId && !needName) {
    return card;
  }
  return {
    ...card,
    ...(needId ? { clientId: cid } : {}),
    ...(needName ? { clientName: displayName } : {}),
  };
}

/**
 * 동일 카드 id에 대해 API 행과 로컬 인박스 행의 내담자 식별 필드를 합친다(서버 필드 우선).
 */
function mergeSameIdConsultantInboxPreferApi(
  apiRow: MindWeatherCard,
  localRow: MindWeatherCard,
): MindWeatherCard {
  return sanitizeMindWeatherCardGenericClientLabel({
    ...apiRow,
    clientId: apiRow.clientId ?? localRow.clientId,
    clientName: pickBetterMindWeatherClientName(apiRow.clientName, localRow.clientName),
  });
}

/**
 * 회원 id 없이 제네릭 `내담자`만 있으면 헤드라인이 `formatMindWeatherClientHeadline`으로
 * `공유 카드 #` 폴백을 타도록 `clientName`을 비운다.
 */
function sanitizeMindWeatherCardGenericClientLabel(card: MindWeatherCard): MindWeatherCard {
  const cid = card.clientId;
  const nameTrim = toDisplayString(card.clientName, '').trim();
  if (cid != null && cid > 0) {
    if (!nameTrim || isGenericMindWeatherClientDisplayName(nameTrim)) {
      return { ...card, clientName: `${MIND_WEATHER_GENERIC_CLIENT_LABEL} #${cid}` };
    }
    return card;
  }
  if (!nameTrim || isGenericMindWeatherClientDisplayName(nameTrim)) {
    return { ...card, clientName: undefined };
  }
  return card;
}

/**
 * MMKV `inbox`·`cards`에 더 풍부한 clientId/실명이 있으면 수신함 카드에 보강한다.
 */
function enrichConsultantInboxCardFromLocalStores(
  card: MindWeatherCard,
  inboxLocals: readonly MindWeatherCard[],
  cardsLocals: readonly MindWeatherCard[],
): MindWeatherCard {
  const fromInbox = inboxLocals.find((c) => sameMindWeatherCardId(c.id, card.id));
  const fromCards = cardsLocals.find((c) => sameMindWeatherCardId(c.id, card.id));
  const clientId = card.clientId ?? fromInbox?.clientId ?? fromCards?.clientId;
  const clientName = pickBetterMindWeatherClientName(
    card.clientName,
    pickBetterMindWeatherClientName(fromInbox?.clientName, fromCards?.clientName),
  );
  return sanitizeMindWeatherCardGenericClientLabel({ ...card, clientId, clientName });
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
    const cn = withNormalizedMindWeatherCardId(c);
    byId.set(normalizeMindWeatherCardId(cn.id), cn);
  }
  for (const c of locals) {
    const cn = withNormalizedMindWeatherCardId(c);
    const key = normalizeMindWeatherCardId(cn.id);
    if (!byId.has(key)) {
      byId.set(key, cn);
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
  const inboxLocals = getInboxLocal();
  const cardsLocals = getAllCardsLocal();
  const byId = new Map<string, MindWeatherCard>();
  for (const c of apiItems) {
    const cn = withNormalizedMindWeatherCardId(c);
    byId.set(normalizeMindWeatherCardId(cn.id), cn);
  }
  for (const c of inboxLocals) {
    const cn = withNormalizedMindWeatherCardId(c);
    const key = normalizeMindWeatherCardId(cn.id);
    const existing = byId.get(key);
    if (existing) {
      byId.set(key, mergeSameIdConsultantInboxPreferApi(existing, cn));
    } else {
      byId.set(key, cn);
    }
  }
  return Array.from(byId.values())
    .map((c) => enrichConsultantInboxCardFromLocalStores(c, inboxLocals, cardsLocals))
    .sort((a, b) => parseCreatedAtMs(b.createdAt) - parseCreatedAtMs(a.createdAt));
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
      saveAllCardsLocal([
        normalized,
        ...cards.filter((c) => !sameMindWeatherCardId(c.id, normalized.id)),
      ]);
      return normalized;
    }
    /* 본문은 왔으나 기대 형태 아님 → mock fallback */
  } catch {
    /* mock fallback: 백엔드 미부착 또는 일시 오류 */
  }
  const keywords = detectKeywords(request.text);
  const tone = pickTone(keywords);
  let card: MindWeatherCard = {
    id: generateLocalId(),
    source: request.source,
    text: request.text,
    summary: buildSummary(keywords, tone),
    tone,
    keywords,
    share: null,
    createdAt: nowIso(),
  };
  card = enrichMindWeatherCardWithClientAuth(card);
  const cards = getAllCardsLocal();
  saveAllCardsLocal([card, ...cards.filter((c) => !sameMindWeatherCardId(c.id, card.id))]);
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
  const idKey = normalizeMindWeatherCardId(id);
  try {
    const raw = await apiGet<unknown>(MIND_WEATHER_API.detail(idKey));
    const body = unwrapApiResponse<unknown>(raw) ?? raw;
    const normalized = normalizeCard(body);
    if (normalized != null) return normalized;
  } catch {
    /* mock fallback */
  }
  return getAllCardsLocal().find((c) => sameMindWeatherCardId(c.id, idKey)) ?? null;
}

export interface MindWeatherShareInput {
  readonly cardId: string | number;
  readonly summary: boolean;
  readonly original: boolean;
  readonly consultantId?: number;
}

function isLocalMindWeatherCardId(cardId: string): boolean {
  return cardId.startsWith('local-');
}

export async function shareMindWeatherCard(input: MindWeatherShareInput): Promise<MindWeatherCard> {
  const cardIdKey = normalizeMindWeatherCardId(input.cardId);
  if (isLocalMindWeatherCardId(cardIdKey)) {
    throw new Error(
      '서버에 저장된 카드만 공유할 수 있어요. 새로 분석한 뒤 다시 공유해 주세요.',
    );
  }
  const raw = await apiPost<unknown>(MIND_WEATHER_API.share(cardIdKey), {
    shareSummary: input.summary,
    shareOriginal: input.original,
    consultantId: input.consultantId,
  });
  const body = unwrapApiResponse<unknown>(raw) ?? raw;
  const normalized = normalizeCard(body);
  if (normalized == null) {
    throw new Error('공유 응답 형식이 올바르지 않습니다.');
  }
  const cards = getAllCardsLocal();
  const next = [
    normalized,
    ...cards.filter((c) => !sameMindWeatherCardId(c.id, normalized.id)),
  ];
  saveAllCardsLocal(next);
  syncInboxLocal(normalized);
  return normalized;
}

export async function unshareMindWeatherCard(cardId: string | number): Promise<MindWeatherCard> {
  const cardIdKey = normalizeMindWeatherCardId(cardId);
  try {
    await apiDelete<unknown>(MIND_WEATHER_API.unshare(cardIdKey));
  } catch {
    /* mock fallback */
  }
  const cards = getAllCardsLocal();
  const target = cards.find((c) => sameMindWeatherCardId(c.id, cardIdKey));
  if (!target) {
    throw new Error('마음 날씨 카드를 찾지 못했습니다.');
  }
  const updated: MindWeatherCard = { ...target, share: null };
  const next = cards.map((c) => (sameMindWeatherCardId(c.id, cardIdKey) ? updated : c));
  saveAllCardsLocal(next);
  syncInboxLocal(updated);
  return updated;
}

export class MindWeatherInboxFetchError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'MindWeatherInboxFetchError';
    this.status = status;
  }
}

function throwConsultantInboxFetchError(err: unknown): never {
  const rec = err as { status?: number; message?: string };
  const status = rec.status ?? 0;
  const message = toDisplayString(rec.message, CONSULTANT_MIND_WEATHER_INBOX_FETCH_FAILED);
  if (__DEV__) {
    console.warn(`[mindWeather] consultant inbox fetch failed: ${status} ${message}`);
  }
  throw new MindWeatherInboxFetchError(message, status);
}

export async function fetchConsultantMindWeatherInbox(): Promise<MindWeatherListPayload> {
  syncTenantFromAccessToken(useAuthStore.getState().accessToken);

  let raw: unknown;
  try {
    raw = await apiGet<unknown>(MIND_WEATHER_API.CONSULTANT_INBOX);
  } catch (err) {
    throwConsultantInboxFetchError(err);
  }

  if (raw != null && typeof raw === 'object') {
    const root = raw as Record<string, unknown>;
    if (root.success === false) {
      throw new Error(
        toDisplayString(
          root.message ?? root.error ?? root.code,
          CONSULTANT_MIND_WEATHER_INBOX_FETCH_FAILED,
        ),
      );
    }
  }

  const items = normalizeListPayload(raw);
  if (items != null) {
    return { items: mergeConsultantInboxWithLocal(items), source: 'api' };
  }

  if (__DEV__) {
    console.warn('[mindWeather] consultant inbox: unrecognized response shape', raw);
  }
  throw new MindWeatherInboxFetchError(
    CONSULTANT_MIND_WEATHER_INBOX_FETCH_FAILED,
    0,
  );
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
