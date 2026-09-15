/**
 * 내담자 패키지 결제 이력 UI 상수 (스펙 SCREEN_SPEC_CLIENT_PACKAGE_PAYMENT_HISTORY).
 *
 * @author MindGarden
 * @since 2026-07-28
 */

export const PACKAGE_PAYMENT_HISTORY_TYPE = Object.freeze({
  INITIAL_MAPPING: 'INITIAL_MAPPING',
  ADDITIONAL_PACKAGE: 'ADDITIONAL_PACKAGE',
  SESSION_EXTENSION: 'SESSION_EXTENSION'
});

export const PACKAGE_PAYMENT_HISTORY_UI = Object.freeze({
  MODAL_TITLE: '패키지 결제 내역',
  SECTION_TITLE: '결제 내역',
  CARD_ACTION_LABEL: '패키지내역',
  EMPTY_TITLE: '결제 내역이 없습니다.',
  EMPTY_DESCRIPTION: '패키지 결제·회기 추가 이력이 아직 없습니다.',
  RETRY_LABEL: '다시 시도',
  LOAD_FAILED: '결제 내역을 불러오지 못했습니다.',
  LOADING_TEXT: '결제 내역을 불러오는 중...',
  CLIENT_MISSING: '내담자 정보를 확인할 수 없습니다.',
  SUMMARY_SESSIONS_FMT: '총 {total}회 / 잔여 {remaining}회',
  SESSIONS_SUFFIX: '회',
  AMOUNT_SUFFIX: '원',
  REFERENCE_PREFIX: '참조:',
  MAPPING_ID_PREFIX: '매핑 #',
  /**
   * 유형 배지. 「최초 배정」= 최초 매핑 결제 이력 행(상담 실일 아님).
   */
  TYPE_LABELS: Object.freeze({
    INITIAL_MAPPING: '최초 배정',
    ADDITIONAL_PACKAGE: '추가패키지',
    SESSION_EXTENSION: '회기추가'
  }),
  /**
   * 카드 날짜 캡션. INITIAL_MAPPING 의 paymentDate 는 BE 에서
   * paymentDate||createdAt 이라 「최초 상담일」로 보이지 않게 분리한다.
   */
  DATE_LABELS: Object.freeze({
    INITIAL_MAPPING: '배정·생성일',
    ADDITIONAL_PACKAGE: '결제일',
    SESSION_EXTENSION: '결제일',
    FALLBACK: '일자'
  })
});

/**
 * 결제 이력 카드 날짜 캡션 — 최초 상담일과 혼동 금지.
 *
 * @param {string|null|undefined} type
 * @returns {string}
 */
export const resolvePackagePaymentHistoryDateLabel = (type) => {
  const key = type == null ? '' : String(type);
  return PACKAGE_PAYMENT_HISTORY_UI.DATE_LABELS[key]
    || PACKAGE_PAYMENT_HISTORY_UI.DATE_LABELS.FALLBACK;
};
