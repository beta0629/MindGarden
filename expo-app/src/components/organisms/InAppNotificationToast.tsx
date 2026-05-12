/**
 * InAppNotificationToast — 포그라운드 인앱 알림 토스트
 * 상단에서 슬라이드 다운, 탭 → 해당 화면 이동, 3초 후 자동 사라짐
 * 위로 스와이프 → 닫기 (Gesture Handler)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  SlideInDown,
  SlideOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Calendar,
  CalendarX,
  CheckCircle,
  CreditCard,
  FileText,
  Heart,
  Info,
  MessageCircle,
  Play,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react-native';
import { useTheme } from '@/theme';

const AUTO_DISMISS_MS = 3000;
const SWIPE_THRESHOLD = -50;

export interface ToastData {
  id: string;
  title: string;
  body: string;
  icon?: string;
  onPress?: () => void;
}

const ICON_MAP: Record<string, typeof Bell> = {
  Calendar,
  CalendarX,
  Bell,
  Play,
  CheckCircle,
  FileText,
  CreditCard,
  RefreshCw,
  AlertTriangle,
  MessageCircle,
  Heart,
  Info,
};

let showToastGlobal: ((data: ToastData) => void) | null = null;

/**
 * 외부에서 토스트를 표시하기 위한 함수
 * NotificationService에서 호출
 */
export function showInAppToast(data: ToastData): void {
  showToastGlobal?.(data);
}

export function InAppNotificationToast() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translateY = useSharedValue(0);

  const dismiss = useCallback(() => {
    setToast(null);
    translateY.value = 0;
  }, [translateY]);

  const showToast = useCallback(
    (data: ToastData) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast(data);
      translateY.value = 0;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    },
    [dismiss, translateY],
  );

  useEffect(() => {
    showToastGlobal = showToast;
    return () => {
      showToastGlobal = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showToast]);

  const swipeGesture = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      if (e.translationY < 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY < SWIPE_THRESHOLD) {
        dismiss();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handlePress = useCallback(() => {
    toast?.onPress?.();
    dismiss();
  }, [toast, dismiss]);

  if (!toast) return null;

  const IconComponent = ICON_MAP[toast.icon ?? ''] ?? Bell;

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View
        entering={SlideInDown.springify().damping(18)}
        exiting={SlideOutUp.duration(200)}
        style={[
          styles.wrapper,
          animatedStyle,
          { top: insets.top + 8 },
        ]}
      >
        <Pressable
          onPress={handlePress}
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.xl,
            },
            theme.shadows.lg,
          ]}
          accessibilityRole="alert"
          accessibilityLabel={`${toast.title}. ${toast.body}`}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: theme.colors.accentSoft },
            ]}
          >
            <IconComponent size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                {
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.sm,
                },
              ]}
              numberOfLines={1}
            >
              {toast.title}
            </Text>
            <Text
              style={[
                styles.body,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.xs,
                },
              ]}
              numberOfLines={2}
            >
              {toast.body}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10000,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    marginBottom: 2,
  },
  body: {
    lineHeight: 16,
  },
});
