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
    INITIAL_MAPPING: '최초 배정',
    /** 동일 내담자 타임라인에서 INITIAL_MAPPING 이 2건+일 때, 최초가 아닌 행 표시용 */
    MAPPING_ASSIGNMENT: '배정',
    ADDITIONAL_PACKAGE: '추가패키지',
    SESSION_EXTENSION: '회기추가'
  })
});

/**
 * INITIAL_MAPPING 행 중 createdAt(없으면 paymentDate)이 가장 이른 mappingId.
 * 최가을형: 242(8/31 createdAt) → 「최초 배정」, 245(9/1) → 「배정」.
 *
 * @param {Array<object|null|undefined>|null|undefined} items
 * @returns {number|string|null}
 */
export const resolveEarliestInitialMappingId = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }
  let earliestId = null;
  let earliestKey = null;
  items.forEach((item) => {
    if (item == null || typeof item !== 'object') {
      return;
    }
    if (item.type !== PACKAGE_PAYMENT_HISTORY_TYPE.INITIAL_MAPPING) {
      return;
    }
    if (item.mappingId == null) {
      return;
    }
    const raw = item.createdAt || item.paymentDate || '';
    const key = String(raw);
    if (earliestKey == null || key < earliestKey
      || (key === earliestKey && Number(item.mappingId) < Number(earliestId))) {
      earliestKey = key;
      earliestId = item.mappingId;
    }
  });
  return earliestId;
};

/**
 * @param {object|null|undefined} item
 * @param {Array<object>|null|undefined} items
 * @returns {string}
 */
export const resolvePackagePaymentHistoryTypeLabel = (item, items) => {
  const type = item == null ? '' : String(item.type || '');
  const labels = PACKAGE_PAYMENT_HISTORY_UI.TYPE_LABELS;
  if (type === PACKAGE_PAYMENT_HISTORY_TYPE.INITIAL_MAPPING) {
    const earliestId = resolveEarliestInitialMappingId(items);
    if (earliestId != null && item?.mappingId != null
      && Number(item.mappingId) !== Number(earliestId)) {
      return labels.MAPPING_ASSIGNMENT;
    }
    return labels.INITIAL_MAPPING;
  }
  return labels[type] || type || '—';
};
