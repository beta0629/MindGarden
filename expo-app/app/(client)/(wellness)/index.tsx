/**
 * 웰니스 메인 화면
 *
 * - "마음 돌봄" 제목 + 오늘 날짜
 * - 진입 카드 (감정 일기, 자가 심리검사, 명상 가이드, 심리 교육, 마음 정원, 마음 날씨)
 * - 힐링 콘텐츠 카드 피드
 * - Reanimated stagger 진입 애니메이션
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  PenLine,
  ClipboardList,
  Headphones,
  BookOpen,
  Heart,
  Sparkles,
  Flower2,
  CloudSun,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { WellnessCard } from '@/components/molecules/WellnessCard';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { EmptyState } from '@/components/atoms/EmptyState';
import { useHealingContents, type HealingContent } from '@/api/hooks/useWellness';
import { WELLNESS_NON_MEDICAL_DISCLAIMER_KO } from '@/constants/wellnessComplianceCopy';

interface WellnessEntryItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function ClientWellness() {
  const theme = useTheme();
  const router = useRouter();
  const today = format(new Date(), 'M월 d일 (EEEE)', { locale: ko });

  const { data: contents, isPending, isFetching, refetch } = useHealingContents();
  const healingFeed = Array.isArray(contents) ? contents : [];

  const ENTRY_ROUTES: Record<string, string> = {
    '감정 일기': '/(client)/(wellness)/mood-journal',
    '마음 자가 점검': '/(client)/(wellness)/self-assessment',
    '명상 가이드': '/(client)/(wellness)/meditation',
    '심리 교육': '/(client)/(wellness)/psycho-education',
    '마음 정원': '/(client)/(wellness)/garden',
    '마음 날씨': '/(client)/(wellness)/mind-weather',
  };

  const handleEntryPress = (title: string) => {
    const route = ENTRY_ROUTES[title];
    if (route) {
      router.push(route as Href);
    }
  };

  const entries: WellnessEntryItem[] = [
    {
      icon: <PenLine size={24} color={theme.colors.primary} />,
      title: '감정 일기',
      description: '오늘의 기분을 기록해보세요',
    },
    {
      icon: <ClipboardList size={24} color={theme.colors.primary} />,
      title: '마음 자가 점검',
      description: '참고용 설문으로 마음을 살펴봐요',
    },
    {
      icon: <Headphones size={24} color={theme.colors.primary} />,
      title: '명상 가이드',
      description: '잠시 쉬어가세요',
    },
    {
      icon: <BookOpen size={24} color={theme.colors.primary} />,
      title: '심리 교육',
      description: '마음에 대해 알아보세요',
    },
    {
      icon: <Flower2 size={24} color={theme.colors.primary} />,
      title: '마음 정원',
      description: '나만의 성장을 조용히 모아가요',
    },
    {
      icon: <CloudSun size={24} color={theme.colors.primary} />,
      title: '마음 날씨',
      description: '짧게 적으면 AI가 감정 키워드를 만들어요',
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title="웰니스" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* 제목 */}
        <Animated.View entering={FadeInDown.springify()} style={styles.header}>
          <View style={styles.headerRow}>
            <Sparkles size={20} color={theme.colors.primary} />
            <Text
              style={{
                fontFamily: theme.fontFamily.bold,
                fontSize: theme.fontSize['2xl'],
                color: theme.colors.textMain,
                marginLeft: 8,
              }}
              accessibilityRole="header"
            >
              마음 돌봄
            </Text>
          </View>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              marginTop: 4,
            }}
          >
            {today}
          </Text>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize['2xs'],
              color: theme.colors.textTertiary,
              marginTop: 10,
              lineHeight: 16,
            }}
          >
            {WELLNESS_NON_MEDICAL_DISCLAIMER_KO}
          </Text>
        </Animated.View>

        {/* 4개 진입 카드 */}
        <View style={styles.entrySection}>
          {entries.map((entry, index) => (
            <WellnessCard
              key={entry.title}
              icon={entry.icon}
              title={entry.title}
              description={entry.description}
              index={index}
              onPress={() => handleEntryPress(entry.title)}
            />
          ))}
        </View>

        {/* 힐링 콘텐츠 피드 */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.feedSection}>
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
            마음챙김 가이드
          </Text>

          {isPending ? (
            <View style={styles.feedLoading}>
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} lines={2} />
              ))}
            </View>
          ) : healingFeed.length === 0 ? (
            <EmptyState
              icon={<Heart size={32} color={theme.colors.textTertiary} />}
              title="콘텐츠 준비 중"
              description="곧 새로운 힐링 콘텐츠가 올라올 예정이에요"
            />
          ) : (
            healingFeed.map((item, index) => (
              <HealingContentCard key={item.id} content={item} index={index} theme={theme} />
            ))
          )}
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface HealingContentCardProps {
  content: HealingContent;
  index: number;
  theme: ReturnType<typeof useTheme>;
}

function HealingContentCard({ content, index, theme }: HealingContentCardProps) {
  const typeIcons: Record<string, React.ReactNode> = {
    MEDITATION: <Headphones size={20} color={theme.colors.primary} />,
    ARTICLE: <BookOpen size={20} color={theme.colors.primary} />,
    AUDIO: <Headphones size={20} color={theme.colors.primary} />,
    VIDEO: <Heart size={20} color={theme.colors.primary} />,
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(500 + index * 80).springify()}
      style={[
        feedStyles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
          ...theme.shadows.sm,
        },
      ]}
    >
      <View style={[feedStyles.iconWrap, { backgroundColor: theme.colors.primaryLight + '30' }]}>
        {typeIcons[content.type] ?? typeIcons.ARTICLE}
      </View>
      <View style={feedStyles.textWrap}>
        <Text
          style={{
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textMain,
          }}
          numberOfLines={1}
        >
          {content.title}
        </Text>
        <Text
          style={{
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
            color: theme.colors.textSecondary,
          }}
          numberOfLines={2}
        >
          {content.description}
        </Text>
        {content.durationMinutes != null && (
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize['2xs'],
              color: theme.colors.textTertiary,
              marginTop: 2,
            }}
          >
            {content.durationMinutes}분
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const feedStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    marginLeft: 12,
    gap: 1,
  },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entrySection: {
    marginTop: 8,
  },
  feedSection: {
    marginTop: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  feedLoading: {
    gap: 10,
  },
  bottomSpacer: {
    height: 24,
  },
});
