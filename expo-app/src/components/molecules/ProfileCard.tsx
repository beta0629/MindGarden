/**
 * ProfileCard — 더보기 메뉴 상단 프로필 카드
 * 아바타 + 이름 + 서브텍스트(전문분야 등)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { StyleSheet, View, Text } from 'react-native';
import { User } from 'lucide-react-native';
import { useTheme } from '@/theme';

const AVATAR_SIZE = 56;

interface ProfileCardProps {
  name: string;
  subtitle: string;
}

export function ProfileCard({ name, subtitle }: ProfileCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          ...theme.shadows.sm,
        },
      ]}
    >
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: theme.colors.accentSoft,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <User size={28} color={theme.colors.textSecondary} />
      </View>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.name,
            {
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.lg,
            },
          ]}
          accessibilityRole="text"
        >
          {name}
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    marginBottom: 4,
  },
  subtitle: {},
});
