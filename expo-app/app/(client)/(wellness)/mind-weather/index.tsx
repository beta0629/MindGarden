/**
 * 마음 날씨 — Phase 3 메인 화면(MVP).
 *
 * - 짧은 메모 입력 → AI 분석 결과 카드 표시
 * - 카드별 상담사 공유 옵트인 모달 (요약/원문 토글)
 * - 최근 분석 카드 목록 + 트렌드 알림 카피
 * - 음성/STT: Phase 3-F 비범위(상수·알림으로만 안내, EXPO_NATIVE_APP_PLAN 11.1 화면 게이트)
 *
 * 참조: `MIND_WEATHER_UI_UX_SPEC.md`, `CONSULTANT_CLIENT_APP_PLAN.md` Phase 4 A절
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AlertTriangle, CloudSun, Mic, Sparkles, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { MindWeatherCard } from '@/components/molecules/MindWeatherCard';
import { CitationBlock } from '@/components/molecules/CitationBlock';
import { AccountMismatchHint } from '@/components/molecules/AccountMismatchHint';
import { MindWeatherShareSheet } from '@/components/organisms/MindWeatherShareSheet';
import {
  useAnalyzeMindWeather,
  useMindWeatherList,
  useShareMindWeatherCard,
  useUnshareMindWeatherCard,
} from '@/api/hooks/useMindWeather';
import { useHasActiveConsultantMapping } from '@/api/hooks/useConsultantMapping';
import {
  CLIENT_MIND_WEATHER_LIST_API_FAILED,
  CLIENT_MIND_WEATHER_SETUP_NO_TENANT,
  CLIENT_MIND_WEATHER_SETUP_NO_TOKEN,
  MIND_WEATHER_TEXT_MAX_LENGTH,
  MIND_WEATHER_TEXT_MIN_LENGTH,
  MIND_WEATHER_TREND_ALERT_COPY,
  MIND_WEATHER_TREND_ALERT_THRESHOLD,
  MIND_WEATHER_VOICE_DEFERRED_UI_LABEL,
  MIND_WEATHER_VOICE_PLACEHOLDER_COPY,
} from '@/constants/mindWeatherKeywords';
import {
  MIND_WEATHER_DISCLAIMER_KO,
  MIND_WEATHER_SHARE_COPY_KO,
} from '@/constants/wellnessComplianceCopy';
import {
  MIND_WEATHER_AI_BANNER_BODY_KO,
  MIND_WEATHER_AI_BANNER_TITLE_KO,
  MIND_WEATHER_METHODOLOGY_KO,
} from '@/constants/assessmentCitations';
import { detectTrendingKeyword } from '@/services/mindWeatherService';
import type { MindWeatherCard as MindWeatherCardData } from '@/services/mindWeatherService';

const RECENT_TREND_WINDOW = 5;

export default function ClientMindWeatherIndex() {
  const theme = useTheme();
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const [shareTargetId, setShareTargetId] = useState<string | null>(null);

  const list = useMindWeatherList();
  const consultantMapping = useHasActiveConsultantMapping();
  const hasActiveMapping = consultantMapping.hasActiveMapping;
  const isShareDisabled = !hasActiveMapping;
  const analyzeMutation = useAnalyzeMindWeather();
  const showListSkeleton =
    list.blockReason === 'auth_loading' ||
    list.blockReason === 'tenant_hydrating' ||
    (list.isQueryReady && list.isPending && !list.data);
  const setupErrorMessage =
    list.blockReason === 'no_token'
      ? CLIENT_MIND_WEATHER_SETUP_NO_TOKEN
      : list.blockReason === 'no_tenant'
        ? CLIENT_MIND_WEATHER_SETUP_NO_TENANT
        : null;
  const showApiListWarning =
    list.isQueryReady && list.isError && (list.data?.items?.length ?? 0) === 0;

  useFocusEffect(
    useCallback(() => {
      if (list.isQueryReady) {
        void list.refetch();
      }
    }, [list.isQueryReady, list.refetch]),
  );
  const shareMutation = useShareMindWeatherCard();
  const unshareMutation = useUnshareMindWeatherCard();

  const cards: MindWeatherCardData[] = list.data?.items ?? [];
  const recentCards = cards.slice(0, RECENT_TREND_WINDOW);
  const trending = useMemo(
    () => detectTrendingKeyword(recentCards, MIND_WEATHER_TREND_ALERT_THRESHOLD),
    [recentCards],
  );

  const draftLength = draft.trim().length;
  const canAnalyze =
    list.isQueryReady &&
    draftLength >= MIND_WEATHER_TEXT_MIN_LENGTH &&
    !analyzeMutation.isPending;

  const handleHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAnalyze = async () => {
    if (!canAnalyze) {
      Alert.alert(
        '조금 더 적어주세요',
        `${MIND_WEATHER_TEXT_MIN_LENGTH}자 이상 적으면 더 정확한 분석이 가능해요.`,
      );
      return;
    }
    handleHaptic();
    try {
      await analyzeMutation.mutateAsync({
        text: draft.trim(),
        source: 'memo',
      });
      setDraft('');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert('분석 실패', '잠시 후 다시 시도해주세요.');
    }
  };

  const shareTargetCard = useMemo(
    () => cards.find((c) => c.id === shareTargetId) ?? null,
    [cards, shareTargetId],
  );

  const handlePressShareCard = useCallback(
    (cardId: string) => {
      if (isShareDisabled) {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        Alert.alert(
          '상담사 매칭 필요',
          '상담사 매칭이 완료된 뒤 공유할 수 있어요.',
          [
            { text: '닫기', style: 'cancel' },
            {
              text: '상담 신청하러 가기',
              onPress: () => router.push('/(client)/(booking)'),
            },
          ],
        );
        return;
      }
      setShareTargetId(cardId);
    },
    [isShareDisabled],
  );

  const handleSubmitShare = async (consent: { summary: boolean; original: boolean }) => {
    if (!shareTargetCard) return;
    if (!consent.summary) {
      setShareTargetId(null);
      return;
    }
    try {
      await shareMutation.mutateAsync({
        cardId: shareTargetCard.id,
        summary: consent.summary,
        original: consent.original,
      });
      setShareTargetId(null);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        MIND_WEATHER_SHARE_COPY_KO.shareSuccessTitle,
        MIND_WEATHER_SHARE_COPY_KO.shareSuccessMessage,
      );
    } catch (err) {
      const message =
        err instanceof Error && err.message.trim().length > 0
          ? err.message
          : '잠시 후 다시 시도해주세요.';
      Alert.alert('공유 실패', message);
    }
  };

  const handleRequestUnshare = (card: MindWeatherCardData) => {
    Alert.alert('공유 철회', MIND_WEATHER_SHARE_COPY_KO.unshareConfirm, [
      { text: '취소', style: 'cancel' },
      {
        text: '철회',
        style: 'destructive',
        onPress: async () => {
          try {
            await unshareMutation.mutateAsync(card.id);
          } catch {
            Alert.alert('처리 실패', '잠시 후 다시 시도해주세요.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title="마음 날씨" canGoBack />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={list.isFetching}
              onRefresh={list.refetch}
              tintColor={theme.colors.primary}
            />
          }
        >
          {setupErrorMessage ? (
            <View
              style={{
                marginBottom: 12,
                padding: 12,
                borderRadius: theme.borderRadius.lg,
                backgroundColor: theme.colors.surfaceAlt,
              }}
            >
              <Text
                style={{
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textMain,
                }}
              >
                {setupErrorMessage}
              </Text>
            </View>
          ) : null}

          {showApiListWarning ? (
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textSecondary,
                marginBottom: 8,
              }}
            >
              {CLIENT_MIND_WEATHER_LIST_API_FAILED}
            </Text>
          ) : null}

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
                오늘의 마음 날씨
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
              짧게 메모해 주시면 AI가 감정 키워드와 한 줄 요약을 만들어 드려요.
            </Text>
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize['2xs'],
                color: theme.colors.textTertiary,
                marginTop: 8,
                lineHeight: 16,
              }}
            >
              {MIND_WEATHER_DISCLAIMER_KO}
            </Text>
          </Animated.View>

          {/* AI 생성·진단 아님 정적 배너 — Apple T3 DoD 4 */}
          <Animated.View
            entering={FadeInDown.delay(40).springify()}
            style={[
              styles.aiBanner,
              {
                backgroundColor: theme.colors.warning + '1A',
                borderColor: theme.colors.warning + '66',
                borderRadius: theme.borderRadius.lg,
              },
            ]}
            accessibilityRole="alert"
            accessibilityLabel={`${MIND_WEATHER_AI_BANNER_TITLE_KO}. ${MIND_WEATHER_AI_BANNER_BODY_KO}`}
            testID="mind-weather-ai-banner"
          >
            <View style={styles.aiBannerHeader}>
              <AlertTriangle size={16} color={theme.colors.warning} />
              <Text
                style={{
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textMain,
                  marginLeft: 6,
                }}
              >
                {MIND_WEATHER_AI_BANNER_TITLE_KO}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textSecondary,
                marginTop: 6,
                lineHeight: 18,
              }}
            >
              {MIND_WEATHER_AI_BANNER_BODY_KO}
            </Text>
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize['2xs'],
                color: theme.colors.textTertiary,
                marginTop: 6,
                lineHeight: 16,
              }}
            >
              {`사용 모델: ${MIND_WEATHER_METHODOLOGY_KO.modelName}`}
            </Text>
            <CitationBlock
              testID="mind-weather-methodology-citation"
              title="가이드라인 출처"
              source={MIND_WEATHER_METHODOLOGY_KO.guidelineSource}
            />
          </Animated.View>

          {trending ? (
            <Animated.View
              entering={FadeInDown.delay(80).springify()}
              style={[
                styles.trendBanner,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderRadius: theme.borderRadius.lg,
                  borderColor: theme.colors.gray[300],
                },
              ]}
              accessibilityRole="alert"
            >
              <TrendingUp size={16} color={theme.colors.primary} />
              <Text
                style={{
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textMain,
                  marginLeft: 8,
                  flex: 1,
                  lineHeight: 18,
                }}
              >
                <Text style={{ fontFamily: theme.fontFamily.semibold }}>
                  {`'${trending.label}'`}
                </Text>
                {`  ${MIND_WEATHER_TREND_ALERT_COPY}`}
              </Text>
            </Animated.View>
          ) : null}

          <Animated.View
            entering={FadeInDown.delay(120).springify()}
            style={[
              styles.inputCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.xl,
                ...theme.shadows.sm,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                color: theme.colors.textMain,
                marginBottom: 8,
              }}
            >
              지금 마음을 짧게 적어보세요
            </Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              multiline
              placeholder="예) 회의가 길어 피곤했지만, 동료의 응원이 큰 힘이 됐어요."
              placeholderTextColor={theme.colors.textTertiary}
              style={[
                styles.textInput,
                {
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textMain,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.lg,
                  backgroundColor: theme.colors.bgMain,
                },
              ]}
              maxLength={MIND_WEATHER_TEXT_MAX_LENGTH}
              accessibilityLabel="마음 메모 입력"
            />
            <View style={styles.helperRow}>
              <Text
                style={{
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize['2xs'],
                  color: theme.colors.textTertiary,
                }}
              >
                {`${draftLength} / ${MIND_WEATHER_TEXT_MAX_LENGTH}`}
              </Text>
              <Pressable
                onPress={() => {
                  handleHaptic();
                  Alert.alert('음성 메모', MIND_WEATHER_VOICE_PLACEHOLDER_COPY);
                }}
                style={({ pressed }) => [
                  styles.voiceButton,
                  {
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.full,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityLabel={`음성 입력, ${MIND_WEATHER_VOICE_DEFERRED_UI_LABEL}`}
                accessibilityRole="button"
              >
                <Mic size={14} color={theme.colors.textSecondary} />
                <Text
                  style={{
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize['2xs'],
                    color: theme.colors.textSecondary,
                    marginLeft: 4,
                  }}
                >
                  {MIND_WEATHER_VOICE_DEFERRED_UI_LABEL}
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleAnalyze}
              disabled={!canAnalyze}
              style={({ pressed }) => [
                styles.analyzeButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.lg,
                  opacity: !canAnalyze ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
              accessibilityLabel="마음 날씨 분석"
              accessibilityRole="button"
            >
              <Sparkles size={16} color={theme.colors.textOnPrimary} />
              <Text
                style={{
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textOnPrimary,
                  marginLeft: 6,
                }}
              >
                {analyzeMutation.isPending ? '분석 중...' : '마음 날씨 분석하기'}
              </Text>
            </Pressable>
          </Animated.View>

          <View style={styles.listSection}>
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                color: theme.colors.textMain,
                marginBottom: 12,
                marginTop: 8,
              }}
            >
              최근 분석 카드
            </Text>

            {showListSkeleton ? (
              <View style={styles.loadingWrap}>
                {[0, 1].map((i) => (
                  <SkeletonCard key={i} lines={3} />
                ))}
              </View>
            ) : cards.length === 0 ? (
              <>
                <EmptyState
                  icon={<CloudSun size={32} color={theme.colors.textTertiary} />}
                  title="아직 분석한 카드가 없어요"
                  description="오늘 하루를 짧게 적어보면 마음 날씨를 만들어 드려요."
                />
                <AccountMismatchHint
                  onPressOpenAccount={() => router.push('/(client)/(more)')}
                  style={styles.accountHint}
                />
              </>
            ) : (
              cards.map((card, index) => (
                <MindWeatherCard
                  key={card.id}
                  card={card}
                  index={index}
                  onPressShare={() => handlePressShareCard(card.id)}
                  onPressUnshare={() => handleRequestUnshare(card)}
                  isShareDisabled={isShareDisabled}
                  busy={
                    (shareMutation.isPending && shareTargetId === card.id) ||
                    (unshareMutation.isPending && unshareMutation.variables === card.id)
                  }
                />
              ))
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      <MindWeatherShareSheet
        visible={shareTargetCard != null}
        onClose={() => setShareTargetId(null)}
        onSubmit={handleSubmitShare}
        initial={
          shareTargetCard?.share
            ? {
                summary: shareTargetCard.share.summary,
                original: shareTargetCard.share.original,
              }
            : undefined
        }
        busy={shareMutation.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  headerWrap: { paddingVertical: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  trendBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  aiBanner: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  aiBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputCard: {
    padding: 16,
    marginBottom: 16,
  },
  textInput: {
    minHeight: 96,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 12,
  },
  listSection: { marginTop: 4 },
  loadingWrap: { gap: 12 },
  bottomSpacer: { height: 32 },
  accountHint: {
    marginHorizontal: 0,
  },
});
