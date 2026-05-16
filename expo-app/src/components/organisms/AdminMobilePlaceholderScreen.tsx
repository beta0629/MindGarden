/**
 * 어드민 모바일 — 준비 중 플레이스홀더(콘텐츠 헤더 + API 힌트)
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { ADMIN_MOBILE_OPERATION_COPY } from '@/constants/adminMobileScreensCopy';
import { toDisplayString } from '@/utils/safeDisplay';

interface AdminMobilePlaceholderScreenProps {
  title: string;
  subtitle?: string;
  apiPathHint: string;
}

export function AdminMobilePlaceholderScreen({
  title,
  subtitle,
  apiPathHint,
}: AdminMobilePlaceholderScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title={title} canGoBack />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: theme.spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.lg,
            marginTop: theme.spacing.lg,
          }}
          accessibilityRole="header"
        >
          {ADMIN_MOBILE_OPERATION_COPY.PLACEHOLDER_TITLE}
        </Text>
        {subtitle ? (
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              marginTop: theme.spacing.sm,
            }}
          >
            {toDisplayString(subtitle, '')}
          </Text>
        ) : null}
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            marginTop: theme.spacing.md,
            lineHeight: 22,
          }}
        >
          {ADMIN_MOBILE_OPERATION_COPY.PLACEHOLDER_BODY}
        </Text>
        <View
          style={[
            styles.hintBox,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              marginTop: theme.spacing.xl,
              padding: theme.spacing.lg,
            },
          ]}
        >
          <Text
            style={{
              color: theme.colors.textTertiary,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.xs,
              marginBottom: theme.spacing.xs,
            }}
          >
            API (다음 단계)
          </Text>
          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
            }}
            selectable
          >
            {toDisplayString(apiPathHint, '—')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  hintBox: {},
});
