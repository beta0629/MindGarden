/**
 * 어드민 운영 — 상담일지 스택 (목록 → 상세)
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { Stack } from 'expo-router';

export default function AdminOperationRecordsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
