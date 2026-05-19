/**
 * SkuCard — 상품 카드 Molecule (MVP+ 썸네일)
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Coins } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AccentBar } from '@/components/shop/atoms/AccentBar';
import { PriceText } from '@/components/shop/atoms/PriceText';
import { ShopSkuThumbnail } from '@/components/shop/molecules/ShopSkuThumbnail';
import type { ShopCatalogSku } from '@/api/hooks/useClientShopCatalog';
import { CLIENT_SHOP_TEST_IDS } from '@/constants/clientShopConstants';
import { toDisplayString } from '@/utils/toDisplayString';

interface SkuCardProps {
  sku: ShopCatalogSku;
  onAddToCart: () => void;
  onPressDetail?: () => void;
  loading?: boolean;
  pointsRedeemable?: boolean;
}

export function SkuCard({
  sku,
  onAddToCart,
  onPressDetail,
  loading = false,
  pointsRedeemable = true,
}: SkuCardProps) {
  const theme = useTheme();

  const handleAdd = () => {
    if (loading) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onAddToCart();
  };

  const handleDetail = () => {
    if (!onPressDetail || loading) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPressDetail();
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.borderRadius.lg,
        },
      ]}
      accessibilityRole="summary"
      testID={`sku-card-${sku.skuCode}`}
    >
      <ShopSkuThumbnail
        sku={sku}
        variant="card"
        testID={CLIENT_SHOP_TEST_IDS.SKU_CARD_THUMBNAIL}
      />
      <View style={styles.cardInner}>
        <AccentBar />
        <View style={styles.body}>
          {onPressDetail ? (
            <Pressable
              onPress={handleDetail}
              accessibilityRole="link"
              accessibilityLabel={`${sku.title} 상세보기`}
              hitSlop={4}
            >
              <Text
                style={[
                  styles.title,
                  styles.titleLink,
                  {
                    color: theme.colors.primary,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                  },
                ]}
                numberOfLines={2}
              >
                {toDisplayString(sku.title, '상품')}
              </Text>
            </Pressable>
          ) : (
            <Text
              style={[
                styles.title,
                {
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                },
              ]}
              numberOfLines={2}
            >
              {toDisplayString(sku.title, '상품')}
            </Text>
          )}
          {sku.descriptionText ? (
            <Text
              style={[
                styles.desc,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                },
              ]}
              numberOfLines={3}
            >
              {sku.descriptionText}
            </Text>
          ) : null}
          <View style={styles.footer}>
            <PriceText amountMinor={sku.unitPriceMinor} currency={sku.currency} />
            <View style={styles.actions}>
              {pointsRedeemable ? (
                <Coins
                  size={18}
                  color={theme.colors.accent}
                  accessibilityLabel="포인트 사용 가능"
                />
              ) : null}
              <Pressable
                onPress={handleAdd}
                disabled={loading}
                style={({ pressed }) => [
                  styles.cta,
                  {
                    backgroundColor: pressed ? theme.colors.primaryDark : theme.colors.primaryLight,
                    borderRadius: theme.borderRadius.md,
                    opacity: loading ? 0.5 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${sku.title} 장바구니에 담기`}
              >
                <Text
                  style={[
                    styles.ctaText,
                    {
                      color: theme.colors.textMain,
                      fontFamily: theme.fontFamily.medium,
                      fontSize: theme.fontSize.sm,
                    },
                  ]}
                >
                  담기
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    minHeight: 44,
  },
  cardInner: {
    flexDirection: 'row',
    flex: 1,
    minHeight: 0,
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  title: {
    lineHeight: 22,
  },
  titleLink: {},
  desc: {
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cta: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    lineHeight: 20,
  },
});
