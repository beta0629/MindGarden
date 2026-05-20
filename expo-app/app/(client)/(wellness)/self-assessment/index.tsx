/**
 * 자가 심리검사 목록 화면
 *
 * - 3개 검사 카드 (PHQ-9, GAD-7, PSS)
 * - 각 카드: 아이콘 + 검사명 + 설명 + "검사 시작" 버튼 + 마지막 검사일
 * - 이전 검사 이력 섹션 (최근 5건)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Heart, Brain, Activity, ChevronRight, Clock } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { EmptyState } from '@/components/atoms/EmptyState';
import { useSelfAssessments, useLastAssessmentByType } from '@/api/hooks/useSelfAssessment';
import { ASSESSMENTS, SEVERITY_COLORS, type AssessmentType } from '@/constants/assessmentQuestions';
import {
  WELLNESS_ASSESSMENT_REFERENCE_FOOTER_KO,
  WELLNESS_NON_MEDICAL_DISCLAIMER_KO,
} from '@/constants/wellnessComplianceCopy';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  heart: Heart,
  brain: Brain,
  activity: Activity,
};

const MAX_HISTORY = 5;

interface AssessmentCardProps {
  readonly type: AssessmentType;
  readonly index: number;
}

function AssessmentCard({ type, index }: AssessmentCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const def = ASSESSMENTS[type];
  const { data: lastResult } = useLastAssessmentByType(type);

  const Icon = ICON_MAP[def.icon] ?? Heart;

  const handleStart = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/(client)/(wellness)/self-assessment/take/${type}`);
  };

  const lastDateStr = lastResult
    ? format(parseISO(lastResult.createdAt), 'M월 d일', { locale: ko })
    : null;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <Pressable
        onPress={handleStart}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.xl,
            ...theme.shadows.sm,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
        accessibilityLabel={`${def.name}. ${def.description}. ${def.questions.length}문항, 약 ${def.estimatedMinutes}분 소요`}
        accessibilityRole="button"
      >
        <View style={styles.cardTop}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryLight + '30' }]}>
            <Icon size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                color: theme.colors.textMain,
              }}
              numberOfLines={1}
            >
              {def.name}
            </Text>
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                marginTop: 2,
              }}
              numberOfLines={2}
            >
              {def.description}
            </Text>
          </View>
          <ChevronRight size={20} color={theme.colors.textTertiary} />
        </View>
        <View style={[styles.cardBottom, { borderTopColor: theme.colors.divider }]}>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.xs,
              color: theme.colors.textTertiary,
            }}
          >
            {def.questions.length}문항 · 약 {def.estimatedMinutes}분
          </Text>
          {Boolean(lastDateStr) && (
            <View style={styles.lastDateRow}>
              <Clock size={12} color={theme.colors.textTertiary} />
              <Text
                style={{
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textTertiary,
                  marginLeft: 4,
                }}
              >
                마지막 점검: {lastDateStr}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function SelfAssessmentIndex() {
  const theme = useTheme();
  const router = useRouter();
  const { data: history } = useSelfAssessments();

  const assessmentTypes: AssessmentType[] = ['PHQ9', 'GAD7', 'PSS'];
  const recentHistory = history?.slice(0, MAX_HISTORY) ?? [];

  const getSeverityColor = (severity: string): string => {
    const key = severity as keyof typeof SEVERITY_COLORS;
    const colorKey = SEVERITY_COLORS[key];
    return theme.colors[colorKey as keyof typeof theme.colors] as string;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title="마음 자가 점검" canGoBack />

      <View
        style={{
          marginHorizontal: 16,
          marginTop: 8,
          padding: 12,
          borderRadius: theme.borderRadius.lg,
          backgroundColor: theme.colors.accentSoft,
        }}
        accessibilityRole="text"
      >
        <Text
          style={{
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
            color: theme.colors.textSecondary,
            lineHeight: 18,
          }}
        >
          {WELLNESS_NON_MEDICAL_DISCLAIMER_KO}
          {'\n\n'}
          {WELLNESS_ASSESSMENT_REFERENCE_FOOTER_KO}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 자가 점검 카드 목록 */}
        {assessmentTypes.map((type, idx) => (
          <AssessmentCard key={type} type={type} index={idx} />
        ))}

        {/* 이전 점검 이력 */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.historySection}>
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              color: theme.colors.textMain,
              marginBottom: 12,
            }}
          >
            점검 이력
          </Text>

          {recentHistory.length === 0 ? (
            <EmptyState
              title="점검 기록이 없습니다"
              description="자가 점검을 완료하면 여기에 기록이 표시됩니다."
            />
          ) : (
            recentHistory.map((result) => {
              const def = ASSESSMENTS[result.type];
              const severityColor = getSeverityColor(result.interpretation.severity);
              return (
                <Pressable
                  key={result.id}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    router.push(`/(client)/(wellness)/self-assessment/result/${result.id}`);
                  }}
                  style={({ pressed }) => [
                    styles.historyCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.borderRadius.lg,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                  accessibilityLabel={`${def.name} 결과: ${result.interpretation.level}`}
                  accessibilityRole="button"
                >
                  <View style={styles.historyLeft}>
                    <Text
                      style={{
                        fontFamily: theme.fontFamily.semibold,
                        fontSize: theme.fontSize.sm,
                        color: theme.colors.textMain,
                      }}
                    >
                      {def.shortName}
                    </Text>
                    <Text
                      style={{
                        fontFamily: theme.fontFamily.regular,
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.textTertiary,
                        marginTop: 2,
                      }}
                    >
                      {format(parseISO(result.createdAt), 'yyyy.M.d', { locale: ko })}
                    </Text>
                  </View>
                  <View style={styles.historyRight}>
                    <View
                      style={[
                        styles.severityBadge,
                        {
                          backgroundColor: severityColor + '20',
                          borderRadius: theme.borderRadius.sm,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontFamily: theme.fontFamily.medium,
                          fontSize: theme.fontSize.xs,
                          color: severityColor,
                        }}
                      >
                        {result.interpretation.level}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: theme.fontFamily.semibold,
                        fontSize: theme.fontSize.sm,
                        color: theme.colors.textMain,
                        marginLeft: 8,
                      }}
                    >
                      {result.totalScore}점
                    </Text>
                    <ChevronRight
                      size={16}
                      color={theme.colors.textTertiary}
                      style={{ marginLeft: 4 }}
                    />
                  </View>
                </Pressable>
              );
            })
          )}
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  card: {
    marginTop: 12,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 10,
  },
  lastDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historySection: {
    marginTop: 24,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 8,
  },
  historyLeft: {},
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bottomSpacer: { height: 32 },
});
