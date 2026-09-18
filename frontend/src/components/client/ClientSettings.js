/**
 * 내담자 설정 — suite: account / notification groups (single column)
 * Header-right entry only · not a CLIENT_WEB_NAV tab · no B0KlA
 *
 * @author CoreSolution
 * @since 2026-09-18
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../../contexts/SessionContext';
import StandardizedApi from '../../utils/standardizedApi';
import notificationManager from '../../utils/notification';
import { toDisplayString } from '../../utils/safeDisplay';
import SafeText from '../common/SafeText';
import UnifiedLoading from '../common/UnifiedLoading';
import ClientWebPageShell from './ClientWebPageShell';
import {
  CLIENT_WEB_SUITE_COPY,
  CLIENT_WEB_SUITE_TEST_IDS
} from '../../constants/clientWebSuiteConstants';
import './ClientSettings.css';

const CLIENT_SETTINGS_TITLE_ID = 'client-settings-page-title';

const ClientSettings = () => {
  const { t } = useTranslation(['settings']);
  const { user } = useSession();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    smsNotifications: false
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadSettings = async() => {
    try {
      const response = await StandardizedApi.get(`/api/clients/${user.id}/settings`);
      if (response.success && response.data) {
        setSettings((prev) => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error(t('settings:status.loadFail'), error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async(key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      const response = await StandardizedApi.post(`/api/clients/${user.id}/settings`, newSettings);
      if (response.success) {
        setSettings(newSettings);
        setMessage(t('settings:status.saveSuccess'));
        setTimeout(() => setMessage(null), 3000);
      } else {
        notificationManager.error(
          t('settings:status.saveFail'),
          response.message || t('settings:status.cannotSave')
        );
      }
    } catch (error) {
      console.error(t('settings:status.saveFail'), error);
      notificationManager.error(t('common.status.error'), t('settings:status.saveError'));
    }
  };

  const accountRows = [
    {
      id: 'name',
      label: CLIENT_WEB_SUITE_COPY.SETTINGS_ACCOUNT_NAME,
      value: toDisplayString(user?.name, '—')
    },
    {
      id: 'email',
      label: CLIENT_WEB_SUITE_COPY.SETTINGS_ACCOUNT_EMAIL,
      value: toDisplayString(user?.email, '—')
    },
    {
      id: 'mobile',
      label: CLIENT_WEB_SUITE_COPY.SETTINGS_ACCOUNT_MOBILE,
      value: toDisplayString(user?.phone || user?.mobile, '—')
    },
    {
      id: 'password',
      label: CLIENT_WEB_SUITE_COPY.SETTINGS_ACCOUNT_PASSWORD,
      value: CLIENT_WEB_SUITE_COPY.SETTINGS_ACCOUNT_PASSWORD_MASK
    }
  ];

  const notifyRows = [
    {
      id: 'notifications',
      label: t('settings:notification.all.label'),
      description: t('settings:notification.all.description'),
      checked: Boolean(settings.notifications)
    },
    {
      id: 'emailNotifications',
      label: t('settings:notification.email.label'),
      description: t('settings:notification.email.descriptionShort'),
      checked: Boolean(settings.emailNotifications)
    },
    {
      id: 'smsNotifications',
      label: t('settings:notification.sms.label'),
      description: t('settings:notification.sms.descriptionShort'),
      checked: Boolean(settings.smsNotifications)
    }
  ];

  const mainSlot = loading ? (
    <div aria-busy="true" aria-live="polite">
      <UnifiedLoading type="inline" text={t('common.status.loading')} />
    </div>
  ) : (
    <>
      {message ? (
        <p className="client-settings-suite__message" role="status">
          <SafeText>{message}</SafeText>
        </p>
      ) : null}

      <section className="client-web-page-shell__card client-settings-suite__group">
        <h2 className="client-settings-suite__group-title">
          {CLIENT_WEB_SUITE_COPY.SETTINGS_ACCOUNT_GROUP}
        </h2>
        <ul className="client-settings-suite__rows">
          {accountRows.map((row) => (
            <li key={row.id} className="client-settings-suite__row">
              <span className="client-settings-suite__label">{row.label}</span>
              <span className="client-settings-suite__value">
                <SafeText>{row.value}</SafeText>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="client-web-page-shell__card client-settings-suite__group">
        <h2 className="client-settings-suite__group-title">
          {CLIENT_WEB_SUITE_COPY.SETTINGS_NOTIFY_GROUP}
        </h2>
        <ul className="client-settings-suite__rows">
          {notifyRows.map((row) => (
            <li key={row.id} className="client-settings-suite__row client-settings-suite__row--toggle">
              <div className="client-settings-suite__toggle-copy">
                <span className="client-settings-suite__label">{row.label}</span>
                <span className="client-settings-suite__desc">{row.description}</span>
              </div>
              <input
                className="client-settings-suite__switch"
                type="checkbox"
                checked={row.checked}
                onChange={(e) => handleSettingChange(row.id, e.target.checked)}
                aria-label={row.label}
              />
            </li>
          ))}
        </ul>
      </section>
    </>
  );

  return (
    <ClientWebPageShell
      title={CLIENT_WEB_SUITE_COPY.SETTINGS_TITLE}
      titleId={CLIENT_SETTINGS_TITLE_ID}
      testId={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PAGE}
      main={mainSlot}
    />
  );
};

export default ClientSettings;
