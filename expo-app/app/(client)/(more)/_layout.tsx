import { Stack } from 'expo-router';
import { ContentLetterbox } from '@/components/app-chrome/ContentLetterbox';

/**
 * 내담자 더보기 Stack 레이아웃 — iPad letterbox 적용 (Build 1.0.9, Apple G4 대응).
 * 하위 그룹(community·messages·sessions-payment)도 본 letterbox 안에서 표시됨.
 * 메시지 대화 화면의 입력바도 letterbox 안에 포함되어 시각 일관성 유지.
 */
export default function ClientMoreLayout() {
  return (
    <ContentLetterbox>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </ContentLetterbox>
  );
}
