import { useId } from 'react';
import {
  NOTIFICATION_CHANNEL_PREFERENCE_VALUE,
  tNotificationChannel
} from '../../../constants/notificationChannelPreference';
import './NotificationChannelPreferenceSection.css';

const SECTION_I18N = 'tenantProfile.notificationChannel.sectionTitle';
const SUB_I18N = 'tenantProfile.notificationChannel.sectionSubtitle';

/**
 * 내담자·상담사 마이페이지 — 알림 수신 채널 선호(라디오).
 *
 * @param {object} props
 * @param {string} props.subjectRole 대상 사용자 역할(CLIENT|CONSULTANT). DOM `role`과 충돌하지 않게 명명.
 * @param {boolean} props.isEditing 편집 모드
 * @param {string} props.preferenceValue TENANT_DEFAULT | KAKAO | SMS
 * @param {boolean} props.tenantKakaoAvailable
 * @param {boolean} props.tenantSmsAvailable
 * @param {string} props.tenantDefaultHint KAKAO | SMS | NONE
 * @param {boolean} props.preferenceUiAdjusted
 * @param {boolean} [props.readOnlyDueToPolicy] 정책상 편집 불가(예: STAFF가 타인 편집)일 때 true
 * @param {string} [props.readOnlyHintI18nKey] readOnlyDueToPolicy이며 isEditing일 때 표시할 i18n 키
 * @param {(e: import('react').ChangeEvent<HTMLInputElement>) => void} props.onPreferenceChange
 * @returns {import('react').JSX.Element|null}
 */
const NotificationChannelPreferenceSection = ({
  subjectRole,
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

  const r = subjectRole ? String(subjectRole).toUpperCase() : '';
  if (r !== 'CLIENT' && r !== 'CONSULTANT') {
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
    <section
      className="mg-v2-ad-b0kla__card mg-mypage__card"
      aria-labelledby={titleId}
    >
      <div className="mg-mypage__section-head">
        <span className="mg-mypage__section-accent" aria-hidden="true" />
        <div className="mg-mypage__section-head-text">
          <h2 id={titleId} className="mg-mypage__section-title">
            {tNotificationChannel(SECTION_I18N)}
          </h2>
          <p className="mg-mypage__section-subtitle mg-mypage-notification-channel__hint">
            {tNotificationChannel(SUB_I18N)}
          </p>
        </div>
      </div>

      <div className="mg-mypage__card-body">
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
    </section>
  );
};

export default NotificationChannelPreferenceSection;
