/**
 * 내담자 관련 TanStack Query 커스텀 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useQuery, useInfiniteQuery, type UseQueryOptions } from '@tanstack/react-query';
import { CONSULTANT_CLIENTS_LIST_COPY } from '@/constants/consultantClientsListCopy';
import { maskEncryptedDisplay } from '@/utils/displayString';
import { toDisplayString, toSafeNumber } from '@/utils/safeDisplay';
import { apiGet } from '../client';
import { CONSULTANT_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'AT_RISK';

export interface Client {
  id: number;
  name: string;
  nickname?: string;
  profileImageUrl?: string;
  registeredDate: string;
  lastSessionDate?: string;
  status: ClientStatus;
  riskLevel?: RiskLevel;
  totalSessions: number;
  consultationPurpose?: string;
  specialNotes?: string;
  contactNumber?: string;
  email?: string;
}

export interface ClientDetail extends Client {
  birthDate?: string;
  gender?: string;
  occupation?: string;
  sessionHistory: SessionHistoryItem[];
  memos: ClientMemo[];
}

export interface SessionHistoryItem {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  sessionNumber: number;
  sessionType: string;
  status: string;
  summary?: string;
}

export interface ClientMemo {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface ClientsParams {
  consultantId: string | number;
  search?: string;
  status?: ClientStatus | 'ALL';
  page?: number;
  size?: number;
}

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  last: boolean;
  number: number;
}

const CLIENT_QUERY_KEYS = {
  all: ['clients'] as const,
  lists: () => [...CLIENT_QUERY_KEYS.all, 'list'] as const,
  list: (params: Omit<ClientsParams, 'page'>) => [...CLIENT_QUERY_KEYS.lists(), params] as const,
  details: () => [...CLIENT_QUERY_KEYS.all, 'detail'] as const,
  detail: (consultantId: string | number, clientId: string | number) =>
    [...CLIENT_QUERY_KEYS.details(), String(consultantId), String(clientId)] as const,
};

const DEFAULT_PAGE_SIZE = 20;

function asRecord(row: unknown): Record<string, unknown> | null {
  if (row != null && typeof row === 'object' && !Array.isArray(row)) {
    return row as Record<string, unknown>;
  }
  return null;
}

function pickStr(o: Record<string, unknown>, camel: string, snake: string): string | undefined {
  const a = o[camel];
  const b = o[snake];
  if (typeof a === 'string' && a.trim() !== '') {
    return a.trim();
  }
  if (typeof b === 'string' && b.trim() !== '') {
    return b.trim();
  }
  return undefined;
}

function isoDatePrefix(v: unknown): string | undefined {
  if (typeof v === 'string') {
    const t = v.trim();
    if (t.length >= 10) {
      return t.slice(0, 10);
    }
  }
  return undefined;
}

function normalizeClientStatus(v: unknown): ClientStatus {
  const s = typeof v === 'string' ? v.trim().toUpperCase() : '';
  if (s === 'INACTIVE' || s === 'ACTIVE' || s === 'AT_RISK') {
    return s;
  }
  return 'ACTIVE';
}

function normalizeRiskLevel(v: unknown): RiskLevel | undefined {
  const s = typeof v === 'string' ? v.trim().toUpperCase() : '';
  if (s === 'LOW' || s === 'MEDIUM' || s === 'HIGH' || s === 'CRITICAL') {
    return s;
  }
  return undefined;
}

export function mapRawToClient(row: unknown): Client {
  const o = asRecord(row) ?? {};
  const id = toSafeNumber(o.id, 0);
  const totalSessions = toSafeNumber(o.totalSessions ?? o.total_sessions, 0);
  const registeredDate =
    pickStr(o, 'registeredDate', 'registered_date') ??
    isoDatePrefix(o.createdAt ?? o.created_at) ??
    '—';
  const lastSessionDate =
    pickStr(o, 'lastSessionDate', 'last_session_date') ??
    isoDatePrefix(o.lastSessionDate ?? o.last_session_date);

  const rawName =
    pickStr(o, 'name', 'name') ?? (typeof o.name === 'string' ? o.name : undefined);
  const rawNickname = pickStr(o, 'nickname', 'nickname');
  const rawEmail = pickStr(o, 'email', 'email');
  const rawPhone =
    pickStr(o, 'contactNumber', 'contact_number') ?? pickStr(o, 'phone', 'phone');

  const nickname =
    rawNickname == null ? undefined : maskEncryptedDisplay(rawNickname, '') || undefined;
  const email = rawEmail == null ? undefined : maskEncryptedDisplay(rawEmail, '') || undefined;
  const contactNumber =
    rawPhone == null ? undefined : maskEncryptedDisplay(rawPhone, '') || undefined;

  return {
    id,
    name: maskEncryptedDisplay(rawName, '이름 비공개'),
    nickname,
    profileImageUrl: pickStr(o, 'profileImageUrl', 'profile_image_url'),
    registeredDate,
    lastSessionDate,
    status: normalizeClientStatus(o.status),
    riskLevel: normalizeRiskLevel(o.riskLevel ?? o.risk_level),
    totalSessions,
    consultationPurpose: pickStr(o, 'consultationPurpose', 'consultation_purpose'),
    specialNotes: pickStr(o, 'specialNotes', 'special_notes'),
    contactNumber,
    email,
  };
}

function mapSessionHistoryItems(raw: unknown): SessionHistoryItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: SessionHistoryItem[] = [];
  for (const row of raw) {
    const o = asRecord(row);
    if (!o) {
      continue;
    }
    out.push({
      id: toSafeNumber(o.id, 0),
      date: toDisplayString(o.date, '—'),
      startTime: toDisplayString(o.startTime ?? o.start_time, '—'),
      endTime: toDisplayString(o.endTime ?? o.end_time, '—'),
      sessionNumber: toSafeNumber(o.sessionNumber ?? o.session_number, 0),
      sessionType: toDisplayString(o.sessionType ?? o.session_type, '—'),
      status: toDisplayString(o.status, '—'),
      summary: pickStr(o, 'summary', 'summary'),
    });
  }
  return out;
}

function mapMemoItems(raw: unknown): ClientMemo[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: ClientMemo[] = [];
  for (const row of raw) {
    const o = asRecord(row);
    if (!o) {
      continue;
    }
    out.push({
      id: toSafeNumber(o.id, 0),
      content: toDisplayString(o.content, ''),
      createdAt: toDisplayString(o.createdAt ?? o.created_at, '—'),
      updatedAt: toDisplayString(o.updatedAt ?? o.updated_at, '—'),
    });
  }
  return out;
}

export function mapRawToClientDetail(body: Record<string, unknown>): ClientDetail {
  const base = mapRawToClient(body);
  const sessionHistory = mapSessionHistoryItems(body.sessionHistory ?? body.session_history);
  const memos = mapMemoItems(body.memos);
  const birthRaw = body.birthDate ?? body.birth_date;
  return {
    ...base,
    birthDate: pickStr(body, 'birthDate', 'birth_date') ?? isoDatePrefix(birthRaw),
    gender: pickStr(body, 'gender', 'gender'),
    occupation: pickStr(body, 'occupation', 'occupation'),
    sessionHistory,
    memos,
  };
}

/**
 * `success: false` 래퍼는 빈 페이지와 동일하게 파싱되면 안 되므로 즉시 실패 처리한다.
 */
