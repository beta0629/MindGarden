/**
 * JSX에 넣기 안전한 표시 문자열로 정규화 (React #130: 객체를 자식으로 렌더 방지)
 * @author Core Solution
 * @since 2026-02-12
 */

/**
 * @param {*} value
 * @param {string} [fallback='—']
 * @returns {string}
 */
export function toDisplayString(value, fallback = '—') {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return String(value);
}

/**
 * HTML이 섞인 알림·리치텍스트 문자열을 표시용 플레인 텍스트로 변환한다.
 * `<template>` 파싱으로 스크립트는 비활성(inert) 처리된다.
 * @param {*} value
 * @returns {string}
 */
export function htmlToPlainText(value) {
  if (value == null || value === '') return '';
  const raw = typeof value === 'string' ? value : toDisplayString(value, '');
  if (raw === '') return '';
  const normalized = raw
    .replaceAll(/<\s*br\s*\/?>/gi, '\n')
    .replaceAll(/<\/\s*(p|div|h[1-6]|li|tr|section|article|ul|ol)\s*>/gi, '\n');
  if (typeof document !== 'undefined') {
    try {
      const tpl = document.createElement('template');
      tpl.innerHTML = normalized;
      const text = tpl.content.textContent || '';
      return text
        .replaceAll('\u00a0', ' ')
        .replaceAll(/[ \t]+\n/g, '\n')
        .replaceAll(/\n{3,}/g, '\n\n')
        .trim();
    } catch {
      // ignore
    }
  }
  return normalized.replaceAll(/<[^>]+>/g, ' ').replaceAll(/\s+/g, ' ').trim();
}

/**
 * 에러·예외·API 오류 객체를 사용자-facing 한 줄 문자열로
 * @param {*} error
 * @param {string} [fallback]
 * @returns {string}
 */
export function toErrorMessage(error, fallback = '오류가 발생했습니다.') {
  if (error == null || error === '') return fallback;
  if (typeof error === 'string') return error;
  if (typeof error === 'number' || typeof error === 'boolean') return String(error);
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object') {
    const msg = error.message ?? error.error ?? error.detail ?? error.msg;
    if (msg != null && typeof msg === 'string') return msg;
    try {
      return JSON.stringify(error);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/**
 * API 숫자 필드가 객체·문자열로 올 때 JSX `{n}%` / 차트 data 등에 안전한 finite number로
 * (React #130: completedCount·completionRate 등이 객체인 경우 방지)
 * @param {*} value
 * @param {number} [fallback=0]
 * @returns {number}
 */
export function toSafeNumber(value, fallback = 0) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    const t = value.trim();
    if (t === '') return fallback;
    const n = Number(t);
    return Number.isFinite(n) ? n : fallback;
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'object') {
    const inner =
      value.value ??
      value.current ??
      value.rate ??
      value.completionRate ??
      value.completedCount ??
      value.count;
    if (inner != null && inner !== value) {
      return toSafeNumber(inner, fallback);
    }
  }
  return fallback;
}
