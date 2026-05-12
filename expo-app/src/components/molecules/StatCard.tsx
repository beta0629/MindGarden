/**
 * 통계 카드 (Molecule)
 * 숫자 + 라벨 + 아이콘
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';

interface StatCardProps {
  readonly icon: LucideIcon;
  readonly value: number | string;
  readonly label: string;
  readonly index?: number;
  readonly accentColor?: string;
}

const ICON_SIZE = 24;

export function StatCard({
  icon: Icon,
  value,
  label,
  index = 0,
  accentColor,
}: StatCardProps) {
  const theme = useTheme();
  const iconColor = accentColor ?? theme.colors.primary;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(300)}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.lg,
          ...theme.shadows.sm,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}
    >
      <View
        style={[
          styles.iconBg,
          {
            backgroundColor: iconColor + '15',
            borderRadius: theme.borderRadius.lg,
            width: 40,
            height: 40,
          },
        ]}
      >
        <Icon size={ICON_SIZE} color={iconColor} />
      </View>

      <Text
        style={[
          styles.value,
          {
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.bold,
            fontSize: theme.fontSize['2xl'],
            marginTop: theme.spacing.sm,
          },
        ]}
      >
        {value}
      </Text>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.xs,
          marginTop: theme.spacing['2xs'],
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 100,
  },
  iconBg: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    lineHeight: 32,
  },
});
