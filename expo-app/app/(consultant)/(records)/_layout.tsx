import { Stack } from 'expo-router';
import { ContentLetterbox } from '@/components/app-chrome/ContentLetterbox';

/** 상담사 일지 Stack — iPad letterbox 적용 (Build 1.0.9, Apple G4 대응). */
export default function ConsultantRecordsLayout() {
  return (
    <ContentLetterbox>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </ContentLetterbox>
  );
}
