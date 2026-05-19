/**
 * LedgerListItem — 포인트 원장 1줄 Molecule
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { formatShopDateTime, formatShopPoints } from '@/utils/clientShopFormat';
import {
  isPointLedgerCredit,
  resolvePointLedgerLabel,
} from '@/constants/clientShopConstants';
import type { ShopPointLedgerEntry } from '@/api/hooks/useClientShopPoints';

interface LedgerListItemProps {
  entry: ShopPointLedgerEntry;
  onPressDetail?: () => void;
}

export function LedgerListItem({ entry, onPressDetail }: LedgerListItemProps) {
  const theme = useTheme();
  const typeLabel = resolvePointLedgerLabel(entry);
  const dateText = formatShopDateTime(entry.createdAt);
  const isCredit = isPointLedgerCredit(entry.type);
  const amountText = isCredit
    ? `+ ${formatShopPoints(entry.amountMinor)}`
    : `- ${formatShopPoints(entry.amountMinor)}`;

  const handlePress = () => {
    if (!onPressDetail) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPressDetail();
  };

  return (
    <View
      style={[
        styles.item,
        {
          borderBottomColor: theme.colors.divider,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <View style={styles.left}>
        <Text
          style={[
            styles.type,
            {
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.base,
            },
          ]}
        >
          {typeLabel}
        </Text>
        {dateText ? (
          <Text
            style={[
              styles.date,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
              },
            ]}
          >
            {dateText}
          </Text>
        ) : null}
        {entry.orderPublicId && onPressDetail ? (
          <Pressable
            onPress={handlePress}
            accessibilityRole="link"
            accessibilityLabel={`주문 번호 ${entry.orderPublicId} 상세보기`}
            hitSlop={4}
          >
            <Text
              style={[
                styles.link,
                {
                  color: theme.colors.primary,
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize.sm,
                },
              ]}
            >
              주문 번호 {entry.orderPublicId} 상세보기
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            {
              color: isCredit ? theme.colors.primary : theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
            },
          ]}
        >
          {amountText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
    minHeight: 44,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  right: {
    alignItems: 'flex-end',
  },
  type: {
    lineHeight: 22,
  },
  date: {
    lineHeight: 18,
  },
  link: {
    lineHeight: 20,
    marginTop: 4,
  },
  amount: {
    lineHeight: 22,
  },
});
