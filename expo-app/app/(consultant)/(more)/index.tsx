/**
 * 상담사 더보기 메뉴 화면
 *
 * TODO(IA): 웹 `ConsultantMoreHub`·LNB와 메뉴 항목·라벨 SSOT 통합은 별도 배치(이번 Expo 범위 밖).
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Alert, Pressable, ScrollView, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Clock,
  Users as UsersIcon,
  Bell,
  MessageSquare,
  UserCircle,
  Settings,
  LogOut,
  CloudSun,
  BookHeart,
  Wallet,
  BarChart3,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { ProfileCard } from '@/components/molecules/ProfileCard';
import { MenuListItem } from '@/components/molecules/MenuListItem';
import { AuthService } from '@/services/AuthService';
import { useAuthStore } from '@/stores/useAuthStore';
import { toDisplayString } from '@/utils/safeDisplay';
import { CONSULTANT_SALARY_SETTLEMENT_COPY } from '@/constants/consultantSalarySettlementCopy';
import { CONSULTANT_SESSION_KPI_COPY } from '@/constants/consultantSessionKpiCopy';
import { CONSULTANT_MOOD_JOURNAL_INBOX_COPY } from '@/constants/consultantMoodJournalInboxCopy';
import { useProfileRemoteSync } from '@/api/hooks/useProfileRemoteSync';

export default function ConsultantMore() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  // P1 핫픽스 (2026-06-10): 더보기 첫 진입에서도 BE 프로필 이미지 동기화
  useProfileRemoteSync();
  const profileName = toDisplayString(user?.nickname?.trim() || user?.name, '선생');
  const profileSubtitle = toDisplayString(user?.email, '전문 상담');
  const showSalarySettlementMenu = Boolean(user?.id);

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
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
    ]);
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ProfileCard
          name={profileName}
          subtitle={profileSubtitle}
          imageUri={user?.profileImageUrl}
        />

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
            상담 관리
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
              icon={Clock}
              title="근무 가능 시간"
              onPress={() => router.push('/(consultant)/(more)/availability')}
            />
            <MenuListItem
              icon={UsersIcon}
              title="커뮤니티"
              subtitle="게시글 · 댓글"
              onPress={() => router.push('/(consultant)/(more)/community')}
            />
            <MenuListItem
              icon={CloudSun}
              title="마음 날씨 수신함"
              subtitle="내담자가 공유한 분석 카드"
              onPress={() => router.push('/(consultant)/(more)/mind-weather-inbox')}
            />
            <MenuListItem
              icon={BookHeart}
              title={CONSULTANT_MOOD_JOURNAL_INBOX_COPY.MENU_TITLE}
              subtitle={CONSULTANT_MOOD_JOURNAL_INBOX_COPY.MENU_SUBTITLE}
              onPress={() => router.push('/(consultant)/(more)/mood-journal-inbox')}
            />
            <MenuListItem
              icon={BarChart3}
              title={CONSULTANT_SESSION_KPI_COPY.MENU_TITLE}
              subtitle={CONSULTANT_SESSION_KPI_COPY.MENU_SUBTITLE}
              onPress={() => router.push('/(consultant)/(more)/session-kpi')}
            />
            {showSalarySettlementMenu ? (
              <MenuListItem
                icon={Wallet}
                title={CONSULTANT_SALARY_SETTLEMENT_COPY.MENU_TITLE}
                subtitle={CONSULTANT_SALARY_SETTLEMENT_COPY.MENU_SUBTITLE}
                onPress={() => router.push('/(consultant)/(more)/salary-settlement')}
              />
            ) : null}
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
              onPress={() => router.push('/(consultant)/(more)/notifications')}
            />
            <MenuListItem
              icon={MessageSquare}
              title="메시지"
              subtitle="대화 목록"
              onPress={() => router.push('/(consultant)/(more)/messages')}
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
              onPress={() => router.push('/(consultant)/(more)/profile')}
            />
            <MenuListItem
              icon={Settings}
              title="앱 설정"
              onPress={() => router.push('/(consultant)/(more)/settings')}
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
              style={[
                styles.logoutText,
                {
                  color: theme.colors.error,
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
