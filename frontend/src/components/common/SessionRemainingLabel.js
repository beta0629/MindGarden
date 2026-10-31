/**
 * 로그인 후 세션 잔여 시간 보조 텍스트 (UnifiedHeader·ProfileDropdown GNB·마이페이지용).
 * 서버 session-info(`isAuthenticated=true` + 타이밍 필드)만 사용한다.
 * 미인증·타이밍 없음이면 storage 절대 폴백(로그인 시각 + 4h)으로 가짜 잔여를 그리지 않고 숨긴다.
 * JWT·쿠키 원문 미표시. 표시 경계: SafeText / toDisplayString.
 *
 * @author CoreSolution
 * @since 2026-08-05
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SafeText from './SafeText';
import { useSession } from '../../contexts/SessionContext';
import { SESSION_REMAINING_DISPLAY, isSessionPublicPath } from '../../constants/session';
import { sessionManager } from '../../utils/sessionManager';
import {
  buildSessionRemainingLabel,
  computeSessionExpiryState,
  pickFresherSessionInfo
} from '../../utils/sessionExpiryDisplay';

/**
 * @param {object} props
 * @param {string} [props.className]
 * @param {boolean} [props.show=true]
 */
const SessionRemainingLabel = ({ className, show = true }) => {
  const { pathname } = useLocation();
  const { user, sessionInfo } = useSession();
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!show || !user || isSessionPublicPath(pathname)) {
      setLabel('');
      return undefined;
    }

    const tick = () => {
      // Context가 stale여도 silent ping이 sessionManager만 갱신한 경우 GNB 잔여가 올라가도록 최신 스냅샷 사용
      const effectiveInfo = pickFresherSessionInfo(
        sessionInfo,
        sessionManager.getSessionInfo()
      );
      if (!effectiveInfo || effectiveInfo.isAuthenticated !== true) {
        setLabel('');
        return;
      }
      const { remainingMs } = computeSessionExpiryState(effectiveInfo, Date.now(), {
        allowFallback: false
      });
      if (remainingMs == null) {
        setLabel('');
        return;
      }
      setLabel(buildSessionRemainingLabel(remainingMs));
    };

    tick();
    const id = setInterval(tick, SESSION_REMAINING_DISPLAY.TICK_MS);
    return () => {
      clearInterval(id);
    };
  }, [show, user, sessionInfo, pathname]);

  if (!label) {
    return null;
  }

  const classes = [SESSION_REMAINING_DISPLAY.CLASS_NAME, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={SESSION_REMAINING_DISPLAY.ARIA_LABEL}
    >
      <SafeText fallback="">{label}</SafeText>
    </span>
  );
};

export default SessionRemainingLabel;
