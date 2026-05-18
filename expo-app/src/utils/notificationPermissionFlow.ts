/**
 * OS 푸시 권한 요청 순서 (Android 채널 선행) — 단위 테스트 대상
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { colors } from '@/theme/tokens';

const DEFAULT_ANDROID_CHANNEL_ID = 'default';

export async function ensureDefaultAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(DEFAULT_ANDROID_CHANNEL_ID, {
    name: 'MindGarden 알림',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: colors.consultant.primary,
  });
}

/**
 * Android 13+ — 채널 생성 후 get/request 권한.
 */
export async function requestOsNotificationPermission(): Promise<boolean> {
  await ensureDefaultAndroidNotificationChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}
