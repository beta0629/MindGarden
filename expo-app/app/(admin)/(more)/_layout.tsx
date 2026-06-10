import { Stack } from 'expo-router';
import { ContentLetterbox } from '@/components/app-chrome/ContentLetterbox';

/** 어드민 더보기 Stack — iPad letterbox 적용 (Build 1.0.9, Apple G4 대응). */
export default function AdminMoreLayout() {
  return (
    <ContentLetterbox>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
      </Stack>
    </ContentLetterbox>
  );
}
