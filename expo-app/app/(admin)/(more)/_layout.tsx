import { Stack } from 'expo-router';

export default function AdminMoreLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
    </Stack>
  );
}
