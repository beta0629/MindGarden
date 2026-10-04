import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * 미저장 변경이 있을 때 이탈을 막는 공통 가드.
 *
 * <ul>
 *   <li>SPA 라우트 이동 — react-router v7 {@code useBlocker} (v6.4+ data router 전용 API)</li>
 *   <li>새로고침·탭 닫기 — {@code beforeunload} (브라우저 기본 확인창)</li>
 * </ul>
 *
 * <p>라우터 컨텍스트 밖(단위 테스트 등)에서는 {@code useBlocker} 가 예외를 던질 수 있어
 * {@code enableRouteBlocker} 로 끌 수 있다.</p>
 *
 * @param {object} params
 * @param {boolean} params.when 미저장 변경 여부
 * @param {boolean} [params.enableRouteBlocker] 라우트 차단 사용 여부 (기본 true)
 * @returns {{ blocker: object|null }} 라우트 차단 상태(차단 중이면 proceed/reset 보유)
 * @author CoreSolution
 * @since 2026-10-04
 */
export function useUnsavedChangesGuard({ when, enableRouteBlocker = true }) {
  const shouldBlock = Boolean(when);

  let blocker = null;
  if (enableRouteBlocker) {
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

  return { blocker };
}

export default useUnsavedChangesGuard;
