/**
 * 화면 표시용 ID·요약 문구 공통 유틸.
 * 주문 UUID 축약·본문 UUID 치환·알림 카드 「패키지」→「상담 회차」만 담당한다.
 * 쇼핑 카탈로그 상품명 전역 치환에는 쓰지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-21
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_IN_TEXT_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const ORDER_NUMBER_VISIBLE_CHARS = 8;
const ORDER_NUMBER_GROUP_CHARS = 4;
const PACKAGE_LABEL = '패키지';
const CONSULTATION_ROUND_LABEL = '상담 회차';
/** 「N회기 패키지 중 M회 남음」 계열은 말 그대로 둔다 */
const REMAINING_SESSIONS_PHRASE_PATTERN = /(\d+)\s*회기\s*패키지\s*중\s*(\d+)\s*회\s*남음/g;

/**
 * 화면에 보이는 주문 번호. UUID 면 앞 8자만 4-4 로 끊어 보여 준다.
 *
 * @param {unknown} id
 * @returns {string}
 */
export const formatPersonalOrderNumber = (id) => {
  const raw = id == null ? '' : String(id).trim();
  if (!raw) {
    return '';
  }
  if (!UUID_PATTERN.test(raw)) {
    return raw;
  }
  const head = raw.slice(0, ORDER_NUMBER_VISIBLE_CHARS).toUpperCase();
  return `${head.slice(0, ORDER_NUMBER_GROUP_CHARS)}-${head.slice(ORDER_NUMBER_GROUP_CHARS)}`;
};

/**
 * 본문·요약에 섞인 UUID 부분 문자열을 8자(4-4) 형태로 줄인다.
 *
 * @param {unknown} text
 * @returns {string}
 */
export const abbreviateUuidsInText = (text) => {
  const raw = text == null ? '' : String(text);
  if (!raw) {
    return '';
  }
  return raw.replace(UUID_IN_TEXT_PATTERN, (match) => formatPersonalOrderNumber(match));
};

/**
 * 알림·메시지 카드/모달 표시용 「패키지」→「상담 회차」.
 * 남은 회기 관용 구문(「N회기 패키지 중 M회 남음」)은 치환하지 않는다.
 *
 * @param {unknown} text
 * @returns {string}
 */
export const replacePackageLabelForDisplay = (text) => {
  const raw = text == null ? '' : String(text);
  if (!raw || !raw.includes(PACKAGE_LABEL)) {
    return raw;
  }
  const placeholders = [];
  const masked = raw.replace(REMAINING_SESSIONS_PHRASE_PATTERN, (match) => {
    const token = `__MG_REMAINING_SESSIONS_${placeholders.length}__`;
    placeholders.push(match);
    return token;
  });
  const replaced = masked.split(PACKAGE_LABEL).join(CONSULTATION_ROUND_LABEL);
  return placeholders.reduce(
    (acc, phrase, index) => acc.split(`__MG_REMAINING_SESSIONS_${index}__`).join(phrase),
    replaced
  );
};

/**
 * 알림 카드 요약·모달 본문 표시용 — UUID 축약 후 「패키지」 라벨만 화면 치환.
 *
 * @param {unknown} text
 * @returns {string}
 */
export const formatNotificationSummaryText = (text) => (
  replacePackageLabelForDisplay(abbreviateUuidsInText(text))
);

export default {
  formatPersonalOrderNumber,
  abbreviateUuidsInText,
  replacePackageLabelForDisplay,
  formatNotificationSummaryText
};
