/**
 * 관리자 모바일 탭 레이아웃 — 5탭 바텀 네비게이터
 * 홈 | 검수 | 운영 | 메시지 | 더보기 (STAFF는 검수 탭 숨김)
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { Tabs, useRouter } from 'expo-router';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Home,
  ClipboardCheck,
  Settings2,
  MessageSquare,
  MoreHorizontal,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useBottomTabNavigatorOptions } from '@/hooks/useBottomTabNavigatorOptions';
import { AdminRoleGate } from '@/components/guards/AdminRoleGate';
import { useAuthStore } from '@/stores/useAuthStore';
import { isStaffRole } from '@/utils/adminRole';
import { ADMIN_MOBILE_COPY } from '@/constants/adminMobileCopy';

const ICON_SIZE = 24;

export default function AdminLayout() {
  const theme = useTheme();
  const tabScreenOptions = useBottomTabNavigatorOptions(theme);
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const hideReviewTab = isStaffRole(role);

  const handleTabPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <AdminRoleGate>
      <Tabs screenOptions={tabScreenOptions}>
        <Tabs.Screen
          name="(home)"
          options={{
            title: ADMIN_MOBILE_COPY.TAB_HOME,
            tabBarIcon: ({ color }) => <Home size={ICON_SIZE} color={color} />,
            tabBarAccessibilityLabel: ADMIN_MOBILE_COPY.TAB_HOME_A11Y,
          }}
          listeners={{ tabPress: handleTabPress }}
        />
        <Tabs.Screen
          name="(review)"
          options={{
            title: ADMIN_MOBILE_COPY.TAB_REVIEW,
            href: hideReviewTab ? null : undefined,
            tabBarIcon: ({ color }) => <ClipboardCheck size={ICON_SIZE} color={color} />,
            tabBarAccessibilityLabel: ADMIN_MOBILE_COPY.TAB_REVIEW_A11Y,
          }}
          listeners={{ tabPress: handleTabPress }}
        />
        <Tabs.Screen
          name="(operation)"
          options={{
            title: ADMIN_MOBILE_COPY.TAB_OPERATION,
            tabBarIcon: ({ color }) => <Settings2 size={ICON_SIZE} color={color} />,
            tabBarAccessibilityLabel: ADMIN_MOBILE_COPY.TAB_OPERATION_A11Y,
          }}
          listeners={{ tabPress: handleTabPress }}
        />
        <Tabs.Screen
          name="(messages)"
          options={{
            title: ADMIN_MOBILE_COPY.TAB_MESSAGES,
            tabBarIcon: ({ color }) => <MessageSquare size={ICON_SIZE} color={color} />,
            tabBarAccessibilityLabel: ADMIN_MOBILE_COPY.TAB_MESSAGES_A11Y,
          }}
          listeners={{ tabPress: handleTabPress }}
        />
        <Tabs.Screen
          name="(more)"
          options={{
            title: ADMIN_MOBILE_COPY.TAB_MORE,
            popToTopOnBlur: true,
            tabBarIcon: ({ color }) => <MoreHorizontal size={ICON_SIZE} color={color} />,
            tabBarAccessibilityLabel: ADMIN_MOBILE_COPY.TAB_MORE_A11Y,
          }}
          listeners={{
            tabPress: () => {
              handleTabPress();
              router.navigate('/(admin)/(more)');
            },
          }}
        />
      </Tabs>
    </AdminRoleGate>
  );
}
