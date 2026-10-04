import { useCallback, useContext, useEffect, useRef } from 'react';
import { UNSAFE_DataRouterContext, UNSAFE_NavigationContext, useBlocker } from 'react-router-dom';
import { CONSULTATION_LOG_AUTOSAVE_STRINGS } from '../constants/consultationLogAutosaveStrings';
import { addUnsavedChangesPopStateHandler } from './unsavedChangesPopStateGate';

/**
 * 미저장 변경이 있을 때 이탈을 막는 공통 가드.
 *
 * <ul>
 *   <li>새로고침·탭 닫기 — {@code beforeunload} (브라우저 기본 확인창). 라우터 종류와 무관.</li>
 *   <li>SPA 라우트 이동 (data router) — react-router {@code useBlocker}.
 *       {@code createBrowserRouter} 계열에서만 사용 가능하다.</li>
 *   <li>SPA 라우트 이동 (BrowserRouter) — 라우터 navigator 의 {@code push}·{@code replace}·{@code go} 를
 *       미저장 동안만 감싸 {@code window.confirm} 으로 확인한다. {@code <Link>}·{@code navigate()}·
 *       {@code navigate(-1)} 이 모두 이 경로를 지난다.</li>
 *   <li>브라우저 뒤로·앞으로 (BrowserRouter) — {@code popstate} 를 라우터보다 먼저 받아 확인하고
 *       ({@link ./unsavedChangesPopStateGate} 관문 — 앱 진입 시 라우터보다 먼저 등록),
 *       취소하면 라우터에 전달하지 않은 채 {@code history.go(delta)} 로 원래 항목에 되돌린다. 되돌릴 때 생기는
 *       {@code popstate} 도 라우터에 전달하지 않는다 — 라우터 위치가 그대로라 화면·입력이 재렌더·재마운트되지 않는다.</li>
 * </ul>
 *
 * <h3>왜 라우터를 구분하는가</h3>
 * <p>{@code useBlocker} 는 <strong>data router 전용</strong> API 로,
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
 * <ul>
 *   <li>뒤로 가기를 취소하면 주소창이 잠깐 이전 주소로 바뀌었다가 되돌아온다(브라우저가 먼저 이동하므로).</li>
 *   <li>라우터 밖에서 만든 기록 항목(라우터 인덱스 {@code idx} 없음)으로 돌아가는 경우에는 현재 주소를
 *       새 항목으로 다시 쌓아 되돌린다 — 앞으로 가기 기록 1건이 사라질 수 있다.</li>
 *   <li>{@code window.history.pushState} 직접 호출·{@code window.location} 변경은 라우터 navigator 를 거치지 않는다.
 *       {@code location} 변경(전체 새로고침)은 {@code beforeunload} 가 막는다.</li>
 *   <li>새로고침·탭 닫기 확인창 문구는 브라우저 기본 문구다(사용자 지정 문구 무시).</li>
 * </ul>
 *
 * @param {object} params
 * @param {boolean} params.when 미저장 변경 여부
 * @param {boolean} [params.enableRouteBlocker] 라우트 차단 사용 여부 (기본 true)
 * @param {string} [params.confirmMessage] 이동 확인창 문구
 * @returns {{ blocker: object|null, releaseGuard: function }} blocker — data router 에서 차단 중이면
 *   proceed/reset 보유, 그 외 null. releaseGuard — 화면이 이미 확인을 받은 이동(저장 후 닫기·
 *   「저장하지 않고 닫기」) 직전에 호출하면 미저장 상태가 끝날 때까지 다시 묻지 않는다.
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
  const navigator = useContext(UNSAFE_NavigationContext)?.navigator;
  const routeBlockerActiveRef = useRef(null);
  if (routeBlockerActiveRef.current === null) {
    routeBlockerActiveRef.current = Boolean(enableRouteBlocker) && Boolean(dataRouterContext?.router);
  }
  const routeBlockerActive = routeBlockerActiveRef.current;

  // 저장·「저장하지 않고 닫기」처럼 화면이 이미 확인을 받은 이동은 다시 묻지 않는다.
  // 렌더 전에 같은 틱에서 이동하므로 when 갱신을 기다리지 않고 ref 로 즉시 해제한다.
  const releasedRef = useRef(false);
  const releaseGuard = useCallback(() => {
    releasedRef.current = true;
  }, []);
  useEffect(() => {
    if (!shouldBlock) releasedRef.current = false;
  }, [shouldBlock]);

  let blocker = null;
  if (routeBlockerActive) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    blocker = useBlocker(({ currentLocation, nextLocation }) =>
      shouldBlock && !releasedRef.current && currentLocation.pathname !== nextLocation.pathname);
  }

  useEffect(() => {
    if (!shouldBlock) return undefined;
    const onBeforeUnload = (event) => {
      if (releasedRef.current) return undefined;
      event.preventDefault();
      // 최신 브라우저는 커스텀 문구를 무시하고 기본 확인창을 띄운다.
      event.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [shouldBlock]);

  // BrowserRouter 폴백 — navigator(push·replace·go)와 popstate(뒤로·앞으로)를 미저장 동안만 확인한다.
  useEffect(() => {
    if (routeBlockerActive || !enableRouteBlocker || !shouldBlock || !navigator) return undefined;
    const { push: originalPush, replace: originalReplace, go: originalGo } = navigator;
    let current = snapshotHistoryEntry();
    // 확인을 받은 navigator.go — 뒤따르는 popstate 는 라우터에 그대로 전달한다.
    let passNextPop = false;
    // 취소 후 원래 항목으로 되돌리는 history.go — 뒤따르는 popstate 는 라우터에 전달하지 않는다
    // (라우터는 이탈을 본 적이 없으므로 위치 갱신·재렌더가 필요 없다).
    let swallowNextPop = false;

    const confirmLeave = () => {
      if (releasedRef.current) return true;
      // eslint-disable-next-line no-alert
      return window.confirm(confirmMessage);
    };
    const changesPath = (to) => resolvePathname(navigator, to) !== window.location.pathname;
    const guarded = (original) => (...args) => {
      if (changesPath(args[0]) && !confirmLeave()) return undefined;
      const result = original.apply(navigator, args);
      current = snapshotHistoryEntry();
      return result;
    };

    navigator.push = guarded(originalPush);
    navigator.replace = guarded(originalReplace);
    navigator.go = (delta) => {
      if (!delta) return originalGo.call(navigator, delta);
      if (!confirmLeave()) return undefined;
      passNextPop = true;
      return originalGo.call(navigator, delta);
    };

    const onPopStateCapture = (event) => {
      if (swallowNextPop) {
        swallowNextPop = false;
        event.stopImmediatePropagation();
        current = snapshotHistoryEntry();
        return;
      }
      if (passNextPop) {
        passNextPop = false;
        current = snapshotHistoryEntry();
        return;
      }
      if (window.location.pathname === new URL(current.href).pathname || confirmLeave()) {
        current = snapshotHistoryEntry();
        return;
      }
      event.stopImmediatePropagation();
      const nextIdx = event.state?.idx;
      const delta = Number.isInteger(current.idx) && Number.isInteger(nextIdx) ? current.idx - nextIdx : 0;
      if (delta !== 0) {
        swallowNextPop = true;
        window.history.go(delta);
      } else {
        window.history.pushState(current.state, '', current.href);
      }
    };
    const removePopStateHandler = addUnsavedChangesPopStateHandler(onPopStateCapture);

    return () => {
      removePopStateHandler();
      navigator.push = originalPush;
      navigator.replace = originalReplace;
      navigator.go = originalGo;
    };
  }, [routeBlockerActive, enableRouteBlocker, shouldBlock, confirmMessage, navigator]);

  return { blocker, releaseGuard };
}

/** 현재 기록 항목 (라우터 인덱스 {@code idx}·state·주소). 취소 시 되돌릴 기준. */
function snapshotHistoryEntry() {
  const state = window.history.state;
  return { idx: state?.idx, state, href: window.location.href };
}

/** navigator 로 넘어온 대상(문자열·경로 객체)의 pathname. 해석 실패면 현재 경로(=확인 생략). */
function resolvePathname(navigator, to) {
  try {
    const href = typeof navigator.createHref === 'function' ? navigator.createHref(to) : String(to);
    return new URL(href, window.location.href).pathname;
  } catch {
    return window.location.pathname;
  }
}

export default useUnsavedChangesGuard;
