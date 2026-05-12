/**
 * MiniPlayer — 명상 재생 중 바텀탭 위에 표시되는 미니 플레이어
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Play, Pause, X } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useMeditationStore } from '@/stores/useMeditationStore';
import { formatPlayerTime } from '@/constants/meditationData';

export function MiniPlayer() {
  const theme = useTheme();
  const router = useRouter();
  const { currentTrack, isPlaying, currentTime, pause, resume, stop } =
    useMeditationStore();

  if (!currentTrack) return null;

  const handlePlayPause = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (isPlaying) pause();
    else resume();
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    stop();
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/(client)/(wellness)/meditation/${currentTrack.id}`);
  };

  const progress =
    currentTrack.durationSeconds > 0
      ? currentTime / currentTrack.durationSeconds
      : 0;

  return (
    <Animated.View
      entering={SlideInDown.springify()}
      exiting={SlideOutDown.springify()}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.divider,
          ...theme.shadows.md,
        },
      ]}
    >
      {/* 진행 바 */}
      <View
        style={[styles.progressBg, { backgroundColor: theme.colors.divider }]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.colors.primary,
              width: `${progress * 100}%` as any,
            },
          ]}
        />
      </View>

      <Pressable
        onPress={handlePress}
        style={styles.content}
        accessibilityLabel={`재생 중: ${currentTrack.title}`}
        accessibilityRole="button"
      >
        <View style={styles.textWrap}>
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textMain,
            }}
            numberOfLines={1}
          >
            {currentTrack.title}
          </Text>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize['2xs'],
              color: theme.colors.textTertiary,
            }}
          >
            {formatPlayerTime(currentTime)} / {formatPlayerTime(currentTrack.durationSeconds)}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handlePlayPause}
            hitSlop={8}
            style={styles.iconBtn}
            accessibilityLabel={isPlaying ? '일시정지' : '재생'}
            accessibilityRole="button"
          >
            {isPlaying ? (
              <Pause size={20} color={theme.colors.primary} fill={theme.colors.primary} />
            ) : (
              <Play size={20} color={theme.colors.primary} fill={theme.colors.primary} />
            )}
          </Pressable>
          <Pressable
            onPress={handleClose}
            hitSlop={8}
            style={styles.iconBtn}
            accessibilityLabel="닫기"
            accessibilityRole="button"
          >
            <X size={18} color={theme.colors.textTertiary} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  progressBg: {
    height: 2,
    width: '100%',
  },
  progressFill: {
    height: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
