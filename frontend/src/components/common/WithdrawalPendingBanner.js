/**
 * 전역 자발 회원 탈퇴 진행 중 배너.
 *
 * USER_LIFECYCLE_TERMINATION_POLICY v1.1 — 사용자 결정 §G Q3 채택:
 *  - 마운트 위치: 전역 (라우터 안, 모든 라우트 공통).
 *  - 노출 조건: 로그인된 사용자 + lifecycle_state === 'WITHDRAWAL_PENDING'.
 *  - 비노출 조건:
 *      · 비로그인 (sessionUser 없음 → status API 미호출, 자연 비노출)
 *      · 로그인 페이지 등 공개 라우트는 sessionUser 가 null 이므로 자동 차단
 *  - 표시 정책: 단순 D-{n}일 메시지 + 마이페이지 보안 탭 이동 링크.
 *
 * 본 배너는 SessionContext 의 user 가 존재할 때만 1회 status API 를 호출하여
 * 정확한 lifecycle_state / withdrawalExpiresAt 를 동기화한다. 라우트 변경마다 다시
 * 호출하지 않으며, 위젯·모달에서 상태가 바뀐 경우(취소/익명화) 페이지 새로고침 시
 * 자연 갱신된다.
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '../../contexts/SessionContext';
import mypageApi from '../../utils/mypageApi';
import SafeText from './SafeText';
import { computeDaysRemaining } from '../mypage/components/WithdrawalPendingWidget';

const LIFECYCLE_PENDING = 'WITHDRAWAL_PENDING';

const WithdrawalPendingBanner = ({ nowProvider }) => {
  const { t } = useTranslation('mypage');
  const sessionContext = useSession();
  const sessionUser = sessionContext && sessionContext.user;
  const [status, setStatus] = useState(null);

  const loadStatus = useCallback(async () => {
    if (!sessionUser || !sessionUser.id) {
      setStatus(null);
      return;
    }
    try {
      const response = await mypageApi.getWithdrawalStatus();
      // StandardizedApi 의 응답이 envelope 또는 평면일 수 있어 안전 추출
      const payload =
        response && typeof response === 'object' && response.data && typeof response.data === 'object'
          ? response.data
          : response;
      setStatus(payload || null);
    } catch (error) {
      // status 실패는 사일런트 — 배너는 비노출. 운영 노이즈 차단.
      setStatus(null);
    }
  }, [sessionUser]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  if (!sessionUser || !sessionUser.id) {
    return null;
  }
  if (!status) {
    return null;
  }
  if (status.lifecycleState !== LIFECYCLE_PENDING) {
    return null;
  }

  const days = computeDaysRemaining(status.withdrawalExpiresAt, nowProvider);

  return (
    <div
      className="mg-withdrawal-pending-banner mg-v2-status-badge mg-v2-badge--danger"
      role="status"
      aria-label={t('withdrawal.banner.ariaLabel')}
      data-testid="withdrawal-pending-banner"
    >
      <span className="mg-withdrawal-pending-banner__message">
        <SafeText>
          {t('withdrawal.banner.message', { days: days === null ? '-' : days })}
        </SafeText>
      </span>
      <Link
        to="/mypage?tab=security"
        className="mg-withdrawal-pending-banner__link"
        data-testid="withdrawal-pending-banner-link"
      >
        {t('withdrawal.banner.cancelLink')}
      </Link>
    </div>
  );
};

export default WithdrawalPendingBanner;
