/**
 * StatCard — 통계 카드 atom
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function StatCard({ label, value, unit, icon, style }: StatCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
          ...theme.shadows.sm,
        },
        style,
      ]}
      accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}`}
      accessibilityRole="text"
    >
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text
        style={[
          styles.value,
          {
            color: theme.colors.primary,
            fontFamily: theme.fontFamily.bold,
            fontSize: theme.fontSize.xl,
          },
        ]}
      >
        {value}
        {unit ? (
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
            }}
          >
            {` ${unit}`}
          </Text>
        ) : null}
      </Text>
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: 8,
  },
  value: {
    marginBottom: 4,
  },
  label: {
    textAlign: 'center',
  },
});
