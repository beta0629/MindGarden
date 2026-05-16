/**
 * 상담사 — 마음 날씨 수신함 (내담자 옵트인 공유 카드).
 *
 * - 내담자가 공유 동의한 카드만 노출
 * - 카드 자체는 분석 결과(요약·키워드)에 한정. 원문은 옵트인 시에만 표시
 * - 목록: 상담사 인박스 API 우선, 오류·빈 응답 시 로컬(MMKV) 인박스 폴백
 *
 * 참조: `MIND_WEATHER_UI_UX_SPEC.md` §2.2
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AlertCircle, CloudSun, Inbox } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { Chip } from '@/components/atoms/Chip';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { useConsultantMindWeatherInbox } from '@/api/hooks/useMindWeather';
import {
  MIND_WEATHER_DISCLAIMER_KO,
  MIND_WEATHER_SHARE_COPY_KO,
} from '@/constants/wellnessComplianceCopy';
import {
  CONSULTANT_MIND_WEATHER_INBOX_FETCH_FAILED,
  MIND_WEATHER_SOURCE_LABELS,
} from '@/constants/mindWeatherKeywords';
import { toDisplayString } from '@/utils/toDisplayString';
import { formatMindWeatherClientHeadline } from '@/utils/mindWeatherClientLabel';

export default function ConsultantMindWeatherInbox() {
  const theme = useTheme();
  const inboxQuery = useConsultantMindWeatherInbox();
  const items = inboxQuery.data?.items ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title="마음 날씨 수신함" canGoBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={inboxQuery.isFetching}
            onRefresh={inboxQuery.refetch}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Animated.View entering={FadeInDown.springify()} style={styles.headerWrap}>
          <View style={styles.headerRow}>
            <CloudSun size={22} color={theme.colors.primary} />
            <Text
              style={{
                fontFamily: theme.fontFamily.bold,
                fontSize: theme.fontSize.xl,
                color: theme.colors.textMain,
                marginLeft: 8,
              }}
              accessibilityRole="header"
            >
              내담자 마음 날씨
            </Text>
          </View>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              marginTop: 6,
              lineHeight: 20,
            }}
          >
            내담자가 직접 공유 동의한 카드만 보여요. 동의 범위에 따라 원문 보기가 잠겨 있을 수
            있습니다.
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
            {MIND_WEATHER_DISCLAIMER_KO}
          </Text>
        </Animated.View>

        {inboxQuery.isLoading ? (
          <View style={styles.loadingWrap}>
            {[0, 1].map((i) => (
              <SkeletonCard key={i} lines={3} />
            ))}
          </View>
        ) : inboxQuery.isError ? (
          <EmptyState
            icon={<AlertCircle size={32} color={theme.colors.textTertiary} />}
            title="수신함을 불러오지 못했어요"
            description={(() => {
              const msg = inboxQuery.error instanceof Error ? inboxQuery.error.message.trim() : '';
              return msg.length > 0 ? msg : CONSULTANT_MIND_WEATHER_INBOX_FETCH_FAILED;
            })()}
            actionLabel="다시 시도"
            onAction={() => inboxQuery.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Inbox size={32} color={theme.colors.textTertiary} />}
            title="아직 공유받은 카드가 없어요"
            description="내담자가 공유 동의를 켜면 이 화면에 카드가 도착해요."
          />
        ) : (
          items.map((card, index) => {
            const dateLabel = (() => {
              try {
                return format(parseISO(card.createdAt), 'yyyy년 M월 d일 (EEEE)', {
                  locale: ko,
                });
              } catch {
                return '';
              }
            })();
            const sharedOriginal = Boolean(card.share?.original);
            const clientHeadline = formatMindWeatherClientHeadline(card.clientName, card.clientId);
            return (
              <Animated.View
                key={card.id}
                entering={FadeInDown.delay(index * 60).springify()}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.xl,
                    borderColor: theme.colors.gray[300],
                    ...theme.shadows.sm,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.semibold,
                      fontSize: theme.fontSize.base,
                      color: theme.colors.textMain,
                    }}
                  >
                    {clientHeadline}
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.regular,
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    {dateLabel} · {MIND_WEATHER_SOURCE_LABELS[card.source]}
                  </Text>
                </View>

                {card.keywords.length > 0 ? (
                  <View style={styles.chips}>
                    {card.keywords.map((kw) => (
                      <Chip
                        key={kw.key}
                        label={toDisplayString(kw.label, '')}
                        selected
                        style={styles.chip}
                      />
                    ))}
                  </View>
                ) : null}

                <Text
                  style={{
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textMain,
                    lineHeight: 22,
                    marginTop: 12,
                  }}
                >
                  {toDisplayString(card.summary, '')}
                </Text>

                <View
                  style={[
                    styles.originalBlock,
                    {
                      backgroundColor: theme.colors.bgMain,
                      borderColor: theme.colors.gray[200],
                      borderRadius: theme.borderRadius.lg,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.medium,
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    {sharedOriginal
                      ? `${clientHeadline} 원문(공유 동의됨)`
                      : '원문은 내담자가 별도 동의해야 표시돼요'}
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.regular,
                      fontSize: theme.fontSize.sm,
                      color: sharedOriginal ? theme.colors.textMain : theme.colors.textTertiary,
                      lineHeight: 20,
                    }}
                  >
                    {sharedOriginal ? toDisplayString(card.text, '') : '— 비공개 —'}
                  </Text>
                </View>

                <Text
                  style={{
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize['2xs'],
                    color: theme.colors.textTertiary,
                    marginTop: 12,
                  }}
                >
                  {MIND_WEATHER_SHARE_COPY_KO.description}
                </Text>
              </Animated.View>
            );
          })
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  headerWrap: { paddingVertical: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  loadingWrap: { gap: 12 },
  card: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { marginBottom: 12 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: { marginBottom: 0 },
  originalBlock: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
  },
  bottomSpacer: { height: 32 },
});
