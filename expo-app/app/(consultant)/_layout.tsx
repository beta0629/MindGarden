/**
 * 상담사 탭 레이아웃 — 5탭 바텀 네비게이터
 * 홈 | 스케줄 | 내담자 | 일지 | 더보기
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Tabs, useRouter } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Home, Calendar, Users, FileText, MoreHorizontal } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useBottomTabNavigatorOptions } from '@/hooks/useBottomTabNavigatorOptions';
import { useMoreTabUnreadTotal } from '@/hooks/useMoreTabUnreadTotal';

const ICON_SIZE = 24;
const BADGE_SIZE = 8;

function UnreadBadge({ visible }: Readonly<{ visible: boolean }>) {
  const theme = useTheme();
  if (!visible) {
    return null;
  }
  return <View style={[styles.badge, { backgroundColor: theme.colors.error }]} />;
}

export default function ConsultantLayout() {
  const theme = useTheme();
  const tabScreenOptions = useBottomTabNavigatorOptions(theme);
  const router = useRouter();
  const moreTabUnread = useMoreTabUnreadTotal();

  const handleTabPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen
        name="(home)"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <Home size={ICON_SIZE} color={color} />,
          tabBarAccessibilityLabel: '홈 탭',
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="(schedule)"
        options={{
          title: '스케줄',
          tabBarIcon: ({ color }) => <Calendar size={ICON_SIZE} color={color} />,
          tabBarAccessibilityLabel: '스케줄 탭',
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="(clients)"
        options={{
          title: '내담자',
          tabBarIcon: ({ color }) => <Users size={ICON_SIZE} color={color} />,
          tabBarAccessibilityLabel: '내담자 탭',
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="(records)"
        options={{
          title: '일지',
          tabBarIcon: ({ color }) => <FileText size={ICON_SIZE} color={color} />,
          tabBarAccessibilityLabel: '일지 탭',
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen
        name="(more)"
        options={{
          title: '더보기',
          popToTopOnBlur: true,
          tabBarIcon: ({ color }) => (
            <View>
              <MoreHorizontal size={ICON_SIZE} color={color} />
              <UnreadBadge visible={moreTabUnread > 0} />
            </View>
          ),
          tabBarAccessibilityLabel: '더보기 탭',
        }}
        listeners={{
          tabPress: () => {
            handleTabPress();
            router.navigate('/(consultant)/(more)');
          },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
  },
});
