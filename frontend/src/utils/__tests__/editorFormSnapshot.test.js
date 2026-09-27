/**
 * 편집 폼 — 초기 스냅샷만 적용. 배경 재조회는 더티가 아니어도 setForm 하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

import { renderHook, act } from '@testing-library/react';
import { shouldApplyServerForm, commitServerEditorForm } from '../editorFormSnapshot';
import { usePreservedEditorForm } from '../../hooks/usePreservedEditorForm';

describe('shouldApplyServerForm', () => {
  it('초기 로드만 적용한다', () => {
    expect(shouldApplyServerForm()).toBe(true);
    expect(shouldApplyServerForm({ hasApplied: false, dirty: false, background: false })).toBe(true);
  });

  it('배경 재조회는 더티가 아니어도 적용하지 않는다', () => {
    expect(shouldApplyServerForm({ hasApplied: true, dirty: false, background: true })).toBe(false);
    expect(shouldApplyServerForm({ hasApplied: false, dirty: false, background: true })).toBe(false);
  });

  it('저장하지 않은 입력은 서버 값으로 덮지 않는다', () => {
    expect(shouldApplyServerForm({ hasApplied: true, dirty: true, background: false })).toBe(false);
    expect(shouldApplyServerForm({ dirty: true, force: true })).toBe(false);
  });

  it('force 는 더티가 아닐 때만 다시 적용한다', () => {
    expect(shouldApplyServerForm({ hasApplied: true, dirty: false, force: true })).toBe(true);
  });
});

describe('commitServerEditorForm', () => {
  it('거절되면 setForm 을 호출하지 않는다', () => {
    const setForm = jest.fn();
    expect(commitServerEditorForm(setForm, { title: 'server' }, { background: true })).toBe(false);
    expect(setForm).not.toHaveBeenCalled();
  });
});

describe('usePreservedEditorForm', () => {
  it('초기 적용 후 배경 재조회와 입력 중 서버 스냅샷을 무시한다', () => {
    const { result } = renderHook(() => usePreservedEditorForm({ title: '' }));

    act(() => {
      expect(result.current.applyServerForm({ title: 'server' })).toBe(true);
    });
    expect(result.current.form.title).toBe('server');

    act(() => {
      result.current.setForm({ title: 'typed' });
    });
    act(() => {
      expect(result.current.applyServerForm({ title: 'server' }, { background: true })).toBe(false);
      expect(result.current.applyServerForm({ title: 'server' })).toBe(false);
    });
    expect(result.current.form.title).toBe('typed');
  });

  it('더티가 아니어도 배경 재조회는 setForm 하지 않는다', () => {
    const { result } = renderHook(() => usePreservedEditorForm({ title: '' }));

    act(() => {
      result.current.applyServerForm({ title: 'server' });
    });
    act(() => {
      expect(result.current.applyServerForm({ title: 'server-again' }, { silent: true })).toBe(false);
    });
    expect(result.current.form.title).toBe('server');
  });
});
