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

  const filteredArticles = useMemo(() => {
    if (activeCategory === 'all') return MOCK_PSYCHO_ARTICLES;
    if (activeCategory === 'bookmarks')
      return MOCK_PSYCHO_ARTICLES.filter((a) => bookmarks.includes(a.id));
    return MOCK_PSYCHO_ARTICLES.filter(
      (a) => a.category === activeCategory,
    );
  }, [activeCategory, bookmarks]);

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

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

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

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
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
