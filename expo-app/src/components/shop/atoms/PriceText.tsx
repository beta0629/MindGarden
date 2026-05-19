/**
 * PriceText — 통화·금액 표시 atom
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { StyleSheet, Text, type TextStyle } from 'react-native';
import { useTheme } from '@/theme';
import { formatShopMoney } from '@/utils/clientShopFormat';

interface PriceTextProps {
  amountMinor: number;
  currency?: string;
  style?: TextStyle;
}

export function PriceText({ amountMinor, currency = 'KRW', style }: PriceTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        styles.price,
        {
          color: theme.colors.textMain,
          fontFamily: theme.fontFamily.semibold,
          fontSize: theme.fontSize.lg,
        },
        style,
      ]}
      accessibilityRole="text"
    >
      {formatShopMoney(amountMinor, currency)}
    </Text>
  );
}

const styles = StyleSheet.create({
  price: {
    lineHeight: 26,
  },
});
