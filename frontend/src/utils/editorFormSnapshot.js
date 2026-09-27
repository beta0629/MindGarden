/**
 * 편집 폼 서버 스냅샷 적용 경계.
 * 초기 로드만 setForm. 배경 재조회는 더티 여부와 관계없이 편집 값을 덮지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

/**
 * @param {{ hasApplied?: boolean, dirty?: boolean, background?: boolean }} [gate]
 * @returns {boolean} true 이면 setForm 해도 된다
 */
export function shouldApplyServerForm(gate = {}) {
  const background = gate.background === true;
  const dirty = gate.dirty === true;
  const hasApplied = gate.hasApplied === true;
  if (dirty) {
    return false;
  }
  if (background) {
    return false;
  }
  if (gate.force === true) {
    return true;
  }
  return !hasApplied;
}

/**
 * @param {(value: unknown) => void} setForm
 * @param {unknown} nextValue
 * @param {{ hasApplied?: boolean, dirty?: boolean, background?: boolean }} [gate]
 * @returns {boolean} 적용했으면 true
 */
export function commitServerEditorForm(setForm, nextValue, gate = {}) {
  if (typeof setForm !== 'function') {
    return false;
  }
  if (!shouldApplyServerForm(gate)) {
    return false;
  }
  setForm(nextValue);
  return true;
}

export default {
  shouldApplyServerForm,
  commitServerEditorForm
};