function assertClientsListNotFailureEnvelope(raw: unknown): void {
  if (raw == null || typeof raw !== 'object') {
    return;
  }
  const root = raw as Record<string, unknown>;
  if (root.success === false) {
    throw new Error(
      toDisplayString(
        root.message ?? root.error ?? root.code,
        CONSULTANT_CLIENTS_LIST_COPY.API_REJECTED_FALLBACK,
      ),
    );
  }
}

function parseConsultantClientsPage(raw: unknown): PaginatedResponse<Client> {
  assertClientsListNotFailureEnvelope(raw);
  const unwrapped = unwrapApiResponse<Record<string, unknown>>(raw);
  const body =
    unwrapped ?? (raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : null);
  if (body == null) {
    throw new Error(CONSULTANT_CLIENTS_LIST_COPY.INVALID_RESPONSE);
  }
  const contentRaw = Array.isArray(body.content) ? body.content : [];
  const content = contentRaw.map((row) => mapRawToClient(row));
  const totalElements =
    typeof body.totalElements === 'number'
      ? body.totalElements
      : typeof body.total_elements === 'number'
        ? body.total_elements
        : 0;
  const totalPages =
    typeof body.totalPages === 'number'
      ? body.totalPages
      : typeof body.total_pages === 'number'
        ? body.total_pages
        : 0;
  const number =
    typeof body.number === 'number'
      ? body.number
      : typeof body.page === 'number'
        ? body.page
        : 0;
  const last =
    typeof body.last === 'boolean'
      ? body.last
      : typeof body.isLast === 'boolean'
        ? body.isLast
        : totalPages <= 0 || number >= totalPages - 1;
  return { content, totalElements, totalPages, last, number };
}

