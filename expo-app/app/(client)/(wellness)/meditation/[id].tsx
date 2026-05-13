/**
 * 명상 플레이어 — expo-audio(브리지) + 진행 바 + 즐겨찾기
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useEffect } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import {
  ArrowLeft,
  Heart,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
} from 'lucide-react-native';

import { useTheme } from '@/theme';
import { fontSize as fontSizeTokens } from '@/theme/typography';
import { useMeditationPlaybackControls } from '@/contexts/MeditationPlaybackContext';
import { useMeditationStore } from '@/stores/useMeditationStore';
import { EmptyState } from '@/components/atoms/EmptyState';
import { useMeditationTrackById } from '@/api/hooks/useMeditations';
import { formatPlayerTime } from '@/constants/meditationData';

const SKIP_SECONDS = 10;

export default function MeditationPlayer() {
  const theme = useTheme();
  const router = useRouter();
  const playback = useMeditationPlaybackControls();
  const { id } = useLocalSearchParams<{ id: string }>();
  const trackId = Number(id);

  const { track, isLoading, refetch, isError, source: catalogSource } =
    useMeditationTrackById(trackId);
  const {
    currentTrack,
    isPlaying,
    currentTime,
    play,
    pause,
    resume,
    seek,
    toggleFavorite,
    isFavorite,
  } = useMeditationStore();

  useEffect(() => {
    if (track && currentTrack?.id !== track.id) {
      play(track);
    }
  }, [track, currentTrack?.id, play]);

  if (isLoading && !track) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top', 'bottom']}
      >
        <View style={[styles.flex, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
            }}
          >
            불러오는 중...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!track) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top', 'bottom']}
      >
        <EmptyState
          title="명상 콘텐츠를 찾을 수 없습니다"
          description={
            isError
              ? '목록을 다시 불러온 뒤 선택해 주세요.'
              : '목록에서 다른 트랙을 선택해 주세요'
          }
          actionLabel="다시 불러오기"
          onAction={() => {
            refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  const liked = isFavorite(track.id);
  const progress =
    track.durationSeconds > 0 ? currentTime / track.durationSeconds : 0;
  const isFinished = currentTime >= track.durationSeconds;

  const handlePlayPause = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (isFinished) {
      void playback?.seekPlaybackTo(0);
      resume();
      return;
    }
    if (isPlaying) pause();
    else resume();
  };

  const handleSkipBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const next = Math.max(0, currentTime - SKIP_SECONDS);
    void playback?.seekPlaybackTo(next);
  };

  const handleSkipForward = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const next = Math.min(track.durationSeconds, currentTime + SKIP_SECONDS);
    void playback?.seekPlaybackTo(next);
  };

  const handleSliderComplete = (val: number) => {
    const next = Math.round(val * track.durationSeconds);
    if (playback) {
      void playback.seekPlaybackTo(next);
    } else {
      seek(next);
    }
  };

  const handleFavorite = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleFavorite(track.id);
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={[...track.gradientColors, theme.colors.bgMain]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.flex}
      >
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
            <Pressable
              onPress={handleBack}
              hitSlop={16}
              style={styles.backBtn}
              accessibilityLabel="뒤로가기"
              accessibilityRole="button"
            >
              <ArrowLeft size={24} color={theme.colors.textOnPrimary} />
            </Pressable>
            <Pressable
              onPress={handleFavorite}
              hitSlop={16}
              style={styles.favBtn}
              accessibilityLabel={liked ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              accessibilityRole="button"
            >
              <Heart
                size={24}
                color={theme.colors.textOnPrimary}
                fill={liked ? theme.colors.error : 'transparent'}
              />
            </Pressable>
          </Animated.View>

          <View style={styles.content}>
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              style={styles.artworkWrap}
            >
              <View
                style={[
                  styles.artwork,
                  { backgroundColor: theme.colors.textOnPrimary + '20' },
                ]}
              >
                <Text style={styles.artworkEmoji}>🧘</Text>
              </View>
            </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.infoWrap}
          >
            <View
              style={{
                alignSelf: 'stretch',
                marginBottom: 12,
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: theme.borderRadius.lg,
                backgroundColor: theme.colors.textOnPrimary + '18',
              }}
              accessibilityRole="text"
            >
              <Text
                style={{
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textOnPrimary,
                  opacity: 0.9,
                  textAlign: 'center',
                }}
              >
                {catalogSource === 'api'
                  ? '서버 카탈로그(GET /api/v1/meditations). 오디오 URL이 없으면 앱에 포함된 무음 데모 클립으로 재생됩니다(실제 가이드 음원은 서버·자사 CDN에 등록).'
                  : '데모 카탈로그(서버 실패 시 폴백). 오디오는 무음 데모 클립이며, 가이드 음원은 라이선스 확보 후 API·CDN에 연결하세요.'}
              </Text>
            </View>
            <Text
                style={{
                  fontFamily: theme.fontFamily.bold,
                  fontSize: theme.fontSize['2xl'],
                  color: theme.colors.textOnPrimary,
                  textAlign: 'center',
                }}
                numberOfLines={2}
              >
                {track.title}
              </Text>
              <Text
                style={{
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textOnPrimary,
                  opacity: 0.8,
                  textAlign: 'center',
                  marginTop: 8,
                }}
                numberOfLines={3}
              >
                {track.description}
              </Text>
            </Animated.View>
          </View>

          <Animated.View
            entering={FadeInUp.delay(400).springify()}
            style={styles.controls}
          >
            <View style={styles.sliderWrap}>
              <Slider
                value={progress}
                onSlidingComplete={handleSliderComplete}
                minimumValue={0}
                maximumValue={1}
                minimumTrackTintColor={theme.colors.textOnPrimary}
                maximumTrackTintColor={theme.colors.textOnPrimary + '40'}
                thumbTintColor={theme.colors.textOnPrimary}
                style={styles.slider}
                accessibilityLabel="재생 진행"
              />
              <View style={styles.timeRow}>
                <Text
                  style={{
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textOnPrimary,
                    opacity: 0.7,
                  }}
                >
                  {formatPlayerTime(currentTime)}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textOnPrimary,
                    opacity: 0.7,
                  }}
                >
                  {formatPlayerTime(track.durationSeconds)}
                </Text>
              </View>
            </View>

            <View style={styles.btnRow}>
              <Pressable
                onPress={handleSkipBack}
                hitSlop={12}
                style={styles.skipBtn}
                accessibilityLabel="10초 뒤로"
                accessibilityRole="button"
              >
                <RotateCcw size={28} color={theme.colors.textOnPrimary} />
                <Text style={[styles.skipLabel, { color: theme.colors.textOnPrimary }]}>
                  10
                </Text>
              </Pressable>

              <Pressable
                onPress={handlePlayPause}
                style={[
                  styles.playBtn,
                  { backgroundColor: theme.colors.textOnPrimary + '25' },
                ]}
                accessibilityLabel={isPlaying ? '일시정지' : '재생'}
                accessibilityRole="button"
              >
                {isPlaying ? (
                  <Pause size={36} color={theme.colors.textOnPrimary} fill={theme.colors.textOnPrimary} />
                ) : (
                  <Play size={36} color={theme.colors.textOnPrimary} fill={theme.colors.textOnPrimary} />
                )}
              </Pressable>

              <Pressable
                onPress={handleSkipForward}
                hitSlop={12}
                style={styles.skipBtn}
                accessibilityLabel="10초 앞으로"
                accessibilityRole="button"
              >
                <RotateCw size={28} color={theme.colors.textOnPrimary} />
                <Text style={[styles.skipLabel, { color: theme.colors.textOnPrimary }]}>
                  10
                </Text>
              </Pressable>
            </View>

            {isFinished && (
              <Animated.View entering={FadeIn.duration(300)}>
                <Text
                  style={{
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                    color: theme.colors.textOnPrimary,
                    textAlign: 'center',
                    marginTop: 16,
                  }}
                >
                  명상을 완료했습니다
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  artworkWrap: { marginBottom: 32 },
  artwork: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkEmoji: { fontSize: fontSizeTokens['5xl'] + fontSizeTokens['3xl'] },
  infoWrap: { paddingHorizontal: 16 },
  controls: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  sliderWrap: { marginBottom: 8 },
  slider: { width: '100%', height: 40 },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginTop: 8,
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipLabel: {
    fontSize: fontSizeTokens['2xs'],
    fontWeight: '600',
    marginTop: -4,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
