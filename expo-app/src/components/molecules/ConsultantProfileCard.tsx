/**
 * ConsultantProfileCard — 상담사 프로필 카드 (예약 시 사용, molecule)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Star } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Avatar } from '../atoms/Avatar';
import { Chip } from '../atoms/Chip';
import type { Consultant } from '@/api/hooks/useBooking';

interface ConsultantProfileCardProps {
  consultant: Consultant;
  index?: number;
  onPress?: () => void;
}

export function ConsultantProfileCard({
  consultant,
  index = 0,
  onPress,
}: ConsultantProfileCardProps) {
  const theme = useTheme();

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.xl,
            ...theme.shadows.sm,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
        accessibilityLabel={`${consultant.name}, 평점 ${consultant.averageRating}, 리뷰 ${consultant.reviewCount}건`}
        accessibilityRole="button"
      >
        <View style={styles.topRow}>
          <Avatar
            uri={consultant.profileImageUrl}
            name={consultant.name}
            size="lg"
          />
          <View style={styles.info}>
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                color: theme.colors.textMain,
              }}
              numberOfLines={1}
            >
              {consultant.name} 전문가
            </Text>
            <View style={styles.ratingRow}>
              <Star
                size={14}
                color={theme.colors.warning}
                fill={theme.colors.warning}
              />
              <Text
                style={{
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textMain,
                  marginLeft: 4,
                }}
              >
                {consultant.averageRating.toFixed(1)}
              </Text>
              <Text
                style={{
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textTertiary,
                  marginLeft: 4,
                }}
              >
                ({consultant.reviewCount}개 리뷰)
              </Text>
            </View>
          </View>
        </View>

        {consultant.specialties.length > 0 && (
          <View style={styles.specialties}>
            {consultant.specialties.map((spec) => (
              <Chip key={spec} label={spec} disabled style={styles.specChip} />
            ))}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  specChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
