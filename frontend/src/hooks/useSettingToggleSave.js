/**
 * 설정 boolean 토글 — 확인(옵션) → 낙관적 반영 → save → 성공/실패(롤백) 공통 훅.
 *
 * StandardizedApi·toast·confirm UI 는 훅이 import 하지 않는다.
 * 페이지가 save / confirm / onSuccess / onError 로 주입한다.
 *
 * @author CoreSolution
 * @since 2026-08-07
 */

import { useCallback, useRef, useState } from 'react';

/**
 * @param {object} args
 * @param {boolean} args.value 현재 값
 * @param {(next: boolean) => void} args.onValueChange 값 반영 콜백
 * @param {(next: boolean) => Promise<unknown>} args.save 저장 (resolve=성공, reject=실패)
 * @param {boolean | ((next: boolean) => boolean)} [args.requireConfirm=false]
 * @param {(ctx: { next: boolean, prev: boolean }) => Promise<boolean>} [args.confirm]
 * @param {boolean} [args.optimistic=true] true 면 선반영 후 실패 시 prev 롤백
 * @param {(next: boolean, prev: boolean) => void} [args.onSuccess]
 * @param {(error: unknown, ctx: { next: boolean, prev: boolean }) => void} [args.onError]
 * @param {boolean} [args.isEnabled=true] false 면 토글 무시·disabled
 * @returns {{ busy: boolean, disabled: boolean, onCheckedChange: (next: boolean) => Promise<void> }}
 */
export function useSettingToggleSave({
  value,
  onValueChange,
  save,
  requireConfirm = false,
  confirm,
  optimistic = true,
  onSuccess,
  onError,
  isEnabled = true
}) {
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  const disabled = !isEnabled || busy;

  const onCheckedChange = useCallback(async(next) => {
    if (busyRef.current || !isEnabled) {
      return;
    }
    if (typeof next !== 'boolean') {
      return;
    }

    const prev = Boolean(valueRef.current);
    if (next === prev) {
      return;
    }

    const needsConfirm = typeof requireConfirm === 'function'
      ? Boolean(requireConfirm(next))
      : Boolean(requireConfirm);

    if (needsConfirm) {
      if (typeof confirm !== 'function') {
        return;
      }
      const confirmed = await confirm({ next, prev });
      if (!confirmed) {
        return;
      }
    }

    busyRef.current = true;
    setBusy(true);

    if (optimistic && typeof onValueChange === 'function') {
      onValueChange(next);
    }

    try {
      if (typeof save !== 'function') {
        throw new Error('useSettingToggleSave: save is required');
      }
      await save(next);
      if (!optimistic && typeof onValueChange === 'function') {
        onValueChange(next);
      }
      if (typeof onSuccess === 'function') {
        onSuccess(next, prev);
      }
    } catch (error) {
      if (optimistic && typeof onValueChange === 'function') {
        onValueChange(prev);
      }
      if (typeof onError === 'function') {
        onError(error, { next, prev });
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [
    isEnabled,
    requireConfirm,
    confirm,
    optimistic,
    onValueChange,
    save,
    onSuccess,
    onError
  ]);

  return { busy, disabled, onCheckedChange };
}

export default useSettingToggleSave;
