/**
 * 결제·회기 관련 TanStack Query 커스텀 훅
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '../client';
import { ADMIN_CLIENT_API, PAYMENT_API } from '../endpoints';

export interface SessionBalance {
  clientId: number;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
}

export type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface PaymentItem {
  id: number;
  paymentDate: string;
  amount: number;
  description: string;
  paymentMethod: string;
  status: PaymentStatus;
  packageName?: string;
  sessionCount?: number;
  createdAt: string;
}

export interface PaymentDetail {
  id: number;
  paymentDate: string;
  amount: number;
  description: string;
  paymentMethod: string;
  status: PaymentStatus;
  packageName?: string;
  sessionCount?: number;
  consultantName?: string;
  consultationDate?: string;
  consultationTime?: string;
  receiptUrl?: string;
  refundable: boolean;
  refundDeadline?: string;
  createdAt: string;
}

export type UsageType = 'USED' | 'CHARGED' | 'REFUNDED';

export interface SessionUsageItem {
  id: number;
  date: string;
  type: UsageType;
  consultantName?: string;
  description: string;
  sessionChange: number;
  remainingAfter: number;
}

export type PaymentFilter = 'ALL' | 'COMPLETED' | 'REFUNDED';

interface CreatePaymentRequest {
  clientId: number;
  packageId: number;
  paymentKey: string;
  orderId: string;
  amount: number;
}

interface RequestExtensionRequest {
  clientId: number;
  packageId: number;
  sessionCount: number;
}

interface PaymentListResponse {
  content: PaymentItem[];
  totalElements: number;
  totalPages: number;
  last: boolean;
}

const PAYMENT_QUERY_KEYS = {
  all: ['payments'] as const,
  /** v2: 매칭 API 기반 + useQuery 형태(영속 캐시의 infinite pages 잔여와 구분) */
  balance: (clientId: number) =>
    [...PAYMENT_QUERY_KEYS.all, 'balance', 'v2', clientId] as const,
  history: (clientId: number, filter?: PaymentFilter) =>
    [...PAYMENT_QUERY_KEYS.all, 'history', 'v2', clientId, filter] as const,
  detail: (paymentId: number) =>
    [...PAYMENT_QUERY_KEYS.all, 'detail', paymentId] as const,
  sessionDetail: (clientId: number, detailId: number) =>
    [...PAYMENT_QUERY_KEYS.all, 'sessionDetail', clientId, detailId] as const,
  usage: (clientId: number) =>
    [...PAYMENT_QUERY_KEYS.all, 'usage', clientId] as const,
};

/**
 * 웹 `normalizeApiListPayload` / `normalizeMappingsListPayload`와 동등한 매칭 배열 추출
 */
function extractMappingsFromResponse(response: any): any[] {
  if (response == null) {
    return [];
  }
  if (Array.isArray(response)) {
    return response;
  }
  if (typeof response !== 'object') {
    return [];
  }
  const tryKeys = (obj: any): any[] | null => {
    if (!obj || typeof obj !== 'object') return null;
    for (const key of ['mappings', 'content', 'data', 'items']) {
      if (Array.isArray(obj[key])) {
        return obj[key];
      }
    }
    return null;
  };
  const inner = response?.data ?? response;
  const direct = tryKeys(inner);
  if (direct) {
    return direct;
  }
  if (inner != null && typeof inner === 'object' && !Array.isArray(inner) && inner.data != null) {
    const nested = tryKeys(inner.data);
    if (nested) {
      return nested;
    }
  }
  return [];
}

/** 웹 ClientDashboard와 동일: ACTIVE 매칭만 회기 합산 */
function aggregateSessionBalance(
  clientId: number,
  mappings: any[],
): SessionBalance {
  const active = mappings.filter((m) => m?.status === 'ACTIVE');
  const totalSessions = active.reduce(
    (s, m) => s + (Number(m.totalSessions) || 0),
    0,
  );
  const usedSessions = active.reduce(
    (s, m) => s + (Number(m.usedSessions) || 0),
    0,
  );
  const remainingSessions = active.reduce(
    (s, m) => s + (Number(m.remainingSessions) || 0),
    0,
  );
  return {
    clientId,
    totalSessions,
    usedSessions,
    remainingSessions,
  };
}

