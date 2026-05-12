/**
 * 회기·결제 라우트 그룹 레이아웃
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Stack } from 'expo-router';
import { useTheme } from '@/theme';

export default function SessionsPaymentLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
        headerStyle: { backgroundColor: theme.colors.bgMain },
        headerTintColor: theme.colors.textMain,
        headerTitleStyle: {
          fontFamily: theme.fontFamily.semibold,
          fontSize: theme.fontSize.lg,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: '회기 · 결제' }} />
      <Stack.Screen name="[id]" options={{ title: '결제 상세' }} />
      <Stack.Screen name="extend" options={{ title: '회기 연장' }} />
      <Stack.Screen name="usage" options={{ title: '사용 이력' }} />
    </Stack>
  );
}
