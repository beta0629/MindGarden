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

/** 라벨을 찾지 못했을 때의 공통 표시. */
export const SCHEDULE_STATUS_LABEL_FALLBACK = '상태 없음';

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
export function resolveScheduleStatusDisplayLabel(status, options = {}) {
  const fallback = options.fallback || SCHEDULE_STATUS_LABEL_FALLBACK;
  const code = readText(status);
  if (!code) {
    return fallback;
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

  return fallback;
}
