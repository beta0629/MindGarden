import { Stack } from 'expo-router';
import { CommunityFeatureGate } from '@/components/guards/CommunityFeatureGate';

export default function ClientCommunityLayout() {
  return (
    <CommunityFeatureGate fallbackHref="/(client)/(more)">
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </CommunityFeatureGate>
  );
}
