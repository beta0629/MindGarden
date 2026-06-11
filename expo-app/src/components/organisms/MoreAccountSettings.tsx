/**
 * 더보기 스택 — 앱 설정 허브(알림·버전·안내)
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Bell, ChevronLeft, Info, ShieldOff } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import { toDisplayString } from '@/utils/safeDisplay';

export interface MoreAccountSettingsProps {
  readonly notificationSettingsHref: Href;
  readonly profileHref: Href;
  /**
   * Apple G1.2 UGC (P2-C) — 차단된 사용자 목록 진입. 제공되지 않으면 행을 노출하지 않는다
   * (어드민/상담사 등 비-내담자 역할에서는 비활성).
   */
  readonly blockedUsersHref?: Href;
}

export function MoreAccountSettings({
  notificationSettingsHref,
  profileHref,
  blockedUsersHref,
}: MoreAccountSettingsProps) {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const appVersion = Constants.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '—';

  const tenantHint =
    user?.tenantId != null && String(user.tenantId).trim() !== ''
      ? `현재 접속 테넌트: ${toDisplayString(user.tenantId)}`
      : '테넌트는 로그인·기관 연동 시 자동 적용됩니다.';

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top', 'bottom']}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
        >
          <ChevronLeft size={24} color={theme.colors.textMain} />
        </Pressable>
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.lg,
          }}
        >
          앱 설정
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.xl,
              ...theme.shadows.sm,
            },
          ]}
        >
          <View style={styles.infoRow}>
            <Info size={20} color={theme.colors.accent} />
            <Text
              style={{
                flex: 1,
                marginLeft: 12,
                color: theme.colors.textSecondary,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                lineHeight: 20,
              }}
            >
              푸시·이메일 알림은 아래에서 켜고 끌 수 있습니다. OS의 방해 금지·집중 모드 설정도 함께
              확인해 주세요.
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.sectionLabel,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.xs,
            },
          ]}
        >
          연결
        </Text>
        <View
          style={[
            styles.menuCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
            },
          ]}
        >
          <Pressable
            onPress={() => router.push(notificationSettingsHref)}
            style={({ pressed }) => [
              styles.menuRow,
              { backgroundColor: pressed ? theme.colors.accentSoft : 'transparent' },
            ]}
            accessibilityRole="button"
            accessibilityLabel="알림 설정"
          >
            <Bell size={20} color={theme.colors.primary} />
            <Text
              style={{
                flex: 1,
                marginLeft: 12,
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.base,
              }}
            >
              알림 설정
            </Text>
            <Text style={{ color: theme.colors.textTertiary, fontSize: theme.fontSize.lg }}>›</Text>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
          <Pressable
            onPress={() => router.push(profileHref)}
            style={({ pressed }) => [
              styles.menuRow,
              { backgroundColor: pressed ? theme.colors.accentSoft : 'transparent' },
            ]}
            accessibilityRole="button"
            accessibilityLabel="프로필로 이동"
          >
            <Text
              style={{
                flex: 1,
                marginLeft: 4,
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.base,
              }}
            >
              프로필 · 계정 정보
            </Text>
            <Text style={{ color: theme.colors.textTertiary, fontSize: theme.fontSize.lg }}>›</Text>
          </Pressable>
          {blockedUsersHref ? (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
              <Pressable
                onPress={() => router.push(blockedUsersHref)}
                style={({ pressed }) => [
                  styles.menuRow,
                  { backgroundColor: pressed ? theme.colors.accentSoft : 'transparent' },
                ]}
                accessibilityRole="button"
                accessibilityLabel="차단된 사용자 목록으로 이동"
                testID="more-account-settings-blocked-users"
              >
                <ShieldOff size={20} color={theme.colors.textSecondary} />
                <Text
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.base,
                  }}
                >
                  차단된 사용자
                </Text>
                <Text style={{ color: theme.colors.textTertiary, fontSize: theme.fontSize.lg }}>›</Text>
              </Pressable>
            </>
          ) : null}
        </View>

        <Text
          style={[
            styles.sectionLabel,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.xs,
            },
          ]}
        >
          앱 정보
        </Text>
        <View
          style={[
            styles.metaCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
            },
          ]}
        >
          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
            }}
          >
            버전 {appVersion}
          </Text>
          <Text
            style={{
              marginTop: 10,
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              lineHeight: 20,
            }}
          >
            {tenantHint}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: {
    width: 32,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sectionLabel: {
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  metaCard: {
    padding: 16,
  },
});
