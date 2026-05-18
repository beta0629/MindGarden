/**
 * 공통코드 API — ScheduleModal 피커 정규화
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { toDisplayString } from '@/utils/safeDisplay';

export type AdminCommonCodeOption = {
  readonly value: string;
  readonly label: string;
  readonly durationMinutes: number;
};

function parseDurationMinutes(code: Record<string, unknown>): number {
  const extraRaw = code.extraData;
  if (typeof extraRaw === 'string' && extraRaw.trim() !== '') {
    try {
      const extra = JSON.parse(extraRaw) as { durationMinutes?: number };
      if (typeof extra.durationMinutes === 'number' && Number.isFinite(extra.durationMinutes)) {
        return extra.durationMinutes;
      }
    } catch {
      /* fall through */
    }
  }
  const codeValue = toDisplayString(code.codeValue, '');
  const parsed = parseInt(codeValue.replace('_MIN', ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
}

function mapCodeRow(code: Record<string, unknown>, defaultMinutes: number): AdminCommonCodeOption {
  const value = toDisplayString(code.codeValue, '').trim();
  const label = toDisplayString(code.codeLabel, value).trim() || value;
  const durationMinutes =
    toDisplayString(code.codeValue, '').includes('_MIN') || code.extraData != null
      ? parseDurationMinutes(code)
      : defaultMinutes;
  return { value, label, durationMinutes };
}

export function normalizeCommonCodeGroup(
  raw: unknown,
  fallback: readonly AdminCommonCodeOption[],
): AdminCommonCodeOption[] {
  const inner =
    raw != null && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)
      ? (raw as Record<string, unknown>).data
      : raw;
  const rows = Array.isArray(inner) ? inner : [];
  if (rows.length === 0) {
    return [...fallback];
  }
  return rows
    .filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')
    .map((r) => mapCodeRow(r, 50))
    .filter((o) => o.value.length > 0);
}

export const FALLBACK_CONSULTATION_TYPE_OPTIONS: readonly AdminCommonCodeOption[] = [
  { value: 'INDIVIDUAL', label: '개인상담', durationMinutes: 50 },
  { value: 'FAMILY', label: '가족상담', durationMinutes: 100 },
  { value: 'INITIAL', label: '초기상담', durationMinutes: 60 },
  { value: 'COUPLE', label: '부부상담', durationMinutes: 80 },
  { value: 'GROUP', label: '집단상담', durationMinutes: 90 },
] as const;

export const FALLBACK_DURATION_OPTIONS: readonly AdminCommonCodeOption[] = [
  { value: '30_MIN', label: '30분', durationMinutes: 30 },
  { value: '50_MIN', label: '50분', durationMinutes: 50 },
  { value: '60_MIN', label: '60분', durationMinutes: 60 },
  { value: '80_MIN', label: '80분', durationMinutes: 80 },
  { value: '90_MIN', label: '90분', durationMinutes: 90 },
  { value: '100_MIN', label: '100분', durationMinutes: 100 },
  { value: '120_MIN', label: '120분', durationMinutes: 120 },
] as const;
