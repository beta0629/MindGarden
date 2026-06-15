/**
 * Dark Mode Context
 *
 * Admin Dashboard V2 ContentHeader 우측 「테마」 버튼의 3단 토글
 * (auto → light → dark → auto) 상태를 관리한다.
 *
 * 책임:
 * - localStorage(`mg-dark-mode`)에 사용자 override 저장 / 복원
 * - prefers-color-scheme 시스템 변경 감지 (mode === 'auto' 일 때만 의미)
 * - 최종 resolved 상태(light|dark)를 <html data-theme="..."> attribute 로 반영
 *
 * 디자인 토큰 cascade(`[data-theme="dark"]`)는 이미 `unified-design-tokens.css`
 * 및 `tokens/design-v2-tokens.css` 에 정의되어 있어, root attribute 만 set 하면
 * 즉시 전체 화면이 다크 cascade 를 받는다.
 *
 * @author CoreSolution
 * @since 2026-06-15
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

const DarkModeContext = createContext(null);

/** localStorage 키 (기존 `mindgarden-theme` 와 충돌 회피) */
export const DARK_MODE_STORAGE_KEY = 'mg-dark-mode';

/** 다크 모드 토글 상태 (auto → light → dark → auto cycle) */
export const DARK_MODE_VALUES = Object.freeze({
  AUTO: 'auto',
  LIGHT: 'light',
  DARK: 'dark'
});

const DARK_MODE_CYCLE = {
  [DARK_MODE_VALUES.AUTO]: DARK_MODE_VALUES.LIGHT,
  [DARK_MODE_VALUES.LIGHT]: DARK_MODE_VALUES.DARK,
  [DARK_MODE_VALUES.DARK]: DARK_MODE_VALUES.AUTO
};

const MEDIA_QUERY_DARK = '(prefers-color-scheme: dark)';

/** localStorage 에서 안전하게 mode 복원. 손상 / 비활성 환경은 'auto' 로 fallback. */
function readInitialMode() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DARK_MODE_VALUES.AUTO;
  }
  try {
    const stored = window.localStorage.getItem(DARK_MODE_STORAGE_KEY);
    if (
      stored === DARK_MODE_VALUES.AUTO
      || stored === DARK_MODE_VALUES.LIGHT
      || stored === DARK_MODE_VALUES.DARK
    ) {
      return stored;
    }
  } catch (_error) {
    // localStorage 접근 실패 (SecurityError 등) — auto 로 fallback
  }
  return DARK_MODE_VALUES.AUTO;
}

/** prefers-color-scheme 초기 값. SSR / matchMedia 미지원 환경은 false. */
function readInitialSystemDark() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return window.matchMedia(MEDIA_QUERY_DARK).matches;
  } catch (_error) {
    return false;
  }
}

/** mode + systemDark → 실제 적용 테마(light|dark) */
function computeResolved(mode, systemDark) {
  if (mode === DARK_MODE_VALUES.DARK) {
    return DARK_MODE_VALUES.DARK;
  }
  if (mode === DARK_MODE_VALUES.LIGHT) {
    return DARK_MODE_VALUES.LIGHT;
  }
  return systemDark ? DARK_MODE_VALUES.DARK : DARK_MODE_VALUES.LIGHT;
}

/**
 * DarkModeProvider
 *
 * App.js 의 <ThemeProvider> 안쪽에 중첩한다.
 *
 * @param {{ children: React.ReactNode }} props
 */
export const DarkModeProvider = ({ children }) => {
  const [mode, setMode] = useState(readInitialMode);
  const [systemDark, setSystemDark] = useState(readInitialSystemDark);

  const resolved = useMemo(
    () => computeResolved(mode, systemDark),
    [mode, systemDark]
  );

  // resolved 변경 시 <html data-theme="..."> attribute 동기화
  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }
    const root = document.documentElement;
    if (resolved === DARK_MODE_VALUES.DARK) {
      root.setAttribute('data-theme', 'dark');
    } else {
      // attribute 가 'dark' 가 아닐 때만 removeAttribute 호출
      // (외부 시스템이 다른 값을 넣어둔 경우 보존)
      if (root.getAttribute('data-theme') === 'dark') {
        root.removeAttribute('data-theme');
      }
    }
    return undefined;
  }, [resolved]);

  // mode 변경 시 localStorage 저장
  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return undefined;
    }
    try {
      window.localStorage.setItem(DARK_MODE_STORAGE_KEY, mode);
    } catch (_error) {
      // 비활성 / 용량 초과 → 무시 (다음 로드 시 auto fallback)
    }
    return undefined;
  }, [mode]);

  // prefers-color-scheme watcher (mode === 'auto' 일 때만 의미 있음)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    let mq;
    try {
      mq = window.matchMedia(MEDIA_QUERY_DARK);
    } catch (_error) {
      return undefined;
    }
    const handler = (event) => {
      setSystemDark(Boolean(event?.matches));
    };
    // 표준 API 우선, 일부 구형 Safari 의 deprecated addListener 도 fallback
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handler);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(handler);
    }
    return () => {
      if (typeof mq.removeEventListener === 'function') {
        mq.removeEventListener('change', handler);
      } else if (typeof mq.removeListener === 'function') {
        mq.removeListener(handler);
      }
    };
  }, []);

  const toggle = useCallback(() => {
    setMode((current) => DARK_MODE_CYCLE[current] || DARK_MODE_VALUES.AUTO);
  }, []);

  const setModeExplicit = useCallback((next) => {
    if (
      next === DARK_MODE_VALUES.AUTO
      || next === DARK_MODE_VALUES.LIGHT
      || next === DARK_MODE_VALUES.DARK
    ) {
      setMode(next);
    }
  }, []);

  const value = useMemo(
    () => ({
      mode,
      resolved,
      systemDark,
      toggle,
      setMode: setModeExplicit
    }),
    [mode, resolved, systemDark, toggle, setModeExplicit]
  );

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
};

/**
 * useDarkMode
 *
 * @returns {{ mode: 'auto'|'light'|'dark', resolved: 'light'|'dark', systemDark: boolean, toggle: Function, setMode: Function }}
 * @throws {Error} DarkModeProvider 외부에서 사용 시
 */
export const useDarkMode = () => {
  const ctx = useContext(DarkModeContext);
  if (!ctx) {
    throw new Error('useDarkMode must be used within DarkModeProvider');
  }
  return ctx;
};

export default DarkModeProvider;
