/**
 * 어드민 모바일 — 상담일지 라이트 (상담사 선택 → 기록 목록·상세)
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiGet } from '../client';
import { ADMIN_MOBILE_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';
import { useAdminApiTenantSync } from '@/hooks/useAdminApiTenantSync';
import { useAdminApiQueryReady } from '@/hooks/useAdminApiQueryReady';
import { useAuthStore } from '@/stores/useAuthStore';
import { isAdminRole } from '@/utils/adminRole';
import { parseAdminConsultantPickerResponse } from '@/utils/adminConsultantPickerNormalize';
import { syncTenantFromAccessToken } from '@/utils/syncTenantFromAccessToken';
import { toDisplayString, toSafeNumber } from '@/utils/safeDisplay';

const QUERY_BASE = ['admin-mobile', 'consultation-records'] as const;

export const ADMIN_CONSULTATION_RECORDS_QUERY_KEYS = {
  all: QUERY_BASE,
  consultants: (tenantId: string) => [...QUERY_BASE, 'consultants', tenantId] as const,
  list: (tenantId: string, consultantId: number) =>
    [...QUERY_BASE, 'list', tenantId, consultantId] as const,
  detail: (tenantId: string, consultantId: number, recordId: number) =>
    [...QUERY_BASE, 'detail', tenantId, consultantId, recordId] as const,
};

export type { AdminConsultantPickerItem } from '@/utils/adminConsultantPickerNormalize';

export type AdminConsultationRecordLite = {
  readonly id: number;
  readonly title: string;
  readonly clientName: string;
  readonly sessionDate: string;
  readonly status: string;
  readonly isSessionCompleted: boolean;
};

function assertApiSuccess(raw: unknown): void {
  if (
    raw != null &&
    typeof raw === 'object' &&
    (raw as Record<string, unknown>).success === false
  ) {
    const msg = (raw as Record<string, unknown>).message;
    throw new Error(typeof msg === 'string' ? msg : '요청이 실패했습니다.');
  }
}

function parseJsonLocalDate(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') {
    return value.length >= 10 ? value.slice(0, 10) : value;
  }
  if (Array.isArray(value) && value.length >= 3) {
    const y = Number(value[0]);
    const m = Number(value[1]);
    const d = Number(value[2]);
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return '';
}

function normalizeRecordRow(row: Record<string, unknown>): AdminConsultationRecordLite | null {
  const id = toSafeNumber(row.id, NaN);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  const sessionNumber = toSafeNumber(row.sessionNumber, 0);
  const titleRaw = toDisplayString(row.title, '').trim();
  const title = titleRaw || (sessionNumber > 0 ? `상담일지 #${sessionNumber}` : `상담일지 #${id}`);
  const clientName = toDisplayString(row.clientName, '내담자').trim() || '내담자';
  const sessionDate =
    parseJsonLocalDate(row.sessionDate) || parseJsonLocalDate(row.consultationDate) || '';
  const isSessionCompleted = Boolean(row.isSessionCompleted);
  const statusRaw = toDisplayString(row.status, '').trim().toUpperCase();
  const status = statusRaw || (isSessionCompleted ? 'COMPLETED' : 'PENDING');

  return {
    id,
    title,
    clientName,
    sessionDate,
    status,
    isSessionCompleted,
  };
}

function parseRecordsListResponse(raw: unknown): AdminConsultationRecordLite[] {
  assertApiSuccess(raw);
  const inner = unwrapApiResponse<unknown>(raw) ?? raw;
  const rows = Array.isArray(inner) ? inner : [];
  return rows
    .map((r) => normalizeRecordRow(r as Record<string, unknown>))
    .filter((item): item is AdminConsultationRecordLite => item != null)
    .sort((a, b) => {
      const dateCmp = b.sessionDate.localeCompare(a.sessionDate);
      if (dateCmp !== 0) return dateCmp;
      return b.id - a.id;
    });
}

function parseRecordDetailResponse(raw: unknown): AdminConsultationRecordLite {
  assertApiSuccess(raw);
  const inner = unwrapApiResponse<Record<string, unknown>>(raw);
  if (inner == null || typeof inner !== 'object') {
    throw new Error('상담 기록을 불러오지 못했습니다.');
  }
  const normalized = normalizeRecordRow(inner);
  if (!normalized) {
    throw new Error('상담 기록을 불러오지 못했습니다.');
  }
  return normalized;
}

/** ADMIN 전용 — `ConsultantRecordsController`는 타 상담사 조회 시 세션 ADMIN 필요 */
export function useAdminConsultantPicker() {
  const { ready, tenantId } = useAdminApiQueryReady();
  const role = useAuthStore((s) => s.role);
  const accessToken = useAuthStore((s) => s.accessToken);
  const allowed = isAdminRole(role);
  const tenantReady = tenantId.trim().length > 0;
  useAdminApiTenantSync();

  return useQuery({
    queryKey: ADMIN_CONSULTATION_RECORDS_QUERY_KEYS.consultants(tenantId),
    queryFn: async () => {
      syncTenantFromAccessToken(accessToken);
      try {
        const raw = await apiGet<unknown>(ADMIN_MOBILE_API.USER_MANAGEMENT, {
          role: 'CONSULTANT',
          includeInactive: false,
        });
        const items = parseAdminConsultantPickerResponse(raw);
        if (items.length === 0) {
          // eslint-disable-next-line no-console -- release APK 진단(PII 없음)
          console.warn('[admin] consultant picker', 0);
        }
        return items;
      } catch (error) {
        // eslint-disable-next-line no-console -- release APK 진단(PII 없음)
        console.warn('[admin] consultant picker', -1);
        throw error;
      }
    },
    enabled: ready && allowed && tenantReady,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useAdminConsultationRecordsList(
  consultantId: number | null | undefined,
  options?: Partial<UseQueryOptions<AdminConsultationRecordLite[]>>,
) {
  const { ready, tenantId } = useAdminApiQueryReady();
  const role = useAuthStore((s) => s.role);
  const allowed = isAdminRole(role);
  const cid = consultantId != null && consultantId > 0 ? consultantId : null;
  useAdminApiTenantSync();

  return useQuery({
    queryKey:
      cid != null
        ? ADMIN_CONSULTATION_RECORDS_QUERY_KEYS.list(tenantId, cid)
        : [...ADMIN_CONSULTATION_RECORDS_QUERY_KEYS.all, 'list-disabled'],
    queryFn: async () => {
      if (cid == null) {
        throw new Error('상담사를 선택해 주세요.');
      }
      const raw = await apiGet<unknown>(ADMIN_MOBILE_API.consultantConsultationRecords(cid));
      return parseRecordsListResponse(raw);
    },
    enabled: ready && allowed && cid != null && options?.enabled !== false,
    staleTime: 1000 * 60 * 2,
    retry: false,
    ...options,
  });
}

export function useAdminConsultationRecordDetail(
  consultantId: number | null | undefined,
  recordId: number | null | undefined,
  options?: Partial<UseQueryOptions<AdminConsultationRecordLite>>,
) {
  const { ready, tenantId } = useAdminApiQueryReady();
  const role = useAuthStore((s) => s.role);
  const allowed = isAdminRole(role);
  const cid = consultantId != null && consultantId > 0 ? consultantId : null;
  const rid = recordId != null && recordId > 0 ? recordId : null;
  useAdminApiTenantSync();

  return useQuery({
    queryKey:
      cid != null && rid != null
        ? ADMIN_CONSULTATION_RECORDS_QUERY_KEYS.detail(tenantId, cid, rid)
        : [...ADMIN_CONSULTATION_RECORDS_QUERY_KEYS.all, 'detail-disabled'],
    queryFn: async () => {
      if (cid == null || rid == null) {
        throw new Error('상담 기록 정보가 올바르지 않습니다.');
      }
      const raw = await apiGet<unknown>(
        ADMIN_MOBILE_API.consultantConsultationRecordDetail(cid, rid),
      );
      return parseRecordDetailResponse(raw);
    },
    enabled: ready && allowed && cid != null && rid != null && options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
    retry: false,
    ...options,
  });
}
