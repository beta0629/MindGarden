/**
 * 어드민·스태프 — 알림 센터 화면
 *
 * @author MindGarden
 * @since 2026-05-26
 */
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { NotificationCenterScreen } from '@/components/organisms/NotificationCenterScreen';
import { ADMIN_MOBILE_MORE_COPY } from '@/constants/adminMobileScreensCopy';

export default function AdminNotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
        <Pressable
          onPress={() => router.replace('/(admin)/(more)')}
          hitSlop={8}
          accessibilityLabel={ADMIN_MOBILE_MORE_COPY.BACK_TO_MORE_A11Y}
          accessibilityRole="button"
        >
          <ChevronLeft size={24} color={theme.colors.textMain} />
        </Pressable>
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.lg,
            marginLeft: 8,
          }}
        >
          {ADMIN_MOBILE_MORE_COPY.NOTIFICATIONS_SCREEN_TITLE}
        </Text>
      </View>
      <NotificationCenterScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
});
