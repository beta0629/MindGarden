import { Stack } from 'expo-router';
import { ContentLetterbox } from '@/components/app-chrome/ContentLetterbox';

/**
 * 내담자 홈 Stack 레이아웃 — iPad letterbox 적용 (Build 1.0.9, Apple G4 대응).
 */
export default function ClientHomeLayout() {
  return (
    <ContentLetterbox>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </ContentLetterbox>
  );
}
