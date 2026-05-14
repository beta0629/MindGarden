/**
 * MenuListItem — 더보기 메뉴용 리스트 아이템
 * 아이콘 + 제목 + 우측 화살표 + Pressable ripple
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Platform, Pressable, StyleSheet, View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';

const ICON_SIZE = 22;
const CHEVRON_SIZE = 18;
const TOUCH_MIN_HEIGHT = 52;

interface MenuListItemProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
}

export function MenuListItem({
  icon: Icon,
  title,
  subtitle,
  onPress,
  disabled = false,
}: MenuListItemProps) {
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
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? theme.colors.accentSoft : theme.colors.surface,
          borderBottomColor: theme.colors.divider,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      android_ripple={{ color: theme.colors.accentSoft }}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.accentSoft }]}>
        <Icon size={ICON_SIZE} color={theme.colors.primary} />
      </View>

      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.base,
            },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>

      <ChevronRight size={CHEVRON_SIZE} color={theme.colors.gray[400]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH_MIN_HEIGHT,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    lineHeight: 22,
  },
  subtitle: {
    marginTop: 2,
  },
});
