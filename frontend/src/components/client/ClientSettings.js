/**
 * 내담자 설정 — suite: editable profile (name/email/phone) + phone OTP verify + notification toggles
 * Header-right entry only · not a CLIENT_WEB_NAV tab · no B0KlA
 * PortOne checkout gate requires isPhoneVerified after OTP (PUT alone ≠ verified).
 *
 * @author CoreSolution
 * @since 2026-09-18
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '../../contexts/SessionContext';
import { useStableUserId } from '../../hooks/useStableUserId';
import { useUserIdScopedLoad } from '../../hooks/useUserIdScopedLoad';
import { useSoftResourceLoad } from '../../hooks/useSoftResourceLoad';
import { API_STATUS, CLIENT_SETTINGS_API, MYPAGE_API } from '../../constants/api';
import {
  CLIENT_WEB_SUITE_COPY,
  CLIENT_WEB_SUITE_TEST_IDS
} from '../../constants/clientWebSuiteConstants';
import StandardizedApi from '../../utils/standardizedApi';
import sessionManager from '../../utils/sessionManager';
import notificationManager from '../../utils/notification';
import {
  isValidKoreanMobileDigits,
  normalizeKoreanMobileDigits
} from '../../utils/koreanMobilePhone';
import { toDisplayString } from '../../utils/safeDisplay';
import { redirectToLoginPageOnce } from '../../utils/sessionRedirect';
import SafeText from '../common/SafeText';
import UnifiedLoading from '../common/UnifiedLoading';
import EmailChangeModal from '../mypage/components/EmailChangeModal';
import PhoneChangeModal from '../mypage/components/PhoneChangeModal';
import ClientWebPageShell from './ClientWebPageShell';
import './ClientSettings.css';

const CLIENT_SETTINGS_TITLE_ID = 'client-settings-page-title';
const PROFILE_FORM_ID = 'client-settings-profile-form';

const DEFAULT_NOTIFY = Object.freeze({
  email: true,
  sms: false,
  push: true
});

/**
 * @param {unknown} err
 * @returns {boolean}
 */
const isAuthFailure = (err) => {
  if (err == null || typeof err !== 'object') {
    return false;
  }
  const status = err.status;
  if (typeof status !== 'number') {
    return false;
  }
  if (status >= API_STATUS.INTERNAL_SERVER_ERROR) {
    return false;
  }
  return status === API_STATUS.UNAUTHORIZED || status === API_STATUS.FORBIDDEN;
};

/**
 * @param {object|null|undefined} source
 * @returns {boolean}
 */
const readPhoneVerifiedFlag = (source) => {
  if (!source || typeof source !== 'object') {
    return false;
  }
  return source.isPhoneVerified === true || source.phoneVerified === true;
};

/**
 * @param {object|null|undefined} payload
 * @returns {{ email: boolean, sms: boolean, push: boolean }}
 */