function mappingPaymentStatusToItemStatus(
  raw: string | undefined,
): PaymentStatus {
  const ps = raw != null ? String(raw).trim().toUpperCase() : '';
  if (!ps) return 'PENDING';
  if (ps === 'REFUNDED') return 'REFUNDED';
  if (
    ps === 'CONFIRMED' ||
    ps === 'PAY' ||
    ps === 'DEP' ||
    ps === 'APPROVED'
  ) {
    return 'COMPLETED';
  }
  if (ps === 'PENDING') return 'PENDING';
  if (ps === 'REJECTED') return 'FAILED';
  if (ps === 'CANCELLED') return 'CANCELLED';
  return 'PENDING';
}

function formatMappingDate(m: any): string {
  const v = m?.paymentDate ?? m?.createdAt ?? m?.assignedAt;
  if (v == null) return '';
  if (typeof v === 'string') return v.split('T')[0] ?? '';
  return String(v);
}

function mappingToPaymentItem(m: any): PaymentItem {
  const id = Number(m.id) || 0;
  const amount = Number(m.packagePrice) || 0;
  const ps = m.paymentStatus != null ? String(m.paymentStatus) : '';
  return {
    id,
    paymentDate: formatMappingDate(m),
    amount,
    description: m.packageName ? String(m.packageName) : '상담 패키지',
    paymentMethod: m.paymentMethod != null ? String(m.paymentMethod) : '-',
    status: mappingPaymentStatusToItemStatus(ps),
    packageName: m.packageName != null ? String(m.packageName) : undefined,
    sessionCount:
      m.totalSessions != null ? Number(m.totalSessions) : undefined,
    createdAt:
      typeof m.createdAt === 'string'
        ? m.createdAt
        : formatMappingDate(m) || new Date().toISOString(),
  };
}

function filterPaymentItems(
  items: PaymentItem[],
  filter: PaymentFilter,
): PaymentItem[] {
  if (filter === 'ALL') return items;
  if (filter === 'COMPLETED') {
    return items.filter((p) => p.status === 'COMPLETED');
  }
  if (filter === 'REFUNDED') {
    return items.filter((p) => p.status === 'REFUNDED');
  }
  return items;
}

