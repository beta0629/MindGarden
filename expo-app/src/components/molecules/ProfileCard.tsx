/**
 * ProfileCard — 더보기 메뉴 상단 프로필 카드
 * 아바타(원격 이미지 또는 이니셜 fallback) + 이름 + 서브텍스트(전문분야 등)
 *
 * P1 핫픽스 (2026-06-10): `imageUri` prop 을 추가하고 공통 `Avatar` atom 으로 위임한다.
 * 기존에는 항상 lucide `<User>` placeholder 만 그렸기 때문에, BE 가 보내준
 * `users.profile_image_url` 이 더보기 상단 카드에 표시되지 않았다 (운영 P1 — user id=20 사례).
 * Avatar 가 이미 `resolveAvatarSourceUri` + 인증 헤더 + 로드 실패 fallback 을 처리하므로
 * 동일 화면에서 일관된 렌더 동작을 보장한다.
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '@/theme';
import { Avatar } from '@/components/atoms/Avatar';
import { shouldRenderProfileCardAvatar } from '@/components/molecules/profileCardAvatarMode';

const AVATAR_SIZE = 56;

interface ProfileCardProps {
  name: string;
  subtitle: string;
  /**
   * 원격 프로필 이미지 URI. 상대 path(`/api/v1/files/...`) 또는 절대 URL 모두 허용.
   * 비어 있으면 Avatar 가 이니셜/lucide User placeholder 로 fallback 한다.
   */
  imageUri?: string | null;
}

export function ProfileCard({ name, subtitle, imageUri }: ProfileCardProps) {
  const theme = useTheme();
  // shouldRenderProfileCardAvatar 와 동일 분기를 따른다 (pure helper 로 jest 회귀 보호).
  const avatarUri = shouldRenderProfileCardAvatar(imageUri) ? imageUri : null;

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
      <Avatar
        uri={avatarUri}
        name={name}
        size="lg"
        style={styles.avatar}
      />
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
