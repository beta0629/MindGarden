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
  reregisterHint: '서버에 기기 토큰을 다시 보냅니다. 푸시가 오지 않을 때 시도해 보세요.',
} as const;
