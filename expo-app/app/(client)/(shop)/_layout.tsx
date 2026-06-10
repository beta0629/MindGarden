/**
 * 내담자 쇼핑 Stack 레이아웃
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { Redirect, Stack, type Href } from 'expo-router';
import { CLIENT_SHOP_MENU_TEMPORARILY_DISABLED } from '@/constants/clientShopConstants';
import { ContentLetterbox } from '@/components/app-chrome/ContentLetterbox';

export default function ClientShopLayout() {
  if (CLIENT_SHOP_MENU_TEMPORARILY_DISABLED) {
    return <Redirect href={'/(client)/(more)' as Href} />;
  }

  return (
    <ContentLetterbox>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="points" />
        <Stack.Screen name="orders/index" />
        <Stack.Screen name="orders/[orderPublicId]" />
        <Stack.Screen name="sku/[skuCode]" />
      </Stack>
    </ContentLetterbox>
  );
}
