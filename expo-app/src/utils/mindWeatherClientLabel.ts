/**
 * 상담사 수신함 등 — 내담자 식별용 표시 문자열 (이름 우선, 없으면 회원 ID).
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { toDisplayString } from '@/utils/toDisplayString';
import { toSafeNumber } from '@/utils/safeDisplay';

const GENERIC_LABEL = '내담자';

export function formatMindWeatherClientHeadline(
  clientName: string | null | undefined,
  clientId: number | string | null | undefined,
): string {
  const name = toDisplayString(clientName, '').trim();
  if (name && name !== GENERIC_LABEL) {
    return name;
  }
  const n = toSafeNumber(clientId, Number.NaN);
  if (Number.isFinite(n) && n > 0) {
    return `${GENERIC_LABEL} #${n}`;
  }
  return GENERIC_LABEL;
}
