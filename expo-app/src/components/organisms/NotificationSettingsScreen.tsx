/**
 * NotificationSettingsScreen — 알림 설정 공용 컴포넌트
 * 카테고리별 토글 스위치로 알림 제어
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { Bell, Calendar, CreditCard, Heart, MessageCircle, Settings } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { SkeletonLoader } from '@/components/atoms/SkeletonLoader';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
  type NotificationSettings,
} from '@/api/hooks/useNotifications';
import { useNotificationSettingsStore } from '@/stores/useNotificationSettingsStore';
import { EmptyState } from '@/components/atoms/EmptyState';
import { useResolveTenantIdForApi } from '@/utils/resolveTenantIdForApi';
import { PUSH_PERMISSION_COPY } from '@/constants/pushPermissionCopy';
import {
  getNotificationPermissionSnapshot,
  NotificationService,
  openNotificationSettings,
  type NotificationPermissionSnapshot,
} from '@/services/NotificationService';

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

function resolvePermissionStatusLabel(snapshot: NotificationPermissionSnapshot | null): string {
  if (snapshot == null) {
    return PUSH_PERMISSION_COPY.statusUndetermined;
  }
  if (snapshot.granted) {
    return PUSH_PERMISSION_COPY.statusGranted;
  }
  if (snapshot.status === 'undetermined') {
    return PUSH_PERMISSION_COPY.statusUndetermined;
  }
  return PUSH_PERMISSION_COPY.statusDenied;
}

export function NotificationSettingsScreen() {
  const theme = useTheme();
  const tenantId = useResolveTenantIdForApi();
  const [permission, setPermission] = useState<NotificationPermissionSnapshot | null>(null);
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [reregisterBusy, setReregisterBusy] = useState(false);

  const refreshPermission = useCallback(async () => {
    const snapshot = await getNotificationPermissionSnapshot();
    setPermission(snapshot);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const onFocus = async () => {
        const snapshot = await getNotificationPermissionSnapshot();
        if (cancelled) {
          return;
        }
        setPermission(snapshot);

        const tid = tenantId.trim();
        if (snapshot.granted && tid) {
          await NotificationService.registerToken();
        }
      };

      void onFocus();

      return () => {
        cancelled = true;
      };
    }, [tenantId]),
  );

  const { data: settings, isLoading, refetch, isRefetching } = useNotificationSettings();
  const updateMutation = useUpdateNotificationSettings();
  const setLocalCategory = useNotificationSettingsStore((s) => s.setCategory);
  const setCategoryAll = useNotificationSettingsStore((s) => s.setCategoryAll);

  useEffect(() => {
    if (settings) {
      setCategoryAll(settings);
    }
  }, [settings, setCategoryAll]);

  const handleRequestPermission = useCallback(async () => {
    setPermissionBusy(true);
    try {
      const granted = await NotificationService.requestPermission();
      await refreshPermission();
      if (granted) {
        await NotificationService.registerToken();
      }
    } finally {
      setPermissionBusy(false);
    }
  }, [refreshPermission]);

  const handleOpenSettings = useCallback(() => {
    void openNotificationSettings();
  }, []);

  const handleReregisterToken = useCallback(async () => {
    setReregisterBusy(true);
    try {
      await NotificationService.registerToken();
      await refreshPermission();
    } finally {
      setReregisterBusy(false);
    }
  }, [refreshPermission]);

  const showOpenSettings =
    permission != null && !permission.granted && permission.canAskAgain === false;

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

  if (!tenantId.trim()) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
        <EmptyState
          icon={<Bell size={32} color={theme.colors.textTertiary} />}
          title="기관 정보가 필요합니다"
          description="테넌트를 선택한 뒤 알림 설정을 변경할 수 있습니다"
        />
      </View>
    );
  }

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
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            refetch();
          }}
          tintColor={theme.colors.primary}
        />
      }
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
        {PUSH_PERMISSION_COPY.deviceSectionTitle}
      </Text>
      <View
        style={[
          styles.card,
          styles.deviceCard,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.xl,
          },
          theme.shadows.sm,
        ]}
      >
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.sm,
          }}
        >
          {resolvePermissionStatusLabel(permission)}
        </Text>
        <Text
          style={{
            color: theme.colors.textTertiary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
            marginTop: 4,
          }}
        >
          {permission?.granted
            ? PUSH_PERMISSION_COPY.reregisterHint
            : showOpenSettings
              ? PUSH_PERMISSION_COPY.deniedHint
              : PUSH_PERMISSION_COPY.allowHint}
        </Text>
        <View style={styles.deviceActions}>
          {showOpenSettings ? (
            <Pressable
              onPress={handleOpenSettings}
              style={[styles.permissionButton, { backgroundColor: theme.colors.gray[100] }]}
              accessibilityRole="button"
              accessibilityLabel={PUSH_PERMISSION_COPY.openSettingsButton}
            >
              <Text
                style={{
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize.sm,
                }}
              >
                {PUSH_PERMISSION_COPY.openSettingsButton}
              </Text>
            </Pressable>
          ) : !permission?.granted ? (
            <Pressable
              onPress={() => {
                void handleRequestPermission();
              }}
              disabled={permissionBusy}
              style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel={PUSH_PERMISSION_COPY.allowButton}
            >
              {permissionBusy ? (
                <ActivityIndicator color={theme.colors.textOnPrimary} />
              ) : (
                <Text
                  style={{
                    color: theme.colors.textOnPrimary,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {PUSH_PERMISSION_COPY.allowButton}
                </Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                void handleReregisterToken();
              }}
              disabled={reregisterBusy}
              style={[styles.permissionButton, { backgroundColor: theme.colors.gray[100] }]}
              accessibilityRole="button"
              accessibilityLabel={PUSH_PERMISSION_COPY.reregisterButton}
            >
              {reregisterBusy ? (
                <ActivityIndicator color={theme.colors.textMain} />
              ) : (
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {PUSH_PERMISSION_COPY.reregisterButton}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </View>

      <Text
        style={[
          styles.sectionTitle,
          styles.sectionTitleSpaced,
          {
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.xs,
          },
        ]}
      >
        알림 카테고리
      </Text>
      {updateMutation.isError ? (
        <Text
          style={{
            color: theme.colors.error,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
            marginBottom: 8,
            paddingHorizontal: 4,
          }}
          accessibilityLiveRegion="polite"
        >
          서버에 저장하지 못했습니다. 아래를 당겨 새로고침해 주세요. 푸시 설정 API가 아직 없으면 이
          기기에만 적용됩니다.
        </Text>
      ) : null}
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
        알림을 끄면 해당 카테고리의 푸시 알림을 받지 않습니다.{'\n'}앱 내 알림은 항상 표시됩니다.
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
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.accentSoft }]}>
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
  sectionTitleSpaced: {
    marginTop: 20,
  },
  card: {
    overflow: 'hidden',
  },
  deviceCard: {
    padding: 16,
    marginBottom: 4,
  },
  deviceActions: {
    marginTop: 12,
    flexDirection: 'row',
  },
  permissionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
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
