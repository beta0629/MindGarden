/**
 * Apple G1.2 UGC (P2-C) — 40×40 원형 아바타 (이름 첫 글자 폴백).
 *
 * <p>디자이너 시안 §D.4 BlockedUserRow 의 Avatar molecule. 이미지 URL 이 있으면 `<Image>` 로,
 * 없으면 primary 배경에 닉네임 첫 글자(흰색)로 폴백한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';

export type UserAvatarProps = {
  readonly imageUri?: string;
  readonly displayName?: string;
  readonly size?: number;
  readonly testID?: string;
};

const DEFAULT_SIZE = 40;

/**
 * 닉네임 첫 글자 추출 — 이모지·공백을 건너뛰고 첫 영문/한글/숫자 1글자를 반환한다.
 *
 * @param name 표시명
 * @returns 첫 글자 (없으면 '·')
 */
function deriveInitial(name?: string): string {
  if (!name) {
    return '·';
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return '·';
  }
  // 한글·영문·숫자만 추출 — 첫 매칭 글자 1개.
  const match = trimmed.match(/[가-힣A-Za-z0-9]/);
  return match ? match[0].toUpperCase() : trimmed.slice(0, 1);
}

export function UserAvatar({ imageUri, displayName, size = DEFAULT_SIZE, testID }: UserAvatarProps) {
  const theme = useTheme();
  const initial = useMemo(() => deriveInitial(displayName), [displayName]);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (imageUri && imageUri.length > 0) {
    return (
      <Image
        source={{ uri: imageUri }}
        accessibilityRole="image"
        accessibilityLabel={displayName ?? '사용자 프로필 사진'}
        style={[styles.image, containerStyle, { backgroundColor: theme.colors.gray[100] }]}
        testID={testID}
      />
    );
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={displayName ?? '사용자 프로필 사진'}
      style={[
        styles.placeholder,
        containerStyle,
        { backgroundColor: theme.colors.primary },
      ]}
      testID={testID}
    >
      <Text
        style={{
          color: theme.colors.textOnPrimary,
          fontFamily: theme.fontFamily.semibold,
          fontSize: Math.floor(size * 0.4),
        }}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default UserAvatar;
