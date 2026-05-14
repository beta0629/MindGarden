/**
 * WellnessCard — 웰니스 진입 카드 (내담자용 molecule)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';

interface WellnessCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index?: number;
  onPress?: () => void;
}

export function WellnessCard({ icon, title, description, index = 0, onPress }: WellnessCardProps) {
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
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
        accessibilityLabel={`${title}. ${description}`}
        accessibilityRole="button"
      >
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryLight + '30' }]}>
          {icon}
        </View>
        <View style={styles.textWrap}>
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              color: theme.colors.textMain,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
            }}
            numberOfLines={2}
          >
            {description}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
});
