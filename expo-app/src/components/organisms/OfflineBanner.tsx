/**
 * OfflineBanner — 오프라인 상태 배너
 * 화면 상단에 표시, 네트워크 복구 시 "연결되었습니다" → 자동 사라짐
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated';
import { WifiOff, Wifi } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useOffline } from '@/hooks/useOffline';

const RECONNECT_DISPLAY_MS = 2500;

export function OfflineBanner() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isOffline } = useOffline();

  const [showReconnect, setShowReconnect] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (isOffline) {
      wasOffline.current = true;
      setShowReconnect(false);
    } else if (wasOffline.current) {
      wasOffline.current = false;
      setShowReconnect(true);
      const timer = setTimeout(() => setShowReconnect(false), RECONNECT_DISPLAY_MS);
      return () => clearTimeout(timer);
    }
  }, [isOffline]);

  if (!isOffline && !showReconnect) return null;

  const isReconnected = !isOffline && showReconnect;
  const backgroundColor = isReconnected
    ? theme.colors.success
    : theme.colors.warning;
  const IconComponent = isReconnected ? Wifi : WifiOff;
  const label = isReconnected ? '연결되었습니다' : '오프라인 상태입니다';

  return (
    <Animated.View
      entering={SlideInUp.duration(300)}
      exiting={SlideOutUp.duration(300)}
      style={[
        styles.container,
        { backgroundColor, paddingTop: insets.top + 4 },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={label}
    >
      <View style={styles.content}>
        <IconComponent
          size={16}
          color={theme.colors.textOnPrimary}
          accessibilityElementsHidden
        />
        <Text
          style={[
            styles.text,
            {
              color: theme.colors.textOnPrimary,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.xs,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    gap: 6,
  },
  text: {
    textAlign: 'center',
  },
});
