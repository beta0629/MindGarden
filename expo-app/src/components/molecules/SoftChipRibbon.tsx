/**
 * SoftChipRibbon — pastel soft chips (비대칭 wrap/flow)
 * equal 2×2 / KPI 3-col FAIL · amber = 미결제만 · 긴 이름 break-ui.
 *
 * @author MindGarden
 * @since 2026-10-28
 */
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import type { AppTheme } from '@/theme/client-theme';
import {
  SOFT_CHIP_ITEM_LAYOUT,
  SOFT_CHIP_RIBBON_LAYOUT,
  type SoftChipItem,
  type SoftChipTone,
} from './softChipRibbonLayout';

export type { SoftChipItem, SoftChipTone };

export interface SoftChipRibbonProps {
  readonly items: readonly SoftChipItem[];
  readonly style?: ViewStyle;
  readonly accessibilityLabel?: string;
}

function SoftChip({ item }: { readonly item: SoftChipItem }) {
  const theme = useTheme();
  const fill = resolveToneFill(item.tone, theme);
  const valueColor =
    item.tone === 'unpaid' ? theme.colors.amberUnpaid : theme.colors.textMain;
  const labelColor =
    item.tone === 'unpaid' ? theme.colors.amberUnpaid : theme.colors.slate;

  return (
    <View
      style={[
        styles.chip,
        SOFT_CHIP_ITEM_LAYOUT,
        {
          backgroundColor: fill,
          borderColor: theme.colors.lineWarm,
          borderRadius: theme.borderRadius.xl,
        },
      ]}
      accessibilityLabel={`${item.label} ${item.value}`}
    >
      <Text
        style={{
          fontFamily: theme.fontFamily.bold,
          fontSize: theme.fontSize.xs,
          color: labelColor,
          opacity: 0.85,
          marginBottom: theme.spacing.xs,
        }}
      >
        {item.label}
      </Text>
      <View style={styles.valueRow}>
        <Text
          style={{
            fontFamily: theme.fontFamily.bold,
            fontSize: theme.fontSize.sm,
            color: valueColor,
            letterSpacing: -0.24,
            flexShrink: 1,
          }}
        >
          {item.value}
        </Text>
        {item.badge ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: theme.fontFamily.bold,
                fontSize: theme.fontSize['2xs'],
                color: theme.colors.slate,
              }}
            >
              {item.badge}
            </Text>
          </View>
        ) : null}
      </View>
      {item.sub ? (
        <Text
          style={{
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.xs,
            color: theme.colors.mute,
            marginTop: theme.spacing.xs,
          }}
        >
          {item.sub}
        </Text>
      ) : null}
    </View>
  );
}

function resolveToneFill(tone: SoftChipTone, theme: AppTheme): string {
  switch (tone) {
    case 'peach':
      return theme.colors.chipPeach;
    case 'mint':
      return theme.colors.chipMint;
    case 'lavender':
      return theme.colors.chipLavender;
    case 'cream':
      return theme.colors.chipCream;
    case 'unpaid':
      return theme.colors.amberUnpaidBg;
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

export function SoftChipRibbon({
  items,
  style,
  accessibilityLabel = '상태',
}: SoftChipRibbonProps) {
  return (
    <View
      style={[SOFT_CHIP_RIBBON_LAYOUT, styles.ribbon, style]}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
    >
      {items.map((item) => (
        <SoftChip key={item.id} item={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ribbon: {
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  valueRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    height: 20,
    paddingHorizontal: 8,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
