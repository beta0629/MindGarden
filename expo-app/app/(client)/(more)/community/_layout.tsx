import { Stack } from 'expo-router';
import {
  CLIENT_COMMUNITY_MENU_CODE,
  CommunityFeatureGate,
} from '@/components/guards/CommunityFeatureGate';

export default function ClientCommunityLayout() {
  return (
    <CommunityFeatureGate
      fallbackHref="/(client)/(more)"
      menuCode={CLIENT_COMMUNITY_MENU_CODE}
    >
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </CommunityFeatureGate>
  );
}
