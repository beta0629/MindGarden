/**
 * 상담사 더보기 메뉴 화면
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Clock,
  DollarSign,
  Users as UsersIcon,
  Bell,
  MessageSquare,
  UserCircle,
  Settings,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { ProfileCard } from '@/components/molecules/ProfileCard';
import { MenuListItem } from '@/components/molecules/MenuListItem';

export default function ConsultantMore() {
  const theme = useTheme();
  const router = useRouter();

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
        <ProfileCard name="상담사" subtitle="전문 상담" />

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
              icon={DollarSign}
              title="수입 리포트"
              onPress={() => router.push('/(consultant)/(more)/income')}
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
              onPress={() => router.push('/(consultant)/(more)/notifications')}
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
              onPress={() => router.push('/(consultant)/(more)/profile')}
            />
            <MenuListItem
              icon={Settings}
              title="앱 설정"
              onPress={() => router.push('/(consultant)/(more)/settings')}
            />
          </View>
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
});
