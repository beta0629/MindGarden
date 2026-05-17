/**
 * StatCard — 통계 카드 atom
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function StatCard({ label, value, unit, icon, style, onPress }: StatCardProps) {
  const theme = useTheme();
  const accessibilityLabel = `${label}: ${value}${unit ? ` ${unit}` : ''}`;
  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      ...theme.shadows.sm,
    },
    style,
  ];

  const content = (
    <>
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
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} accessibilityLabel={accessibilityLabel} accessibilityRole="text">
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
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
