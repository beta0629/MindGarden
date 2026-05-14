/**
 * RatingStars — 별점 입력/표시 (1~5, 터치 선택)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Star } from 'lucide-react-native';
import { useTheme } from '@/theme';

interface RatingStarsProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}

const MAX_STARS = 5;

export function RatingStars({ value, onChange, size = 32, readonly = false }: RatingStarsProps) {
  const theme = useTheme();

  const handlePress = (starIndex: number) => {
    if (readonly) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onChange?.(starIndex + 1);
  };

  return (
    <View
      style={styles.container}
      accessibilityLabel={`별점 ${value}점`}
      accessibilityRole="adjustable"
    >
      {Array.from({ length: MAX_STARS }).map((_, i) => {
        const filled = i < value;
        return (
          <Pressable
            key={i}
            onPress={() => handlePress(i)}
            disabled={readonly}
            hitSlop={4}
            style={styles.star}
            accessibilityLabel={`${i + 1}점`}
          >
            <Star
              size={size}
              color={theme.colors.warning}
              fill={filled ? theme.colors.warning : 'transparent'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    padding: 2,
  },
});
