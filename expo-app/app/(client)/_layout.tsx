/**
 * 내담자 탭 레이아웃 — 4탭 바텀 네비게이터 (커버+챕터 v4 도크)
 * 홈 | 예약((sessions) 일정 챕터) | 마음 | 나
 *
 * `(booking)`·`(shop)` 은 도크에 노출하지 않는다(href: null). 직접 예약 경로를 열지 않는다.
 *
 * @author MindGarden
 * @since 2026-05-12
 * @updated 2026-11-06 — v4 라벨·teal 활성 점 (`roleDockConfig`)
 */
import { useMemo } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  CalendarDays,
  CalendarPlus,
  HeartPulse,
  House,
  ShoppingBag,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useBottomTabNavigatorOptions } from '@/hooks/useBottomTabNavigatorOptions';
import { useMoreTabUnreadTotal } from '@/hooks/useMoreTabUnreadTotal';
import { MiniPlayer } from '@/components/organisms/MiniPlayer';
import { MeditationAudioBridge } from '@/components/organisms/MeditationAudioBridge';
import {
  ROLE_DOCK_TINT,
  RoleDockTabIcon,
  RoleDockTabLabel,
} from '@/components/organisms/coverChapter';
import { useMeditationStore } from '@/stores/useMeditationStore';
import { CLIENT_DOCK_TABS, getDockTab, type ClientDockRoute } from '@/constants/roleDockConfig';

function dockOptions(route: ClientDockRoute, icon: LucideIcon, showBadge = false) {
  const tab = getDockTab(CLIENT_DOCK_TABS, route);
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

export default function ClientLayout() {
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
  const currentTrack = useMeditationStore((s) => s.currentTrack);
  const moreTabUnread = useMoreTabUnreadTotal();

  const handleTabPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <MeditationAudioBridge>
      <View style={styles.root}>
        <Tabs screenOptions={tabScreenOptions}>
          <Tabs.Screen
            name="(home)"
            options={dockOptions('(home)', House)}
            listeners={{ tabPress: handleTabPress }}
          />
          {/* 비즈니스: 내담자 직접 예약 불가 — 관리자가 예약 생성 */}
          <Tabs.Screen name="(booking)" options={dockOptions('(booking)', CalendarPlus)} />
          <Tabs.Screen
            name="(sessions)"
            options={dockOptions('(sessions)', CalendarDays)}
            listeners={{ tabPress: handleTabPress }}
          />
          <Tabs.Screen
            name="(wellness)"
            options={dockOptions('(wellness)', HeartPulse)}
            listeners={{ tabPress: handleTabPress }}
          />
          <Tabs.Screen name="(shop)" options={dockOptions('(shop)', ShoppingBag)} />
          <Tabs.Screen
            name="(more)"
            options={{
              ...dockOptions('(more)', UserRound, moreTabUnread > 0),
              /** 다른 탭으로 이동 시 (more) 내부 스택을 루트로 리셋 — RN Bottom Tabs 공식 옵션 */
              popToTopOnBlur: true,
            }}
            listeners={{
              tabPress: () => {
                handleTabPress();
                /** 알림만 열린 스택에서도 나 탭을 누르면 메뉴(index)로 */
                router.navigate('/(client)/(more)');
              },
            }}
          />
        </Tabs>
        {currentTrack && <MiniPlayer />}
      </View>
    </MeditationAudioBridge>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
