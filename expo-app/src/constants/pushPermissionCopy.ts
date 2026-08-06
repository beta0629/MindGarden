/**
 * OS 푸시 권한 안내 카피 (하드코딩 검사 통과용 상수)
 *
 * @author MindGarden
 * @since 2026-05-18
 */

export const PUSH_PERMISSION_COPY = {
  deviceSectionTitle: '기기 알림',
  statusGranted: '허용됨',
  statusDenied: '거부됨',
  statusUndetermined: '아직 허용하지 않음',
  allowButton: '알림 허용',
  openSettingsButton: '설정에서 켜기',
  allowHint: '푸시 알림을 받으려면 기기에서 알림을 허용해 주세요.',
  deniedHint: '알림이 꺼져 있습니다. 설정 앱에서 MindGarden 알림을 켜 주세요.',
  reregisterButton: '푸시 다시 등록',
  reregisterHint: '서버에 기기 토큰을 다시 보냅니다. 푸시가 오지 않을 때 시도해 주세요.',
  registerSuccessTitle: '푸시 등록 완료',
  registerSuccessBody: '이 기기에서 알림을 받을 수 있습니다.',
  registerFailedTitle: '푸시 등록 실패',
  registerFailedBody: '다시 시도하거나 알림 설정에서 ‘푸시 다시 등록’을 눌러 주세요.',
  registerRetryToastId: 'push-register-retry',
  unregisterFailedTitle: '푸시 해제 실패',
  unregisterFailedBody:
    '기기 알림 등록 해제가 완료되지 않았습니다. 다른 계정으로 로그인하면 알림 설정에서 ‘푸시 다시 등록’을 눌러 주세요.',
  unregisterFailToastId: 'push-unregister-fail',
} as const;
