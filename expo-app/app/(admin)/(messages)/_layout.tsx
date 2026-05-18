/**
 * 어드민 메시지 탭 — Stack 그룹 (탭 바에 route 이름·아이콘 깨짐 방지)
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { Stack } from 'expo-router';

export default function AdminMessagesLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
