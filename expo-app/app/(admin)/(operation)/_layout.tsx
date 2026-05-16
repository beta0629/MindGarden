import { Stack } from 'expo-router';

export default function AdminOperationLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="schedule" />
      <Stack.Screen name="records" />
      <Stack.Screen name="users" />
      <Stack.Screen name="mind-weather" />
    </Stack>
  );
}
