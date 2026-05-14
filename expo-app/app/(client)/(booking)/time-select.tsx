/**
 * Step 2: 시간 선택
 * 주간 캘린더 스와이프 + TimeSlotChip 그리드
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTheme } from '@/theme';
import { toDisplayString } from '@/utils/safeDisplay';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { TimeSlotChip } from '@/components/molecules/TimeSlotChip';
import { Avatar } from '@/components/atoms/Avatar';
import { SkeletonLoader } from '@/components/atoms/SkeletonLoader';
import { EmptyState } from '@/components/atoms/EmptyState';
import { useConsultantAvailability, type AvailableSlot } from '@/api/hooks/useBooking';

const STEP_LABELS = ['상담사 선택', '시간 선택', '결제'];
const DAYS_IN_WEEK = 7;

export default function BookingTimeSelect() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    consultantId: string;
    consultantName: string;
    consultantImage: string;
    specialties: string;
  }>();

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  const consultantLabel = toDisplayString(params.consultantName, '상담');

  const weekStart = format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data, isLoading } = useConsultantAvailability(params.consultantId, weekStart);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: DAYS_IN_WEEK }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const slotsForSelectedDate =
    data?.slots.filter((s) => s.date === format(selectedDate, 'yyyy-MM-dd')) ?? [];

  const handleDateSelect = (date: Date) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
  };

  const handleNext = () => {
    if (!selectedSlot) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({
      pathname: '/(client)/(booking)/payment',
      params: {
        consultantId: params.consultantId,
        consultantName: consultantLabel,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      },
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title="시간 선택" canGoBack />
      <ProgressBar currentStep={2} totalSteps={3} labels={STEP_LABELS} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 상담사 미니 프로필 */}
        <Animated.View entering={FadeInDown.springify()} style={styles.miniProfile}>
          <Avatar uri={params.consultantImage || undefined} name={consultantLabel} size="sm" />
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              color: theme.colors.textMain,
              marginLeft: 8,
            }}
          >
            {consultantLabel} 전문가
          </Text>
        </Animated.View>

        {/* 주간 캘린더 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekRow}
        >
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);
            return (
              <Pressable
                key={day.toISOString()}
                onPress={() => handleDateSelect(day)}
                style={[
                  styles.dayChip,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                    borderColor: isToday ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.borderRadius.lg,
                  },
                ]}
                accessibilityLabel={format(day, 'M월 d일 EEEE', {
                  locale: ko,
                })}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={{
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.xs,
                    color: isSelected ? theme.colors.textOnPrimary : theme.colors.textSecondary,
                  }}
                >
                  {format(day, 'EEE', { locale: ko })}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.lg,
                    color: isSelected ? theme.colors.textOnPrimary : theme.colors.textMain,
                  }}
                >
                  {format(day, 'd')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 가용 시간 그리드 */}
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
          가용 시간
        </Text>

        {isLoading ? (
          <View style={styles.slotGrid}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonLoader key={i} width="30%" height={44} borderRadius={12} />
            ))}
          </View>
        ) : slotsForSelectedDate.length === 0 ? (
          <EmptyState title="가용 시간이 없어요" description="다른 날짜를 선택해보세요" />
        ) : (
          <View style={styles.slotGrid}>
            {slotsForSelectedDate.map((slot) => (
              <TimeSlotChip
                key={`${slot.date}-${slot.startTime}`}
                time={slot.startTime}
                isAvailable={slot.isAvailable}
                isSelected={
                  selectedSlot?.date === slot.date && selectedSlot?.startTime === slot.startTime
                }
                onPress={() => handleSlotSelect(slot)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.divider,
            ...theme.shadows.md,
          },
        ]}
      >
        <Pressable
          onPress={handleNext}
          disabled={!selectedSlot}
          style={[
            styles.nextButton,
            {
              backgroundColor: selectedSlot ? theme.colors.primary : theme.colors.gray[300],
              borderRadius: theme.borderRadius.lg,
            },
          ]}
          accessibilityLabel="다음 단계"
          accessibilityRole="button"
        >
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              color: selectedSlot ? theme.colors.textOnPrimary : theme.colors.textTertiary,
            }}
          >
            다음 단계
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  miniProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
  },
  dayChip: {
    width: 52,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 4,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 12,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  nextButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
