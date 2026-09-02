import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import notificationManager from '../../../utils/notification';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';

const parseUaSummary = () => {
  if (typeof navigator === 'undefined') return '이 브라우저';
  const ua = navigator.userAgent || '';
  let browser = '브라우저';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  let os = '';
  if (ua.includes('Mac OS')) os = 'Mac';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  return os ? `${os} · ${browser}` : browser;
};

const SecuritySection = ({
  onPasswordChange,
  onPasswordReset,
  onRequestLogoutOtherDevices,
  onRequestWithdrawal,
  isWithdrawalPending
}) => {
  const { t } = useTranslation('mypage');
  const deviceLabel = useMemo(() => parseUaSummary(), []);

  return (
    <>
      <article className="mg-mypage-clinic-os__section" aria-labelledby="mg-mypage-security-pw-title">
        <div className="mg-mypage-clinic-os__section-head">
          <div className="mg-mypage-clinic-os__section-head-text">
            <h2 id="mg-mypage-security-pw-title" className="mg-mypage-clinic-os__section-title">
              비밀번호
            </h2>
          </div>
        </div>
        <div className="mg-mypage-clinic-os__section-body">
          <p className="mg-mypage-clinic-os__section-description">
            비밀번호는 목록에 표시되지 않습니다. 변경 시 확인이 필요합니다.
          </p>
          <div className="mg-mypage-clinic-os__action-row">
            <MGButton
              type="button"
              variant="primary"
              size="medium"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={onPasswordChange}
            >
              비밀번호 변경
            </MGButton>
            <MGButton
              type="button"
              variant="ghost"
              size="medium"
              className={buildErpMgButtonClassName({ variant: 'ghost', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={onPasswordReset}
              preventDoubleClick={false}
            >
              비밀번호 찾기
            </MGButton>
          </div>
        </div>
      </article>

      <article className="mg-mypage-clinic-os__section" aria-labelledby="mg-mypage-security-2fa-title">
        <div className="mg-mypage-clinic-os__section-head">
          <div className="mg-mypage-clinic-os__section-head-text">
            <h2 id="mg-mypage-security-2fa-title" className="mg-mypage-clinic-os__section-title">
              2단계 인증
            </h2>
          </div>
        </div>
        <div className="mg-mypage-clinic-os__section-body">
          <div className="mg-mypage-clinic-os__action-row">
            <span className="mg-v2-status-badge mg-v2-badge--neutral" role="status">
              미사용
            </span>
            <MGButton
              type="button"
              variant="ghost"
              size="medium"
              className={buildErpMgButtonClassName({ variant: 'ghost', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => notificationManager.show('2단계 인증은 준비 중입니다.', 'info')}
              preventDoubleClick={false}
            >
              설정
            </MGButton>
          </div>
        </div>
      </article>

      <article className="mg-mypage-clinic-os__section" aria-labelledby="mg-mypage-security-sessions-title">
        <div className="mg-mypage-clinic-os__section-head">
          <div className="mg-mypage-clinic-os__section-head-text">
            <h2 id="mg-mypage-security-sessions-title" className="mg-mypage-clinic-os__section-title">
              로그인된 기기
            </h2>
          </div>
        </div>
        <ul className="mg-mypage-clinic-os__list">
          <li className="mg-mypage-clinic-os__list-item">
            <div className="mg-mypage-clinic-os__list-item-main">
              <p className="mg-mypage-clinic-os__item-title">{deviceLabel}</p>
              <p className="mg-mypage-clinic-os__section-description">현재 세션 · 이 브라우저</p>
            </div>
            <div className="mg-mypage-clinic-os__list-item-meta">
              <span className="mg-v2-status-badge mg-v2-badge--success" role="status">
                이 기기
              </span>
            </div>
          </li>
        </ul>
        <div className="mg-mypage-clinic-os__card-actions">
          <MGButton
            type="button"
            variant="ghost"
            size="medium"
            className={buildErpMgButtonClassName({ variant: 'ghost', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onRequestLogoutOtherDevices}
          >
            다른 기기 모두 로그아웃
          </MGButton>
        </div>
      </article>

      <article
        className="mg-mypage-clinic-os__section"
        aria-labelledby="mg-mypage-security-account-title"
        data-testid="mypage-security-account-section"
      >
        <div className="mg-mypage-clinic-os__section-head">
          <div className="mg-mypage-clinic-os__section-head-text">
            <h2 id="mg-mypage-security-account-title" className="mg-mypage-clinic-os__section-title">
              {t('withdrawal.sectionTitle')}
            </h2>
          </div>
        </div>
        <div className="mg-mypage-clinic-os__section-body">
          <p className="mg-mypage-clinic-os__section-description">
            {t('withdrawal.sectionDescription')}
          </p>
          <div className="mg-mypage-clinic-os__action-row">
            <MGButton
              type="button"
              variant="danger"
              size="medium"
              className={buildErpMgButtonClassName({
                variant: 'danger',
                size: 'md',
                loading: false
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={onRequestWithdrawal || (() =>
                notificationManager.show('회원 탈퇴 신청 기능을 사용할 수 없습니다.', 'info')
              )}
              disabled={isWithdrawalPending}
              data-testid="mypage-security-withdrawal-button"
            >
              {t('withdrawal.openModalButton')}
            </MGButton>
          </div>
        </div>
      </article>
    </>
  );
};

export default SecuritySection;
