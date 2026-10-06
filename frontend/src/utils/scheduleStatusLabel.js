/**
 * 스케줄 상태 표시 라벨.
 * 공통코드(SCHEDULE_STATUS) 한글명 → i18n → 공통 폴백.
 * 코드 원문(COMPLETED 등)은 화면에 그대로 두지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */

/** i18n schedule 네임스페이스의 상태 라벨 prefix. */
export const SCHEDULE_STATUS_LABEL_I18N_PREFIX = 'schedule:constants.status.';

/** translate 가 없을 때만 쓰는 unknown 라벨 defaultValue. */
export const SCHEDULE_STATUS_LABEL_FALLBACK = '상태 없음';

/** 라벨을 찾지 못했을 때의 i18n 키. */
export const SCHEDULE_STATUS_UNKNOWN_I18N_KEY = `${SCHEDULE_STATUS_LABEL_I18N_PREFIX}unknown`;

const readText = (value) => (value == null ? '' : String(value).trim());

const readCodeValue = (row) => {
  if (!row || typeof row !== 'object') {
    return '';
  }
  if (row.codeValue != null) {
    return readText(row.codeValue);
  }
  return readText(row.value);
};

const readCodeLabel = (row) => {
  if (!row || typeof row !== 'object') {
    return '';
  }
  return readText(row.koreanName || row.codeLabel || row.label);
};

/**
 * @param {string|null|undefined} status 상태 코드
 * @param {{ codes?: Array<Record<string, *>>, translate?: Function, fallback?: string }} [options]
 * @returns {string}
 */
const resolveUnknownLabel = (options) => {
  if (options.fallback) {
    return options.fallback;
  }
  if (typeof options.translate === 'function') {
    const translated = readText(options.translate(SCHEDULE_STATUS_UNKNOWN_I18N_KEY, {
      defaultValue: SCHEDULE_STATUS_LABEL_FALLBACK
    }));
    if (translated && translated !== SCHEDULE_STATUS_UNKNOWN_I18N_KEY) {
      return translated;
    }
  }
  return SCHEDULE_STATUS_LABEL_FALLBACK;
};

export function resolveScheduleStatusDisplayLabel(status, options = {}) {
  const code = readText(status);
  if (!code) {
    return resolveUnknownLabel(options);
  }

  const rows = Array.isArray(options.codes) ? options.codes : [];
  const match = rows.find((row) => readCodeValue(row) === code);
  const fromCode = readCodeLabel(match);
  if (fromCode && fromCode !== code) {
    return fromCode;
  }

  if (typeof options.translate === 'function') {
    const key = `${SCHEDULE_STATUS_LABEL_I18N_PREFIX}${code}`;
    const translated = readText(options.translate(key, { defaultValue: '' }));
    if (
      translated
      && translated !== key
      && translated !== code
      && !translated.startsWith(SCHEDULE_STATUS_LABEL_I18N_PREFIX)
    ) {
      return translated;
    }
  }

  return resolveUnknownLabel(options);
}
