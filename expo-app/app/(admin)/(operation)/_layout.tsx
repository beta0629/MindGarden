import { Stack } from 'expo-router';
import { ContentLetterbox } from '@/components/app-chrome/ContentLetterbox';

/**
 * 파일 기반 라우트만 사용 — 자식 `Stack.Screen`을 나열하면 iOS에서
 * `users` 등 폴더 라우트와 중복 등록되어 Render Error가 난다.
 * iPad letterbox 적용 (Build 1.0.9, Apple G4 대응).
 */
export default function AdminOperationLayout() {
  return (
    <ContentLetterbox>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </ContentLetterbox>
  );
}
