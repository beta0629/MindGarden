/**
 * 어드민 메시지 탭 — Stack 그룹 (탭 바에 route 이름·아이콘 깨짐 방지)
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { Stack } from 'expo-router';
import { ContentLetterbox } from '@/components/app-chrome/ContentLetterbox';

/** 어드민 메시지 Stack — iPad letterbox 적용 (Build 1.0.9, Apple G4 대응). */
export default function AdminMessagesLayout() {
  return (
    <ContentLetterbox>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </ContentLetterbox>
  );
}
