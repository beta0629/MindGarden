/**
 * 일정 등록 피커 API 응답 정규화
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { toDisplayString, toSafeNumber } from '@/utils/safeDisplay';

export type AdminConsultantVacationPickerItem = {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly isOnVacation: boolean;
  readonly isActive: boolean;
};

export type AdminMappingClientPickerItem = {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
};

function pickConsultantId(row: Record<string, unknown>): number {
  const direct = toSafeNumber(row.id ?? row.consultantId ?? row.userId, NaN);
  if (Number.isFinite(direct) && direct > 0) {
    return direct;
  }
  const nested = row.consultant;
  if (nested != null && typeof nested === 'object') {
    return toSafeNumber((nested as Record<string, unknown>).id, NaN);
  }
  return NaN;
}

export function parseConsultantsWithVacationResponse(raw: unknown): AdminConsultantVacationPickerItem[] {
  const root = raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  if (root?.success === false) {
    const msg = root.message;
    throw new Error(typeof msg === 'string' ? msg : '상담사 목록을 불러오지 못했습니다.');
  }
  let data = root?.data ?? raw;
  if (data != null && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    data = obj.consultants ?? obj.items ?? obj.list;
  }
  const rows = Array.isArray(data) ? data : [];
  return rows
    .filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')
    .map((row) => {
      const id = pickConsultantId(row);
      if (!Number.isFinite(id) || id <= 0) {
        return null;
      }
      const name =
        toDisplayString(row.name ?? row.consultantName ?? row.userName, '').trim() ||
        `상담사 #${id}`;
      const email = toDisplayString(row.email, '').trim();
      const isOnVacation = Boolean(row.isOnVacation ?? row.onVacation ?? row.vacation);
      const status = toDisplayString(row.status, '').trim().toUpperCase();
      const isActive =
        row.isActive !== false &&
        status !== 'INACTIVE' &&
        status !== 'DISABLED';
      return { id, name, email, isOnVacation, isActive };
    })
    .filter((item): item is AdminConsultantVacationPickerItem => item != null)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export function parseMappingClientsResponse(raw: unknown): AdminMappingClientPickerItem[] {
  const root = raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  if (root?.success === false) {
    const msg = root.message;
    throw new Error(typeof msg === 'string' ? msg : '내담자 목록을 불러오지 못했습니다.');
  }
  let data = root?.data ?? raw;
  if (data != null && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    data = obj.mappings ?? obj.clients ?? obj.items;
  }
  const rows = Array.isArray(data) ? data : [];
  return rows
    .filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')
    .map((row) => {
      const nestedClient = row.client;
      const clientObj =
        nestedClient != null && typeof nestedClient === 'object'
          ? (nestedClient as Record<string, unknown>)
          : row;
      const id = toSafeNumber(
        row.clientId ?? clientObj.id ?? row.id,
        NaN,
      );
      if (!Number.isFinite(id) || id <= 0) {
        return null;
      }
      const name =
        toDisplayString(
          clientObj.name ?? row.clientName ?? row.name,
          '',
        ).trim() || `내담자 #${id}`;
      const email = toDisplayString(clientObj.email ?? row.email, '').trim();
      const phone = toDisplayString(clientObj.phone ?? row.phone, '').trim();
      return { id, name, email, phone };
    })
    .filter((item): item is AdminMappingClientPickerItem => item != null)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export function extractCreatedEntityId(raw: unknown): number | null {
  const root = raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  if (root?.success === false) {
    return null;
  }
  const data = root?.data ?? raw;
  if (data != null && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const id = toSafeNumber(obj.id ?? obj.userId ?? obj.clientId, NaN);
    if (Number.isFinite(id) && id > 0) {
      return id;
    }
    const user = obj.user;
    if (user != null && typeof user === 'object') {
      const userId = toSafeNumber((user as Record<string, unknown>).id, NaN);
      if (Number.isFinite(userId) && userId > 0) {
        return userId;
      }
    }
  }
  return null;
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (error != null && typeof error === 'object') {
    const rec = error as Record<string, unknown>;
    const msg = rec.message;
    if (typeof msg === 'string' && msg.trim().length > 0) {
      return msg.trim();
    }
    const original = rec.originalError;
    if (original != null && typeof original === 'object') {
      const axiosData = (original as { response?: { data?: unknown } }).response?.data;
      if (axiosData != null && typeof axiosData === 'object') {
        const body = axiosData as Record<string, unknown>;
        if (typeof body.message === 'string' && body.message.trim()) {
          return body.message.trim();
        }
        if (typeof body.error === 'string' && body.error.trim()) {
          return body.error.trim();
        }
      }
    }
  }
  return fallback;
}