export function useSessionBalance(clientId: number | undefined) {
  return useQuery<SessionBalance>({
    queryKey: PAYMENT_QUERY_KEYS.balance(clientId!),
    queryFn: async () => {
      const response = await apiGet<any>(ADMIN_CLIENT_API.MAPPINGS_BY_CLIENT, {
        clientId,
      });
      const mappings = extractMappingsFromResponse(response);
      return aggregateSessionBalance(clientId!, mappings);
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 3,
  });
}

export function usePaymentHistory(
  clientId: number | undefined,
  filter: PaymentFilter = 'ALL',
) {
  return useQuery<PaymentListResponse>({
    queryKey: PAYMENT_QUERY_KEYS.history(clientId!, filter),
    queryFn: async () => {
      const response = await apiGet<any>(ADMIN_CLIENT_API.MAPPINGS_BY_CLIENT, {
        clientId,
      });
      const mappings = extractMappingsFromResponse(response);
      const items = mappings
        .map(mappingToPaymentItem)
        .sort((a, b) => {
          const tb = Date.parse(String(b.createdAt)) || 0;
          const ta = Date.parse(String(a.createdAt)) || 0;
          return tb - ta;
        });
      const content = filterPaymentItems(items, filter);
      return {
        content,
        totalElements: content.length,
        totalPages: 1,
        last: true,
      };
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
  });
}

function pgPaymentToPaymentDetail(raw: Record<string, unknown>, id: number): PaymentDetail {
  const amount =
    Number(raw.amount ?? raw.paymentAmount ?? raw.totalAmount ?? 0) || 0;
  const statusRaw =
    raw.status != null ? String(raw.status).trim().toUpperCase() : '';
  let status: PaymentStatus = 'PENDING';
  if (statusRaw.includes('COMPLET') || statusRaw === 'PAID' || statusRaw === 'DONE') {
    status = 'COMPLETED';
  } else if (statusRaw.includes('REFUND')) {
    status = 'REFUNDED';
  } else if (statusRaw.includes('FAIL')) {
    status = 'FAILED';
  } else if (statusRaw.includes('CANCEL')) {
    status = 'CANCELLED';
  }
  const approvedAt = raw.approvedAt != null ? String(raw.approvedAt) : '';
  const createdAt = raw.createdAt != null ? String(raw.createdAt) : '';
  const paymentDate = (approvedAt || createdAt || '').split('T')[0] || '-';
  const method = raw.method != null ? String(raw.method) : '';
  const paymentMethod = method || '-';
  const description =
    raw.description != null && String(raw.description).trim() !== ''
      ? String(raw.description)
      : '결제';
  return {
    id: Number(raw.id) || id,
    paymentDate,
    amount,
    description,
    paymentMethod,
    status,
    refundable: false,
    createdAt: createdAt || paymentDate || new Date().toISOString(),
  };
}

function mappingRowToPaymentDetail(m: Record<string, unknown>, mappingId: number): PaymentDetail {
  const amount =
    Number(m.packagePrice ?? m.paymentAmount ?? 0) || 0;
  const consultant =
    m.consultant != null && typeof m.consultant === 'object'
      ? (m.consultant as Record<string, unknown>)
      : null;
  const consultantName =
    consultant?.consultantName != null
      ? String(consultant.consultantName)
      : undefined;
  const assignedAt =
    m.assignedAt != null ? String(m.assignedAt).split('T')[0] : undefined;
  const paymentDate = formatMappingDate(m) || '-';
  const ps = m.paymentStatus != null ? String(m.paymentStatus) : '';
  return {
    id: mappingId,
    paymentDate,
    amount,
    description:
      m.packageName != null && String(m.packageName).trim() !== ''
        ? String(m.packageName)
        : '상담 패키지(매칭)',
    paymentMethod:
      m.paymentMethod != null ? String(m.paymentMethod) : '-',
    status: mappingPaymentStatusToItemStatus(ps),
    packageName:
      m.packageName != null ? String(m.packageName) : undefined,
    sessionCount:
      m.totalSessions != null ? Number(m.totalSessions) : undefined,
    consultantName,
    consultationDate: assignedAt,
    refundable: false,
    createdAt:
      typeof m.createdAt === 'string'
        ? m.createdAt
        : formatMappingDate(m) || new Date().toISOString(),
  };
}

function normalizeUsageRows(response: unknown): SessionUsageItem[] {
  let raw: unknown = response;
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    raw = o.data ?? o.content ?? o.items ?? o;
  }
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
    const o2 = raw as Record<string, unknown>;
    if (Array.isArray(o2.content)) {
      raw = o2.content;
    } else if (Array.isArray(o2.items)) {
      raw = o2.items;
    }
  }
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: SessionUsageItem[] = [];
  raw.forEach((row, idx) => {
    if (row == null || typeof row !== 'object') {
      return;
    }
    const r = row as Record<string, unknown>;
    const id = Number(r.id) || idx + 1;
    const dateRaw = r.date ?? r.usageDate ?? r.createdAt ?? '';
    const date =
      typeof dateRaw === 'string'
        ? dateRaw.split('T')[0] ?? ''
        : String(dateRaw);
    const typeRaw = r.type != null ? String(r.type).toUpperCase() : 'USED';
    let type: UsageType = 'USED';
    if (typeRaw.includes('CHARGE') || typeRaw === 'CHARGED') {
      type = 'CHARGED';
    } else if (typeRaw.includes('REFUND')) {
      type = 'REFUNDED';
    }
    const description =
      r.description != null ? String(r.description) : '회기 변동';
    const sessionChange = Number(r.sessionChange ?? r.delta ?? 0);
    const remainingAfter = Number(r.remainingAfter ?? r.remaining ?? 0);
    const consultantName =
      r.consultantName != null ? String(r.consultantName) : undefined;
    if (!date) {
      return;
    }
    const item: SessionUsageItem = {
      id,
      date,
      type,
      description,
      sessionChange,
      remainingAfter,
    };
    if (consultantName !== undefined) {
      item.consultantName = consultantName;
    }
    out.push(item);
  });
  return out;
}

