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
  const n = toSafeNumber(clientId, Number.NaN);
  const hasId = Number.isFinite(n) && n > 0;
  /** API가 이름 없이·또는 구버전에서 "내담자"만 줄 때는 회원 ID로 식별 */
  if (hasId && (!name || name === GENERIC_LABEL)) {
    return `${GENERIC_LABEL} #${n}`;
  }
  if (name && name !== GENERIC_LABEL) {
    return name;
  }
  if (hasId) {
    return `${GENERIC_LABEL} #${n}`;
  }
  return GENERIC_LABEL;
}
