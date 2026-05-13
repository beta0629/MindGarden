/**
 * MindWeatherCard — Phase 4-A 분석 결과 표시 molecule.
 *
 * `MIND_WEATHER_UI_UX_SPEC.md` §3.2 `WeatherResultCard` 기반.
 * - 키워드 칩 그룹 + 한 줄 요약 + 「참고용」 고정 푸터
 * - 공유 토글·철회 액션은 부모에서 콜백으로 주입 (옵션)
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CloudSun, Lock, Share2, Sparkles } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTheme } from '@/theme';
import { Chip } from '@/components/atoms/Chip';
import {
  MIND_WEATHER_DISCLAIMER_KO,
  MIND_WEATHER_SHARE_COPY_KO,
} from '@/constants/wellnessComplianceCopy';
import { MIND_WEATHER_SOURCE_LABELS } from '@/constants/mindWeatherKeywords';
import type { MindWeatherCard as MindWeatherCardData } from '@/services/mindWeatherService';
import { toDisplayString } from '@/utils/toDisplayString';

interface MindWeatherCardProps {
  readonly card: MindWeatherCardData;
  readonly index?: number;
  /** 본인 카드일 때만 노출. 미지정 시 공유 액션 영역 자체가 사라진다. */
  readonly onPressShare?: () => void;
  readonly onPressUnshare?: () => void;
  readonly busy?: boolean;
}

export function MindWeatherCard({
  card,
  index = 0,
  onPressShare,
  onPressUnshare,
  busy = false,
}: MindWeatherCardProps) {
  const theme = useTheme();
  const sharedSummary = Boolean(card.share?.summary);
  const sharedOriginal = Boolean(card.share?.original);
  const createdAtLabel = (() => {
    try {
      return format(parseISO(card.createdAt), 'M월 d일 (EEEE)', { locale: ko });
    } catch {
      return '';
    }
  })();

  return (
    <Animated.View
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
      <View style={styles.headerRow}>
        <View
          style={[
            styles.headerIcon,
            { backgroundColor: theme.colors.primaryLight + '30' },
          ]}
        >
          <CloudSun size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              color: theme.colors.textMain,
            }}
            accessibilityRole="header"
          >
            AI가 분석한 오늘의 마음
          </Text>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.xs,
              color: theme.colors.textSecondary,
              marginTop: 2,
            }}
          >
            {createdAtLabel} · {MIND_WEATHER_SOURCE_LABELS[card.source]}
          </Text>
        </View>
      </View>

      {card.keywords.length > 0 ? (
        <View style={styles.chipsRow}>
          {card.keywords.map((kw) => (
            <Chip
              key={kw.key}
              label={toDisplayString(kw.label, '')}
              selected
              style={styles.chip}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyKeywords}>
          <Sparkles size={16} color={theme.colors.textTertiary} />
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.xs,
              color: theme.colors.textTertiary,
              marginLeft: 6,
            }}
          >
            키워드를 충분히 찾지 못했어요. 조금 더 길게 적어보면 좋아요.
          </Text>
        </View>
      )}

      <Text
        style={{
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.base,
          color: theme.colors.textMain,
          lineHeight: 24,
          marginTop: 12,
        }}
      >
        {toDisplayString(card.summary, '')}
      </Text>

      <Text
        style={{
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.xs,
          color: theme.colors.textSecondary,
          marginTop: 12,
        }}
      >
        {MIND_WEATHER_DISCLAIMER_KO}
      </Text>

      {(onPressShare || onPressUnshare) ? (
        <View style={styles.actionsRow}>
          {sharedSummary ? (
            <View style={styles.statusGroup}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: theme.colors.primaryLight + '40' },
                ]}
              >
                <Share2 size={14} color={theme.colors.primary} />
                <Text
                  style={{
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.primary,
                    marginLeft: 4,
                  }}
                >
                  {sharedOriginal ? '요약+원문 공유 중' : '요약·키워드 공유 중'}
                </Text>
              </View>
              {onPressUnshare ? (
                <Pressable
                  onPress={onPressUnshare}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.linkButton,
                    { opacity: busy ? 0.5 : pressed ? 0.7 : 1 },
                  ]}
                  accessibilityLabel="공유 철회"
                  accessibilityRole="button"
                >
                  <Lock size={14} color={theme.colors.textSecondary} />
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.medium,
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.textSecondary,
                      marginLeft: 4,
                    }}
                  >
                    공유 철회
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : onPressShare ? (
            <Pressable
              onPress={onPressShare}
              disabled={busy}
              style={({ pressed }) => [
                styles.shareButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.lg,
                  opacity: busy ? 0.6 : pressed ? 0.85 : 1,
                },
              ]}
              accessibilityLabel={MIND_WEATHER_SHARE_COPY_KO.ctaShare}
              accessibilityRole="button"
            >
              <Share2 size={16} color={theme.colors.textOnPrimary} />
              <Text
                style={{
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textOnPrimary,
                  marginLeft: 6,
                }}
              >
                {MIND_WEATHER_SHARE_COPY_KO.ctaShare}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerText: { flex: 1 },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: { marginBottom: 0 },
  emptyKeywords: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
});
