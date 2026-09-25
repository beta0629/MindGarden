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

/** 결제 채널(소스) — method와 분리. SSOT: PAYMENT_SOURCE_ONLINE_MANUAL_MAPPING_RULES_20260318 */
export const PACKAGE_PAYMENT_HISTORY_SOURCE = Object.freeze({
  ONLINE: 'ONLINE',
  MANUAL: 'MANUAL',
  UNKNOWN: 'UNKNOWN'
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
  /** ACTIVE·소진 매핑 — 결제 당시 회기와 구분되는 현재 잔여 */
  REMAINING_SESSIONS_FMT: '잔여 {remaining}회',
  /**
   * 추가패키지 병합 TERMINATED — 종료=잔여0 오해 방지.
   * {mappingId} = 합산 대상 활성 매핑 ID
   */
  MERGED_INTO_ACTIVE_FMT: '활성 매핑 #{mappingId}에 합산됨',
  AMOUNT_SUFFIX: '원',
  REFERENCE_PREFIX: '참조:',
  MAPPING_ID_PREFIX: '매핑 #',
  TYPE_LABELS: Object.freeze({
    INITIAL_MAPPING: '최초 배정',
    /** 동일 내담자 타임라인에서 INITIAL_MAPPING 이 2건+일 때, 최초가 아닌 행 표시용 */
    MAPPING_ASSIGNMENT: '배정',
    ADDITIONAL_PACKAGE: '추가패키지',
    SESSION_EXTENSION: '회기추가'
  }),
  DATE_LABELS: Object.freeze({
    INITIAL_MAPPING: '배정·생성일',
    ADDITIONAL_PACKAGE: '결제일',
    SESSION_EXTENSION: '결제일',
    FALLBACK: '일자'
  }),
  /** 채널 뱃지 — method 라벨에 「온라인」혼재 금지 */
  SOURCE_LABELS: Object.freeze({
    ONLINE: '온라인',
    MANUAL: '수동/센터',
    UNKNOWN: '미확인'
  })
});

/**
 * paymentSource → 표시 라벨. UNKNOWN은 숨김 가능하도록 null 반환 옵션.
 *
 * @param {string|null|undefined} source
 * @param {{ hideUnknown?: boolean }} [options]
 * @returns {string|null}
 */
export const resolvePackagePaymentSourceLabel = (source, options = {}) => {
  const key = source == null ? '' : String(source).trim().toUpperCase();
  const labels = PACKAGE_PAYMENT_HISTORY_UI.SOURCE_LABELS;
  if (!key || !Object.prototype.hasOwnProperty.call(labels, key)) {
    return null;
  }
  if (options.hideUnknown && key === PACKAGE_PAYMENT_HISTORY_SOURCE.UNKNOWN) {
    return null;
  }
  return labels[key];
};

/**
 * Badge statusVariant for source channel.
 *
 * @param {string|null|undefined} source
 * @returns {'success'|'neutral'|'warning'|null}
 */
export const resolvePackagePaymentSourceBadgeVariant = (source) => {
  const key = source == null ? '' : String(source).trim().toUpperCase();
  if (key === PACKAGE_PAYMENT_HISTORY_SOURCE.ONLINE) {
    return 'success';
  }
  if (key === PACKAGE_PAYMENT_HISTORY_SOURCE.MANUAL) {
    return 'neutral';
  }
  if (key === PACKAGE_PAYMENT_HISTORY_SOURCE.UNKNOWN) {
    return 'warning';
  }
  return null;
};

/**
 * ACTIVE 매핑 잔여 라벨. remainingSessions 가 숫자일 때만.
 *
 * @param {object|null|undefined} item
 * @returns {string|null}
 */
export const resolvePackagePaymentRemainingLabel = (item) => {
  if (item == null || typeof item !== 'object') {
    return null;
  }
  if (item.remainingSessions == null || item.remainingSessions === '') {
    return null;
  }
  const remaining = Number(item.remainingSessions);
  if (!Number.isFinite(remaining)) {
    return null;
  }
  return PACKAGE_PAYMENT_HISTORY_UI.REMAINING_SESSIONS_FMT
    .replace('{remaining}', String(remaining));
};

/**
 * 병합 TERMINATED 추가패키지 안내. 종료=잔여0 오해 방지.
 *
 * @param {object|null|undefined} item
 * @returns {string|null}
 */
export const resolvePackagePaymentMergedIntoLabel = (item) => {
  if (item == null || typeof item !== 'object') {
    return null;
  }
  if (item.mergedIntoActive !== true) {
    return null;
  }
  if (item.targetActiveMappingId == null || item.targetActiveMappingId === '') {
    return null;
  }
  return PACKAGE_PAYMENT_HISTORY_UI.MERGED_INTO_ACTIVE_FMT
    .replace('{mappingId}', String(item.targetActiveMappingId));
};

/**
 * INITIAL_MAPPING 행 중 createdAt(없으면 paymentDate)이 가장 이른 mappingId.
 * 가장 이른 행만 「최초 배정」, 이후 INITIAL_MAPPING 은 「배정」.
 * 특정 mappingId / clientId 분기 금지.
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

export const resolvePackagePaymentHistoryDateLabel = (type) => {
  const key = type == null ? '' : String(type);
  return PACKAGE_PAYMENT_HISTORY_UI.DATE_LABELS[key]
    || PACKAGE_PAYMENT_HISTORY_UI.DATE_LABELS.FALLBACK;
};
