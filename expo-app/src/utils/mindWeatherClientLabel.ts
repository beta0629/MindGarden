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
  const t = toDisplayString(clientName, '').trim();
  if (t.length === 0) {
    return true;
  }
  const lower = t.toLowerCase();
  if (lower === MIND_WEATHER_GENERIC_CLIENT_LABEL.toLowerCase()) {
    return true;
  }
  if (t === '이름 비공개' || lower === 'anonymous' || t === '—') {
    return true;
  }
  /** 서버가 `내담자 #123` 형태로 주면 표시용으로는 충분히 구체적이므로 제네릭이 아님 */
  if (/^내담자\s*#\s*\d+$/u.test(t)) {
    return false;
  }
  return false;
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
  /** API가 이름 없이·제네릭만 줄 때는 회원 id로 식별 */
  if (hasId && (!name || isGenericMindWeatherClientDisplayName(name))) {
    return `${MIND_WEATHER_GENERIC_CLIENT_LABEL} #${n}`;
  }
  if (name && !isGenericMindWeatherClientDisplayName(name)) {
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
