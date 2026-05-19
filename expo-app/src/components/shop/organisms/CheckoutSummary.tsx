/**
 * CheckoutSummary — 결제 금액 요약 Organism
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { formatShopMoney } from '@/utils/clientShopFormat';

interface CheckoutSummaryProps {
  subtotalMinor: number;
  pointsRedeemMinor: number;
  cashDueMinor: number;
}

export function CheckoutSummary({
  subtotalMinor,
  pointsRedeemMinor,
  cashDueMinor,
}: CheckoutSummaryProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.borderRadius.xl,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel="결제 금액 요약"
    >
      <Text
        style={[
          styles.sectionTitle,
          {
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.base,
          },
        ]}
      >
        결제 금액
      </Text>
      <View style={styles.row}>
        <Text
          style={[
            styles.label,
            { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
          ]}
        >
          상품 총액
        </Text>
        <Text
          style={[
            styles.value,
            { color: theme.colors.textMain, fontFamily: theme.fontFamily.medium },
          ]}
        >
          {formatShopMoney(subtotalMinor)}
        </Text>
      </View>
      <View style={styles.row}>
        <Text
          style={[
            styles.label,
            { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
          ]}
        >
          포인트 할인
        </Text>
        <Text
          style={[
            styles.value,
            styles.discount,
            { color: theme.colors.accent, fontFamily: theme.fontFamily.medium },
          ]}
        >
          - {formatShopMoney(pointsRedeemMinor)}
        </Text>
      </View>
      <View
        style={[
          styles.row,
          styles.totalRow,
          { borderTopColor: theme.colors.divider },
        ]}
      >
        <Text
          style={[
            styles.totalLabel,
            { color: theme.colors.textMain, fontFamily: theme.fontFamily.semibold },
          ]}
        >
          최종 PG 결제액
        </Text>
        <Text
          style={[
            styles.totalValue,
            { color: theme.colors.primary, fontFamily: theme.fontFamily.bold },
          ]}
        >
          {formatShopMoney(cashDueMinor)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  sectionTitle: {
    lineHeight: 22,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
  },
  value: {
    fontSize: 14,
    lineHeight: 20,
  },
  discount: {},
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLabel: {
    fontSize: 16,
    lineHeight: 24,
  },
  totalValue: {
    fontSize: 24,
    lineHeight: 32,
  },
});
