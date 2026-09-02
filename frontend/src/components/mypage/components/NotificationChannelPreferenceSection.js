import { useId } from 'react';
import {
  NOTIFICATION_CHANNEL_PREFERENCE_VALUE,
  tNotificationChannel
} from '../../../constants/notificationChannelPreference';
import { shouldShowNotificationChannelPreference } from '../../../constants/mypageProfileRoles';
import './NotificationChannelPreferenceSection.css';

const SECTION_I18N = 'tenantProfile.notificationChannel.sectionTitle';
const SUB_I18N = 'tenantProfile.notificationChannel.sectionSubtitle';

/**
 * 내담자·상담사·운영+상담 겸직 마이페이지 — 알림 수신 채널 선호(라디오).
 */
const NotificationChannelPreferenceSection = ({
  displayUser,
  isEditing,
  preferenceValue,
  tenantKakaoAvailable,
  tenantSmsAvailable,
  tenantDefaultHint,
  preferenceUiAdjusted,
  onPreferenceChange,
  readOnlyDueToPolicy = false,
  readOnlyHintI18nKey = 'admin.userProfile.notificationChannel.staffReadOnlyHint'
}) => {
  const groupId = useId();
  const titleId = `${groupId}-title`;

  if (!shouldShowNotificationChannelPreference(displayUser)) {
    return null;
  }

  const kakaoOk = tenantKakaoAvailable !== false;
  const smsOk = tenantSmsAvailable !== false;
  const noneConfigured = !kakaoOk && !smsOk;

  const options = [
    {
      value: NOTIFICATION_CHANNEL_PREFERENCE_VALUE.TENANT_DEFAULT,
      labelKey: 'tenantProfile.notificationChannel.optionTenantDefault',
      descKey: 'tenantProfile.notificationChannel.optionTenantDefaultDescription',
      disabled: false,
      hidden: false
    },
    {
      value: NOTIFICATION_CHANNEL_PREFERENCE_VALUE.KAKAO,
      labelKey: 'tenantProfile.notificationChannel.optionKakao',
      descKey: 'tenantProfile.notificationChannel.optionKakaoDescription',
      disabled: !kakaoOk,
      hidden: !kakaoOk
    },
    {
      value: NOTIFICATION_CHANNEL_PREFERENCE_VALUE.SMS,
      labelKey: 'tenantProfile.notificationChannel.optionSms',
      descKey: 'tenantProfile.notificationChannel.optionSmsDescription',
      disabled: !smsOk,
      hidden: !smsOk
    }
  ].filter((o) => !o.hidden);

  const topHintKey = noneConfigured
    ? 'tenantProfile.notificationChannel.hintNoChannelConfigured'
    : !kakaoOk
      ? 'tenantProfile.notificationChannel.hintKakaoUnavailable'
      : !smsOk
        ? 'tenantProfile.notificationChannel.hintSmsUnavailable'
        : null;

  const tenantDefaultLine =
    !noneConfigured &&
    preferenceValue === NOTIFICATION_CHANNEL_PREFERENCE_VALUE.TENANT_DEFAULT &&
    tenantDefaultHint === 'KAKAO'
      ? tNotificationChannel('tenantProfile.notificationChannel.optionKakaoDescription')
      : !noneConfigured &&
        preferenceValue === NOTIFICATION_CHANNEL_PREFERENCE_VALUE.TENANT_DEFAULT &&
        tenantDefaultHint === 'SMS'
        ? tNotificationChannel('tenantProfile.notificationChannel.optionSmsDescription')
        : null;

  return (
    <div className="mg-mypage-clinic-os__form-row mg-mypage-clinic-os__form-row--stack" aria-labelledby={titleId}>
      <div>
        <h3 id={titleId} className="mg-mypage-clinic-os__section-title">
          {tNotificationChannel(SECTION_I18N)}
        </h3>
        <p className="mg-mypage-clinic-os__section-description mg-mypage-notification-channel__hint">
          {tNotificationChannel(SUB_I18N)}
        </p>
      </div>

      {topHintKey ? (
        <p className="mg-mypage-notification-channel__hint mg-mypage-notification-channel__hint--warn">
          {tNotificationChannel(topHintKey)}
        </p>
      ) : null}

      {preferenceUiAdjusted ? (
        <p className="mg-mypage-notification-channel__hint mg-mypage-notification-channel__hint--warn">
          {tNotificationChannel('tenantProfile.notificationChannel.hintPreferenceResetToTenantDefault')}
        </p>
      ) : null}

      {readOnlyDueToPolicy && isEditing ? (
        <p className="mg-mypage-notification-channel__hint mg-mypage-notification-channel__hint--warn">
          {tNotificationChannel(readOnlyHintI18nKey)}
        </p>
      ) : null}

      {tenantDefaultLine ? (
        <p className="mg-mypage-notification-channel__hint">{tenantDefaultLine}</p>
      ) : null}

      <div
        className="mg-mypage-notification-channel__radiogroup"
        role="radiogroup"
        aria-labelledby={titleId}
      >
        {options.map((opt) => {
          const inputId = `${groupId}-${opt.value}`;
          const checked = preferenceValue === opt.value;
          return (
            <label
              key={opt.value}
              htmlFor={inputId}
              className={`mg-mypage-notification-channel__option${
                opt.disabled || noneConfigured ? ' mg-mypage-notification-channel__option--disabled' : ''
              }`}
            >
              <div className="mg-mypage-notification-channel__option-head">
                <input
                  id={inputId}
                  type="radio"
                  name="notificationChannelPreference"
                  value={opt.value}
                  checked={checked}
                  onChange={onPreferenceChange}
                  disabled={
                    !isEditing || readOnlyDueToPolicy || opt.disabled || noneConfigured
                  }
                />
                <span>{tNotificationChannel(opt.labelKey)}</span>
              </div>
              <p className="mg-mypage-notification-channel__option-desc">
                {tNotificationChannel(opt.descKey)}
              </p>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationChannelPreferenceSection;
