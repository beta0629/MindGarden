/**
 * Avatar — 프로필 사진 또는 이니셜 표시 atom
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { StyleSheet, Text, View, type ViewStyle, type ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { useTheme } from '@/theme';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

export function Avatar({ uri, name, size = 'md', style }: AvatarProps) {
  const theme = useTheme();
  const dimension = SIZE_MAP[size];

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[containerStyle as ImageStyle, style as ImageStyle]}
        contentFit="cover"
        transition={200}
        accessibilityLabel={name ? `${name} 프로필 사진` : '프로필 사진'}
      />
    );
  }

  const initial = name?.charAt(0)?.toUpperCase() ?? '';

  return (
    <View
      style={[containerStyle, styles.fallback, style]}
      accessibilityLabel={name ? `${name} 아바타` : '아바타'}
    >
      {initial ? (
        <Text
          style={{
            fontFamily: theme.fontFamily.semibold,
            fontSize: dimension * 0.4,
            color: theme.colors.textSecondary,
          }}
        >
          {initial}
        </Text>
      ) : (
        <User size={dimension * 0.5} color={theme.colors.textSecondary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
