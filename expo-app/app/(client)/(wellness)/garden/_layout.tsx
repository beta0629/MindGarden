import { Stack } from 'expo-router';

/**
 * 내담자 「마음 정원」전용 스택 (Phase 4-B)
 *
 * @author MindGarden
 * @since 2026-05-13
 */
export default function ClientMindGardenLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
