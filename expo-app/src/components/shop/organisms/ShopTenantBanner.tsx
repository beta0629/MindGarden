/**
 * ShopTenantBanner — 테넌트 배너 Organism
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { SHOP_BANNER_PLACEHOLDER_COPY } from '@/constants/clientShopConstants';
import { toDisplayString } from '@/utils/toDisplayString';

interface ShopTenantBannerProps {
  tenantLabel?: string | null;
}

export function ShopTenantBanner({ tenantLabel }: ShopTenantBannerProps) {
  const theme = useTheme();
  const headline = tenantLabel
    ? `${toDisplayString(tenantLabel, '마음 돌봄')} 상품을 둘러보세요`
    : SHOP_BANNER_PLACEHOLDER_COPY;

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.banner, { borderRadius: theme.borderRadius.xl }]}
      accessibilityRole="header"
    >
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.textOnPrimary,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.xl,
          },
        ]}
      >
        {headline}
      </Text>
      <View style={styles.spacer} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 88,
    justifyContent: 'center',
  },
  title: {
    lineHeight: 28,
  },
  spacer: {
    height: 0,
  },
});
