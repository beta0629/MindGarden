/**
 * 어드민 매칭 목록 API 정규화·필터 (웹 IntegratedMatchingSchedule SSOT)
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { toDisplayString, toSafeNumber } from '@/utils/safeDisplay';

export type AdminMappingListItem = {
  readonly id: number;
  readonly consultantId: number;
  readonly consultantName: string;
  readonly clientId: number;
  readonly clientName: string;
  readonly status: string;
  readonly remainingSessions: number;
  readonly totalSessions: number;
  readonly packageName: string;
  readonly packagePrice: number;
  readonly paymentMethod: string;
  readonly paymentReference?: string;
  readonly createdAt: string | null;
};

export type AdminMappingViewFilter = 'ongoing' | 'remaining' | 'all';

const ONGOING_EXCLUDED = new Set(['SESSIONS_EXHAUSTED', 'TERMINATED']);

export function getMappingSortTimestamp(mapping: AdminMappingListItem): number {
  const raw = mapping.createdAt;
  if (!raw) {
    return 0;
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

export function isOngoingAdminMapping(mapping: AdminMappingListItem): boolean {
  const status = mapping.status.trim().toUpperCase();
  return status.length > 0 && !ONGOING_EXCLUDED.has(status);
}

function mapRow(row: Record<string, unknown>): AdminMappingListItem | null {
  const id = toSafeNumber(row.id, NaN);
  const consultantId = toSafeNumber(row.consultantId, NaN);
  const clientId = toSafeNumber(row.clientId, NaN);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  const remainingSessions = toSafeNumber(row.remainingSessions, 0);
  const totalSessions = toSafeNumber(row.totalSessions, 0);
  const packagePrice = toSafeNumber(row.packagePrice, 0);
  const paymentMethodRaw = row.paymentMethod;
  const paymentMethod =
    paymentMethodRaw != null && String(paymentMethodRaw).trim() !== ''
      ? String(paymentMethodRaw).trim()
      : '';
  const paymentReferenceRaw = row.paymentReference;
  const paymentReference =
    paymentReferenceRaw != null && String(paymentReferenceRaw).trim() !== ''
      ? String(paymentReferenceRaw).trim()
      : undefined;
  const createdAtRaw = row.createdAt ?? row.assignedAt ?? row.startDate;
  const createdAt =
    createdAtRaw == null
      ? null
      : typeof createdAtRaw === 'string'
        ? createdAtRaw
        : String(createdAtRaw);
  return {
    id,
    consultantId: Number.isFinite(consultantId) ? consultantId : 0,
    consultantName: toDisplayString(row.consultantName, '상담사'),
    clientId: Number.isFinite(clientId) ? clientId : 0,
    clientName: toDisplayString(row.clientName, '내담자'),
    status: toDisplayString(row.status, 'UNKNOWN').trim().toUpperCase(),
    remainingSessions: Number.isFinite(remainingSessions) ? remainingSessions : 0,
    totalSessions: Number.isFinite(totalSessions) ? totalSessions : 0,
    packageName: toDisplayString(row.packageName, ''),
    packagePrice: Number.isFinite(packagePrice) ? packagePrice : 0,
    paymentMethod,
    ...(paymentReference != null ? { paymentReference } : {}),
    createdAt,
  };
}

export function normalizeAdminMappingsList(raw: unknown): AdminMappingListItem[] {
  const root = raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  if (root?.success === false) {
    const msg = root.message;
    throw new Error(typeof msg === 'string' ? msg : '매칭 목록을 불러오지 못했습니다.');
  }
  let data = root?.data ?? raw;
  if (data != null && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    data = obj.mappings ?? obj.items ?? obj.list;
  }
  const rows = Array.isArray(data) ? data : [];
  return rows
    .filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')
    .map(mapRow)
    .filter((item): item is AdminMappingListItem => item != null)
    .sort((a, b) => getMappingSortTimestamp(b) - getMappingSortTimestamp(a));
}

export function filterAdminMappingsByView(
  items: readonly AdminMappingListItem[],
  viewFilter: AdminMappingViewFilter,
): AdminMappingListItem[] {
  if (viewFilter === 'all') {
    return [...items];
  }
  if (viewFilter === 'remaining') {
    return items.filter((m) => m.remainingSessions > 0);
  }
  return items.filter(isOngoingAdminMapping);
}

export function findAdminMappingById(
  items: readonly AdminMappingListItem[],
  mappingId: number,
): AdminMappingListItem | undefined {
  return items.find((m) => m.id === mappingId);
}
