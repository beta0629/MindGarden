/**
 * 감정 일기 메인 화면
 *
 * - 월 네비게이션 + 감정 달력 (이모지 표시)
 * - 감정 추이 꺾은선 차트 (주간/월간 토글, SVG)
 * - "오늘의 기분 기록하기" CTA
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, PenLine } from 'lucide-react-native';
import { format, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTheme } from '@/theme';
import { fontSize as fontSizeTokens } from '@/theme/typography';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { LineTrendChart } from '@/components/molecules/LineTrendChart';
import { AccountMismatchHint } from '@/components/molecules/AccountMismatchHint';
import { useMoodJournals, useMoodStats } from '@/api/hooks/useMoodJournal';
import {
  WEEKDAYS,
  MOOD_STAT_PERIODS,
  MOOD_STAT_PERIOD_LABELS,
  type MoodStatPeriod,
} from '@/constants/moodConstants';

const CELL_SIZE = 44;
const CHART_HEIGHT = 168;
const screenWidth = Dimensions.get('window').width;
const MOOD_LINE_CHART_WIDTH = screenWidth - 64;

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const days: { day: number; otherMonth: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrev - i, otherMonth: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, otherMonth: false });
  }
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, otherMonth: true });
    }
  }
  return days;
}

export default function MoodJournalIndex() {
  const theme = useTheme();
  const router = useRouter();
  const today = new Date();
  const [calDate, setCalDate] = useState(today);
  const [statPeriod, setStatPeriod] = useState<MoodStatPeriod>('weekly');

  const calYear = calDate.getFullYear();
  const calMonth = calDate.getMonth();
  const monthKey = format(calDate, 'yyyy-MM');

  const { data: entries } = useMoodJournals(monthKey);
  const { data: stats } = useMoodStats(statPeriod);
  const calDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth]);
  /**
   * 캘린더 월 + 추이 기간 모두 0건일 때만 계정 안내 노출 (오해 방지가 필요한 시점).
   * `entries`/`stats` 가 아직 로딩 중(undefined)이면 노출하지 않는다.
   */
  const hasNoMoodData = useMemo(() => {
    if (entries === undefined || stats === undefined) {
      return false;
    }
    const entriesEmpty = Object.keys(entries ?? {}).length === 0;
    const statsEmpty = (stats ?? []).every((s) => s.value === 0);
    return entriesEmpty && statsEmpty;
  }, [entries, stats]);

  const hapticFeedback = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const goToPrevMonth = () => {
    hapticFeedback();
    setCalDate(subMonths(calDate, 1));
  };
  const goToNextMonth = () => {
    hapticFeedback();
    setCalDate(addMonths(calDate, 1));
  };

  const handleDayPress = (day: number) => {
    hapticFeedback();
    const dateStr = format(new Date(calYear, calMonth, day), 'yyyy-MM-dd');
    router.push(`/(client)/(wellness)/mood-journal/${dateStr}`);
  };

  const handleCreate = () => {
    hapticFeedback();
    router.push('/(client)/(wellness)/mood-journal/create');
  };

  const todayStr = format(today, 'yyyy-MM-dd');

  const maxStatValue = 5;

  const chartLabels = stats?.map((s) => format(new Date(s.date), 'M/d')) ?? [];
  const chartValues = stats?.map((s) => s.value) ?? [];
  const hasAnyMoodPoint = chartValues.some((v) => v > 0);

  const renderChartBody = () => {
    if (stats == null) {
      return (
        <Text
          style={{
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            paddingVertical: 24,
          }}
        >
          불러오는 중...
        </Text>
      );
    }
    if (chartValues.length === 0) {
      return (
        <Text
          style={{
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            paddingVertical: 24,
          }}
        >
          이 기간에 표시할 데이터가 없습니다.
        </Text>
      );
    }
    return (
      <>
        <LineTrendChart
          values={chartValues}
          labels={chartLabels}
          maxValue={maxStatValue}
          width={MOOD_LINE_CHART_WIDTH}
          height={CHART_HEIGHT}
        />
        {hasAnyMoodPoint ? null : (
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.xs,
              color: theme.colors.textTertiary,
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            아직 이 기간에 기록이 없어요. 기록하면 추이가 연결됩니다.
          </Text>
        )}
      </>
    );
  };

  const emojiForDate = (day: number): string | null => {
    const dateStr = format(new Date(calYear, calMonth, day), 'yyyy-MM-dd');
    return entries?.[dateStr]?.emoji ?? null;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title="감정 일기" canGoBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 월 네비게이션 */}
        <Animated.View entering={FadeInDown.springify()} style={styles.monthNav}>
          <Pressable
            onPress={goToPrevMonth}
            hitSlop={16}
            accessibilityLabel="이전 달"
            accessibilityRole="button"
          >
            <ChevronLeft size={24} color={theme.colors.textMain} />
          </Pressable>
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.lg,
              color: theme.colors.textMain,
            }}
          >
            {format(calDate, 'yyyy년 M월', { locale: ko })}
          </Text>
          <Pressable
            onPress={goToNextMonth}
            hitSlop={16}
            accessibilityLabel="다음 달"
            accessibilityRole="button"
          >
            <ChevronRight size={24} color={theme.colors.textMain} />
          </Pressable>
        </Animated.View>

        {/* 요일 헤더 */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((wd) => (
            <Text
              key={wd}
              style={[
                styles.weekdayCell,
                {
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textTertiary,
                },
              ]}
            >
              {wd}
            </Text>
          ))}
        </View>

        {/* 달력 그리드 */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.calendarGrid}>
          {calDays.map((cell, idx) => {
            const cellKey = cell.otherMonth ? `other-${idx}` : `day-${cell.day}`;
            const dateStr = cell.otherMonth
              ? ''
              : format(new Date(calYear, calMonth, cell.day), 'yyyy-MM-dd');
            const isToday = dateStr === todayStr;
            const emoji = cell.otherMonth ? null : emojiForDate(cell.day);
            const dayColor = cell.otherMonth ? theme.colors.textTertiary : theme.colors.textMain;
            const hasRecord = Boolean(emoji);
            const recordSuffix = hasRecord ? ' 기록 있음' : '';
            const a11yLabel = cell.otherMonth
              ? undefined
              : `${calMonth + 1}월 ${cell.day}일${recordSuffix}`;

            return (
              <Pressable
                key={cellKey}
                style={[
                  styles.dayCell,
                  isToday && {
                    borderWidth: 2,
                    borderColor: theme.colors.primary,
                    borderRadius: theme.borderRadius.lg,
                  },
                ]}
                onPress={() => !cell.otherMonth && handleDayPress(cell.day)}
                disabled={cell.otherMonth}
                accessibilityLabel={a11yLabel}
                accessibilityRole="button"
              >
                {emoji ? (
                  <Text style={styles.emojiText}>{emoji}</Text>
                ) : (
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.regular,
                      fontSize: theme.fontSize.sm,
                      color: dayColor,
                    }}
                  >
                    {cell.day}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </Animated.View>

        {/* CTA 버튼 */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Pressable
            onPress={handleCreate}
            style={({ pressed }) => [
              styles.ctaButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.xl,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
            accessibilityLabel="오늘의 기분 기록하기"
            accessibilityRole="button"
          >
            <PenLine size={20} color={theme.colors.textOnPrimary} />
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                color: theme.colors.textOnPrimary,
                marginLeft: 8,
              }}
            >
              오늘의 기분 기록하기
            </Text>
          </Pressable>
        </Animated.View>

        {hasNoMoodData ? (
          <AccountMismatchHint
            onPressOpenAccount={() => router.push('/(client)/(more)')}
            style={styles.accountHint}
          />
        ) : null}

        {/* 감정 추이 차트 */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={[
            styles.chartSection,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.xl,
              ...theme.shadows.sm,
            },
          ]}
        >
          <View style={styles.chartHeader}>
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                color: theme.colors.textMain,
              }}
            >
              감정 추이
            </Text>
            <View style={styles.periodToggle}>
              {MOOD_STAT_PERIODS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => {
                    hapticFeedback();
                    setStatPeriod(p);
                  }}
                  style={[
                    styles.periodChip,
                    {
                      backgroundColor: statPeriod === p ? theme.colors.primary : 'transparent',
                      borderColor: statPeriod === p ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  accessibilityLabel={MOOD_STAT_PERIOD_LABELS[p]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: statPeriod === p }}
                >
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.medium,
                      fontSize: theme.fontSize.xs,
                      color:
                        statPeriod === p ? theme.colors.textOnPrimary : theme.colors.textSecondary,
                    }}
                  >
                    {MOOD_STAT_PERIOD_LABELS[p]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 추이 꺾은선 (Phase 3-B: Skia 미도입 시 SVG로 동일 역할) */}
          <View style={styles.chartBody}>{renderChartBody()}</View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  weekdayCell: {
    width: CELL_SIZE,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emojiText: {
    fontSize: fontSizeTokens['2xl'],
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  chartSection: {
    marginTop: 20,
    padding: 16,
  },
  chartBody: {
    alignItems: 'center',
    minHeight: CHART_HEIGHT + 8,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  periodToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  bottomSpacer: { height: 32 },
  accountHint: {
    marginHorizontal: 0,
  },
});
