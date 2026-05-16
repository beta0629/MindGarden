/**
 * 어드민 커뮤니티 검수 큐 API 응답 정규화 — 웹 `adminWebScaffold.js` 필드 매핑과 정합
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { toDisplayString, toSafeNumber } from '@/utils/safeDisplay';

export type CommunityModerationDecision = 'APPROVE' | 'REJECT';

export type CommunityPostKind = 'CLIENT_REVIEW' | 'CONSULTANT_COLUMN' | string;

export type CommunityModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | string;

export interface CommunityModerationQueueItem {
  readonly id: number;
  readonly postKind: CommunityPostKind;
  readonly moderationStatus: CommunityModerationStatus;
  readonly title: string;
  readonly bodyPreview: string;
  readonly authorUserId: number;
  readonly authorDisplay: string;
  readonly anonymous: boolean;
  readonly specialty: string | null;
  readonly createdAt: string;
}

const LIST_PAYLOAD_KEYS = [
  'data',
  'content',
  'items',
  'posts',
  'records',
  'list',
  'elements',
  'moderationQueue',
  'queue',
] as const;

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

/**
 * 검수 큐 GET 응답에서 행 배열 추출 (`extractModerationQueueRows` 동등)
 */
export function extractModerationQueueRows(raw: unknown): unknown[] {
  if (raw == null) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw !== 'object') {
    return [];
  }
  const obj = raw as Record<string, unknown>;
  if (obj.success === false) {
    return [];
  }
  if ('data' in obj && obj.data !== undefined) {
    return normalizeApiListPayload(obj.data);
  }
  return normalizeApiListPayload(raw);
}

export function pickCommunityModerationRowId(row: unknown): number | null {
  if (row == null || typeof row !== 'object') {
    return null;
  }
  const obj = row as Record<string, unknown>;
  const id = obj.id ?? obj.postId ?? obj.moderationQueueId ?? obj.queueItemId;
  const n = toSafeNumber(id, Number.NaN);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function pickRowTitle(row: Record<string, unknown>): string {
  const t = row.title ?? row.subject ?? row.postTitle ?? row.summary;
  return toDisplayString(t, '');
}

function pickRowStatus(row: Record<string, unknown>): CommunityModerationStatus {
  const s = row.moderationStatus ?? row.status ?? row.reviewStatus ?? row.state;
  return toDisplayString(s, 'PENDING').trim().toUpperCase() as CommunityModerationStatus;
}

function pickRowPostKind(row: Record<string, unknown>): CommunityPostKind {
  const k = row.postKind ?? row.kind ?? row.type;
  return toDisplayString(k, 'CLIENT_REVIEW').trim().toUpperCase() as CommunityPostKind;
}

function pickBodyPreview(row: Record<string, unknown>): string {
  const c =
    row.bodyPreview ?? row.content ?? row.body ?? row.postBody ?? row.text ?? row.description;
  return toDisplayString(c, '');
}

/**
 * 단건·목록 행을 앱 표시 모델로 정규화
 */
export function normalizeCommunityModerationQueueItem(
  row: unknown,
): CommunityModerationQueueItem | null {
  if (row == null || typeof row !== 'object') {
    return null;
  }
  const obj = row as Record<string, unknown>;
  const id = pickCommunityModerationRowId(obj);
  if (id == null) {
    return null;
  }
  const authorUserId = toSafeNumber(obj.authorUserId ?? obj.authorId, 0);
  return {
    id,
    postKind: pickRowPostKind(obj),
    moderationStatus: pickRowStatus(obj),
    title: pickRowTitle(obj),
    bodyPreview: pickBodyPreview(obj),
    authorUserId: Number.isFinite(authorUserId) ? authorUserId : 0,
    authorDisplay: toDisplayString(obj.authorDisplay ?? obj.authorName ?? obj.author, '—'),
    anonymous: obj.anonymous === true,
    specialty: obj.specialty != null ? toDisplayString(obj.specialty, '') : null,
    createdAt: toDisplayString(obj.createdAt ?? obj.created ?? obj.registeredAt, ''),
  };
}

export function normalizeCommunityModerationQueueList(
  raw: unknown,
): CommunityModerationQueueItem[] {
  const rows = extractModerationQueueRows(raw);
  const out: CommunityModerationQueueItem[] = [];
  for (const row of rows) {
    const item = normalizeCommunityModerationQueueItem(row);
    if (item != null) {
      out.push(item);
    }
  }
  return out;
}

export function buildCommunityModerationPatchBody(
  decision: CommunityModerationDecision,
  note?: string,
): { decision: CommunityModerationDecision; note?: string } {
  const trimmed = note != null ? String(note).trim() : '';
  if (decision === 'APPROVE') {
    return { decision: 'APPROVE' };
  }
  if (trimmed !== '') {
    return { decision: 'REJECT', note: trimmed };
  }
  return { decision: 'REJECT' };
}
