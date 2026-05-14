/**
 * 명상 가이드 메인 — 카테고리 탭, 추천 명상, 명상 카드 리스트, 수련 통계
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Headphones, Clock, Flame, Play } from 'lucide-react-native';

import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { Chip } from '@/components/atoms/Chip';
import { StatCard } from '@/components/atoms/StatCard';
import { EmptyState } from '@/components/atoms/EmptyState';
import { useMeditationStore } from '@/stores/useMeditationStore';
import { useMeditationCatalog } from '@/api/hooks/useMeditations';
import {
  MEDITATION_CATEGORIES,
  MOCK_MEDITATION_TRACKS,
  RECOMMENDED_TRACK_ID,
  formatDuration,
  type MeditationCategory,
  type MeditationTrack,
} from '@/constants/meditationData';

export default function MeditationMain() {
  const theme = useTheme();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<MeditationCategory | 'favorites'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const catalogQuery = useMeditationCatalog();
  const serverTracks = catalogQuery.data?.tracks;
  const catalogTracks: MeditationTrack[] =
    serverTracks != null && serverTracks.length > 0 ? serverTracks : MOCK_MEDITATION_TRACKS;
  const catalogSource =
    serverTracks != null && serverTracks.length > 0 && catalogQuery.data?.source === 'api'
      ? 'api'
      : 'demo';

  const { favorites, totalPracticeMinutes, streakDays } = useMeditationStore();

  const filteredTracks = useMemo(() => {
    if (activeCategory === 'all') return catalogTracks;
    if (activeCategory === 'favorites')
      return catalogTracks.filter((t) => favorites.includes(t.id));
    return catalogTracks.filter((t) => t.category === activeCategory);
  }, [activeCategory, favorites, catalogTracks]);

  const recommendedTrack =
    catalogTracks.find((t) => t.id === RECOMMENDED_TRACK_ID) ?? catalogTracks[0];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await catalogQuery.refetch();
    setRefreshing(false);
  }, [catalogQuery]);

  const navigateToPlayer = (trackId: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/(client)/(wellness)/meditation/${trackId}`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title="명상 가이드" canGoBack />

      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 8,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: theme.borderRadius.lg,
          backgroundColor: theme.colors.accentSoft,
        }}
        accessibilityRole="text"
      >
        <Text
          style={{
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.xs,
            color: theme.colors.textSecondary,
          }}
        >
          {catalogSource === 'api'
            ? '서버에 등록된 명상(MEDITATION) 카탈로그를 불러왔어요. 오디오 URL이 없으면 무음 데모 클립으로 재생됩니다.'
            : '지금은 앱에 포함된 데모 목록을 보여 드려요. 운영에서 힐링 카탈로그에 명상 항목을 등록·노출하면 GET /api/v1/meditations 목록으로 자동 전환됩니다.'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || catalogQuery.isFetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* 수련 통계 */}
        <Animated.View entering={FadeInDown.springify()} style={styles.statsRow}>
          <StatCard
            label="총 수련 시간"
            value={totalPracticeMinutes}
            unit="분"
            icon={<Clock size={20} color={theme.colors.primary} />}
            style={styles.statCard}
          />
          <StatCard
            label="연속 수련"
            value={streakDays}
            unit="일"
            icon={<Flame size={20} color={theme.colors.primary} />}
            style={styles.statCard}
          />
        </Animated.View>

        {/* 오늘의 추천 */}
        {recommendedTrack && (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                  color: theme.colors.textMain,
                },
              ]}
            >
              오늘의 추천 명상
            </Text>
            <Pressable
              onPress={() => navigateToPlayer(recommendedTrack.id)}
              style={({ pressed }) => [
                styles.recommendCard,
                {
                  borderRadius: theme.borderRadius.xl,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  overflow: 'hidden',
                },
              ]}
              accessibilityLabel={`추천 명상: ${recommendedTrack.title}`}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[...recommendedTrack.gradientColors]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.recommendGradient}
              >
                <View style={styles.recommendContent}>
                  <View style={styles.recommendTextWrap}>
                    <Text
                      style={{
                        fontFamily: theme.fontFamily.bold,
                        fontSize: theme.fontSize.xl,
                        color: theme.colors.textOnPrimary,
                      }}
                      numberOfLines={2}
                    >
                      {recommendedTrack.title}
                    </Text>
                    <Text
                      style={{
                        fontFamily: theme.fontFamily.regular,
                        fontSize: theme.fontSize.sm,
                        color: theme.colors.textOnPrimary,
                        opacity: 0.85,
                        marginTop: 4,
                      }}
                      numberOfLines={2}
                    >
                      {recommendedTrack.description}
                    </Text>
                    <View style={styles.recommendMeta}>
                      <Text
                        style={{
                          fontFamily: theme.fontFamily.medium,
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.textOnPrimary,
                          opacity: 0.8,
                        }}
                      >
                        {recommendedTrack.categoryLabel} ·{' '}
                        {formatDuration(recommendedTrack.durationSeconds)}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.playCircle,
                      { backgroundColor: theme.colors.textOnPrimary + '30' },
                    ]}
                  >
                    <Play
                      size={28}
                      color={theme.colors.textOnPrimary}
                      fill={theme.colors.textOnPrimary}
                    />
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* 카테고리 칩 */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {MEDITATION_CATEGORIES.map((cat) => (
              <Chip
                key={cat.key}
                label={cat.label}
                selected={activeCategory === cat.key}
                onPress={() => setActiveCategory(cat.key)}
                style={styles.chip}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* 명상 카드 리스트 */}
        {filteredTracks.length === 0 ? (
          <EmptyState
            icon={<Heart size={32} color={theme.colors.textTertiary} />}
            title={
              activeCategory === 'favorites' ? '즐겨찾기가 비어있어요' : '명상 콘텐츠가 없어요'
            }
            description={
              activeCategory === 'favorites'
                ? '하트를 눌러 즐겨찾기에 추가해보세요'
                : '다른 카테고리를 선택해보세요'
            }
          />
        ) : (
          filteredTracks.map((track, index) => (
            <MeditationCard
              key={track.id}
              track={track}
              index={index}
              onPress={() => navigateToPlayer(track.id)}
            />
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface MeditationCardProps {
  track: MeditationTrack;
  index: number;
  onPress: () => void;
}

function MeditationCard({ track, index, onPress }: MeditationCardProps) {
  const theme = useTheme();
  const { toggleFavorite, isFavorite } = useMeditationStore();
  const liked = isFavorite(track.id);

  const handleFavorite = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleFavorite(track.id);
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 60).springify()}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyles.card,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.xl,
            ...theme.shadows.sm,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
        accessibilityLabel={`${track.title}. ${track.categoryLabel}. ${formatDuration(track.durationSeconds)}`}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[...track.gradientColors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[cardStyles.gradient, { borderRadius: theme.borderRadius.lg }]}
        >
          <Headphones size={24} color={theme.colors.textOnPrimary} />
        </LinearGradient>

        <View style={cardStyles.textWrap}>
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              color: theme.colors.textMain,
            }}
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <View style={cardStyles.metaRow}>
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textSecondary,
              }}
            >
              {formatDuration(track.durationSeconds)}
            </Text>
            <View style={[cardStyles.tag, { backgroundColor: theme.colors.accentSoft }]}>
              <Text
                style={{
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize['2xs'],
                  color: theme.colors.textSecondary,
                }}
              >
                {track.categoryLabel}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleFavorite}
          hitSlop={12}
          style={cardStyles.heartBtn}
          accessibilityLabel={liked ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          accessibilityRole="button"
        >
          <Heart
            size={20}
            color={liked ? theme.colors.error : theme.colors.textTertiary}
            fill={liked ? theme.colors.error : 'transparent'}
          />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
  },
  gradient: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  heartBtn: {
    padding: 8,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  statCard: { flex: 1 },
  sectionTitle: { marginBottom: 10 },
  recommendCard: { marginBottom: 16 },
  recommendGradient: { padding: 20 },
  recommendContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendTextWrap: { flex: 1 },
  recommendMeta: { marginTop: 8 },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  chipRow: {
    paddingVertical: 8,
    gap: 8,
  },
  chip: { marginRight: 0 },
  bottomSpacer: { height: 24 },
});
