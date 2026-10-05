/**
 * 사용자 입력이 없어도 세션 활동으로 취급할 때 쓰는 공용 알림.
 *
 * SessionContext 의 활동 ping(공유 45초 스로틀 → silent checkSession, 401 은 공용 처리)과 같은 경로를 탄다.
 * 장시간 진행 조회(수동 발송 작업 등) 화면이 폴링마다 호출한다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */

import { SESSION_ACTIVITY_PROGRAMMATIC_EVENT } from '../constants/session';

/**
 * 세션 활동 이벤트를 window 에 보낸다.
 */
export const notifySessionActivity = () => {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }
  window.dispatchEvent(new Event(SESSION_ACTIVITY_PROGRAMMATIC_EVENT));
};

export default notifySessionActivity;
