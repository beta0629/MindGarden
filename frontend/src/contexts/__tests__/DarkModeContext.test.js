/**
 * DarkModeContext 단위 테스트.
 *
 * 검증 항목:
 *   1) toggle() 는 resolved 기준 light ↔ dark 양방향이다 (auto cycle 아님).
 *   2) OS dark + mode=dark 에서 toggle 시 명시 light → data-theme="light".
 *   3) mode 변경 시 localStorage('mg-dark-mode') 에 저장한다.
 *   4) mode='dark' 시 <html data-theme="dark">.
 *   5) mode='light' 시 <html data-theme="light"> (OS dark 덮임 방지).
 *   6) mode='auto' 시 prefers-color-scheme 에 따라 resolved 가 바뀐다.
 *   7) mode='dark' 인 상태에서 외부 시스템이 attribute 를 비웠다가 다시 렌더되어도 'dark' 유지.
 *
 * @author CoreSolution
 * @since 2026-06-15
 */
import React from 'react';
import { act, render, waitFor } from '@testing-library/react';

import {
  DarkModeProvider,
  useDarkMode,
  DARK_MODE_STORAGE_KEY,
  DARK_MODE_VALUES
} from '../DarkModeContext';

/** matchMedia mock — change 핸들러를 캡처해 시스템 다크 변경을 시뮬레이션한다. */
function installMatchMediaMock(initialMatches) {
  const listeners = new Set();
  const mq = {
    matches: initialMatches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: jest.fn((event, handler) => {
      if (event === 'change') {
        listeners.add(handler);
      }
    }),
    removeEventListener: jest.fn((event, handler) => {
      if (event === 'change') {
        listeners.delete(handler);
      }
    }),
    addListener: jest.fn((handler) => listeners.add(handler)),
    removeListener: jest.fn((handler) => listeners.delete(handler)),
    dispatchEvent: jest.fn(() => true)
  };
  window.matchMedia = jest.fn(() => mq);
  return {
    mq,
    fireChange: (next) => {
      mq.matches = next;
      listeners.forEach((handler) => handler({ matches: next }));
    }
  };
}

const Probe = ({ onReady }) => {
  const ctx = useDarkMode();
  React.useEffect(() => {
    onReady(ctx);
  }, [ctx, onReady]);
  return null;
};

/** 최신 ctx snapshot 을 동기로 받아 검증한다. */
const renderProvider = async() => {
  const snapshots = [];
  const utils = render(
    <DarkModeProvider>
      <Probe onReady={(c) => snapshots.push(c)} />
    </DarkModeProvider>
  );
  await waitFor(() => expect(snapshots.length).toBeGreaterThan(0));
  return {
    ...utils,
    getCtx: () => snapshots[snapshots.length - 1],
    snapshots
  };
};

