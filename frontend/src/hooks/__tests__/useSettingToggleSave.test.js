/**
 * useSettingToggleSave — confirm / optimistic / rollback / busy 재진입 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-08-07
 */

import { act, renderHook } from '@testing-library/react';
import { useSettingToggleSave } from '../useSettingToggleSave';

describe('useSettingToggleSave', () => {
  const flush = async() => {
    await act(async() => {
      await Promise.resolve();
    });
  };

  it('optimistic true: 선반영 후 save 성공 시 onSuccess', async() => {
    const onValueChange = jest.fn();
    const onSuccess = jest.fn();
    const save = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useSettingToggleSave({
      value: false,
      onValueChange,
      save,
      optimistic: true,
      onSuccess
    }));

    await act(async() => {
      await result.current.onCheckedChange(true);
    });

    expect(onValueChange).toHaveBeenCalledWith(true);
    expect(save).toHaveBeenCalledWith(true);
    expect(onSuccess).toHaveBeenCalledWith(true, false);
    expect(result.current.busy).toBe(false);
  });

  it('optimistic true: save 실패 시 prev 롤백 + onError', async() => {
    const onValueChange = jest.fn();
    const onError = jest.fn();
    const err = new Error('fail');
    const save = jest.fn().mockRejectedValue(err);

    const { result } = renderHook(() => useSettingToggleSave({
      value: false,
      onValueChange,
      save,
      optimistic: true,
      onError
    }));

    await act(async() => {
      await result.current.onCheckedChange(true);
    });

    expect(onValueChange).toHaveBeenNthCalledWith(1, true);
    expect(onValueChange).toHaveBeenNthCalledWith(2, false);
    expect(onError).toHaveBeenCalledWith(err, { next: true, prev: false });
  });

  it('optimistic false: 성공 후에만 onValueChange', async() => {
    const onValueChange = jest.fn();
    let resolveSave;
    const save = jest.fn(() => new Promise((resolve) => {
      resolveSave = resolve;
    }));

    const { result } = renderHook(() => useSettingToggleSave({
      value: false,
      onValueChange,
      save,
      optimistic: false
    }));

    let pending;
    act(() => {
      pending = result.current.onCheckedChange(true);
    });

    await flush();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(result.current.busy).toBe(true);
    expect(result.current.disabled).toBe(true);

    await act(async() => {
      resolveSave();
      await pending;
    });

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('requireConfirm + confirm false 이면 save·낙관적 반영 모두 abort', async() => {
    const onValueChange = jest.fn();
    const save = jest.fn();
    const confirm = jest.fn().mockResolvedValue(false);

    const { result } = renderHook(() => useSettingToggleSave({
      value: false,
      onValueChange,
      save,
      requireConfirm: true,
      confirm
    }));

    await act(async() => {
      await result.current.onCheckedChange(true);
    });

    expect(confirm).toHaveBeenCalledWith({ next: true, prev: false });
    expect(save).not.toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('requireConfirm 이 (next)=>next 이면 ON 만 confirm', async() => {
    const confirm = jest.fn().mockResolvedValue(true);
    const save = jest.fn().mockResolvedValue(undefined);
    const onValueChange = jest.fn();

    const { result, rerender } = renderHook(
      ({ value }) => useSettingToggleSave({
        value,
        onValueChange,
        save,
        requireConfirm: (next) => next === true,
        confirm,
        optimistic: true
      }),
      { initialProps: { value: false } }
    );

    await act(async() => {
      await result.current.onCheckedChange(true);
    });
    expect(confirm).toHaveBeenCalledTimes(1);

    confirm.mockClear();
    rerender({ value: true });

    await act(async() => {
      await result.current.onCheckedChange(false);
    });
    expect(confirm).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledWith(false);
  });

  it('busy 중 재진입은 무시한다', async() => {
    let resolveSave;
    const save = jest.fn(() => new Promise((resolve) => {
      resolveSave = resolve;
    }));
    const onValueChange = jest.fn();

    const { result } = renderHook(() => useSettingToggleSave({
      value: false,
      onValueChange,
      save,
      optimistic: true
    }));

    let first;
    act(() => {
      first = result.current.onCheckedChange(true);
    });
    await flush();

    await act(async() => {
      await result.current.onCheckedChange(false);
    });

    expect(save).toHaveBeenCalledTimes(1);

    await act(async() => {
      resolveSave();
      await first;
    });
  });

  it('isEnabled=false 이면 disabled 이고 콜백이 무시된다', async() => {
    const save = jest.fn();
    const { result } = renderHook(() => useSettingToggleSave({
      value: false,
      onValueChange: jest.fn(),
      save,
      isEnabled: false
    }));

    expect(result.current.disabled).toBe(true);

    await act(async() => {
      await result.current.onCheckedChange(true);
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('requireConfirm + confirm true 이면 save 호출 (ON 확인 경로)', async() => {
    const confirm = jest.fn().mockResolvedValue(true);
    const save = jest.fn().mockResolvedValue(undefined);
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useSettingToggleSave({
      value: false,
      onValueChange: jest.fn(),
      save,
      requireConfirm: true,
      confirm,
      optimistic: true,
      onSuccess
    }));

    await act(async() => {
      await result.current.onCheckedChange(true);
    });

    expect(confirm).toHaveBeenCalledWith({ next: true, prev: false });
    expect(save).toHaveBeenCalledWith(true);
    expect(onSuccess).toHaveBeenCalledWith(true, false);
  });

  it('optimistic false + requireConfirm: confirm 전에는 onValueChange 미호출', async() => {
    let resolveConfirm;
    const confirm = jest.fn(() => new Promise((resolve) => {
      resolveConfirm = resolve;
    }));
    const onValueChange = jest.fn();
    const save = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useSettingToggleSave({
      value: false,
      onValueChange,
      save,
      requireConfirm: true,
      confirm,
      optimistic: false
    }));

    let pending;
    act(() => {
      pending = result.current.onCheckedChange(true);
    });
    await flush();

    expect(confirm).toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();

    await act(async() => {
      resolveConfirm(true);
      await pending;
    });

    expect(save).toHaveBeenCalledWith(true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
