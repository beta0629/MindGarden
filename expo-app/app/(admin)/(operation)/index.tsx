/**
 * 어드민·스태프 운영 허브
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, CloudSun, FileText, Users } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { MenuListItem } from '@/components/molecules/MenuListItem';
import { useAuthStore } from '@/stores/useAuthStore';
import { isAdminRole } from '@/utils/adminRole';
import { ADMIN_MOBILE_OPERATION_COPY } from '@/constants/adminMobileScreensCopy';

export default function AdminOperationHubScreen() {
  const theme = useTheme();
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const showMindWeather = isAdminRole(role);

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
            onPress={() => router.push('/(admin)/(operation)/users')}
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
  menuGroup: {
    overflow: 'hidden',
  },
});
