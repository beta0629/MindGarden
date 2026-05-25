import React, { useState } from 'react';
import notificationManager from '../../../utils/notification';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { useTranslation } from 'react-i18next';

const SettingsSection = () => {
  const { t } = useTranslation(['settings', 'common']);
  const LOCALE_OPTIONS = [
    { value: 'ko-KR', label: t('settings:language.ko') },
    { value: 'en-US', label: t('settings:language.en', 'English') }
  ];

  const TZ_OPTIONS = [
    { value: 'Asia/Seoul', label: t('settings:timezone.seoul') },
    { value: 'UTC', label: t('settings:timezone.utc', 'UTC') }
  ];
  const [locale, setLocale] = useState('ko-KR');
  const [timezone, setTimezone] = useState('Asia/Seoul');
  const [notifyPush, setNotifyPush] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(false);

  const handleSave = () => {
    notificationManager.show(t('settings:status.mypageSaveInfo'), 'info');
  };

  return (
    <>
      <article className="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-settings-general-title">
        <div className="mg-mypage__section-head">
          <span className="mg-mypage__section-accent" aria-hidden="true" />
          <div className="mg-mypage__section-head-text">
            <h2 id="mg-mypage-settings-general-title" className="mg-mypage__section-title">
              {t('settings:general.title')}
            </h2>
          </div>
        </div>
        <div className="mg-mypage__card-body">
          <div className="mg-mypage__form-row">
            <label className="mg-mypage__form-label" htmlFor="mg-mypage-lang">
              {t('settings:general.language')}
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
              {t('settings:general.timezone')}
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
              {t('common.labels.notification')}
            </h2>
          </div>
        </div>
        <ul className="mg-mypage__list">
          <li className="mg-mypage__list-item mg-mypage__preference-row">
            <div className="mg-mypage__list-item-main">
              <p className="mg-mypage__preference-title">{t('settings:notification.push.label')}</p>
              <p className="mg-mypage__section-description">{t('settings:notification.push.descriptionApp')}</p>
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
              <p className="mg-mypage__preference-title">{t('settings:notification.email.label')}</p>
              <p className="mg-mypage__section-description">{t('settings:notification.emailSummary.description')}</p>
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
            {t('settings:action.save')}
          </MGButton>
        </div>
      </article>
    </>
  );
};

export default SettingsSection;
