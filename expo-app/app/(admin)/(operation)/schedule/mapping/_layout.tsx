import { Stack } from 'expo-router';

export default function AdminMappingStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="create" />
    </Stack>
  );
}
