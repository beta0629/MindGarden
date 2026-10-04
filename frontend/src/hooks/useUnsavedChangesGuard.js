import { useContext, useEffect, useRef } from 'react';
import { UNSAFE_DataRouterContext, useBlocker } from 'react-router-dom';
import { CONSULTATION_LOG_AUTOSAVE_STRINGS } from '../constants/consultationLogAutosaveStrings';

/**
 * 미저장 변경이 있을 때 이탈을 막는 공통 가드.
 *
 * <ul>
 *   <li>새로고침·탭 닫기 — {@code beforeunload} (브라우저 기본 확인창). 라우터 종류와 무관.</li>
 *   <li>SPA 라우트 이동 (data router) — react-router {@code useBlocker}.
 *       {@code createBrowserRouter} 계열에서만 사용 가능하다.</li>
 *   <li>SPA 라우트 이동 (BrowserRouter) — 같은 출처 {@code <a href>} 클릭을 캡처 단계에서
 *       가로채 {@code window.confirm} 으로 확인한다.</li>
 * </ul>
 *
 * <h3>왜 라우터를 구분하는가</h3>
 * <p>{@code useBlocker} 는 v6.4+ <strong>data router 전용</strong> API 로,
 * {@code BrowserRouter} 아래에서 호출하면 "useBlocker must be used within a data router"
 * 예외를 던져 화면이 크래시한다. 앱 루트가 {@code BrowserRouter} 인 동안에는 호출하지 않는다.
 * 판별은 {@code UNSAFE_DataRouterContext} 가 존재하는지로 한다
 * ({@code BrowserRouter} 는 이 컨텍스트를 제공하지 않는다).</p>
 *
 * <p>조건부 훅 호출이지만 <strong>마운트 수명 동안 조건이 바뀌지 않도록 ref 로 고정</strong>한다.
 * 같은 컴포넌트 인스턴스가 언마운트 없이 다른 종류의 라우터로 옮겨질 수는 없으므로
 * 훅 호출 순서는 항상 동일하다.</p>
 *
 * <h3>BrowserRouter 경로의 한계</h3>
 * <p>앵커 클릭만 가로채므로 {@code navigate()} 직접 호출(버튼 등)은 막히지 않는다.
 * LNB·GNB 등 주요 이동 경로는 {@code <Link>}(= {@code <a href>}) 이므로 실사용 경로는 덮인다.
 * 전면 차단이 필요하면 라우터를 {@code createBrowserRouter} 로 이전해야 한다(본 변경 범위 밖).</p>
 *
 * @param {object} params
 * @param {boolean} params.when 미저장 변경 여부
 * @param {boolean} [params.enableRouteBlocker] 라우트 차단 사용 여부 (기본 true)
 * @param {string} [params.confirmMessage] 앵커 클릭 확인창 문구
 * @returns {{ blocker: object|null }} data router 에서 차단 중이면 proceed/reset 보유, 그 외 null
 * @author CoreSolution
 * @since 2026-10-04
 */
export function useUnsavedChangesGuard({
  when,
  enableRouteBlocker = true,
  confirmMessage = CONSULTATION_LOG_AUTOSAVE_STRINGS.LEAVE_MESSAGE
}) {
  const shouldBlock = Boolean(when);

  // data router 여부는 마운트 시점에 한 번만 확정한다 (훅 호출 순서 고정).
  const dataRouterContext = useContext(UNSAFE_DataRouterContext);
  const routeBlockerActiveRef = useRef(null);
  if (routeBlockerActiveRef.current === null) {
    routeBlockerActiveRef.current = Boolean(enableRouteBlocker) && Boolean(dataRouterContext?.router);
  }
  const routeBlockerActive = routeBlockerActiveRef.current;

  let blocker = null;
  if (routeBlockerActive) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    blocker = useBlocker(({ currentLocation, nextLocation }) =>
      shouldBlock && currentLocation.pathname !== nextLocation.pathname);
  }

  useEffect(() => {
    if (!shouldBlock) return undefined;
    const onBeforeUnload = (event) => {
      event.preventDefault();
      // 최신 브라우저는 커스텀 문구를 무시하고 기본 확인창을 띄운다.
      event.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [shouldBlock]);

  // BrowserRouter 폴백 — 같은 출처 앵커 클릭을 캡처 단계에서 확인한다.
  useEffect(() => {
    if (routeBlockerActive || !enableRouteBlocker || !shouldBlock) return undefined;
    const onClickCapture = (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target?.closest?.('a[href]');
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      let nextUrl;
      try {
        nextUrl = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (nextUrl.origin !== window.location.origin) return;
      if (nextUrl.pathname === window.location.pathname) return;
      // eslint-disable-next-line no-alert
      if (!window.confirm(confirmMessage)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener('click', onClickCapture, true);
    return () => document.removeEventListener('click', onClickCapture, true);
  }, [routeBlockerActive, enableRouteBlocker, shouldBlock, confirmMessage]);

  return { blocker };
}

export default useUnsavedChangesGuard;
