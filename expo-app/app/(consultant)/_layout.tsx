/**
 * 상담사 탭 레이아웃 — 4탭 바텀 네비게이터 (커버+챕터 v4 도크)
 * 홈 | 일정 | 일지 | 나
 *
 * `(clients)` 는 도크에서 숨기고(href: null) 「나」 메뉴·홈 알림 행에서 진입한다.
 *
 * @author MindGarden
 * @since 2026-05-12
 * @updated 2026-11-06 — v4 라벨·teal 활성 점 (`roleDockConfig`)
 */
import { useMemo } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Calendar, FileText, House, UserRound, Users, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useBottomTabNavigatorOptions } from '@/hooks/useBottomTabNavigatorOptions';
import { useMoreTabUnreadTotal } from '@/hooks/useMoreTabUnreadTotal';
import { ConsultantRoleGate } from '@/components/guards/ConsultantRoleGate';
import {
  ROLE_DOCK_TINT,
  RoleDockTabIcon,
  RoleDockTabLabel,
} from '@/components/organisms/coverChapter';
import {
  CONSULTANT_DOCK_TABS,
  getDockTab,
  type ConsultantDockRoute,
} from '@/constants/roleDockConfig';

function dockOptions(route: ConsultantDockRoute, icon: LucideIcon, showBadge = false) {
  const tab = getDockTab(CONSULTANT_DOCK_TABS, route);
  return {
    title: tab.label,
    ...(tab.visible ? {} : { href: null }),
    tabBarAccessibilityLabel: tab.a11yLabel,
    tabBarIcon: ({ color }: { color: string }) => (
      <RoleDockTabIcon icon={icon} color={color} showBadge={showBadge} />
    ),
    tabBarLabel: ({ focused, color }: { focused: boolean; color: string }) => (
      <RoleDockTabLabel label={tab.label} focused={focused} color={color} />
    ),
  };
}

export default function ConsultantLayout() {
  const theme = useTheme();
  const baseTabOptions = useBottomTabNavigatorOptions(theme);
  const tabScreenOptions = useMemo(
    () => ({
      ...baseTabOptions,
      tabBarActiveTintColor: ROLE_DOCK_TINT.active,
      tabBarInactiveTintColor: ROLE_DOCK_TINT.inactive,
    }),
    [baseTabOptions],
  );
  const router = useRouter();
  const moreTabUnread = useMoreTabUnreadTotal();

  const handleTabPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <ConsultantRoleGate>
      <Tabs screenOptions={tabScreenOptions}>
        <Tabs.Screen
          name="(home)"
          options={dockOptions('(home)', House)}
          listeners={{ tabPress: handleTabPress }}
        />
        <Tabs.Screen
          name="(schedule)"
          options={dockOptions('(schedule)', Calendar)}
          listeners={{ tabPress: handleTabPress }}
        />
        <Tabs.Screen name="(clients)" options={dockOptions('(clients)', Users)} />
        <Tabs.Screen
          name="(records)"
          options={dockOptions('(records)', FileText)}
          listeners={{ tabPress: handleTabPress }}
        />
        <Tabs.Screen
          name="(more)"
          options={{
            ...dockOptions('(more)', UserRound, moreTabUnread > 0),
            popToTopOnBlur: true,
          }}
          listeners={{
            tabPress: () => {
              handleTabPress();
              router.navigate('/(consultant)/(more)');
            },
          }}
        />
      </Tabs>
    </ConsultantRoleGate>
  );
}
