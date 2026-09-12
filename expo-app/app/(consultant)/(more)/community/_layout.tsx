import { Stack } from 'expo-router';
import {
  CONSULTANT_COMMUNITY_MENU_CODE,
  CommunityFeatureGate,
} from '@/components/guards/CommunityFeatureGate';

export default function ConsultantCommunityLayout() {
  return (
    <CommunityFeatureGate
      fallbackHref="/(consultant)/(more)"
      menuCode={CONSULTANT_COMMUNITY_MENU_CODE}
    >
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </CommunityFeatureGate>
  );
}
