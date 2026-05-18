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
  /** B0KlA KPI — 좌측 4px primary 악센트 바 + surface/border 카드 */
  showAccentBar?: boolean;
}

export function StatCard({
  label,
  value,
  unit,
  icon,
  style,
  onPress,
  showAccentBar = false,
}: StatCardProps) {
  const theme = useTheme();
  const accessibilityLabel = `${label}: ${value}${unit ? ` ${unit}` : ''}`;
  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      ...(showAccentBar
        ? { borderWidth: 1, borderColor: theme.colors.border }
        : theme.shadows.sm),
    },
    showAccentBar ? styles.cardAccentLayout : null,
    style,
  ];

  const valueFontSize = showAccentBar ? theme.fontSize['2xl'] : theme.fontSize.xl;

  const content = (
    <>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text
        style={[
          styles.value,
          {
            color: showAccentBar ? theme.colors.textMain : theme.colors.primary,
            fontFamily: theme.fontFamily.bold,
            fontSize: valueFontSize,
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

  const accentBar = showAccentBar ? (
    <View
      style={[styles.accentBar, { backgroundColor: theme.colors.primary }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  ) : null;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        {accentBar}
        <View style={showAccentBar ? styles.cardInner : undefined}>{content}</View>
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} accessibilityLabel={accessibilityLabel} accessibilityRole="text">
      {accentBar}
      <View style={showAccentBar ? styles.cardInner : undefined}>{content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  cardAccentLayout: {
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    padding: 0,
  },
  accentBar: {
    width: 4,
  },
  cardInner: {
    flex: 1,
    padding: 16,
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
