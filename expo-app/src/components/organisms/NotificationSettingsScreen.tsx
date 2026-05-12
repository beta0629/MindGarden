/**
 * NotificationSettingsScreen — 알림 설정 공용 컴포넌트
 * 카테고리별 토글 스위치로 알림 제어
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useEffect } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Bell,
  Calendar,
  CreditCard,
  Heart,
  MessageCircle,
  Settings,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { SkeletonLoader } from '@/components/atoms/SkeletonLoader';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
  type NotificationSettings,
} from '@/api/hooks/useNotifications';
import { useNotificationSettingsStore } from '@/stores/useNotificationSettingsStore';

interface SettingCategory {
  key: keyof NotificationSettings;
  icon: typeof Bell;
  title: string;
  description: string;
}

const SETTING_CATEGORIES: SettingCategory[] = [
  {
    key: 'schedule',
    icon: Calendar,
    title: '예약 알림',
    description: '새 예약, 변경, 취소 알림',
  },
  {
    key: 'payment',
    icon: CreditCard,
    title: '결제 알림',
    description: '결제 완료, 환불 알림',
  },
  {
    key: 'message',
    icon: MessageCircle,
    title: '메시지 알림',
    description: '새 메시지 수신 알림',
  },
  {
    key: 'wellness',
    icon: Heart,
    title: '웰니스 알림',
    description: '감정 일기 리마인더, 명상 추천',
  },
  {
    key: 'system',
    icon: Settings,
    title: '시스템 알림',
    description: '공지사항, 업데이트 알림',
  },
];

export function NotificationSettingsScreen() {
  const theme = useTheme();

  const { data: settings, isLoading } = useNotificationSettings();
  const updateMutation = useUpdateNotificationSettings();
  const setLocalCategory = useNotificationSettingsStore((s) => s.setCategory);
  const setCategoryAll = useNotificationSettingsStore((s) => s.setCategoryAll);

  useEffect(() => {
    if (settings) {
      setCategoryAll(settings);
    }
  }, [settings, setCategoryAll]);

  const handleToggle = useCallback(
    (key: keyof NotificationSettings, value: boolean) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setLocalCategory(key, value);
      updateMutation.mutate({ [key]: value });
    },
    [updateMutation, setLocalCategory],
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={styles.skeletonItem}>
            <SkeletonLoader width={40} height={40} borderRadius={20} />
            <View style={styles.skeletonText}>
              <SkeletonLoader width="60%" height={16} />
              <SkeletonLoader width="80%" height={12} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.bgMain }]}
      contentContainerStyle={styles.content}
    >
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
        알림 카테고리
      </Text>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.xl,
          },
          theme.shadows.sm,
        ]}
      >
        {SETTING_CATEGORIES.map((category, index) => (
          <SettingRow
            key={category.key}
            category={category}
            value={settings?.[category.key] ?? true}
            onToggle={handleToggle}
            isLast={index === SETTING_CATEGORIES.length - 1}
          />
        ))}
      </View>
      <Text
        style={[
          styles.footerNote,
          {
            color: theme.colors.textTertiary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
          },
        ]}
      >
        알림을 끄면 해당 카테고리의 푸시 알림을 받지 않습니다.{'\n'}
        앱 내 알림은 항상 표시됩니다.
      </Text>
    </ScrollView>
  );
}

interface SettingRowProps {
  category: SettingCategory;
  value: boolean;
  onToggle: (key: keyof NotificationSettings, value: boolean) => void;
  isLast: boolean;
}

function SettingRow({ category, value, onToggle, isLast }: SettingRowProps) {
  const theme = useTheme();
  const IconComponent = category.icon;

  return (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomColor: theme.colors.divider, borderBottomWidth: 1 },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: theme.colors.accentSoft },
        ]}
      >
        <IconComponent size={20} color={theme.colors.textSecondary} />
      </View>
      <View style={styles.rowContent}>
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.sm,
          }}
        >
          {category.title}
        </Text>
        <Text
          style={{
            color: theme.colors.textTertiary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
            marginTop: 2,
          }}
        >
          {category.description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={(val) => onToggle(category.key, val)}
        trackColor={{
          false: theme.colors.gray[200],
          true: theme.colors.primary,
        }}
        thumbColor={theme.colors.textOnPrimary}
        accessibilityLabel={`${category.title} ${value ? '켜짐' : '꺼짐'}`}
        accessibilityRole="switch"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  footerNote: {
    marginTop: 16,
    paddingHorizontal: 4,
    lineHeight: 18,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  skeletonText: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
});