const mapNotifyFromApi = (payload) => {
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
const buildNotifyPutBody = (notify) => ({
  notifications: {
    email: Boolean(notify.email),
    sms: Boolean(notify.sms),
    push: Boolean(notify.push)
  }
});

const ClientSettings = () => {
  const { t } = useTranslation(['settings']);
  const navigate = useNavigate();
  const {
    user,
    checkSession,
    isLoggedIn,
    hasCheckedSession
  } = useSession();
  const { userId, userRef } = useStableUserId(user);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifiedPhoneDigits, setVerifiedPhoneDigits] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [message, setMessage] = useState(null);
  const [notify, setNotify] = useState({ ...DEFAULT_NOTIFY });
  const [isEmailChangeOpen, setIsEmailChangeOpen] = useState(false);
  const [isPhoneChangeOpen, setIsPhoneChangeOpen] = useState(false);

  const applyProfileFields = useCallback((profile, sessionUser) => {
    const nextName = toDisplayString(
      profile?.name ?? sessionUser?.name ?? sessionUser?.nickname,
      ''
    );
    const nextEmail = toDisplayString(
      profile?.email ?? sessionUser?.email ?? sessionUser?.userEmail,
      ''
    );
    const nextPhone = toDisplayString(
      profile?.phone ?? sessionUser?.phone ?? sessionUser?.phoneNumber,
      ''
    );
    const verified = readPhoneVerifiedFlag(profile) || readPhoneVerifiedFlag(sessionUser);
    const digits = nextPhone ? normalizeKoreanMobileDigits(nextPhone) : null;
    setFullName(nextName);
    setEmail(nextEmail);
    setPhone(nextPhone);
    setIsPhoneVerified(verified);
    setVerifiedPhoneDigits(verified && digits && isValidKoreanMobileDigits(digits) ? digits : null);
  }, []);

  /**
   * Profile/settings fetch body — partial API failure ≠ blank page.
   * Auth failure → soft navigate /login (hard reload 금지).
   * Loading toggle is owned by useSoftResourceLoad / runResourceLoad finally.
   */
  const fetchSettings = useCallback(async() => {
    const sessionUser = userRef.current;
    if (!sessionUser?.id) {
      return;
    }

    setLoadError('');
    try {
      const [profileResult, settingsResult] = await Promise.allSettled([
        StandardizedApi.get(MYPAGE_API.GET_INFO),
        StandardizedApi.get(CLIENT_SETTINGS_API.GET)
      ]);

      const profileRejected =
        profileResult.status === 'rejected' ? profileResult.reason : null;
      const settingsRejected =
        settingsResult.status === 'rejected' ? settingsResult.reason : null;

      if (isAuthFailure(profileRejected) || isAuthFailure(settingsRejected)) {
        navigate('/login', { replace: true });
        return;
      }

      const bothNull =
        profileResult.status === 'fulfilled'
        && profileResult.value == null
        && settingsResult.status === 'fulfilled'
        && settingsResult.value == null;
      if (bothNull && !sessionManager.getUser()?.id) {
        navigate('/login', { replace: true });
        return;
      }

      if (profileResult.status === 'fulfilled' && profileResult.value) {
        applyProfileFields(profileResult.value, sessionUser);
      } else {
        applyProfileFields(null, sessionUser);
        if (profileRejected) {
          console.error(CLIENT_WEB_SUITE_COPY.SETTINGS_LOAD_ERROR, profileRejected);
          setLoadError(CLIENT_WEB_SUITE_COPY.SETTINGS_LOAD_ERROR);
        }
      }

      if (settingsResult.status === 'fulfilled' && settingsResult.value) {
        setNotify(mapNotifyFromApi(settingsResult.value));
      } else if (settingsRejected && !profileRejected) {
        console.error(CLIENT_WEB_SUITE_COPY.SETTINGS_LOAD_ERROR, settingsRejected);
        setLoadError(CLIENT_WEB_SUITE_COPY.SETTINGS_LOAD_ERROR);
      }
    } catch (err) {
      if (isAuthFailure(err)) {
        navigate('/login', { replace: true });
        return;
      }
      console.error(CLIENT_WEB_SUITE_COPY.SETTINGS_LOAD_ERROR, err);
      setLoadError(err?.message || CLIENT_WEB_SUITE_COPY.SETTINGS_LOAD_ERROR);
      applyProfileFields(null, sessionUser);
    }
  }, [applyProfileFields, navigate, userRef]);

  const { load: loadSettings, softRefresh: softRefreshSettings } = useSoftResourceLoad(
    setLoading,
    fetchSettings
  );

  // hasCheckedSession 전에 !isLoggedIn 으로 soft kick 하면 마운트 레이스 → 스피너/로그인 루프.
  // sessionLoading 고착에 enabled 를 묶지 않는다 (로드 스킵 + loading true 고착 방지).
  useEffect(() => {
    if (!hasCheckedSession) {
      return;
    }
    if (!isLoggedIn) {
      setLoading(false);
      navigate('/login', { replace: true });
    }
  }, [hasCheckedSession, isLoggedIn, navigate]);

  useUserIdScopedLoad({
    userId,
    loadFn: loadSettings,
    enabled: Boolean(hasCheckedSession && isLoggedIn),
    onMissingUserId: () => {
      setLoading(false);
      setLoadError('');
    }
  });

  /**
   * 다시 시도: silent checkSession → softRefresh (hard reload 금지).
   */
  const handleRetry = useCallback(async() => {
    setLoadError('');
    setLoading(true);
    try {
      if (typeof checkSession === 'function') {
        const ok = await checkSession(true, { silent: true });
        if (!ok && !sessionManager.getUser()?.id) {
          navigate('/login', { replace: true });
          return;
        }
      }
      if (!userRef.current?.id && !sessionManager.getUser()?.id) {
        navigate('/login', { replace: true });
        return;
      }
      await softRefreshSettings();
    } catch (err) {
      if (isAuthFailure(err)) {
        navigate('/login', { replace: true });
        return;
      }
      setLoadError(err?.message || CLIENT_WEB_SUITE_COPY.SETTINGS_LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [checkSession, softRefreshSettings, navigate, userRef]);

  const refreshSessionAfterProfileSave = useCallback(
    async({
      savedName,
      savedPhone,
      savedEmail,
      phoneVerified,
      phoneVerifiedAt
    }) => {
      const baseUser =
        sessionManager.user && typeof sessionManager.user === 'object'
          ? sessionManager.user
          : {};
      const patchedUser = {
        ...baseUser,
        name: savedName,
        phone: savedPhone,
        phoneNumber: savedPhone,
        mobile: savedPhone,
        ...(savedEmail ? { email: savedEmail } : {}),
        isPhoneVerified: phoneVerified === true,
        phoneVerified: phoneVerified === true,
        ...(phoneVerifiedAt != null ? { phoneVerifiedAt } : {})
      };
      // SessionContext addListener 비활성 — setUser + checkSession(SET_USER) 가 React SSOT
      if (typeof sessionManager.setUser === 'function') {
        sessionManager.setUser(patchedUser);
      } else {
        sessionManager.user = patchedUser;
        if (typeof sessionManager.notifyListeners === 'function') {
          sessionManager.notifyListeners();
        }
      }

      // silent: 로딩 오버레이·foreground 401 킥 없이 Context 동기화 (background-401 정책 유지)
      if (typeof checkSession === 'function') {
        await checkSession(true, { silent: true });
      }

      // OTP 성공 직후 current-user 가 verified/phone 을 비우면 동일 번호로 재병합 후 Context 갱신
      if (phoneVerified !== true || !savedPhone) {
        return;
      }
      const savedDigits = normalizeKoreanMobileDigits(savedPhone);
      if (!savedDigits || !isValidKoreanMobileDigits(savedDigits)) {
        return;
      }
      const afterUser = sessionManager.getUser?.() || sessionManager.user || {};
      const afterDigits = normalizeKoreanMobileDigits(
        afterUser.phone || afterUser.phoneNumber || afterUser.mobile || ''
      );
      const digitsMatch = afterDigits === savedDigits;
      const stillVerified =
        afterUser.isPhoneVerified === true || afterUser.phoneVerified === true;
      const missingPhoneAlias =
        afterUser.phone == null
        || afterUser.phoneNumber == null
        || afterUser.mobile == null;

      if (!digitsMatch && afterDigits) {
        return;
      }
      if (stillVerified && !missingPhoneAlias) {
        return;
      }

      const remerged = {
        ...afterUser,
        phone: savedPhone,
        phoneNumber: savedPhone,
        mobile: savedPhone,
        isPhoneVerified: true,
        phoneVerified: true,
        ...(phoneVerifiedAt != null ? { phoneVerifiedAt } : {})
      };
      if (typeof sessionManager.setUser === 'function') {
        sessionManager.setUser(remerged);
      } else {
        sessionManager.user = remerged;
        if (typeof sessionManager.notifyListeners === 'function') {
          sessionManager.notifyListeners();
        }
      }
      if (typeof checkSession === 'function') {
        await checkSession(true, { silent: true });
      }
    },
    [checkSession]
  );

  const handlePhoneInputChange = (event) => {
    const next = event.target.value;
    setPhone(next);
    setProfileError('');
    const digits = normalizeKoreanMobileDigits(next);
    if (
      isPhoneVerified
      && verifiedPhoneDigits
      && digits
      && digits !== verifiedPhoneDigits
    ) {
      setIsPhoneVerified(false);
    } else if (
      verifiedPhoneDigits
      && digits
      && digits === verifiedPhoneDigits
      && readPhoneVerifiedFlag(user)
    ) {
      setIsPhoneVerified(true);
    }
  };

  const handleProfileSubmit = async(event) => {
    event.preventDefault();
    setProfileError('');

    const trimmedName = String(fullName || '').trim();
    if (!trimmedName) {
      setProfileError(CLIENT_WEB_SUITE_COPY.SETTINGS_NAME_REQUIRED);
      return;
    }

    const phoneRaw = String(phone || '').trim();
    if (!phoneRaw) {
      setProfileError(CLIENT_WEB_SUITE_COPY.SETTINGS_PHONE_REQUIRED);
      return;
    }
    const phoneDigits = normalizeKoreanMobileDigits(phoneRaw);
    if (!isValidKoreanMobileDigits(phoneDigits)) {
      setProfileError(CLIENT_WEB_SUITE_COPY.SETTINGS_PHONE_INVALID);
      return;
    }

    const phoneDigitsChanged =
      !verifiedPhoneDigits || phoneDigits !== verifiedPhoneDigits;
    const nextVerified = phoneDigitsChanged ? false : isPhoneVerified;

    setSavingProfile(true);
    try {
      const response = await StandardizedApi.put(MYPAGE_API.UPDATE_INFO, {
        name: trimmedName,
        phone: phoneDigits
      });
      const savedName = toDisplayString(response?.name, trimmedName);
      const savedPhone = toDisplayString(response?.phone, phoneDigits);
      const savedEmail = toDisplayString(response?.email, email);
      const apiVerified = readPhoneVerifiedFlag(response);
      const effectiveVerified = phoneDigitsChanged ? false : (apiVerified || nextVerified);

      setFullName(savedName);
      setPhone(savedPhone);
      if (savedEmail) {
        setEmail(savedEmail);
      }
      setIsPhoneVerified(effectiveVerified);
      if (!effectiveVerified) {
        setVerifiedPhoneDigits(null);
      }

      await refreshSessionAfterProfileSave({
        savedName,
        savedPhone,
        savedEmail: savedEmail || undefined,
        phoneVerified: effectiveVerified,
        phoneVerifiedAt: effectiveVerified ? response?.phoneVerifiedAt : null
      });
      await softRefreshSettings();

      setMessage(CLIENT_WEB_SUITE_COPY.SETTINGS_SAVE_SUCCESS);
      notificationManager.show(CLIENT_WEB_SUITE_COPY.SETTINGS_SAVE_SUCCESS, 'success');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error(CLIENT_WEB_SUITE_COPY.SETTINGS_SAVE_ERROR, error);
      const msg =
        error?.response?.data?.message
        || error?.message
        || CLIENT_WEB_SUITE_COPY.SETTINGS_SAVE_ERROR;
      setProfileError(msg);
      notificationManager.show(CLIENT_WEB_SUITE_COPY.SETTINGS_SAVE_ERROR, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleNotifyChange = async(key, value) => {
    const next = { ...notify, [key]: value };
    try {
      await StandardizedApi.put(CLIENT_SETTINGS_API.UPDATE, buildNotifyPutBody(next));
      setNotify(next);
      setMessage(CLIENT_WEB_SUITE_COPY.SETTINGS_NOTIFY_SAVE_SUCCESS);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error(CLIENT_WEB_SUITE_COPY.SETTINGS_NOTIFY_SAVE_ERROR, error);
      notificationManager.show(CLIENT_WEB_SUITE_COPY.SETTINGS_NOTIFY_SAVE_ERROR, 'error');
    }
  };

  const handleEmailChangeSuccess = useCallback(async() => {
    try {
      // logout() finally 가 서브도메인 유지 1회 replace — assign/reload 금지
      await sessionManager.logout();
    } catch (logoutError) {
      console.warn('이메일 변경 후 로그아웃 처리 중 오류 — sessionRedirect 1회:', logoutError);
      redirectToLoginPageOnce();
    }
  }, []);

  const handlePhoneChangeSuccess = useCallback(
    async(response) => {
      const savedPhone = toDisplayString(
        response?.phone ?? response?.data?.phone,
        phone
      );
      const digits = normalizeKoreanMobileDigits(savedPhone);
      const verifiedAt =
        response?.phoneVerifiedAt ?? response?.data?.phoneVerifiedAt ?? null;

      setPhone(savedPhone);
      setIsPhoneVerified(true);
      setVerifiedPhoneDigits(
        digits && isValidKoreanMobileDigits(digits) ? digits : null
      );
      setProfileError('');

      await refreshSessionAfterProfileSave({
        savedName: fullName,
        savedPhone,
        savedEmail: email || undefined,
        phoneVerified: true,
        phoneVerifiedAt: verifiedAt
      });

      setMessage(CLIENT_WEB_SUITE_COPY.SETTINGS_PHONE_VERIFY_SUCCESS);
      notificationManager.show(
        CLIENT_WEB_SUITE_COPY.SETTINGS_PHONE_VERIFY_SUCCESS,
        'success'
      );
      setTimeout(() => setMessage(null), 3000);
    },
    [email, fullName, phone, refreshSessionAfterProfileSave]
  );

  const notifyRows = [
    {
      id: 'push',
      label: t('settings:notification.all.label'),
      description: t('settings:notification.all.description'),
      checked: Boolean(notify.push)
    },
    {
      id: 'email',
      label: t('settings:notification.email.label'),
      description: t('settings:notification.email.descriptionShort'),
      checked: Boolean(notify.email)
    },
    {
      id: 'sms',
      label: t('settings:notification.sms.label'),
      description: t('settings:notification.sms.descriptionShort'),
      checked: Boolean(notify.sms)
    }
  ];

  const pageBusy = !hasCheckedSession || loading;

  let mainSlot;
  if (pageBusy) {
    mainSlot = (
      <div aria-busy="true" aria-live="polite">
        <UnifiedLoading
          type="inline"
          text={CLIENT_WEB_SUITE_COPY.SETTINGS_LOADING}
        />
      </div>
    );
  } else if (loadError) {
    mainSlot = (
      <div
        className="client-web-page-shell__card"
        role="alert"
        data-testid={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_LOAD_ERROR}
      >
        <h2 className="client-settings-suite__group-title">
          {CLIENT_WEB_SUITE_COPY.SETTINGS_ERROR_TITLE}
        </h2>
        <p className="client-settings-suite__hint">
          <SafeText>{loadError}</SafeText>
        </p>
        <div className="client-settings-suite__actions">
          <button
            type="button"
            className="client-web-page-shell__cta"
            data-testid={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_RETRY}
            onClick={() => {
              void handleRetry();
            }}
          >
            {CLIENT_WEB_SUITE_COPY.SETTINGS_RETRY}
          </button>
        </div>
      </div>
    );
  } else {
    mainSlot = (
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
        <p className="client-settings-suite__hint">
          {CLIENT_WEB_SUITE_COPY.SETTINGS_PROFILE_HINT}
        </p>

        <form
          id={PROFILE_FORM_ID}
          className="client-settings-suite__form"
          data-testid={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PROFILE_FORM}
          onSubmit={handleProfileSubmit}
          noValidate
        >
          <div className="client-settings-suite__field">
            <label
              className="client-settings-suite__label"
              htmlFor={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_FULL_NAME}
            >
              {CLIENT_WEB_SUITE_COPY.SETTINGS_ACCOUNT_NAME}
            </label>
            <input
              id={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_FULL_NAME}
              data-testid={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_FULL_NAME}
              className="client-settings-suite__input"
              type="text"
              name="fullName"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setProfileError('');
              }}
              autoComplete="name"
              required
              disabled={savingProfile}
            />
          </div>

          <div className="client-settings-suite__field">
            <label
              className="client-settings-suite__label"
              htmlFor={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_EMAIL}
            >
              {CLIENT_WEB_SUITE_COPY.SETTINGS_ACCOUNT_EMAIL}
            </label>
            <div className="client-settings-suite__email-row">
              <input
                id={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_EMAIL}
                data-testid={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_EMAIL}
                className="client-settings-suite__input"
                type="email"
                name="email"
                value={email}
                readOnly
                autoComplete="email"
                aria-readonly="true"
              />
              <button
                type="button"
                className="client-web-page-shell__cta client-web-page-shell__cta--ghost"
                data-testid={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_EMAIL_CHANGE}
                onClick={() => setIsEmailChangeOpen(true)}
                disabled={savingProfile}
              >
                {CLIENT_WEB_SUITE_COPY.SETTINGS_EMAIL_CHANGE_CTA}
              </button>
            </div>
            {!email ? (
              <p className="client-settings-suite__field-hint">
                {CLIENT_WEB_SUITE_COPY.SETTINGS_EMAIL_EMPTY_HINT}
              </p>
            ) : null}
          </div>

          <div className="client-settings-suite__field">
            <label
              className="client-settings-suite__label"
              htmlFor={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PHONE}
            >
              {CLIENT_WEB_SUITE_COPY.SETTINGS_ACCOUNT_MOBILE}
            </label>
            <div className="client-settings-suite__email-row">
              <input
                id={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PHONE}
                data-testid={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PHONE}
                className="client-settings-suite__input"
                type="tel"
                name="phone"
                value={phone}
                onChange={handlePhoneInputChange}
                inputMode="tel"
                autoComplete="tel"
                placeholder="01012345678"
                required
                disabled={savingProfile}
              />
              <button
                type="button"
                className="client-web-page-shell__cta client-web-page-shell__cta--ghost"
                data-testid={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PHONE_VERIFY}
                onClick={() => setIsPhoneChangeOpen(true)}
                disabled={savingProfile}
              >
                {CLIENT_WEB_SUITE_COPY.SETTINGS_PHONE_VERIFY_CTA}
              </button>
            </div>
            {isPhoneVerified ? (
              <p
                className="client-settings-suite__verified"
                data-testid={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PHONE_VERIFIED_STATUS}
                role="status"
              >
                {CLIENT_WEB_SUITE_COPY.SETTINGS_PHONE_VERIFIED_BADGE}
              </p>
            ) : (
              <p className="client-settings-suite__field-hint" role="status">
                {CLIENT_WEB_SUITE_COPY.SETTINGS_PHONE_UNVERIFIED_HINT}
              </p>
            )}
          </div>

          <div className="client-settings-suite__row client-settings-suite__row--password">
            <span className="client-settings-suite__label">
              {CLIENT_WEB_SUITE_COPY.SETTINGS_ACCOUNT_PASSWORD}
            </span>
            <span className="client-settings-suite__value">
              {CLIENT_WEB_SUITE_COPY.SETTINGS_ACCOUNT_PASSWORD_MASK}
            </span>
          </div>

          {profileError ? (
            <p
              className="client-settings-suite__error"
              role="alert"
              data-testid={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PROFILE_ERROR}
            >
              <SafeText>{profileError}</SafeText>
            </p>
          ) : null}

          <div className="client-settings-suite__actions">
            <button
              type="submit"
              className="client-web-page-shell__cta"
              data-testid={CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_SAVE}
              disabled={savingProfile}
              aria-busy={savingProfile}
            >
              {savingProfile
                ? CLIENT_WEB_SUITE_COPY.SETTINGS_SAVING
                : CLIENT_WEB_SUITE_COPY.SETTINGS_SAVE_CTA}
            </button>
          </div>
        </form>
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
                onChange={(e) => handleNotifyChange(row.id, e.target.checked)}
                aria-label={row.label}
              />
            </li>
          ))}
        </ul>
      </section>

      <EmailChangeModal
        isOpen={isEmailChangeOpen}
        onClose={() => setIsEmailChangeOpen(false)}
        onSuccess={handleEmailChangeSuccess}
      />
      <PhoneChangeModal
        isOpen={isPhoneChangeOpen}
        onClose={() => setIsPhoneChangeOpen(false)}
        onSuccess={handlePhoneChangeSuccess}
      />
    </>
    );
  }

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
