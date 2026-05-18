import { Stack } from 'expo-router';

/**
 * 파일 기반 라우트만 사용 — 자식 `Stack.Screen`을 나열하면 iOS에서
 * `users` 등 폴더 라우트와 중복 등록되어 Render Error가 난다.
 */
export default function AdminOperationLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