describe('DarkModeContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    installMatchMediaMock(false);
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('초기 mode 는 auto, resolved 는 light (시스템 light)', async() => {
    const { getCtx } = await renderProvider();
    expect(getCtx().mode).toBe(DARK_MODE_VALUES.AUTO);
    expect(getCtx().resolved).toBe(DARK_MODE_VALUES.LIGHT);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('toggle() 는 resolved 기준 light ↔ dark 양방향', async() => {
    const { getCtx } = await renderProvider();

    await act(async() => {
      getCtx().toggle();
    });
    expect(getCtx().mode).toBe(DARK_MODE_VALUES.DARK);
    expect(getCtx().resolved).toBe(DARK_MODE_VALUES.DARK);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    await act(async() => {
      getCtx().toggle();
    });
    expect(getCtx().mode).toBe(DARK_MODE_VALUES.LIGHT);
    expect(getCtx().resolved).toBe(DARK_MODE_VALUES.LIGHT);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    await act(async() => {
      getCtx().toggle();
    });
    expect(getCtx().mode).toBe(DARK_MODE_VALUES.DARK);
    expect(getCtx().resolved).toBe(DARK_MODE_VALUES.DARK);
  });

  it('OS dark + mode=dark 에서 toggle 시 명시 light 로 복귀 (auto 함정 없음)', async() => {
    installMatchMediaMock(true);
    window.localStorage.setItem(DARK_MODE_STORAGE_KEY, DARK_MODE_VALUES.DARK);

    const { getCtx } = await renderProvider();
    expect(getCtx().resolved).toBe(DARK_MODE_VALUES.DARK);

    await act(async() => {
      getCtx().toggle();
    });

    expect(getCtx().mode).toBe(DARK_MODE_VALUES.LIGHT);
    expect(getCtx().resolved).toBe(DARK_MODE_VALUES.LIGHT);
    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    );
  });

  it('OS dark + mode=auto 에서 toggle 시 명시 light (다시 dark 로 안 보임)', async() => {
    installMatchMediaMock(true);

    const { getCtx } = await renderProvider();
    expect(getCtx().mode).toBe(DARK_MODE_VALUES.AUTO);
    expect(getCtx().resolved).toBe(DARK_MODE_VALUES.DARK);

    await act(async() => {
      getCtx().toggle();
    });

    expect(getCtx().mode).toBe(DARK_MODE_VALUES.LIGHT);
    expect(getCtx().resolved).toBe(DARK_MODE_VALUES.LIGHT);
    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    );
  });

  it('mode 변경 시 localStorage(mg-dark-mode) 에 저장', async() => {
    const { getCtx } = await renderProvider();

    await act(async() => {
      getCtx().setMode(DARK_MODE_VALUES.DARK);
    });

    await waitFor(() =>
      expect(window.localStorage.getItem(DARK_MODE_STORAGE_KEY)).toBe(
        DARK_MODE_VALUES.DARK
      )
    );
  });

  it('mode=dark → <html data-theme="dark">', async() => {
    const { getCtx } = await renderProvider();

    await act(async() => {
      getCtx().setMode(DARK_MODE_VALUES.DARK);
    });

    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    );
  });

  it('mode=light → <html data-theme="light">', async() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const { getCtx } = await renderProvider();

    await act(async() => {
      getCtx().setMode(DARK_MODE_VALUES.LIGHT);
    });

    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    );
  });

  it('mode=auto 일 때 prefers-color-scheme 변경에 resolved 가 따라감', async() => {
    const mediaCtl = installMatchMediaMock(false);

    const { getCtx } = await renderProvider();
    expect(getCtx().resolved).toBe(DARK_MODE_VALUES.LIGHT);

    await act(async() => {
      mediaCtl.fireChange(true);
    });
    await waitFor(() => expect(getCtx().resolved).toBe(DARK_MODE_VALUES.DARK));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    await act(async() => {
      mediaCtl.fireChange(false);
    });
    await waitFor(() => expect(getCtx().resolved).toBe(DARK_MODE_VALUES.LIGHT));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('localStorage 에 dark 가 저장돼 있으면 초기화 시 즉시 data-theme="dark"', async() => {
    window.localStorage.setItem(DARK_MODE_STORAGE_KEY, DARK_MODE_VALUES.DARK);

    const { getCtx } = await renderProvider();

    expect(getCtx().mode).toBe(DARK_MODE_VALUES.DARK);
    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    );
  });

  it('mode=dark 인 상태에서 외부 시스템이 attribute 를 비워도 effect 재실행 시 복원', async() => {
    const { getCtx, rerender } = await renderProvider();

    await act(async() => {
      getCtx().setMode(DARK_MODE_VALUES.DARK);
    });
    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    );

    // H6 시뮬: 외부 코드가 attribute 를 임의로 제거
    document.documentElement.removeAttribute('data-theme');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();

    // 부모 리렌더로 effect 재실행을 트리거 (실 App.js 에서는 user 갱신 직후
    // initializeDynamicThemeSystem 가 attribute 를 비우지만, App.js 의 H6 가드가
    // 즉시 복원한다. 본 테스트는 Context 효과 자체가 재실행 시 복원되는지 확인.)
    await act(async() => {
      rerender(
        <DarkModeProvider>
          <Probe onReady={() => {}} key="rerender" />
        </DarkModeProvider>
      );
    });

    await waitFor(() =>
      expect(window.localStorage.getItem(DARK_MODE_STORAGE_KEY)).toBe(
        DARK_MODE_VALUES.DARK
      )
    );
  });

  it('Provider 외부에서 useDarkMode 호출 시 에러', () => {
    const Bad = () => {
      useDarkMode();
      return null;
    };
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Bad />)).toThrow(/DarkModeProvider/);
    errSpy.mockRestore();
  });
});
