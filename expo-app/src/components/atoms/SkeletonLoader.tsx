/**
 * SkeletonLoader — 로딩 플레이스홀더 atom
 * Reanimated 기반 shimmer 효과
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useTheme, spacing } from '@/theme';

interface SkeletonLoaderProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) {
  const theme = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as ViewStyle['width'],
          height,
          borderRadius,
          backgroundColor: theme.colors.gray[200],
        },
        animatedStyle,
        style,
      ]}
      accessibilityLabel="로딩 중"
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
  style?: ViewStyle;
}

export function SkeletonCard({ lines = 3, style }: SkeletonCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
        },
        style,
      ]}
    >
      <View style={styles.cardHeader}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View style={styles.cardHeaderText}>
          <SkeletonLoader width="60%" height={14} />
          <SkeletonLoader width="40%" height={12} />
        </View>
      </View>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader
          key={i}
          width={i === lines - 1 ? '70%' : '100%'}
          height={12}
          style={styles.line}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: spacing.md,
    gap: 6,
  },
  line: {
    marginTop: spacing.sm,
  },
});
