/**
 * 검사 결과 화면
 *
 * - 총점 표시 (큰 숫자 + 원형 프로그레스)
 * - 해석 카드 (심각도별 색상)
 * - "상담사에게 결과 공유" 토글
 * - "다시 검사하기" 버튼
 * - 이전 결과 비교 차트 (있을 때)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useEffect, useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { RotateCcw } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { EmptyState } from '@/components/atoms/EmptyState';
import {
  useAssessmentDetail,
  useSelfAssessments,
} from '@/api/hooks/useSelfAssessment';
import {
  ASSESSMENTS,
  SEVERITY_COLORS,
} from '@/constants/assessmentQuestions';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CIRCLE_SIZE = 140;
const STROKE_WIDTH = 10;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ScoreCircleProps {
  readonly score: number;
  readonly maxScore: number;
  readonly severityColor: string;
}

function ScoreCircle({ score, maxScore, severityColor }: ScoreCircleProps) {
  const theme = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / maxScore, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [score, maxScore, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <View style={circleStyles.wrap}>
      <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
        <Circle
          cx={CIRCLE_SIZE / 2}
          cy={CIRCLE_SIZE / 2}
          r={RADIUS}
          stroke={theme.colors.gray[200]}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <AnimatedCircle
          cx={CIRCLE_SIZE / 2}
          cy={CIRCLE_SIZE / 2}
          r={RADIUS}
          stroke={severityColor}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
        />
      </Svg>
      <View style={circleStyles.textOverlay}>
        <Text
          style={{
            fontFamily: theme.fontFamily.bold,
            fontSize: theme.fontSize['4xl'],
            color: theme.colors.textMain,
          }}
          accessibilityLabel={`${score}점`}
        >
          {score}
        </Text>
        <Text
          style={{
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
            color: theme.colors.textTertiary,
          }}
        >
          / {maxScore}
        </Text>
      </View>
    </View>
  );
}

const circleStyles = StyleSheet.create({
  wrap: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function AssessmentResult() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: result, isLoading } = useAssessmentDetail(id ?? '');
  const { data: allResults } = useSelfAssessments();

  const definition = result ? ASSESSMENTS[result.type] : null;
  const severityKey = result
    ? SEVERITY_COLORS[result.interpretation.severity]
    : 'success';
  const severityColor = theme.colors[severityKey as keyof typeof theme.colors] as string;

  const previousResults = useMemo(() => {
    if (!allResults || !result) return [];
    return allResults
      .filter((r) => r.type === result.type && r.id !== result.id)
      .slice(0, 3);
  }, [allResults, result]);

  const handleRetake = () => {
    if (!result) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace(
      `/(client)/(wellness)/self-assessment/take/${result.type}`,
    );
  };

  const handleGoBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(client)/(wellness)/self-assessment');
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top']}
      >
        <AppTopBar title="검사 결과" canGoBack />
        <View style={styles.center}>
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

  if (!result || !definition) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top']}
      >
        <AppTopBar title="검사 결과" canGoBack />
        <EmptyState title="결과를 찾을 수 없습니다" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <AppTopBar title="검사 결과" canGoBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* 검사 이름 + 날짜 */}
        <Animated.View entering={FadeInDown.springify()} style={styles.headerCenter}>
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.lg,
              color: theme.colors.textMain,
            }}
          >
            {definition.name}
          </Text>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              marginTop: 4,
            }}
          >
            {format(parseISO(result.createdAt), 'yyyy년 M월 d일', { locale: ko })}
          </Text>
        </Animated.View>

        {/* 원형 프로그레스 + 점수 */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.scoreSection}
        >
          <ScoreCircle
            score={result.totalScore}
            maxScore={definition.maxScore}
            severityColor={severityColor}
          />
        </Animated.View>

        {/* 해석 카드 */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={[
            styles.interpretCard,
            {
              backgroundColor: severityColor + '15',
              borderColor: severityColor + '40',
              borderRadius: theme.borderRadius.xl,
            },
          ]}
        >
          <Text
            style={{
              fontFamily: theme.fontFamily.bold,
              fontSize: theme.fontSize.xl,
              color: severityColor,
              textAlign: 'center',
            }}
          >
            {result.interpretation.level}
          </Text>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              textAlign: 'center',
              marginTop: 8,
              lineHeight: 22,
            }}
          >
            {result.interpretation.description}
          </Text>
        </Animated.View>

        {/* 이전 결과 비교 */}
        {previousResults.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={[
              styles.compareSection,
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
                marginBottom: 12,
              }}
            >
              이전 검사 비교
            </Text>
            <View style={styles.compareRow}>
              {/* 현재 결과 */}
              <View style={styles.compareItem}>
                <Text
                  style={{
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textTertiary,
                    marginBottom: 4,
                  }}
                >
                  이번
                </Text>
                <View
                  style={[
                    styles.compareBar,
                    {
                      height:
                        (result.totalScore / definition.maxScore) * 60 + 10,
                      backgroundColor: severityColor,
                      borderRadius: theme.borderRadius.sm,
                    },
                  ]}
                />
                <Text
                  style={{
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textMain,
                    marginTop: 4,
                  }}
                >
                  {result.totalScore}
                </Text>
              </View>
              {previousResults.map((prev) => {
                const prevSeverityKey =
                  SEVERITY_COLORS[prev.interpretation.severity];
                const prevColor = theme.colors[
                  prevSeverityKey as keyof typeof theme.colors
                ] as string;
                return (
                  <View key={prev.id} style={styles.compareItem}>
                    <Text
                      style={{
                        fontFamily: theme.fontFamily.regular,
                        fontSize: theme.fontSize['2xs'],
                        color: theme.colors.textTertiary,
                        marginBottom: 4,
                      }}
                    >
                      {format(parseISO(prev.createdAt), 'M/d')}
                    </Text>
                    <View
                      style={[
                        styles.compareBar,
                        {
                          height:
                            (prev.totalScore / definition.maxScore) * 60 + 10,
                          backgroundColor: prevColor + '80',
                          borderRadius: theme.borderRadius.sm,
                        },
                      ]}
                    />
                    <Text
                      style={{
                        fontFamily: theme.fontFamily.regular,
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.textSecondary,
                        marginTop: 4,
                      }}
                    >
                      {prev.totalScore}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* 버튼 그룹 */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.buttonGroup}
        >
          <Pressable
            onPress={handleRetake}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.xl,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
            accessibilityLabel="다시 검사하기"
            accessibilityRole="button"
          >
            <RotateCcw size={18} color={theme.colors.textOnPrimary} />
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                color: theme.colors.textOnPrimary,
                marginLeft: 8,
              }}
            >
              다시 검사하기
            </Text>
          </Pressable>

          <Pressable
            onPress={handleGoBack}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderWidth: 1,
                borderRadius: theme.borderRadius.xl,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
            accessibilityLabel="검사 목록으로"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                color: theme.colors.textMain,
              }}
            >
              검사 목록으로
            </Text>
          </Pressable>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCenter: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  scoreSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  interpretCard: {
    padding: 20,
    borderWidth: 1,
  },
  compareSection: {
    marginTop: 16,
    padding: 16,
  },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
  },
  compareItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  compareBar: {
    width: 28,
    minHeight: 10,
  },
  buttonGroup: {
    gap: 10,
    marginTop: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  bottomSpacer: { height: 32 },
});
