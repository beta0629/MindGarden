import { Stack } from 'expo-router';

export default function ConsultantMoreLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="session-kpi" options={{ headerShown: false }} />
      <Stack.Screen name="mood-journal-inbox" options={{ headerShown: false }} />
    </Stack>
  );
}