export function useConsultantClients(params: ClientsParams) {
  const { consultantId, search, status, size = DEFAULT_PAGE_SIZE } = params;
  const consultantIdStr =
    consultantId != null && String(consultantId).trim() !== '' ? String(consultantId).trim() : '';

  return useInfiniteQuery<PaginatedResponse<Client>>({
    queryKey: CLIENT_QUERY_KEYS.list({ consultantId: consultantIdStr, search, status }),
    queryFn: async ({ pageParam }) => {
      const raw = await apiGet<unknown>(CONSULTANT_API.consultantClients(consultantIdStr), {
        search: search || undefined,
        status: status === 'ALL' ? undefined : status,
        page: pageParam,
        size,
      });
      return parseConsultantClientsPage(raw);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
    enabled: consultantIdStr.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

function assertClientDetailNotFailureEnvelope(raw: unknown): void {
  if (raw == null || typeof raw !== 'object') {
    return;
  }
  const root = raw as Record<string, unknown>;
  if (root.success === false) {
    throw new Error(
      toDisplayString(
        root.message ?? root.error ?? root.code,
        CONSULTANT_CLIENTS_LIST_COPY.DETAIL_API_REJECTED_FALLBACK,
      ),
    );
  }
}

export interface UseClientDetailParams {
  clientId: string | number | undefined;
  consultantId: string | number | undefined;
}

export function useClientDetail(
  params: UseClientDetailParams,
  options?: Partial<UseQueryOptions<ClientDetail>>,
) {
  const clientIdStr =
    params.clientId != null && String(params.clientId).trim() !== ''
      ? String(params.clientId).trim()
      : '';
  const consultantIdStr =
    params.consultantId != null && String(params.consultantId).trim() !== ''
      ? String(params.consultantId).trim()
      : '';

  return useQuery<ClientDetail>({
    queryKey: CLIENT_QUERY_KEYS.detail(consultantIdStr, clientIdStr),
    queryFn: async () => {
      const raw = await apiGet<unknown>(
        CONSULTANT_API.consultantClientDetail(consultantIdStr, clientIdStr),
      );
      assertClientDetailNotFailureEnvelope(raw);
      const unwrapped = unwrapApiResponse<Record<string, unknown>>(raw);
      if (unwrapped == null) {
        throw new Error(CONSULTANT_CLIENTS_LIST_COPY.DETAIL_INVALID_RESPONSE);
      }
      return mapRawToClientDetail(unwrapped);
    },
    enabled: clientIdStr.length > 0 && consultantIdStr.length > 0,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export { CLIENT_QUERY_KEYS };
