/**
 * 어드민·스태프 더보기 허브
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, LogOut, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { MenuListItem } from '@/components/molecules/MenuListItem';
import { ProfileCard } from '@/components/molecules/ProfileCard';
import { AuthService } from '@/services/AuthService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTenantStore } from '@/stores/useTenantStore';
import { isAdminRole } from '@/utils/adminRole';
import { toDisplayString } from '@/utils/safeDisplay';
import { ADMIN_MOBILE_MORE_COPY } from '@/constants/adminMobileScreensCopy';

export default function AdminMoreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const tenantName = useTenantStore((s) => s.tenantName);
  const showCommunityReview = isAdminRole(role);

  const profileName = toDisplayString(user?.name ?? user?.nickname, '관리자');
  const profileSubtitle = toDisplayString(tenantName ?? user?.email, '테넌트 관리');

  const handleLogout = () => {
    Alert.alert(
      ADMIN_MOBILE_MORE_COPY.LOGOUT_CONFIRM_TITLE,
      ADMIN_MOBILE_MORE_COPY.LOGOUT_CONFIRM_BODY,
      [
        { text: ADMIN_MOBILE_MORE_COPY.CANCEL, style: 'cancel' },
        {
          text: ADMIN_MOBILE_MORE_COPY.LOGOUT,
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.logout();
              router.replace('/(auth)/login');
            } catch {
              await useAuthStore.getState().logout();
              router.replace('/(auth)/login');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <View style={styles.header}>
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.xl,
          }}
          accessibilityRole="header"
        >
          {ADMIN_MOBILE_MORE_COPY.TITLE}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ProfileCard name={profileName} subtitle={profileSubtitle} />

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.xs,
              },
            ]}
          >
            {ADMIN_MOBILE_MORE_COPY.SECTION_OPERATIONS}
          </Text>
          <View
            style={[
              styles.menuGroup,
              { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg },
            ]}
          >
            {showCommunityReview ? (
              <MenuListItem
                icon={ShieldCheck}
                title={ADMIN_MOBILE_MORE_COPY.COMMUNITY_REVIEW}
                subtitle={ADMIN_MOBILE_MORE_COPY.COMMUNITY_REVIEW_SUB}
                onPress={() => router.push('/(admin)/(review)')}
              />
            ) : null}
            <MenuListItem
              icon={Bell}
              title={ADMIN_MOBILE_MORE_COPY.NOTIFICATION_SETTINGS}
              onPress={() => router.push('/(admin)/(more)/notification-settings')}
            />
          </View>
        </View>

        <View style={styles.logoutSection}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              {
                backgroundColor: pressed ? theme.colors.accentSoft : theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
          >
            <LogOut size={20} color={theme.colors.error} />
            <Text
              style={{
                color: theme.colors.error,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.base,
                marginLeft: theme.spacing.sm,
              }}
            >
              {ADMIN_MOBILE_MORE_COPY.LOGOUT}
            </Text>
          </Pressable>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scroll: {
    paddingBottom: 32,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuGroup: {
    overflow: 'hidden',
  },
  logoutSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
});
