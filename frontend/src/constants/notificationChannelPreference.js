/**
 * 알림 수신 채널 선호 — API 값 및 i18n 키(스펙 SCREEN_SPEC… §12)에 대응하는 한국어 기본값.
 * 추후 react-i18next 도입 시 키를 그대로 사용한다.
 *
 * @author CoreSolution
 * @since 2026-04-24
 */

export const NOTIFICATION_CHANNEL_PREFERENCE_VALUE = Object.freeze({
  TENANT_DEFAULT: 'TENANT_DEFAULT',
  KAKAO: 'KAKAO',
  SMS: 'SMS'
});

export const TENANT_PROFILE_NOTIFICATION_CHANNEL_I18N = Object.freeze({
  'admin.userProfile.notificationChannel.staffReadOnlyHint':
    '알림 채널 선호는 관리자만 변경할 수 있습니다.',
  'admin.userProfile.notificationChannel.adminReadOnlyHint':
    '이 항목은 조회만 가능합니다.',
  'tenantProfile.notificationChannel.sectionTitle': '알림 수신 채널',
  'tenantProfile.notificationChannel.sectionSubtitle': '예약·회기 안내를 받을 채널을 선택합니다.',
  'tenantProfile.notificationChannel.optionTenantDefault': '테넌트 기본 설정 따름',
  'tenantProfile.notificationChannel.optionKakao': '카카오 알림톡',
  'tenantProfile.notificationChannel.optionSms': '문자(SMS)',
  'tenantProfile.notificationChannel.optionTenantDefaultDescription': '센터가 정한 기본 채널을 사용합니다.',
  'tenantProfile.notificationChannel.optionKakaoDescription': '카카오 알림톡으로 안내를 받습니다.',
  'tenantProfile.notificationChannel.optionSmsDescription': 'SMS로 안내를 받습니다.',
  'tenantProfile.notificationChannel.hintSmsUnavailable': '이 센터는 문자 알림을 사용하지 않습니다.',
  'tenantProfile.notificationChannel.hintKakaoUnavailable': '이 센터는 카카오 알림톡을 사용하지 않습니다.',
  'tenantProfile.notificationChannel.hintNoChannelConfigured': '알림 채널이 설정되어 있지 않습니다. 관리자에게 문의해 주세요.',
  'tenantProfile.notificationChannel.hintPreferenceResetToTenantDefault':
    '선택하신 채널을 사용할 수 없어 센터 기본 설정으로 표시됩니다. 저장 시 기본값으로 맞춰질 수 있습니다.',
  'tenantProfile.notificationChannel.save': '저장',
  'tenantProfile.notificationChannel.saved': '저장되었습니다.',
  'tenantProfile.notificationChannel.adminReadOnlyHint': '관리자는 이 항목을 변경할 수 없습니다.'
});

/**
 * @param {string} key
 * @returns {string}
 */
export function tNotificationChannel(key) {
  if (key && TENANT_PROFILE_NOTIFICATION_CHANNEL_I18N[key]) {
    return TENANT_PROFILE_NOTIFICATION_CHANNEL_I18N[key];
  }
  return key;
}
