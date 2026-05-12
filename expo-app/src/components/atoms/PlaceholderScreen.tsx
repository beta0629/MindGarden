/**
 * 공통 Placeholder 화면 — Phase 2 이후 구현될 화면의 임시 표시
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

interface PlaceholderScreenProps {
  title: string;
  phase?: string;
}

export function PlaceholderScreen({ title, phase = 'Phase 2' }: PlaceholderScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <View style={styles.container}>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.xl,
            },
          ]}
          accessibilityRole="header"
        >
          {title}
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
          {phase}에서 구현 예정
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
});
