/**
 * 심리 교육 메인 — 카테고리 칩, 카드뉴스 리스트, 북마크 필터
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
import { Bookmark, Clock, BookOpen } from 'lucide-react-native';
import { createMMKV } from 'react-native-mmkv';

import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { Chip } from '@/components/atoms/Chip';
import { EmptyState } from '@/components/atoms/EmptyState';
import {
  PSYCHO_EDUCATION_API_PLACEHOLDER,
  useHealingContents,
  usePsychoEducationCatalog,
} from '@/api/hooks/useWellness';
import { toDisplayString } from '@/utils/toDisplayString';
import {
  PSYCHO_CATEGORIES,
  MOCK_PSYCHO_ARTICLES,
  type PsychoCategory,
  type PsychoArticle,
} from '@/constants/psychoEducationData';

const mmkv = createMMKV({ id: 'psycho-education' });

function loadBookmarks(): number[] {
  try {
    const raw = mmkv.getString('bookmarks');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBookmarks(ids: number[]) {
  mmkv.set('bookmarks', JSON.stringify(ids));
}

export default function PsychoEducationMain() {
  const theme = useTheme();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<
    PsychoCategory | 'bookmarks'
  >('all');
  const [bookmarks, setBookmarks] = useState<number[]>(loadBookmarks);
  const [refreshing, setRefreshing] = useState(false);

  const healingQuery = useHealingContents();
  const psychoCatalogQuery = usePsychoEducationCatalog();

  const catalogArticles = useMemo(
    () => psychoCatalogQuery.data?.articles ?? MOCK_PSYCHO_ARTICLES,
    [psychoCatalogQuery.data?.articles],
  );
  const psychoSource = psychoCatalogQuery.data?.source ?? 'demo';
  const psychoFallbackError = psychoCatalogQuery.data?.usedFallbackDueToError ?? false;

  const healingArticlePreview = useMemo(() => {
    const list = healingQuery.data ?? [];
    return list
      .filter((item) => item.type === 'ARTICLE')
      .slice(0, 3);
  }, [healingQuery.data]);

  const filteredArticles = useMemo(() => {
    if (activeCategory === 'all') return catalogArticles;
    if (activeCategory === 'bookmarks')
      return catalogArticles.filter((a) => bookmarks.includes(a.id));
    return catalogArticles.filter(
      (a) => a.category === activeCategory,
    );
  }, [activeCategory, bookmarks, catalogArticles]);

  const toggleBookmark = useCallback(
    (articleId: number) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const next = bookmarks.includes(articleId)
        ? bookmarks.filter((id) => id !== articleId)
        : [...bookmarks, articleId];
      setBookmarks(next);
      saveBookmarks(next);
    },
    [bookmarks],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([healingQuery.refetch(), psychoCatalogQuery.refetch()]);
    setRefreshing(false);
  }, [healingQuery, psychoCatalogQuery]);

  const navigateToDetail = (articleId: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/(client)/(wellness)/psycho-education/${articleId}`);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <AppTopBar title="심리 교육" canGoBack />

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
          {psychoSource === 'api'
            ? `서버 목록(${PSYCHO_EDUCATION_API_PLACEHOLDER}). 북마크·읽기 완료는 이 기기(MMKV)에만 저장됩니다.`
            : psychoFallbackError
              ? `서버 목록(${PSYCHO_EDUCATION_API_PLACEHOLDER})을 불러오지 못해 샘플 카드뉴스를 표시합니다. 동기화로 재시도할 수 있습니다.`
              : `샘플 카드뉴스 · 전용 API ${PSYCHO_EDUCATION_API_PLACEHOLDER}(예정). 서버 연동 시 목록이 바뀝니다.`}
          {' '}
          힐링 콘텐츠는 연동 시 아래에 표시됩니다.
        </Text>
      </View>

      {psychoFallbackError ? (
        <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
          <EmptyState
            title="심리 교육 서버 목록을 불러오지 못했습니다"
            description={`${PSYCHO_EDUCATION_API_PLACEHOLDER} 연결을 확인한 뒤 다시 시도해 주세요. 샘플 카드뉴스는 계속 이용할 수 있습니다.`}
            actionLabel="다시 시도"
            onAction={() => {
              void psychoCatalogQuery.refetch();
            }}
          />
        </View>
      ) : null}

      {healingQuery.isError ? (
        <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
          <EmptyState
            title="힐링 콘텐츠를 불러오지 못했습니다"
            description="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
            actionLabel="다시 시도"
            onAction={() => {
              void healingQuery.refetch();
            }}
          />
        </View>
      ) : null}

      {healingQuery.isSuccess && healingArticlePreview.length > 0 ? (
        <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textMain,
              marginBottom: 6,
            }}
          >
            힐링 콘텐츠에서 가져온 글 (ARTICLE)
          </Text>
          {healingArticlePreview.map((row) => (
            <Text
              key={row.id}
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textSecondary,
                marginBottom: 4,
              }}
              numberOfLines={2}
            >
              {toDisplayString(row.title, '제목 없음')}
            </Text>
          ))}
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing || healingQuery.isFetching || psychoCatalogQuery.isFetching
            }
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* 카테고리 칩 */}
        <Animated.View entering={FadeInDown.springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {PSYCHO_CATEGORIES.map((cat) => (
              <Chip
                key={cat.key}
                label={cat.label}
                selected={activeCategory === cat.key}
                onPress={() => setActiveCategory(cat.key)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* 카드 리스트 */}
        {filteredArticles.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={32} color={theme.colors.textTertiary} />}
            title={
              activeCategory === 'bookmarks'
                ? '북마크가 비어있어요'
                : '콘텐츠가 없어요'
            }
            description={
              activeCategory === 'bookmarks'
                ? '북마크 아이콘을 눌러 저장해보세요'
                : '다른 카테고리를 선택해보세요'
            }
          />
        ) : (
          filteredArticles.map((article, index) => (
            <PsychoCard
              key={article.id}
              article={article}
              index={index}
              isBookmarked={bookmarks.includes(article.id)}
              onPress={() => navigateToDetail(article.id)}
              onBookmark={() => toggleBookmark(article.id)}
            />
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface PsychoCardProps {
  article: PsychoArticle;
  index: number;
  isBookmarked: boolean;
  onPress: () => void;
  onBookmark: () => void;
}

function PsychoCard({
  article,
  index,
  isBookmarked,
  onPress,
  onBookmark,
}: PsychoCardProps) {
  const theme = useTheme();

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
        accessibilityLabel={`${article.title}. ${article.categoryLabel}. ${article.readMinutes}분 읽기`}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[...article.gradientColors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[cardStyles.thumb, { borderRadius: theme.borderRadius.lg }]}
        >
          <BookOpen size={24} color={theme.colors.textOnPrimary} />
        </LinearGradient>

        <View style={cardStyles.textWrap}>
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              color: theme.colors.textMain,
            }}
            numberOfLines={2}
          >
            {article.title}
          </Text>
          <View style={cardStyles.metaRow}>
            <View
              style={[
                cardStyles.tag,
                { backgroundColor: theme.colors.accentSoft },
              ]}
            >
              <Text
                style={{
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize['2xs'],
                  color: theme.colors.textSecondary,
                }}
              >
                {article.categoryLabel}
              </Text>
            </View>
            <View style={cardStyles.timeWrap}>
              <Clock size={12} color={theme.colors.textTertiary} />
              <Text
                style={{
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textTertiary,
                }}
              >
                {article.readMinutes}분
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={onBookmark}
          hitSlop={12}
          style={cardStyles.bookmarkBtn}
          accessibilityLabel={isBookmarked ? '북마크 해제' : '북마크 추가'}
          accessibilityRole="button"
        >
          <Bookmark
            size={20}
            color={
              isBookmarked ? theme.colors.primary : theme.colors.textTertiary
            }
            fill={isBookmarked ? theme.colors.primary : 'transparent'}
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
  thumb: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
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
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookmarkBtn: {
    padding: 8,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  chipRow: { paddingVertical: 8, gap: 8 },
  bottomSpacer: { height: 24 },
});
