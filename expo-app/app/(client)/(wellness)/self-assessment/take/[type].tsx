/**
 * 검사 실시 화면
 *
 * - 상단: ProgressBar (현재 문항 / 전체 문항)
 * - 문항 표시: 큰 텍스트
 * - 4점 척도 Chip 선택 (0~3)
 * - 이전/다음 네비게이션
 * - Reanimated 슬라이드 전환, haptics 피드백
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  SlideInRight,
  SlideInLeft,
} from 'react-native-reanimated';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { useSubmitAssessment } from '@/api/hooks/useSelfAssessment';
import {
  ASSESSMENTS,
  OPTION_LABELS,
  type AssessmentType,
} from '@/constants/assessmentQuestions';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function AssessmentTake() {
  const theme = useTheme();
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const assessmentType = (type as AssessmentType) ?? 'PHQ9';
  const definition = ASSESSMENTS[assessmentType];

  const totalQuestions = definition?.questions.length ?? 0;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>(
    () => new Array<number>(totalQuestions).fill(-1),
  );
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [shareWithConsultant, setShareWithConsultant] = useState(false);

  const submitMutation = useSubmitAssessment();

  const hapticFeedback = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  if (!definition) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top']}
      >
        <AppTopBar title="검사" canGoBack />
        <View style={styles.center}>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
            }}
          >
            검사 정보를 찾을 수 없습니다.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isLastQuestion = currentIdx === totalQuestions - 1;
  const currentAnswer = answers[currentIdx] ?? -1;
  const isAnswered = currentAnswer >= 0;
  const allAnswered = answers.every((a) => a >= 0);

  const selectOption = (score: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIdx] = score;
      return next;
    });
  };

  const isSelected = (score: number) => currentAnswer === score;

  const goNext = () => {
    if (currentIdx < totalQuestions - 1) {
      hapticFeedback();
      setDirection('right');
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentIdx > 0) {
      hapticFeedback();
      setDirection('left');
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!allAnswered) {
      Alert.alert('알림', '모든 문항에 답변해주세요.');
      return;
    }
    hapticFeedback();
    try {
      const result = await submitMutation.mutateAsync({
        type: assessmentType,
        answers,
        sharedWithConsultant: shareWithConsultant,
      });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace(
        `/(client)/(wellness)/self-assessment/result/${result.id}`,
      );
    } catch {
      Alert.alert('오류', '검사 제출에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const EnterAnimation =
    direction === 'right' ? SlideInRight.duration(250) : SlideInLeft.duration(250);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <AppTopBar title={definition.shortName} canGoBack />

      <View style={styles.content}>
        {/* ProgressBar */}
        <ProgressBar currentStep={currentIdx + 1} totalSteps={totalQuestions} />

        <Text
          style={{
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
            color: theme.colors.textTertiary,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          {currentIdx + 1} / {totalQuestions}
        </Text>

        {/* 문항 */}
        <Animated.View
          key={currentIdx}
          entering={EnterAnimation}
          style={styles.questionWrap}
        >
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.lg,
              color: theme.colors.textMain,
              textAlign: 'center',
              lineHeight: 28,
              paddingHorizontal: 16,
            }}
            accessibilityRole="text"
          >
            {definition.questions[currentIdx]}
          </Text>
        </Animated.View>

        {/* 4점 척도 */}
        <View style={styles.optionsWrap}>
          {OPTION_LABELS.map((opt) => {
            const optSelected = isSelected(opt.score);
            return (
              <Pressable
                key={opt.score}
                onPress={() => selectOption(opt.score)}
                style={({ pressed }) => [
                  styles.optionButton,
                  {
                    backgroundColor: optSelected
                      ? theme.colors.primary
                      : theme.colors.surface,
                    borderColor: optSelected
                      ? theme.colors.primary
                      : theme.colors.border,
                    borderRadius: theme.borderRadius.lg,
                    ...(!optSelected && theme.shadows.sm),
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
                accessibilityLabel={`${opt.label} (${opt.score}점)`}
                accessibilityRole="button"
                accessibilityState={{ selected: optSelected }}
              >
                <Text
                  style={{
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.sm,
                    color: optSelected
                      ? theme.colors.textOnPrimary
                      : theme.colors.textSecondary,
                  }}
                >
                  {opt.score}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.sm,
                    color: optSelected
                      ? theme.colors.textOnPrimary
                      : theme.colors.textMain,
                    marginLeft: 8,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 공유 토글 (마지막 문항에서만 표시) */}
        {isLastQuestion && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={[
              styles.shareRow,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
          >
            <View style={styles.shareText}>
              <Text
                style={{
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textMain,
                }}
              >
                상담사에게 결과 공유
              </Text>
            </View>
            <Switch
              value={shareWithConsultant}
              onValueChange={setShareWithConsultant}
              trackColor={{
                false: theme.colors.gray[300],
                true: theme.colors.primaryLight,
              }}
              thumbColor={
                shareWithConsultant ? theme.colors.primary : theme.colors.surface
              }
              accessibilityLabel="상담사 공유 토글"
            />
          </Animated.View>
        )}

        {/* 네비게이션 */}
        <View style={styles.navRow}>
          <Pressable
            onPress={goPrev}
            disabled={currentIdx === 0}
            style={({ pressed }) => [
              styles.navButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.lg,
                opacity: currentIdx === 0 ? 0.4 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
            accessibilityLabel="이전 문항"
            accessibilityRole="button"
          >
            <ChevronLeft size={20} color={theme.colors.textMain} />
            <Text
              style={{
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textMain,
                marginLeft: 4,
              }}
            >
              이전
            </Text>
          </Pressable>

          {isLastQuestion ? (
            <Pressable
              onPress={handleSubmit}
              disabled={!allAnswered || submitMutation.isPending}
              style={({ pressed }) => [
                styles.navButton,
                styles.submitButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.lg,
                  opacity: !allAnswered || submitMutation.isPending ? 0.5 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
              accessibilityLabel="결과 보기"
              accessibilityRole="button"
            >
              <Text
                style={{
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textOnPrimary,
                }}
              >
                {submitMutation.isPending ? '제출 중...' : '결과 보기'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={goNext}
              disabled={!isAnswered}
              style={({ pressed }) => [
                styles.navButton,
                {
                  backgroundColor: isAnswered
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: isAnswered
                    ? theme.colors.primary
                    : theme.colors.border,
                  borderRadius: theme.borderRadius.lg,
                  opacity: isAnswered ? 1 : 0.5,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
              accessibilityLabel="다음 문항"
              accessibilityRole="button"
            >
              {(() => {
                const textColor = isAnswered
                  ? theme.colors.textOnPrimary
                  : theme.colors.textMain;
                return (
                  <>
                    <Text
                      style={{
                        fontFamily: theme.fontFamily.medium,
                        fontSize: theme.fontSize.sm,
                        color: textColor,
                        marginRight: 4,
                      }}
                    >
                      다음
                    </Text>
                    <ChevronRight size={20} color={textColor} />
                  </>
                );
              })()}
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  questionWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  optionsWrap: {
    gap: 10,
    paddingBottom: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 8,
  },
  shareText: { flex: 1, marginRight: 12 },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
  },
  submitButton: {
    flex: 2,
  },
});
