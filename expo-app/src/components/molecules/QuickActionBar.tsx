/**
 * 빠른 액션 바 (Molecule)
 * 아이콘 버튼 3~4개 가로 배치
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';

export interface QuickAction {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly onPress: () => void;
}

interface QuickActionBarProps {
  readonly actions: QuickAction[];
}

const ICON_SIZE = 24;
const CIRCLE_SIZE = 52;

function QuickActionButton({ icon: Icon, label, onPress }: QuickAction) {
  const theme = useTheme();

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.actionItem}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: theme.colors.primary + '12',
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            borderRadius: CIRCLE_SIZE / 2,
          },
        ]}
      >
        <Icon size={ICON_SIZE} color={theme.colors.primary} />
      </View>
      <Text
        style={{
          color: theme.colors.textMain,
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.fontSize.xs,
          marginTop: theme.spacing.sm,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function QuickActionBar({ actions }: QuickActionBarProps) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(300)}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
          paddingVertical: theme.spacing.lg,
          paddingHorizontal: theme.spacing.md,
          ...theme.shadows.sm,
        },
      ]}
    >
      {actions.map((action) => (
        <QuickActionButton key={action.label} {...action} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  actionItem: {
    alignItems: 'center',
    minWidth: 64,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
