/**
 * 상담사 수신함 등 — 내담자 식별용 표시 문자열 (이름 우선, 없으면 회원 ID).
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { toDisplayString } from '@/utils/toDisplayString';
import { toSafeNumber } from '@/utils/safeDisplay';

/** API·로컬에서 쓰이는 제네릭 내담자 표기(실명 없음) */
export const MIND_WEATHER_GENERIC_CLIENT_LABEL = '내담자';

export function isGenericMindWeatherClientDisplayName(
  clientName: string | null | undefined,
): boolean {
  return toDisplayString(clientName, '').trim() === MIND_WEATHER_GENERIC_CLIENT_LABEL;
}

export function formatMindWeatherClientHeadline(
  clientName: string | null | undefined,
  clientId: number | string | null | undefined,
  /** API·로컬에 식별 필드가 없을 때 카드 엔티티 id로만이라도 구분 */
  cardEntityId?: string | null,
): string {
  const name = toDisplayString(clientName, '').trim();
  const n = toSafeNumber(clientId, Number.NaN);
  const hasId = Number.isFinite(n) && n > 0;
  /** API가 이름 없이·또는 구버전에서 "내담자"만 줄 때는 회원 ID로 식별 */
  if (hasId && (!name || name === MIND_WEATHER_GENERIC_CLIENT_LABEL)) {
    return `${MIND_WEATHER_GENERIC_CLIENT_LABEL} #${n}`;
  }
  if (name && name !== MIND_WEATHER_GENERIC_CLIENT_LABEL) {
    return name;
  }
  if (hasId) {
    return `${MIND_WEATHER_GENERIC_CLIENT_LABEL} #${n}`;
  }
  const cardId = toDisplayString(cardEntityId, '').trim();
  if (cardId) {
    return `공유 카드 #${cardId}`;
  }
  return MIND_WEATHER_GENERIC_CLIENT_LABEL;
}
