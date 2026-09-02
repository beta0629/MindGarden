/**
 * 어드민·스태프 운영 허브
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, CloudSun, FileText, Home, Users } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { MenuListItem } from '@/components/molecules/MenuListItem';
import { useAuthStore } from '@/stores/useAuthStore';
import { isAdminRole } from '@/utils/adminRole';
import { isDualRoleUser } from '@/utils/roleCapability';
import {
  ADMIN_MOBILE_DUAL_ROLE_COPY,
  ADMIN_MOBILE_OPERATION_COPY,
} from '@/constants/adminMobileScreensCopy';

export default function AdminOperationHubScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const showMindWeather = isAdminRole(role);
  const showCounselingLinks = isDualRoleUser(user);

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
          {ADMIN_MOBILE_OPERATION_COPY.HUB_TITLE}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.menuGroup,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              marginHorizontal: theme.spacing.lg,
            },
          ]}
        >
          <MenuListItem
            icon={Calendar}
            title={ADMIN_MOBILE_OPERATION_COPY.SCHEDULE_LITE}
            subtitle={ADMIN_MOBILE_OPERATION_COPY.SCHEDULE_LITE_SUB}
            onPress={() => router.push('/(admin)/(operation)/schedule')}
          />
          <MenuListItem
            icon={FileText}
            title={ADMIN_MOBILE_OPERATION_COPY.RECORDS}
            subtitle={ADMIN_MOBILE_OPERATION_COPY.RECORDS_SUB}
            onPress={() => router.push('/(admin)/(operation)/records')}
          />
          <MenuListItem
            icon={Users}
            title={ADMIN_MOBILE_OPERATION_COPY.USERS}
            subtitle={ADMIN_MOBILE_OPERATION_COPY.USERS_SUB}
            onPress={() => router.push('/(admin)/(operation)/user-management')}
          />
          {showMindWeather ? (
            <MenuListItem
              icon={CloudSun}
              title={ADMIN_MOBILE_OPERATION_COPY.MIND_WEATHER}
              subtitle={ADMIN_MOBILE_OPERATION_COPY.MIND_WEATHER_SUB}
              onPress={() => router.push('/(admin)/(operation)/mind-weather')}
            />
          ) : null}
        </View>

        {showCounselingLinks ? (
          <View style={[styles.section, { paddingHorizontal: theme.spacing.lg }]}>
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
              {ADMIN_MOBILE_DUAL_ROLE_COPY.SECTION_TITLE}
            </Text>
            <View
              style={[
                styles.menuGroup,
                { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg },
              ]}
            >
              <MenuListItem
                icon={Home}
                title={ADMIN_MOBILE_DUAL_ROLE_COPY.COUNSELING_HOME}
                subtitle={ADMIN_MOBILE_DUAL_ROLE_COPY.COUNSELING_HOME_SUB}
                onPress={() => router.push('/(consultant)/(home)')}
              />
              <MenuListItem
                icon={Calendar}
                title={ADMIN_MOBILE_DUAL_ROLE_COPY.MY_SCHEDULE}
                subtitle={ADMIN_MOBILE_DUAL_ROLE_COPY.MY_SCHEDULE_SUB}
                onPress={() => router.push('/(consultant)/(schedule)')}
              />
              <MenuListItem
                icon={Users}
                title={ADMIN_MOBILE_DUAL_ROLE_COPY.MY_CLIENTS}
                subtitle={ADMIN_MOBILE_DUAL_ROLE_COPY.MY_CLIENTS_SUB}
                onPress={() => router.push('/(consultant)/(clients)')}
              />
              <MenuListItem
                icon={FileText}
                title={ADMIN_MOBILE_DUAL_ROLE_COPY.MY_RECORDS}
                subtitle={ADMIN_MOBILE_DUAL_ROLE_COPY.MY_RECORDS_SUB}
                onPress={() => router.push('/(consultant)/(records)')}
              />
            </View>
          </View>
        ) : null}
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
