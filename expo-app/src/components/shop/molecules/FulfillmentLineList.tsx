/**
 * 주문 상세 — SKU 단위 이행(fulfillment) 상태 목록
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import {
  formatShopFulfillmentBadge,
  type ShopOrderFulfillmentLine,
} from '@/constants/clientShopConstants';
import { toDisplayString } from '@/utils/toDisplayString';

type FulfillmentLineListProps = {
  readonly fulfillmentLines?: ShopOrderFulfillmentLine[];
};

function resolveFulfillmentBadgeColor(
  statusKey: string,
  colors: { primary: string; warning: string; textSecondary: string },
): string {
  if (statusKey === 'completed') {
    return colors.primary;
  }
  if (statusKey === 'pending') {
    return colors.warning;
  }
  return colors.textSecondary;
}

export function FulfillmentLineList({ fulfillmentLines = [] }: FulfillmentLineListProps) {
  const theme = useTheme();

  if (!fulfillmentLines.length) {
    return null;
  }

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
      accessibilityLabel="이행 상태"
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
        이행 상태
      </Text>
      {fulfillmentLines.map((line) => {
        const key = `${line.skuCode}-${line.category}-${line.status}`;
        const badge = formatShopFulfillmentBadge(line);
        const statusKey = (line.status || '').toLowerCase();
        const badgeColor = resolveFulfillmentBadgeColor(statusKey, {
          primary: theme.colors.primary,
          warning: theme.colors.warning,
          textSecondary: theme.colors.textSecondary,
        });
        return (
          <View
            key={key}
            style={[styles.item, { borderTopColor: theme.colors.divider }]}
          >
            <View style={styles.itemHead}>
              <Text
                style={[
                  styles.sku,
                  { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
                ]}
                numberOfLines={1}
              >
                {toDisplayString(line.skuCode, 'SKU')}
              </Text>
              <View
                style={[
                  styles.badge,
                  statusKey === 'completed' && styles.badgeCompleted,
                  statusKey === 'pending' && styles.badgePending,
                  statusKey === 'skipped' && styles.badgeSkipped,
                  {
                    backgroundColor: badgeColor,
                    borderRadius: theme.borderRadius.sm,
                  },
                ]}
                accessibilityLabel={badge}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: theme.colors.textOnPrimary,
                      fontFamily: theme.fontFamily.medium,
                      fontSize: theme.fontSize.xs,
                    },
                  ]}
                >
                  {badge}
                </Text>
              </View>
            </View>
            {line.message ? (
              <Text
                style={[
                  styles.message,
                  { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
                ]}
              >
                {line.message}
              </Text>
            ) : null}
          </View>
        );
      })}
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
  sectionTitle: { lineHeight: 22, marginBottom: 4 },
  item: {
    paddingTop: 10,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  itemHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sku: { fontSize: 13, lineHeight: 18, flex: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '55%',
  },
  badgeCompleted: {},
  badgePending: {},
  badgeSkipped: {},
  badgeText: { lineHeight: 16, textAlign: 'center' },
  message: { fontSize: 12, lineHeight: 18 },
});
