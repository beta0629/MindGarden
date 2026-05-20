/**
 * AppTopBar — 앱 상단 네비게이션 바
 * 타이틀 + 선택적 뒤로가기 버튼
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme';

interface AppTopBarProps {
  title: string;
  canGoBack?: boolean;
  rightAction?: React.ReactNode;
}

export function AppTopBar({ title, canGoBack, rightAction }: AppTopBarProps) {
  const theme = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  return (
    <View
      style={[styles.container, { borderBottomColor: theme.colors.divider }]}
      accessibilityRole="header"
    >
      {canGoBack ? (
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          hitSlop={8}
        >
          <ChevronLeft size={24} color={theme.colors.textMain} />
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}

      <Text
        style={[
          styles.title,
          {
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.lg,
            color: theme.colors.textMain,
          },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>

      {rightAction ? (
        <View style={styles.rightSlot}>{rightAction}</View>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  rightSlot: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
