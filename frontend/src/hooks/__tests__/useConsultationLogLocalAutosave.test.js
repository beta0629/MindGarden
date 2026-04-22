import { act, renderHook } from '@testing-library/react';
import {
  CONSULTATION_LOG_LOCAL_AUTOSAVE_DEBOUNCE_MS,
  CONSULTATION_LOG_LOCAL_AUTOSAVE_MAX_INTERVAL_MS
} from '../../constants/consultationLogAutosaveConstants';
import * as consultationLogLocalDraft from '../../utils/consultationLogLocalDraft';
import { useConsultationLogLocalAutosave } from '../useConsultationLogLocalAutosave';

describe('useConsultationLogLocalAutosave', () => {
  let writeSpy;
  let readSpy;
  let rafSpy;

  const tenantIdStr = 'tenant-test';
  const draftScope = { type: 'schedule', id: 'sched-1' };
  const onRestoreDraftCandidate = jest.fn();

  const formDataRef = { current: { clientCondition: 'x' } };
  const memoDraftRef = { current: 'memo' };
  const contentDirtyRef = { current: true };

  const baseParams = () => ({
    isOpen: true,
    loading: false,
    tenantIdStr,
    draftScope,
    formData: formDataRef.current,
    memoDraft: memoDraftRef.current,
    formDataRef,
    memoDraftRef,
    contentDirtyRef,
    onRestoreDraftCandidate
  });

  beforeEach(() => {
    jest.useFakeTimers();
    writeSpy = jest.spyOn(consultationLogLocalDraft, 'writeConsultationLogLocalDraft').mockImplementation(() => {});
    readSpy = jest.spyOn(consultationLogLocalDraft, 'readConsultationLogLocalDraft').mockReturnValue(null);
    rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    onRestoreDraftCandidate.mockClear();
    contentDirtyRef.current = true;
    formDataRef.current = { clientCondition: 'x' };
    memoDraftRef.current = 'memo';
  });

  afterEach(() => {
    rafSpy?.mockRestore?.();
    writeSpy.mockRestore();
    readSpy.mockRestore();
    jest.useRealTimers();
    try {
      delete document.visibilityState;
    } catch {
      // ignore
    }
  });

  const setDocumentHidden = () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      writable: true,
      value: 'hidden'
    });
  };

  const setDocumentVisible = () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      writable: true,
      value: 'visible'
    });
  };

  test('디바운스 경과 후 더티일 때 writeConsultationLogLocalDraft 호출', () => {
    setDocumentVisible();
    renderHook(() => useConsultationLogLocalAutosave(baseParams()));

    expect(writeSpy).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(CONSULTATION_LOG_LOCAL_AUTOSAVE_DEBOUNCE_MS);
    });

    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(writeSpy).toHaveBeenCalledWith(tenantIdStr, draftScope, {
      formData: formDataRef.current,
      memoDraft: memoDraftRef.current
    });
    expect(contentDirtyRef.current).toBe(false);
  });

  test('더티가 아니면 디바운스 후에도 write 호출 없음', () => {
    setDocumentVisible();
    contentDirtyRef.current = false;
    renderHook(() => useConsultationLogLocalAutosave(baseParams()));

    act(() => {
      jest.advanceTimersByTime(CONSULTATION_LOG_LOCAL_AUTOSAVE_DEBOUNCE_MS);
    });

    expect(writeSpy).not.toHaveBeenCalled();
  });

  test('visibilitychange(hidden) 시 더티면 즉시 write 호출', () => {
    setDocumentVisible();
    renderHook(() => useConsultationLogLocalAutosave(baseParams()));

    act(() => {
      setDocumentHidden();
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(writeSpy).toHaveBeenCalledTimes(1);
  });

  test('visibilitychange(hidden)이어도 더티가 아니면 write 없음', () => {
    setDocumentVisible();
    contentDirtyRef.current = false;
    renderHook(() => useConsultationLogLocalAutosave(baseParams()));

    act(() => {
      setDocumentHidden();
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(writeSpy).not.toHaveBeenCalled();
  });

  test('주기 flush: MAX_INTERVAL 경과 시 더티면 write 호출', () => {
    setDocumentVisible();
    renderHook(() => useConsultationLogLocalAutosave(baseParams()));

    act(() => {
      jest.advanceTimersByTime(CONSULTATION_LOG_LOCAL_AUTOSAVE_MAX_INTERVAL_MS);
    });

    expect(writeSpy).toHaveBeenCalledTimes(1);
  });

  test('입력 변화 시 디바운스가 리셋되어 마지막 정지 후 한 번만 write', () => {
    setDocumentVisible();
    const { rerender } = renderHook(
      ({ formData, memoDraft }) =>
        useConsultationLogLocalAutosave({
          ...baseParams(),
          formData,
          memoDraft
        }),
      { initialProps: { formData: { a: 1 }, memoDraft: '' } }
    );

    act(() => {
      jest.advanceTimersByTime(CONSULTATION_LOG_LOCAL_AUTOSAVE_DEBOUNCE_MS - 1000);
    });
    expect(writeSpy).not.toHaveBeenCalled();

    act(() => {
      rerender({ formData: { a: 2 }, memoDraft: '' });
    });

    act(() => {
      jest.advanceTimersByTime(CONSULTATION_LOG_LOCAL_AUTOSAVE_DEBOUNCE_MS - 1000);
    });
    expect(writeSpy).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(writeSpy).toHaveBeenCalledTimes(1);
  });

  test('isOpen이 false이면 디바운스 타이머가 정리되어 이후 write 없음', () => {
    setDocumentVisible();
    const { rerender } = renderHook(
      ({ isOpen }) =>
        useConsultationLogLocalAutosave({
          ...baseParams(),
          isOpen
        }),
      { initialProps: { isOpen: true } }
    );

    act(() => {
      rerender({ isOpen: false });
    });

    act(() => {
      jest.advanceTimersByTime(CONSULTATION_LOG_LOCAL_AUTOSAVE_DEBOUNCE_MS * 2);
    });

    expect(writeSpy).not.toHaveBeenCalled();
  });
});
