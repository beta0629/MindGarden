import React, { useMemo } from 'react';
import notificationManager from '../../../utils/notification';
import MypageSectionPanel from '../layout/MypageSectionPanel';
import MypageDefinitionRows from '../layout/MypageDefinitionRows';
import MypageActionButton from '../layout/MypageActionButton';
import {
  MYPAGE_SECTION_KEYS,
  MYPAGE_SECTION_LABELS,
  MYPAGE_SECTION_CAPTIONS,
  MYPAGE_FEATURE_READY,
  MYPAGE_FIELD_LABELS,
  MYPAGE_SECURITY_COPY
} from '../../../constants/mypageRoleLayout';

const parseUaSummary = () => {
  if (typeof navigator === 'undefined') return MYPAGE_SECURITY_COPY.THIS_BROWSER;
  const ua = navigator.userAgent || '';
  let browser = MYPAGE_SECURITY_COPY.BROWSER;
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

/**
 * 로그인·보안 — 비밀번호 변경/찾기 · 지금 로그인한 기기.
 * 2단계 인증·다른 기기 로그아웃은 MYPAGE_FEATURE_READY 가 true 일 때만 노출 (Q1).
 */
const SecuritySection = ({
  onPasswordChange,
  onPasswordReset,
  onRequestLogoutOtherDevices
}) => {
  const deviceLabel = useMemo(() => parseUaSummary(), []);

  const rows = [
    {
      key: 'password',
      label: MYPAGE_FIELD_LABELS.PASSWORD,
      value: MYPAGE_FIELD_LABELS.PASSWORD_VALUE,
      action: (
        <span className="mg-mypage-rows__action-group">
          <MypageActionButton variant="ghost" onClick={onPasswordReset} data-testid="mypage-password-reset">
            {MYPAGE_FIELD_LABELS.PASSWORD_RESET}
          </MypageActionButton>
          <MypageActionButton variant="outline" onClick={onPasswordChange} data-testid="mypage-password-change">
            {MYPAGE_FIELD_LABELS.PASSWORD_CHANGE}
          </MypageActionButton>
        </span>
      )
    },
    MYPAGE_FEATURE_READY.TWO_FACTOR
      ? {
        key: 'two-factor',
        label: MYPAGE_SECURITY_COPY.TWO_FACTOR,
        value: MYPAGE_SECURITY_COPY.TWO_FACTOR_OFF,
        action: (
          <MypageActionButton
            variant="ghost"
            onClick={() => notificationManager.show(MYPAGE_SECURITY_COPY.TWO_FACTOR_NOT_READY, 'info')}
          >
            {MYPAGE_SECURITY_COPY.TWO_FACTOR_SETUP}
          </MypageActionButton>
        )
      }
      : null,
    {
      key: 'device',
      label: MYPAGE_FIELD_LABELS.DEVICE,
      value: deviceLabel,
      caption: MYPAGE_FIELD_LABELS.DEVICE_CURRENT,
      action: MYPAGE_FEATURE_READY.LOGOUT_OTHER_DEVICES ? (
        <MypageActionButton variant="ghost" onClick={onRequestLogoutOtherDevices}>
          {MYPAGE_SECURITY_COPY.LOGOUT_OTHER_DEVICES}
        </MypageActionButton>
      ) : null
    }
  ];

  return (
    <MypageSectionPanel
      sectionKey={MYPAGE_SECTION_KEYS.SECURITY}
      title={MYPAGE_SECTION_LABELS[MYPAGE_SECTION_KEYS.SECURITY]}
      caption={MYPAGE_SECTION_CAPTIONS[MYPAGE_SECTION_KEYS.SECURITY]}
    >
      <MypageDefinitionRows rows={rows} testId="mypage-security-rows" />
    </MypageSectionPanel>
  );
};

export default SecuritySection;
