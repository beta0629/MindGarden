import { Stack } from 'expo-router';
import { ContentLetterbox } from '@/components/app-chrome/ContentLetterbox';

/**
 * 내담자 웰니스 Stack 레이아웃 — iPad letterbox 적용 (Build 1.0.9, Apple G4 대응).
 * 하위 그룹(meditation·mind-weather·mood-journal·psycho-education·self-assessment·garden)도
 * 본 letterbox 안에서 표시됨.
 */
export default function ClientWellnessLayout() {
  return (
    <ContentLetterbox>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </ContentLetterbox>
  );
}
