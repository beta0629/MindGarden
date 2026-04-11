import React, { useMemo } from 'react';
import notificationManager from '../../../utils/notification';
import MGButton from '../../common/MGButton';

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

const SecuritySection = ({ onPasswordChange, onPasswordReset, onRequestLogoutOtherDevices }) => {
  const deviceLabel = useMemo(() => parseUaSummary(), []);

  return (
    <>
      <article className="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-security-pw-title">
        <div className="mg-mypage__section-head">
          <span className="mg-mypage__section-accent" aria-hidden="true" />
          <div className="mg-mypage__section-head-text">
            <h2 id="mg-mypage-security-pw-title" className="mg-mypage__section-title">
              비밀번호
            </h2>
          </div>
        </div>
        <div className="mg-mypage__card-body">
          <p className="mg-mypage__section-description">
            비밀번호는 목록에 표시되지 않습니다. 변경 시 확인이 필요합니다.
          </p>
          <div className="mg-mypage__readonly-row">
            <MGButton
              type="button"
              className="mg-v2-button mg-v2-button--primary"
              onClick={onPasswordChange}
              variant="primary"
            >
              비밀번호 변경
            </MGButton>
            <MGButton
              type="button"
              className="mg-v2-button mg-v2-button--outline"
              onClick={onPasswordReset}
              variant="outline"
              preventDoubleClick={false}
            >
              비밀번호 찾기
            </MGButton>
          </div>
        </div>
      </article>

      <article className="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-security-2fa-title">
        <div className="mg-mypage__section-head">
          <span className="mg-mypage__section-accent" aria-hidden="true" />
          <div className="mg-mypage__section-head-text">
            <h2 id="mg-mypage-security-2fa-title" className="mg-mypage__section-title">
              2단계 인증
            </h2>
          </div>
        </div>
        <div className="mg-mypage__card-body">
          <div className="mg-mypage__readonly-row">
            <span className="mg-v2-status-badge mg-v2-badge--neutral" role="status">
              미사용
            </span>
            <MGButton
              type="button"
              className="mg-v2-button mg-v2-button--outline"
              onClick={() => notificationManager.show('2단계 인증은 준비 중입니다.', 'info')}
              variant="outline"
              preventDoubleClick={false}
            >
              설정
            </MGButton>
          </div>
        </div>
      </article>

      <article className="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-security-sessions-title">
        <div className="mg-mypage__section-head">
          <span className="mg-mypage__section-accent" aria-hidden="true" />
          <div className="mg-mypage__section-head-text">
            <h2 id="mg-mypage-security-sessions-title" className="mg-mypage__section-title">
              로그인된 기기
            </h2>
          </div>
        </div>
        <ul className="mg-mypage__list">
          <li className="mg-mypage__list-item">
            <div className="mg-mypage__list-item-main">
              <p className="mg-mypage__device-name">{deviceLabel}</p>
              <p className="mg-mypage__section-description">현재 세션 · 이 브라우저</p>
            </div>
            <div className="mg-mypage__list-item-meta">
              <span className="mg-v2-status-badge mg-v2-badge--success" role="status">
                이 기기
              </span>
            </div>
          </li>
        </ul>
        <div className="mg-v2-card-actions">
          <MGButton
            type="button"
            className="mg-v2-button mg-v2-button--danger mg-v2-button--outline"
            onClick={onRequestLogoutOtherDevices}
            variant="danger"
          >
            다른 기기 모두 로그아웃
          </MGButton>
        </div>
      </article>
    </>
  );
};

export default SecuritySection;
