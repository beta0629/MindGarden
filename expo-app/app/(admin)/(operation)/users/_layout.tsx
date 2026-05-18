import { Stack } from 'expo-router';

export default function AdminUsersStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create-client" />
      <Stack.Screen name="create-consultant" />
      <Stack.Screen name="create-staff" />
    </Stack>
  );
}
