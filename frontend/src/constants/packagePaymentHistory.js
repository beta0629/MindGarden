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
  TYPE_LABELS: Object.freeze({
    INITIAL_MAPPING: '최초매칭',
    ADDITIONAL_PACKAGE: '추가패키지',
    SESSION_EXTENSION: '회기추가'
  })
});