function buildUsageFromMappings(mappings: any[]): SessionUsageItem[] {
  const rows: SessionUsageItem[] = [];
  const sorted = [...mappings].sort((a, b) => {
    const tb = Date.parse(String(b?.paymentDate ?? b?.createdAt ?? 0)) || 0;
    const ta = Date.parse(String(a?.paymentDate ?? a?.createdAt ?? 0)) || 0;
    return tb - ta;
  });
  sorted.forEach((m, idx) => {
    if (m == null || typeof m !== 'object') {
      return;
    }
    const total = Number(m.totalSessions) || 0;
    if (total <= 0) {
      return;
    }
    const id = Number(m.id) || idx + 1;
    const date = formatMappingDate(m) || '-';
    const pkg =
      m.packageName != null ? String(m.packageName) : '패키지';
    const consultant =
      m.consultant != null && typeof m.consultant === 'object'
        ? (m.consultant as Record<string, unknown>)
        : null;
    const consultantName =
      consultant?.consultantName != null
        ? String(consultant.consultantName)
        : undefined;
    rows.push({
      id: id + 1_000_000,
      date,
      type: 'CHARGED',
      consultantName,
      description: `${pkg} · 회기 ${total}회 반영(매칭 요약)`,
      sessionChange: total,
      remainingAfter: Number(m.remainingSessions) || 0,
    });
  });
  return rows;
}

export interface SessionUsageHistoryResult {
  items: SessionUsageItem[];
  /** 서버 session-usage가 비었을 때 매칭 목록으로 채움 */
  isDerivedFromMappings: boolean;
}

export function usePaymentDetail(paymentId: number | undefined) {
  return useQuery<PaymentDetail>({
    queryKey: PAYMENT_QUERY_KEYS.detail(paymentId!),
    queryFn: async () => {
      const response = await apiGet<any>(PAYMENT_API.paymentDetail(paymentId!));
      const raw = response?.data ?? response;
      if (raw && typeof raw === 'object') {
        return raw as PaymentDetail;
      }
      throw new Error('EMPTY');
    },
    enabled: !!paymentId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * 회기·결제 목록에서 연 `id`는 매칭(ConsultantClientMapping) ID인 경우가 많아
 * 매칭 행을 우선으로 표시하고, 없을 때만 PG 결제 상세를 조회한다.
 */
export function useSessionPaymentDetail(
  clientId: number | undefined,
  detailId: number | undefined,
) {
  return useQuery<PaymentDetail>({
    queryKey: PAYMENT_QUERY_KEYS.sessionDetail(clientId!, detailId!),
    queryFn: async () => {
      if (!clientId || !detailId) {
        throw new Error('missing');
      }
      const mapRes = await apiGet<any>(ADMIN_CLIENT_API.MAPPINGS_BY_CLIENT, {
        clientId,
      });
      const mappings = extractMappingsFromResponse(mapRes);
      const hit = mappings.find((m: any) => Number(m?.id) === detailId);
      if (hit) {
        return mappingRowToPaymentDetail(hit as Record<string, unknown>, detailId);
      }
      let pgRaw: Record<string, unknown> | null = null;
      try {
        const pg = await apiGet<any>(PAYMENT_API.paymentDetail(detailId));
        pgRaw = (pg?.data ?? pg) as Record<string, unknown> | null;
      } catch {
        pgRaw = null;
      }
      if (pgRaw && typeof pgRaw === 'object') {
        return pgPaymentToPaymentDetail(pgRaw, detailId);
      }
      throw new Error('NOT_FOUND');
    },
    enabled: !!clientId && !!detailId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSessionUsageHistory(clientId: number | undefined) {
  return useQuery<SessionUsageHistoryResult>({
    queryKey: PAYMENT_QUERY_KEYS.usage(clientId!),
    queryFn: async () => {
      let apiRows: SessionUsageItem[] = [];
      try {
        const response = await apiGet<any>(PAYMENT_API.SESSION_USAGE_HISTORY, {
          clientId,
        });
        apiRows = normalizeUsageRows(response?.data ?? response);
      } catch {
        apiRows = [];
      }
      if (apiRows.length > 0) {
        return { items: apiRows, isDerivedFromMappings: false };
      }
      const mapRes = await apiGet<any>(ADMIN_CLIENT_API.MAPPINGS_BY_CLIENT, {
        clientId,
      });
      const mappings = extractMappingsFromResponse(mapRes);
      const derived = buildUsageFromMappings(mappings);
      return {
        items: derived,
        isDerivedFromMappings: derived.length > 0,
      };
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaymentRequest) =>
      apiPost(PAYMENT_API.CONFIRM_PAYMENT, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.all });
    },
  });
}

export function useRequestExtension() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RequestExtensionRequest) =>
      apiPost(PAYMENT_API.SESSION_EXTENSIONS, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.all });
    },
  });
}

export { PAYMENT_QUERY_KEYS };
