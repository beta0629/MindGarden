/**
 * 마음 날씨 — Phase 4-A 메인 화면.
 *
 * - 짧은 메모 입력 → AI 분석 결과 카드 표시
 * - 카드별 상담사 공유 옵트인 모달 (요약/원문 토글)
 * - 최근 분석 카드 목록 + 트렌드 알림 카피
 * - 음성/STT 는 후속 트랙(플레이스홀더)
 *
 * 참조: `MIND_WEATHER_UI_UX_SPEC.md`, `CONSULTANT_CLIENT_APP_PLAN.md` Phase 4 A절
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useMemo, useState } from 'react';
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
import { CloudSun, Mic, Sparkles, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { MindWeatherCard } from '@/components/molecules/MindWeatherCard';
import { MindWeatherShareSheet } from '@/components/organisms/MindWeatherShareSheet';
import {
  useAnalyzeMindWeather,
  useMindWeatherList,
  useShareMindWeatherCard,
  useUnshareMindWeatherCard,
} from '@/api/hooks/useMindWeather';
import {
  MIND_WEATHER_TEXT_MAX_LENGTH,
  MIND_WEATHER_TEXT_MIN_LENGTH,
  MIND_WEATHER_TREND_ALERT_COPY,
  MIND_WEATHER_TREND_ALERT_THRESHOLD,
  MIND_WEATHER_VOICE_PLACEHOLDER_COPY,
} from '@/constants/mindWeatherKeywords';
import {
  MIND_WEATHER_DISCLAIMER_KO,
  MIND_WEATHER_SHARE_COPY_KO,
} from '@/constants/wellnessComplianceCopy';
import { detectTrendingKeyword } from '@/services/mindWeatherService';
import type { MindWeatherCard as MindWeatherCardData } from '@/services/mindWeatherService';

const RECENT_TREND_WINDOW = 5;

export default function ClientMindWeatherIndex() {
  const theme = useTheme();
  const [draft, setDraft] = useState('');
  const [shareTargetId, setShareTargetId] = useState<string | null>(null);

  const list = useMindWeatherList();
  const analyzeMutation = useAnalyzeMindWeather();
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
    draftLength >= MIND_WEATHER_TEXT_MIN_LENGTH && !analyzeMutation.isPending;

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
    } catch {
      Alert.alert('공유 실패', '잠시 후 다시 시도해주세요.');
    }
  };

  const handleRequestUnshare = (card: MindWeatherCardData) => {
    Alert.alert(
      '공유 철회',
      MIND_WEATHER_SHARE_COPY_KO.unshareConfirm,
      [
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
      ],
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
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
                accessibilityLabel="음성 메모(준비 중)"
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
                  음성 메모(준비 중)
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

            {list.isLoading ? (
              <View style={styles.loadingWrap}>
                {[0, 1].map((i) => (
                  <SkeletonCard key={i} lines={3} />
                ))}
              </View>
            ) : cards.length === 0 ? (
              <EmptyState
                icon={<CloudSun size={32} color={theme.colors.textTertiary} />}
                title="아직 분석한 카드가 없어요"
                description="오늘 하루를 짧게 적어보면 마음 날씨를 만들어 드려요."
              />
            ) : (
              cards.map((card, index) => (
                <MindWeatherCard
                  key={card.id}
                  card={card}
                  index={index}
                  onPressShare={() => setShareTargetId(card.id)}
                  onPressUnshare={() => handleRequestUnshare(card)}
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
});
