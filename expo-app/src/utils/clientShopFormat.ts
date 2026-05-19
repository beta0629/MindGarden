/**
 * 내담자 쇼핑 금액·포인트 표시 (minor = 원 정수)
 *
 * @author MindGarden
 * @since 2026-05-19
 */

/**
 * @param minor 원 단위 정수
 * @param currency ISO 통화 코드
 */
export function formatShopMoney(minor: number, currency = 'KRW'): string {
  const amount = Number(minor) || 0;
  if (currency === 'KRW') {
    return `${amount.toLocaleString('ko-KR')}원`;
  }
  return `${amount.toLocaleString('ko-KR')} ${currency}`;
}

/**
 * @param minor 포인트 minor 단위
 */
export function formatShopPoints(minor: number): string {
  return `${Number(minor || 0).toLocaleString('ko-KR')} P`;
}

/**
 * @param isoDateTime ISO-8601 일시
 */
export function formatShopDateTime(isoDateTime?: string | null): string {
  if (!isoDateTime) {
    return '';
  }
  const normalized = String(isoDateTime).replace('T', ' ').slice(0, 16);
  return normalized;
}
