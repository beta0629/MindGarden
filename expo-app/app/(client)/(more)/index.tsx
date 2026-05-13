/**
 * 내담자 더보기 메뉴 화면
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Alert, Pressable, ScrollView, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CreditCard,
  Users as UsersIcon,
  Bell,
  MessageSquare,
  UserCircle,
  Settings,
  LogOut,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { ProfileCard } from '@/components/molecules/ProfileCard';
import { MenuListItem } from '@/components/molecules/MenuListItem';
import { AuthService } from '@/services/AuthService';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ClientMore() {
  const theme = useTheme();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
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
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.headerTitle,
            {
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.xl,
            },
          ]}
          accessibilityRole="header"
        >
          더보기
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TODO: Phase 1-A에서 실제 사용자 데이터 연동 */}
        <ProfileCard name="내담자" subtitle="마음 돌봄" />

        <View style={styles.sectionContainer}>
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
            상담 · 결제
          </Text>
          <View
            style={[
              styles.menuGroup,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
          >
            <MenuListItem
              icon={CreditCard}
              title="회기 · 결제"
              subtitle="보유 회기, 결제 내역, 연장"
              onPress={() => router.push('/(client)/(more)/sessions-payment')}
            />
            <MenuListItem
              icon={UsersIcon}
              title="커뮤니티"
              subtitle="Phase 3에서 구현 예정"
              onPress={() => {}}
              disabled
            />
          </View>
        </View>

        <View style={styles.sectionContainer}>
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
            알림 · 메시지
          </Text>
          <View
            style={[
              styles.menuGroup,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
          >
            <MenuListItem
              icon={Bell}
              title="알림 센터"
              onPress={() => router.push('/(client)/(more)/notifications')}
            />
            <MenuListItem
              icon={MessageSquare}
              title="메시지"
              subtitle="Phase 3에서 구현 예정"
              onPress={() => {}}
              disabled
            />
          </View>
        </View>

        <View style={styles.sectionContainer}>
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
            설정
          </Text>
          <View
            style={[
              styles.menuGroup,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
          >
            <MenuListItem
              icon={UserCircle}
              title="프로필 설정"
              onPress={() => router.push('/(client)/(more)/profile')}
            />
            <MenuListItem
              icon={Settings}
              title="앱 설정"
              onPress={() => router.push('/(client)/(more)/settings')}
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
            <LogOut size={20} color={theme.colors.error ?? '#E53E3E'} />
            <Text
              style={[
                styles.logoutText,
                {
                  color: theme.colors.error ?? '#E53E3E',
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize.base,
                },
              ]}
            >
              로그아웃
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {},
  scrollContent: {
    paddingBottom: 32,
  },
  sectionContainer: {
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
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  logoutText: {
    lineHeight: 22,
  },
});
