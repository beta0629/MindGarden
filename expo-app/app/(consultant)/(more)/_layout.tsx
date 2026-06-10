import { Stack } from 'expo-router';
import { ContentLetterbox } from '@/components/app-chrome/ContentLetterbox';

/**
 * 상담사 더보기 Stack — iPad letterbox 적용 (Build 1.0.9, Apple G4 대응).
 * 하위 community / messages 그룹도 본 letterbox 안에서 표시됨.
 */
export default function ConsultantMoreLayout() {
  return (
    <ContentLetterbox>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="session-kpi" options={{ headerShown: false }} />
        <Stack.Screen name="mood-journal-inbox" options={{ headerShown: false }} />
      </Stack>
    </ContentLetterbox>
  );
}
