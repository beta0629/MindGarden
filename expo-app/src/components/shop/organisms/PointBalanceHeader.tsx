/**
 * PointBalanceHeader — 내 포인트 잔액 헤더 Organism
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { formatShopPoints } from '@/utils/clientShopFormat';

interface PointBalanceHeaderProps {
  availableMinor: number;
  heldMinor?: number;
}

export function PointBalanceHeader({ availableMinor, heldMinor = 0 }: PointBalanceHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.primary,
          borderRadius: theme.borderRadius.xl,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`사용 가능한 포인트 ${formatShopPoints(availableMinor)}`}
    >
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.textOnPrimary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
          },
        ]}
      >
        사용 가능한 포인트
      </Text>
      <Text
        style={[
          styles.balance,
          {
            color: theme.colors.textOnPrimary,
            fontFamily: theme.fontFamily.bold,
            fontSize: 32,
          },
        ]}
      >
        {formatShopPoints(availableMinor)}
      </Text>
      {heldMinor > 0 ? (
        <Text
          style={[
            styles.held,
            {
              color: theme.colors.textOnPrimary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.xs,
              opacity: 0.85,
            },
          ]}
        >
          보류 중 {formatShopPoints(heldMinor)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 6,
  },
  label: {
    lineHeight: 20,
  },
  balance: {
    lineHeight: 40,
  },
  held: {
    lineHeight: 18,
    marginTop: 4,
  },
});
