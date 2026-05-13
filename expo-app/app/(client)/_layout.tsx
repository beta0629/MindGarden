/**
 * 내담자 탭 레이아웃 — 4탭 바텀 네비게이터
 * 홈 | 내 상담 | 웰니스 | 더보기
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Home,
  CalendarPlus,
  MessageCircle,
  Leaf,
  MoreHorizontal,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { MiniPlayer } from '@/components/organisms/MiniPlayer';
import { MeditationAudioBridge } from '@/components/organisms/MeditationAudioBridge';
import { useMeditationStore } from '@/stores/useMeditationStore';

const ICON_SIZE = 24;
const BADGE_SIZE = 8;

function UnreadBadge() {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.colors.error }]} />
  );
}

export default function ClientLayout() {
  const theme = useTheme();
  const currentTrack = useMeditationStore((s) => s.currentTrack);

  const handleTabPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <MeditationAudioBridge>
      <View style={styles.root}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.gray[400],
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              borderTopWidth: StyleSheet.hairlineWidth,
              height: Platform.OS === 'ios' ? 88 : 64,
              paddingBottom: Platform.OS === 'ios' ? 24 : 8,
              paddingTop: 8,
            },
            tabBarLabelStyle: {
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.xs,
            },
          }}
        >
          <Tabs.Screen
            name="(home)"
            options={{
              title: '홈',
              tabBarIcon: ({ color }) => (
                <Home size={ICON_SIZE} color={color} />
              ),
              tabBarAccessibilityLabel: '홈 탭',
            }}
            listeners={{ tabPress: handleTabPress }}
          />
          {/* 비즈니스: 내담자 직접 예약 불가 — 관리자가 예약 생성 */}
          <Tabs.Screen
            name="(booking)"
            options={{
              title: '예약',
              href: null,
              tabBarIcon: ({ color }) => (
                <CalendarPlus size={ICON_SIZE} color={color} />
              ),
              tabBarAccessibilityLabel: '예약 탭',
            }}
            listeners={{ tabPress: handleTabPress }}
          />
          <Tabs.Screen
            name="(sessions)"
            options={{
              title: '내 상담',
              tabBarIcon: ({ color }) => (
                <MessageCircle size={ICON_SIZE} color={color} />
              ),
              tabBarAccessibilityLabel: '내 상담 탭',
            }}
            listeners={{ tabPress: handleTabPress }}
          />
          <Tabs.Screen
            name="(wellness)"
            options={{
              title: '웰니스',
              tabBarIcon: ({ color }) => (
                <Leaf size={ICON_SIZE} color={color} />
              ),
              tabBarAccessibilityLabel: '웰니스 탭',
            }}
            listeners={{ tabPress: handleTabPress }}
          />
          <Tabs.Screen
            name="(more)"
            options={{
              title: '더보기',
              tabBarIcon: ({ color }) => (
                <View>
                  <MoreHorizontal size={ICON_SIZE} color={color} />
                  <UnreadBadge />
                </View>
              ),
              tabBarAccessibilityLabel: '더보기 탭',
            }}
            listeners={{ tabPress: handleTabPress }}
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
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
  },
});
