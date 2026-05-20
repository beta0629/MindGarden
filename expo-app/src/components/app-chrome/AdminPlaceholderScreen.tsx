/**
 * 관리자 모바일 — 단순 플레이스홀더 화면
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

interface AdminPlaceholderScreenProps {
  title: string;
}

export function AdminPlaceholderScreen({ title }: AdminPlaceholderScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <Text
        style={{
          color: theme.colors.textMain,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.base,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.xl,
        }}
        accessibilityRole="header"
      >
        {title}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
