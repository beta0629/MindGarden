/**
 * CONSULTATION_PACKAGE 공통코드 → 매칭 생성 패키지 옵션
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { toDisplayString, toSafeNumber } from '@/utils/safeDisplay';

export type AdminMappingPackageOption = {
  readonly value: string;
  readonly label: string;
  readonly sessions: number;
  readonly price: number;
};

function parsePackageExtra(code: Record<string, unknown>): { sessions: number; price: number } {
  let sessions = 20;
  let price = 0;
  const codeValue = toDisplayString(code.codeValue, '');
  if (codeValue.startsWith('SINGLE_')) {
    sessions = 1;
    const priceStr = codeValue.replace('SINGLE_', '');
    price = parseInt(priceStr, 10) || 0;
  }
  const extraRaw = code.extraData;
  if (typeof extraRaw === 'string' && extraRaw.trim() !== '') {
    try {
      const extra = JSON.parse(extraRaw) as { price?: number; sessions?: number };
      if (extra.price != null) {
        price = parseFloat(String(extra.price)) || price;
      }
      if (extra.sessions != null) {
        sessions = parseInt(String(extra.sessions), 10) || sessions;
      }
    } catch {
      /* ignore */
    }
  }
  if (!codeValue.startsWith('SINGLE_') && price === 0) {
    const desc = toDisplayString(code.codeDescription, '');
    const parsed = parseFloat(desc);
    if (!Number.isNaN(parsed) && parsed > 0) {
      price = parsed;
    }
  }
  return { sessions, price };
}

function packageLabel(codeValue: string, fallback: string): string {
  if (codeValue === 'BASIC') {
    return '기본 패키지';
  }
  if (codeValue === 'STANDARD') {
    return '표준 패키지';
  }
  if (codeValue === 'PREMIUM') {
    return '프리미엄 패키지';
  }
  if (codeValue === 'VIP') {
    return 'VIP 패키지';
  }
  return fallback;
}

export function normalizeConsultationPackageCodes(raw: unknown): AdminMappingPackageOption[] {
  const root = raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  let data = root?.data ?? raw;
  const rows = Array.isArray(data) ? data : [];
  return rows
    .filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')
    .map((code) => {
      const value = toDisplayString(code.codeValue, '').trim();
      if (!value) {
        return null;
      }
      const korean = toDisplayString(code.koreanName, '').trim();
      const codeLabel = toDisplayString(code.codeLabel, '').trim();
      const fallbackLabel = korean || codeLabel || value;
      const label = packageLabel(value, fallbackLabel);
      const { sessions, price } = parsePackageExtra(code);
      return { value, label, sessions, price };
    })
    .filter((o): o is AdminMappingPackageOption => o != null);
}

export type AdminMappingSimpleCodeOption = {
  readonly value: string;
  readonly label: string;
};

export function normalizeMappingSimpleCodeGroup(raw: unknown): AdminMappingSimpleCodeOption[] {
  const root = raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  let data = root?.data ?? raw;
  const rows = Array.isArray(data) ? data : [];
  return rows
    .filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')
    .map((code) => {
      const value = toDisplayString(code.codeValue, '').trim();
      if (!value) {
        return null;
      }
      const label =
        toDisplayString(code.codeLabel, '').trim() ||
        toDisplayString(code.koreanName, '').trim() ||
        value;
      return { value, label };
    })
    .filter((o): o is AdminMappingSimpleCodeOption => o != null);
}

export type AdminMappingClientWithInfo = {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
};

export function normalizeClientsWithMappingInfo(raw: unknown): AdminMappingClientWithInfo[] {
  const root = raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  if (root?.success === false) {
    const msg = root.message;
    throw new Error(typeof msg === 'string' ? msg : '내담자 목록을 불러오지 못했습니다.');
  }
  let data = root?.data ?? raw;
  if (data != null && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    data = obj.clients ?? obj.items;
  }
  const rows = Array.isArray(data) ? data : Array.isArray(raw) ? raw : [];
  return rows
    .filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')
    .map((row) => {
      const id = toSafeNumber(row.id ?? row.clientId, NaN);
      if (!Number.isFinite(id) || id <= 0) {
        return null;
      }
      return {
        id,
        name: toDisplayString(row.name, `내담자 #${id}`),
        email: toDisplayString(row.email, '').trim(),
        phone: toDisplayString(row.phone, '').trim(),
      };
    })
    .filter((item): item is AdminMappingClientWithInfo => item != null)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}
