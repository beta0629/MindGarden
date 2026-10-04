/**
 * 미저장 가드용 {@code popstate} 관문 — 라우터보다 먼저 뒤로·앞으로 이동을 받는다.
 *
 * <p>같은 대상(window)의 리스너는 브라우저가 등록 순서대로 부른다(캡처 여부와 무관하게 동작하는 브라우저가
 * 있다). {@code BrowserRouter} 는 마운트 때 {@code popstate} 리스너를 등록하므로, 화면이 나중에 등록한
 * 리스너로는 라우터가 먼저 이전 화면을 렌더한다(입력 유실·재마운트). 그래서 앱 진입 시 관문 리스너
 * 하나를 라우터보다 먼저 등록해 두고, 미저장 가드는 이 관문에 처리기를 붙인다. 처리기가
 * {@code event.stopImmediatePropagation()} 을 부르면 라우터 리스너는 실행되지 않는다.</p>
 *
 * <p>앱 진입점({@code index.js})에서 {@code App} 보다 먼저 import 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

const handlers = new Set();
let installed = false;

function dispatchToHandlers(event) {
  for (const handler of Array.from(handlers)) {
    handler(event);
  }
}

/**
 * 관문 리스너를 한 번만 등록한다 (중복 호출 무해).
 */
export function installUnsavedChangesPopStateGate() {
  if (installed || typeof window === 'undefined') return;
  window.addEventListener('popstate', dispatchToHandlers, true);
  installed = true;
}

/**
 * 관문에 처리기를 붙인다. 관문이 아직 없으면 지금 등록한다(이 경우 라우터보다 늦을 수 있다).
 *
 * @param {(event: PopStateEvent) => void} handler popstate 처리기
 * @returns {() => void} 처리기 해제 함수
 */
export function addUnsavedChangesPopStateHandler(handler) {
  installUnsavedChangesPopStateGate();
  handlers.add(handler);
  return () => handlers.delete(handler);
}

installUnsavedChangesPopStateGate();
