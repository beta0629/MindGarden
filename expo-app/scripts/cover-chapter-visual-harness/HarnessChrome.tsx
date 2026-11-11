/**
 * 하네스 크롬 — 모의 safe-area 인셋 공급 · 역할 도크(탭 바) · 화면+도크 프레임.
 *
 * 도크는 `app/(client)/_layout.tsx` · `app/(consultant)/_layout.tsx` 와 같은 아이콘·라벨 컴포넌트와
 * `useBottomTabNavigatorOptions` 의 tabBarStyle 을 그대로 쓴다(react-navigation 탭 바 대신 정적 행).
 *
 * @author MindGarden
 * @since 2026-11-07
 */
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  type EdgeInsets,
} from 'react-native-safe-area-context';
import {
  Calendar,
  CalendarDays,
  CalendarPlus,
  FileText,
  HeartPulse,
  House,
  ShoppingBag,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import {
  CLINIC_OS,
  ROLE_DOCK_TINT,
  RoleDockTabIcon,
  RoleDockTabLabel,
} from '@/components/organisms/coverChapter';
import {
  CLIENT_DOCK_TABS,
  CONSULTANT_DOCK_TABS,
  type ClientDockRoute,
  type ConsultantDockRoute,
  type RoleDockTab,
} from '@/constants/roleDockConfig';
import { useBottomTabNavigatorOptions } from '@/hooks/useBottomTabNavigatorOptions';
import { useCoverLayoutMode } from '@/hooks/useCoverLayoutMode';
import { clientTheme, consultantTheme } from '@/theme';
import type { CoverLayoutMode } from '@/utils/coverChapterViewModel';
import type { HarnessInsets, HarnessViewport } from './visualMatrixSpec';

export const HARNESS_DOCK_TEST_ID = 'harness-role-dock';

const CLIENT_DOCK_ICONS: Record<ClientDockRoute, LucideIcon> = {
  '(home)': House,
  '(sessions)': CalendarDays,
  '(wellness)': HeartPulse,
  '(more)': UserRound,
  '(booking)': CalendarPlus,
  '(shop)': ShoppingBag,
};

const CONSULTANT_DOCK_ICONS: Record<ConsultantDockRoute, LucideIcon> = {
  '(home)': House,
  '(schedule)': Calendar,
  '(records)': FileText,
  '(more)': UserRound,
  '(clients)': Users,
};

/**
 * 웹 `SafeAreaProvider` 는 마운트 후 CSS env() 로 인셋을 다시 재서(헤드리스에서 0) 모의값을 덮어쓴다.
 * 그래서 라이브러리 자체 컨텍스트에 모의 인셋을 직접 공급한다(라이브러리 테스트 가이드와 같은 방식).
 */
export function HarnessSafeAreaProvider({
  insets,
  viewport,
  children,
}: Readonly<{ insets: HarnessInsets; viewport: HarnessViewport; children: ReactNode }>) {
  const value: EdgeInsets = { ...insets };
  return (
    <SafeAreaFrameContext.Provider value={{ x: 0, y: 0, ...viewport }}>
      <SafeAreaInsetsContext.Provider value={value}>{children}</SafeAreaInsetsContext.Provider>
    </SafeAreaFrameContext.Provider>
  );
}

function DockRow<R extends string>({
  tabs,
  icons,
  activeRoute,
  theme,
}: Readonly<{
  tabs: readonly RoleDockTab<R>[];
  icons: Record<R, LucideIcon>;
  activeRoute: R;
  theme: typeof clientTheme;
}>) {
  const { tabBarStyle } = useBottomTabNavigatorOptions(theme);
  return (
    <View testID={HARNESS_DOCK_TEST_ID} role="tablist" style={[styles.dock, tabBarStyle]}>
      {tabs
        .filter((t) => t.visible)
        .map((tab) => {
          const focused = tab.route === activeRoute;
          const color = focused ? ROLE_DOCK_TINT.active : ROLE_DOCK_TINT.inactive;
          return (
            <View
              key={tab.route}
              role="tab"
              aria-selected={focused}
              aria-label={tab.a11yLabel}
              style={styles.tab}
            >
              <RoleDockTabIcon icon={icons[tab.route]} color={color} />
              <RoleDockTabLabel label={tab.label} focused={focused} color={color} />
            </View>
          );
        })}
    </View>
  );
}

export function HarnessClientDock({ activeRoute }: Readonly<{ activeRoute: ClientDockRoute }>) {
  return (
    <DockRow
      tabs={CLIENT_DOCK_TABS}
      icons={CLIENT_DOCK_ICONS}
      activeRoute={activeRoute}
      theme={clientTheme}
    />
  );
}

export function HarnessCounselorDock({
  activeRoute,
}: Readonly<{ activeRoute: ConsultantDockRoute }>) {
  return (
    <DockRow
      tabs={CONSULTANT_DOCK_TABS}
      icons={CONSULTANT_DOCK_ICONS}
      activeRoute={activeRoute}
      theme={consultantTheme}
    />
  );
}

/** 화면(flex 1) + 하단 도크. 실제 레이아웃 모드를 브라우저 프로브에 알린다. */
export function HarnessFrame({
  screen,
  dock,
  onLayoutMode,
}: Readonly<{
  screen: ReactNode;
  dock: ReactNode;
  onLayoutMode: (mode: CoverLayoutMode) => void;
}>) {
  const mode = useCoverLayoutMode();
  useEffect(() => {
    onLayoutMode(mode);
  }, [mode, onLayoutMode]);
  return (
    <View style={styles.frame}>
      <View style={styles.screen}>{screen}</View>
      {dock}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    backgroundColor: CLINIC_OS.cream,
  },
  screen: {
    flex: 1,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
});
