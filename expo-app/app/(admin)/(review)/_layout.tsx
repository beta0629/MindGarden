/**
 * 어드민 검수 스택 — STAFF 딥링크·직접 URL 차단
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { Redirect, Stack, type Href } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { isStaffRole } from '@/utils/adminRole';

export default function AdminReviewLayout() {
  const role = useAuthStore((s) => s.role);

  if (isStaffRole(role)) {
    return <Redirect href={'/(admin)/(home)' as Href} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
