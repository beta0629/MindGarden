import { Stack } from 'expo-router';

export default function ClientMessagesLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
