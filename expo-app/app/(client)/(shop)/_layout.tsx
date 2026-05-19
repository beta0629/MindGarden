/**
 * 내담자 쇼핑 Stack 레이아웃
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { Stack } from 'expo-router';

export default function ClientShopLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="points" />
      <Stack.Screen name="orders/index" />
      <Stack.Screen name="orders/[orderPublicId]" />
      <Stack.Screen name="sku/[skuCode]" />
    </Stack>
  );
}
