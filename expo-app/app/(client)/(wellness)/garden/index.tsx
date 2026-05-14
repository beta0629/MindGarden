/**
 * 「마음 정원」메인 화면 — 토큰 기반 카드·진행 바 MVP (Lottie 없음)
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sprout, Flower2, Info } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import {
  GARDEN_EVENT_WEIGHTS,
  GARDEN_GROWTH_WEEKLY_POINTS_CAP,
  GARDEN_POLICY_COPY_KO,
  GARDEN_VISUAL_ELEMENTS,
  getGardenStageProgress,
} from '@/constants/mindGardenGrowth';
import { useMindGardenStore } from '@/stores/useMindGardenStore';

export default function ClientMindGardenScreen() {
  const theme = useTheme();
  const totalGardenPoints = useMindGardenStore((s) => s.totalGardenPoints);
  const weeklyPointsThisWeek = useMindGardenStore((s) => s.weeklyPointsThisWeek);
  const recordGrowthEvent = useMindGardenStore((s) => s.recordGrowthEvent);
  const resetForDemo = useMindGardenStore((s) => s.resetForDemo);

  const progress = getGardenStageProgress(totalGardenPoints);
  const nextTh = progress.nextThreshold;
  const segmentSpan = nextTh === null ? 0 : nextTh - progress.currentThreshold;
  const barRatio =
    segmentSpan > 0 ? Math.min(1, Math.max(0, progress.pointsInStage / segmentSpan)) : 1;

  const unlocked = GARDEN_VISUAL_ELEMENTS.filter((el) => el.minStageIndex <= progress.stageIndex);

  const applyDemo = (kind: 'SESSION_COMPLETED' | 'HOMEWORK_COMPLETED' | 'SELF_CARE_COMPLETED') => {
    const r = recordGrowthEvent(kind, { skipDedupe: true });
    if (r.duplicate) {
      return;
    }
    if (r.earned === 0) {
      Alert.alert(
        '이번 주 한도',
        `이번 주에는 최대 ${GARDEN_GROWTH_WEEKLY_POINTS_CAP}점까지 모을 수 있어요. 다음 주에 다시 만나요.`,
      );
      return;
    }
    const fullWeight = GARDEN_EVENT_WEIGHTS[kind];
    const extra =
      r.earned > 0 && r.earned < fullWeight ? ' (이번 주 한도에 맞춰 일부만 반영됐어요.)' : '';
    Alert.alert('정원이 자랐어요', `+${r.earned} 성장점이 쌓였어요.${extra}`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title="마음 정원" canGoBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.hero,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.xl,
              ...theme.shadows.sm,
            },
          ]}
        >
          <View style={styles.heroRow}>
            <Flower2 size={28} color={theme.colors.primary} />
            <Text
              style={{
                fontFamily: theme.fontFamily.bold,
                fontSize: theme.fontSize['2xl'],
                color: theme.colors.textMain,
                marginLeft: theme.spacing.sm,
              }}
              accessibilityRole="header"
            >
              나만의 정원
            </Text>
          </View>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.sm,
              lineHeight: 22,
            }}
          >
            상담과 스스로를 돌보는 활동이 조용히 정원을 키워요. 다른 사람과 비교하지 않아요.
          </Text>
        </View>

        <View
          style={[
            styles.card,
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
            }}
          >
            지금 단계
          </Text>
          <Text
            style={{
              fontFamily: theme.fontFamily.bold,
              fontSize: theme.fontSize.xl,
              color: theme.colors.primary,
              marginTop: theme.spacing.xs,
            }}
          >
            {progress.stageLabel}
          </Text>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.xs,
            }}
          >
            누적 성장점 {totalGardenPoints}점 · 이번 주 {weeklyPointsThisWeek}/
            {GARDEN_GROWTH_WEEKLY_POINTS_CAP}점
          </Text>

          {progress.nextThreshold != null && (
            <View style={styles.barWrap}>
              <View
                style={[
                  styles.barTrack,
                  {
                    backgroundColor: theme.colors.divider,
                    borderRadius: theme.borderRadius.full,
                  },
                ]}
              >
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.round(barRatio * 100)}%`,
                      backgroundColor: theme.colors.accent,
                      borderRadius: theme.borderRadius.full,
                    },
                  ]}
                />
              </View>
              <Text
                style={{
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize['2xs'],
                  color: theme.colors.textTertiary,
                  marginTop: theme.spacing.xs,
                }}
              >
                다음 단계까지 {progress.pointsToNext ?? 0}점
              </Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: theme.borderRadius.xl,
              borderWidth: 1,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.policyRow}>
            <Info size={18} color={theme.colors.textSecondary} />
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textMain,
                marginLeft: theme.spacing.sm,
              }}
            >
              이 정원을 대하는 방식
            </Text>
          </View>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              lineHeight: 20,
              color: theme.colors.textSecondary,
            }}
          >
            {GARDEN_POLICY_COPY_KO.nonCompetitive}
          </Text>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              lineHeight: 20,
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.sm,
            }}
          >
            {GARDEN_POLICY_COPY_KO.weeklyCap}
          </Text>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              lineHeight: 20,
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.sm,
            }}
          >
            {GARDEN_POLICY_COPY_KO.noDecay}
          </Text>
        </View>

        <View
          style={[
            styles.card,
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
            }}
          >
            정원에 더해진 것들
          </Text>
          <View style={styles.chipRow}>
            {unlocked.map((el) => (
              <View
                key={el.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: theme.colors.accentSoft,
                    borderRadius: theme.borderRadius.lg,
                  },
                ]}
              >
                <Sprout size={14} color={theme.colors.primaryDark} />
                <Text
                  style={{
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textMain,
                    marginLeft: theme.spacing.xs,
                  }}
                >
                  {el.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.card,
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
            }}
          >
            이벤트 연습 (목업)
          </Text>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize['2xs'],
              color: theme.colors.textTertiary,
              marginTop: theme.spacing.xs,
              marginBottom: theme.spacing.md,
            }}
          >
            실제 서비스의 서버 권위 이벤트·예약·웰니스 연동은 기획서 Phase 3-G(마음 정원) 범위이며,
            이 화면 버튼은 로컬 데모용입니다.
          </Text>
          <View style={styles.demoRow}>
            <DemoButton
              label="상담 완료"
              theme={theme}
              onPress={() => applyDemo('SESSION_COMPLETED')}
            />
            <DemoButton
              label="과제 완료"
              theme={theme}
              onPress={() => applyDemo('HOMEWORK_COMPLETED')}
            />
            <DemoButton
              label="자기돌봄"
              theme={theme}
              onPress={() => applyDemo('SELF_CARE_COMPLETED')}
            />
          </View>
          <Pressable
            onPress={() => {
              Alert.alert('초기화', '데모 성장점을 모두 지울까요?', [
                { text: '취소', style: 'cancel' },
                { text: '초기화', style: 'destructive', onPress: () => resetForDemo() },
              ]);
            }}
            style={{ marginTop: theme.spacing.md }}
            accessibilityRole="button"
            accessibilityLabel="데모 데이터 초기화"
          >
            <Text
              style={{
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textTertiary,
                textDecorationLine: 'underline',
              }}
            >
              데모 데이터 초기화
            </Text>
          </Pressable>
        </View>

        <View style={{ height: theme.spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface DemoButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly theme: ReturnType<typeof useTheme>;
}

function DemoButton({ label, onPress, theme }: DemoButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.demoBtn,
        {
          backgroundColor: theme.colors.accentSoft,
          borderRadius: theme.borderRadius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text
        style={{
          fontFamily: theme.fontFamily.semibold,
          fontSize: theme.fontSize.xs,
          color: theme.colors.textMain,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 14,
  },
  hero: { padding: 20 },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  card: { padding: 20 },
  barWrap: { marginTop: 16 },
  barTrack: { height: 10, overflow: 'hidden' },
  barFill: { height: 10 },
  policyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  demoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  demoBtn: { paddingVertical: 10, paddingHorizontal: 12 },
});
