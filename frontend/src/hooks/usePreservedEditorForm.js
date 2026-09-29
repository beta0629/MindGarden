/**
 * 편집 화면 서버 스냅샷.
 * 초기 로드만 setForm. 이후 배경 재조회·세션 ping 은 입력값을 유지한다.
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

import { useCallback, useRef, useState } from 'react';
import { commitServerEditorForm } from '../utils/editorFormSnapshot';

/**
 * @template T
 * @param {T} initialValue
 * @returns {{
 *   form: T,
 *   setForm: import('react').Dispatch<import('react').SetStateAction<T>>,
 *   markDirty: () => void,
 *   applyServerForm: (next: T, options?: { background?: boolean, silent?: boolean }) => boolean
 * }}
 */
export function usePreservedEditorForm(initialValue) {
  const [form, setFormState] = useState(initialValue);
  const hasAppliedRef = useRef(false);
  const dirtyRef = useRef(false);

  const setForm = useCallback((value) => {
    dirtyRef.current = true;
    setFormState(value);
  }, []);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  const applyServerForm = useCallback((nextValue, options = {}) => {
    const background = options.background === true || options.silent === true;
    const applied = commitServerEditorForm(setFormState, nextValue, {
      hasApplied: hasAppliedRef.current,
      dirty: dirtyRef.current,
      background,
      force: options.force === true
    });
    if (applied) {
      hasAppliedRef.current = true;
      dirtyRef.current = false;
    }
    return applied;
  }, []);

  return {
    form,
    setForm,
    markDirty,
    applyServerForm
  };
}

export default usePreservedEditorForm;
