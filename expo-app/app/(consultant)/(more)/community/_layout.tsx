import { Stack } from 'expo-router';
import { CommunityFeatureGate } from '@/components/guards/CommunityFeatureGate';

export default function ConsultantCommunityLayout() {
  return (
    <CommunityFeatureGate fallbackHref="/(consultant)/(more)">
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </CommunityFeatureGate>
  );
}
