import React, { useState } from 'react';
import notificationManager from '../../../utils/notification';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';

const LOCALE_OPTIONS = [
  { value: 'ko-KR', label: '한국어' },
  { value: 'en-US', label: 'English' }
];

const TZ_OPTIONS = [
  { value: 'Asia/Seoul', label: '서울 (Asia/Seoul)' },
  { value: 'UTC', label: 'UTC' }
];

const SettingsSection = () => {
  const [locale, setLocale] = useState('ko-KR');
  const [timezone, setTimezone] = useState('Asia/Seoul');
  const [notifyPush, setNotifyPush] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(false);

  const handleSave = () => {
    notificationManager.show('환경 설정 저장 API 연동 전입니다. 선택값은 이 기기에서만 유지됩니다.', 'info');
  };

  return (
    <>
      <article className="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-settings-general-title">
        <div className="mg-mypage__section-head">
          <span className="mg-mypage__section-accent" aria-hidden="true" />
          <div className="mg-mypage__section-head-text">
            <h2 id="mg-mypage-settings-general-title" className="mg-mypage__section-title">
              일반
            </h2>
          </div>
        </div>
        <div className="mg-mypage__card-body">
          <div className="mg-mypage__form-row">
            <label className="mg-mypage__form-label" htmlFor="mg-mypage-lang">
              언어
            </label>
            <select
              className="mg-mypage__form-control"
              id="mg-mypage-lang"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
            >
              {LOCALE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mg-mypage__form-row">
            <label className="mg-mypage__form-label" htmlFor="mg-mypage-tz">
              시간대
            </label>
            <select
              className="mg-mypage__form-control"
              id="mg-mypage-tz"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {TZ_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </article>

      <article className="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-settings-notify-title">
        <div className="mg-mypage__section-head">
          <span className="mg-mypage__section-accent" aria-hidden="true" />
          <div className="mg-mypage__section-head-text">
            <h2 id="mg-mypage-settings-notify-title" className="mg-mypage__section-title">
              알림
            </h2>
          </div>
        </div>
        <ul className="mg-mypage__list">
          <li className="mg-mypage__list-item mg-mypage__preference-row">
            <div className="mg-mypage__list-item-main">
              <p className="mg-mypage__preference-title">푸시 알림</p>
              <p className="mg-mypage__section-description">앱 푸시로 예약·메시지를 받습니다.</p>
            </div>
            <div className="mg-mypage__list-item-meta">
              <input
                type="checkbox"
                id="mg-mypage-notify-push"
                checked={notifyPush}
                onChange={(e) => setNotifyPush(e.target.checked)}
                role="switch"
                aria-checked={notifyPush}
              />
            </div>
          </li>
          <li className="mg-mypage__list-item mg-mypage__preference-row">
            <div className="mg-mypage__list-item-main">
              <p className="mg-mypage__preference-title">이메일 알림</p>
              <p className="mg-mypage__section-description">이메일로 요약을 받습니다.</p>
            </div>
            <div className="mg-mypage__list-item-meta">
              <input
                type="checkbox"
                id="mg-mypage-notify-email"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                role="switch"
                aria-checked={notifyEmail}
              />
            </div>
          </li>
        </ul>
        <div className="mg-v2-card-actions">
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleSave}
          >
            설정 저장
          </MGButton>
        </div>
      </article>
    </>
  );
};

export default SettingsSection;
