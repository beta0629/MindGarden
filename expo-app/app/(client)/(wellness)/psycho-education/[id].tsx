/**
 * 심리 교육 상세 — 카드 스와이프 페이지네이션 + 읽기완료 트래킹
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Bookmark, Check } from 'lucide-react-native';
import { createMMKV } from 'react-native-mmkv';

import { usePsychoEducationArticleById, PSYCHO_EDUCATION_API_PLACEHOLDER } from '@/api/hooks/useWellness';
import { useTheme } from '@/theme';
import { EmptyState } from '@/components/atoms/EmptyState';
import { type PsychoPage } from '@/constants/psychoEducationData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 24;

const mmkv = createMMKV({ id: 'psycho-education' });

function loadBookmarks(): number[] {
  try {
    const raw = mmkv.getString('bookmarks');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadCompleted(): number[] {
  try {
    const raw = mmkv.getString('completed');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function PsychoEducationDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const articleId = Number(id);

  const {
    article,
    source: psychoSource,
    usedFallbackDueToError,
    isLoading,
    refetch,
  } = usePsychoEducationArticleById(articleId);

  const [currentPage, setCurrentPage] = useState(0);
  const [bookmarks, setBookmarks] = useState<number[]>(loadBookmarks);
  const [completedArticles, setCompletedArticles] = useState<number[]>(loadCompleted);
  const flatListRef = useRef<FlatList>(null);

  const isBookmarked = bookmarks.includes(articleId);
  const isCompleted = completedArticles.includes(articleId);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first && first.index != null) {
        setCurrentPage(first.index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleBookmark = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const next = isBookmarked
      ? bookmarks.filter((i) => i !== articleId)
      : [...bookmarks, articleId];
    setBookmarks(next);
    mmkv.set('bookmarks', JSON.stringify(next));
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  useEffect(() => {
    if (!article) {
      return;
    }
    const lastIndex = article.pages.length - 1;
    if (currentPage !== lastIndex) {
      return;
    }
    setCompletedArticles((prev) => {
      if (prev.includes(articleId)) {
        return prev;
      }
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const next = [...prev, articleId];
      mmkv.set('completed', JSON.stringify(next));
      return next;
    });
  }, [article, currentPage, articleId]);

  if (isLoading && !article) {
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

  if (!article) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top', 'bottom']}
      >
        <EmptyState
          title="콘텐츠를 찾을 수 없습니다"
          description="목록에서 다른 글을 선택하거나 다시 불러와 주세요"
          actionLabel="다시 불러오기"
          onAction={() => {
            void refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  const sourceBanner =
    psychoSource === 'api'
      ? '서버에서 불러온 글입니다. 북마크·읽기 완료는 이 기기(MMKV)에만 저장됩니다.'
      : usedFallbackDueToError
        ? `서버 목록(${PSYCHO_EDUCATION_API_PLACEHOLDER})을 불러오지 못해 샘플을 표시합니다.`
        : `샘플 카드뉴스입니다. 서버 연동 후 ${PSYCHO_EDUCATION_API_PLACEHOLDER} 목록으로 바뀝니다.`;

  const renderPage = ({ item, index }: { item: PsychoPage; index: number }) => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <LinearGradient
        colors={[...article.gradientColors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.pageCard, { borderRadius: theme.borderRadius.xl }]}
      >
        <Text
          style={{
            fontFamily: theme.fontFamily.bold,
            fontSize: theme.fontSize.xl,
            color: theme.colors.textOnPrimary,
            marginBottom: 16,
          }}
        >
          {item.title}
        </Text>
        <Text
          style={{
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.base,
            color: theme.colors.textOnPrimary,
            opacity: 0.9,
            lineHeight: 26,
          }}
        >
          {item.body}
        </Text>
        <Text
          style={{
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.xs,
            color: theme.colors.textOnPrimary,
            opacity: 0.6,
            marginTop: 20,
            textAlign: 'right',
          }}
        >
          {index + 1} / {article.pages.length}
        </Text>
      </LinearGradient>
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.bgMain }]}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        {/* 헤더 */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <Pressable
            onPress={handleBack}
            hitSlop={16}
            style={styles.iconBtn}
            accessibilityLabel="뒤로가기"
            accessibilityRole="button"
          >
            <ArrowLeft size={24} color={theme.colors.textMain} />
          </Pressable>
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.lg,
              color: theme.colors.textMain,
              flex: 1,
              textAlign: 'center',
            }}
            numberOfLines={1}
          >
            {article.title}
          </Text>
          <Pressable
            onPress={handleBookmark}
            hitSlop={16}
            style={styles.iconBtn}
            accessibilityLabel={isBookmarked ? '북마크 해제' : '북마크 추가'}
            accessibilityRole="button"
          >
            <Bookmark
              size={22}
              color={isBookmarked ? theme.colors.primary : theme.colors.textMain}
              fill={isBookmarked ? theme.colors.primary : 'transparent'}
            />
          </Pressable>
        </Animated.View>

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
            {sourceBanner}
          </Text>
        </View>

        {/* 카드 스와이프 */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.flex}
        >
          <FlatList
            ref={flatListRef}
            data={article.pages as PsychoPage[]}
            renderItem={renderPage}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
        </Animated.View>

        {/* 페이지 인디케이터 */}
        <View style={styles.indicatorRow}>
          {article.pages.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === currentPage
                      ? theme.colors.primary
                      : theme.colors.border,
                  width: i === currentPage ? 20 : 8,
                },
              ]}
              accessibilityLabel={`페이지 ${i + 1}${i === currentPage ? ' 현재' : ''}`}
            />
          ))}
        </View>

        {/* 완료 표시 */}
        {isCompleted && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.completedBadge}>
            <Check size={16} color={theme.colors.success} />
            <Text
              style={{
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.sm,
                color: theme.colors.success,
                marginLeft: 4,
              }}
            >
              읽기 완료
            </Text>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  page: {
    justifyContent: 'center',
    paddingHorizontal: CARD_PADDING,
  },
  pageCard: {
    padding: 28,
    minHeight: 320,
    justifyContent: 'center',
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  },
});
