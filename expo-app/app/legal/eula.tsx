/**
 * /legal/eula — App Store 1.2 UGC zero-tolerance EULA
 *
 * @author MindGarden
 * @since 2026-09-11
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { APP_STORE_EULA_COPY } from '@/constants/appStoreEulaCopy';
import { TabletContentShell } from '@/components/layout/TabletContentShell';

export default function AppStoreEulaScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bgMain }]}>
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.colors.divider,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          style={styles.backBtn}
        >
          <Text
            style={{
              color: theme.colors.primary,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.base,
            }}
          >
            닫기
          </Text>
        </Pressable>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.lg,
          }}
          accessibilityRole="header"
        >
          {APP_STORE_EULA_COPY.TITLE}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <TabletContentShell>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={[
              styles.ageNote,
              {
                color: theme.colors.warning,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.sm,
                backgroundColor: theme.colors.accentSoft,
              },
            ]}
            testID="eula-age-rating-note"
          >
            {APP_STORE_EULA_COPY.AGE_RATING_NOTE}
          </Text>

          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              lineHeight: 22,
              marginBottom: 20,
            }}
          >
            {APP_STORE_EULA_COPY.INTRO}
          </Text>

          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              marginBottom: 8,
            }}
            testID="eula-zero-tolerance-heading"
          >
            {APP_STORE_EULA_COPY.ZERO_TOLERANCE_HEADING}
          </Text>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              lineHeight: 22,
              marginBottom: 20,
            }}
            testID="eula-zero-tolerance-body"
          >
            {APP_STORE_EULA_COPY.ZERO_TOLERANCE_BODY}
          </Text>

          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              marginBottom: 8,
            }}
          >
            {APP_STORE_EULA_COPY.REPORTING_HEADING}
          </Text>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              lineHeight: 22,
              marginBottom: 20,
            }}
          >
            {APP_STORE_EULA_COPY.REPORTING_BODY}
          </Text>

          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.sm,
              lineHeight: 22,
            }}
          >
            {APP_STORE_EULA_COPY.AGREEMENT}
          </Text>
        </ScrollView>
      </TabletContentShell>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    minWidth: 48,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  ageNote: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
});
