/**
 * 자발 회원 탈퇴 유예 기간 위젯 (마이페이지 최상단).
 *
 * USER_LIFECYCLE_TERMINATION_POLICY v1.1 Q3 — 30일 유예.
 * lifecycle_state === 'WITHDRAWAL_PENDING' 일 때만 노출되며, 남은 일수 카운트 +
 * 만료 예정 일시 + 탈퇴 취소 버튼을 제공한다.
 *
 * 디자이너 §C.2 — 강조 카드 (`mg-v2-ad-b0kla__card`) 스타일.
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT
} from '../../erp/common/erpMgButtonProps';
import mypageApi from '../../../utils/mypageApi';
import notificationManager from '../../../utils/notification';

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

const computeDaysRemaining = (expiresAt, nowProvider) => {
  if (!expiresAt) {
    return null;
  }
  const expires = new Date(expiresAt).getTime();
  if (Number.isNaN(expires)) {
    return null;
  }
  const now = (nowProvider ? nowProvider() : new Date()).getTime();
  const diff = expires - now;
  if (diff <= 0) {
    return 0;
  }
  return Math.ceil(diff / MILLIS_PER_DAY);
};

const formatExpiresAt = (expiresAt) => {
  if (!expiresAt) {
    return '';
  }
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const WithdrawalPendingWidget = ({
  withdrawalExpiresAt,
  withdrawalRequestedAt,
  onCancelled,
  nowProvider
}) => {
  const { t } = useTranslation('mypage');
  const [cancelling, setCancelling] = useState(false);

  const daysRemaining = useMemo(
    () => computeDaysRemaining(withdrawalExpiresAt, nowProvider),
    [withdrawalExpiresAt, nowProvider]
  );

  const formattedExpiresAt = useMemo(
    () => formatExpiresAt(withdrawalExpiresAt),
    [withdrawalExpiresAt]
  );

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    try {
      const response = await mypageApi.cancelWithdrawal();
      notificationManager.show(t('withdrawal.pending.cancelSuccess'), 'success');
      if (onCancelled) {
        onCancelled(response);
      }
    } catch (error) {
      const message =
        (error && (error.message || error.error)) ||
        t('withdrawal.pending.cancelFailure');
      notificationManager.show(message, 'error');
    } finally {
      setCancelling(false);
    }
  }, [onCancelled, t]);

  return (
    <article
      className="mg-v2-ad-b0kla__card mg-mypage__card mg-mypage-withdrawal-widget"
      data-testid="mypage-withdrawal-pending-widget"
      aria-labelledby="mypage-withdrawal-widget-title"
    >
      <div className="mg-mypage__section-head">
        <span className="mg-mypage__section-accent" aria-hidden="true" />
        <div className="mg-mypage__section-head-text">
          <h2
            id="mypage-withdrawal-widget-title"
            className="mg-mypage__section-title"
          >
            {t('withdrawal.pending.widgetTitle')}
          </h2>
          <p className="mg-mypage__section-description">
            {t('withdrawal.pending.widgetSubtitle')}
          </p>
        </div>
      </div>
      <div className="mg-mypage__card-body">
        <dl className="mg-mypage-withdrawal-widget__meta">
          <div className="mg-mypage-withdrawal-widget__meta-row">
            <dt>{t('withdrawal.pending.daysRemainingLabel')}</dt>
            <dd>
              <span
                className="mg-v2-status-badge mg-v2-badge--danger"
                role="status"
                data-testid="mypage-withdrawal-days-remaining"
              >
                {daysRemaining === null
                  ? '—'
                  : t('withdrawal.pending.daysRemainingValue', { days: daysRemaining })}
              </span>
            </dd>
          </div>
          <div className="mg-mypage-withdrawal-widget__meta-row">
            <dt>{t('withdrawal.pending.expiresAtLabel')}</dt>
            <dd data-testid="mypage-withdrawal-expires-at">
              <SafeText>{formattedExpiresAt || '—'}</SafeText>
            </dd>
          </div>
          {withdrawalRequestedAt ? (
            <div
              className="mg-mypage-withdrawal-widget__meta-row mg-mypage-withdrawal-widget__meta-row--muted"
              data-testid="mypage-withdrawal-requested-at"
            >
              <dt>신청일시</dt>
              <dd>
                <SafeText>{formatExpiresAt(withdrawalRequestedAt)}</SafeText>
              </dd>
            </div>
          ) : null}
        </dl>
        <div className="mg-v2-card-actions">
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'md',
              loading: cancelling
            })}
            loading={cancelling}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleCancel}
            disabled={cancelling}
            data-testid="mypage-withdrawal-cancel-button"
          >
            {t('withdrawal.pending.cancelWithdrawalButton')}
          </MGButton>
        </div>
      </div>
    </article>
  );
};

export default WithdrawalPendingWidget;
export { computeDaysRemaining };
