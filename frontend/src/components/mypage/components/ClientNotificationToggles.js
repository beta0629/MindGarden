/**
 * 내담자 알림 토글 행 — 「알림 받는 방법」 섹션 아래 (구 /client/settings 알림 그룹 이동, Q2)
 * 조회·저장은 CLIENT_SETTINGS_API 그대로 (GET 1회, 토글마다 PUT { notifications }).
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CLIENT_SETTINGS_API } from '../../../constants/api';
import { CLIENT_WEB_SUITE_COPY } from '../../../constants/clientWebSuiteConstants';
import { MYPAGE_CLIENT_NOTIFY_COPY } from '../../../constants/mypageRoleLayout';
import StandardizedApi from '../../../utils/standardizedApi';
import notificationManager from '../../../utils/notification';

const DEFAULT_NOTIFY = Object.freeze({
  email: true,
  sms: false,
  push: true
});

/**
 * @param {object|null|undefined} payload
 * @returns {{ email: boolean, sms: boolean, push: boolean }}
 */
export const mapClientNotifyFromApi = (payload) => {
  const nested = payload?.notifications;
  if (nested && typeof nested === 'object') {
    return {
      email: nested.email !== false,
      sms: Boolean(nested.sms),
      push: nested.push !== false
    };
  }
  return { ...DEFAULT_NOTIFY };
};

/**
 * @param {{ email: boolean, sms: boolean, push: boolean }} notify
 * @returns {{ notifications: { email: boolean, sms: boolean, push: boolean } }}
 */
export const buildClientNotifyPutBody = (notify) => ({
  notifications: {
    email: Boolean(notify.email),
    sms: Boolean(notify.sms),
    push: Boolean(notify.push)
  }
});

const ClientNotificationToggles = () => {
  const { t } = useTranslation(['settings']);
  const [notify, setNotify] = useState({ ...DEFAULT_NOTIFY });
  const [savingKey, setSavingKey] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async() => {
      try {
        const response = await StandardizedApi.get(CLIENT_SETTINGS_API.GET);
        if (!cancelled && response) {
          setNotify(mapClientNotifyFromApi(response));
        }
      } catch (error) {
        console.error(CLIENT_WEB_SUITE_COPY.SETTINGS_LOAD_ERROR, error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNotifyChange = useCallback(async(key, value) => {
    const next = { ...notify, [key]: value };
    setSavingKey(key);
    try {
      await StandardizedApi.put(CLIENT_SETTINGS_API.UPDATE, buildClientNotifyPutBody(next));
      setNotify(next);
      notificationManager.show(CLIENT_WEB_SUITE_COPY.SETTINGS_NOTIFY_SAVE_SUCCESS, 'success');
    } catch (error) {
      console.error(CLIENT_WEB_SUITE_COPY.SETTINGS_NOTIFY_SAVE_ERROR, error);
      notificationManager.show(CLIENT_WEB_SUITE_COPY.SETTINGS_NOTIFY_SAVE_ERROR, 'error');
    } finally {
      setSavingKey('');
    }
  }, [notify]);

  const rows = [
    {
      id: 'push',
      label: t('settings:notification.all.label'),
      description: t('settings:notification.all.description')
    },
    {
      id: 'email',
      label: t('settings:notification.email.label'),
      description: t('settings:notification.email.descriptionShort')
    },
    {
      id: 'sms',
      label: t('settings:notification.sms.label'),
      description: t('settings:notification.sms.descriptionShort')
    }
  ];

  return (
    <ul
      className="mg-mypage-toggles"
      aria-label={MYPAGE_CLIENT_NOTIFY_COPY.GROUP_LABEL}
      data-testid="mypage-client-notify-toggles"
    >
      {rows.map((row) => {
        const inputId = `mg-mypage-client-notify-${row.id}`;
        return (
          <li key={row.id} className="mg-mypage-toggles__row">
            <label className="mg-mypage-toggles__copy" htmlFor={inputId}>
              <span className="mg-mypage-toggles__label">{row.label}</span>
              <span className="mg-mypage-toggles__desc">{row.description}</span>
            </label>
            <input
              id={inputId}
              className="mg-mypage-switch"
              type="checkbox"
              role="switch"
              checked={Boolean(notify[row.id])}
              aria-checked={Boolean(notify[row.id])}
              disabled={savingKey === row.id}
              onChange={(e) => handleNotifyChange(row.id, e.target.checked)}
              data-testid={`mypage-client-notify-${row.id}`}
            />
          </li>
        );
      })}
    </ul>
  );
};

export default ClientNotificationToggles;
