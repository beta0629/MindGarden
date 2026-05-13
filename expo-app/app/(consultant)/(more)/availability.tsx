/**
 * ConsultantAvailability — 상담사 근무 가능 시간 설정
 *
 * 주간 타임블록(월~일, 09:00~21:00, 30분 단위) on/off 토글,
 * 휴가 등록(날짜 범위 + 사유), 저장.
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import {
  Clock,
  CalendarOff,
  Plus,
  Trash2,
  Save,
  RotateCcw,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonLoader } from '@/components/atoms/SkeletonLoader';
import {
  useConsultantAvailability,
  useUpdateAvailability,
  useVacations,
  useCreateVacation,
  useDeleteVacation,
  extractErrorMessage,
  isValidDate,
  type AvailabilitySlot,
  type Vacation,
} from '@/api/hooks/useAvailability';
import { useTenantStore } from '@/stores/useTenantStore';

const DAYS_OF_WEEK = [
  { key: 'MON', full: 'MONDAY', label: '월' },
  { key: 'TUE', full: 'TUESDAY', label: '화' },
  { key: 'WED', full: 'WEDNESDAY', label: '수' },
  { key: 'THU', full: 'THURSDAY', label: '목' },
  { key: 'FRI', full: 'FRIDAY', label: '금' },
  { key: 'SAT', full: 'SATURDAY', label: '토' },
  { key: 'SUN', full: 'SUNDAY', label: '일' },
] as const;

const START_HOUR = 9;
const END_HOUR = 21;
const SLOT_INTERVAL_MIN = 30;

const buildTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    slots.push(
      `${String(h).padStart(2, '0')}:00`,
      `${String(h).padStart(2, '0')}:30`,
    );
  }
  return slots;
};

const TIME_SLOTS = buildTimeSlots();

type DayKey = (typeof DAYS_OF_WEEK)[number]['key'];
type Grid = Record<DayKey, Record<string, boolean>>;

const buildEmptyGrid = (): Grid => {
  const grid = {} as Grid;
  DAYS_OF_WEEK.forEach((d) => {
    grid[d.key] = {};
    TIME_SLOTS.forEach((t) => {
      grid[d.key][t] = false;
    });
  });
  return grid;
};

const gridFromSlots = (slots: AvailabilitySlot[]): Grid => {
  const grid = buildEmptyGrid();
  slots.forEach((slot) => {
    const dayKey = slot.dayOfWeek?.substring(0, 3).toUpperCase() as DayKey;
    const time = slot.startTime?.substring(0, 5);
    if (grid[dayKey]?.[time] !== undefined) {
      grid[dayKey][time] = true;
    }
  });
  return grid;
};

const gridToSlots = (grid: Grid): AvailabilitySlot[] => {
  const slots: AvailabilitySlot[] = [];
  DAYS_OF_WEEK.forEach((d) => {
    TIME_SLOTS.forEach((t) => {
      if (grid[d.key][t]) {
        const [hh = 0, mm = 0] = t.split(':').map(Number);
        const endMin = mm + SLOT_INTERVAL_MIN;
        const endH = hh + Math.floor(endMin / 60);
        const endM = endMin % 60;
        slots.push({
          dayOfWeek: d.full,
          startTime: t,
          endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
        });
      }
    });
  });
  return slots;
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
};

export default function ConsultantAvailability() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const tenantId = useTenantStore((s) => s.tenantId);
  const isConsultant = role === 'consultant';
  const consultantId = isConsultant ? user?.id : undefined;

  const {
    data: serverSlots,
    isLoading: loadingSlots,
    isError: slotsError,
    error: slotsErrorObj,
    refetch: refetchSlots,
  } = useConsultantAvailability(consultantId);
  const {
    data: vacationList,
    isLoading: loadingVacations,
    isError: vacationsError,
    error: vacationsErrorObj,
    refetch: refetchVacations,
  } = useVacations(consultantId);

  const updateAvailability = useUpdateAvailability();
  const createVacation = useCreateVacation();
  const deleteVacation = useDeleteVacation();

  const [grid, setGrid] = useState<Grid>(buildEmptyGrid);
  const [originalGrid, setOriginalGrid] = useState<Grid | null>(null);
  const [vacStartDate, setVacStartDate] = useState('');
  const [vacEndDate, setVacEndDate] = useState('');
  const [vacReason, setVacReason] = useState('');

  useEffect(() => {
    if (serverSlots) {
      const newGrid = gridFromSlots(serverSlots);
      setGrid(newGrid);
      setOriginalGrid(structuredClone(newGrid));
    }
  }, [serverSlots]);

  const hasChanges = useMemo(() => {
    if (!originalGrid) return false;
    return JSON.stringify(grid) !== JSON.stringify(originalGrid);
  }, [grid, originalGrid]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const toggleSlot = useCallback(
    (dayKey: DayKey, time: string) => {
      triggerHaptic();
      setGrid((prev) => ({
        ...prev,
        [dayKey]: { ...prev[dayKey], [time]: !prev[dayKey][time] },
      }));
    },
    [triggerHaptic],
  );

  const handleSave = useCallback(async () => {
    if (!consultantId || !hasChanges) return;
    triggerHaptic();
    try {
      await updateAvailability.mutateAsync({
        consultantId,
        slots: gridToSlots(grid),
      });
      setOriginalGrid(structuredClone(grid));
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('저장 완료', '근무 가능 시간이 저장되었습니다.');
    } catch (err) {
      Alert.alert(
        '저장 실패',
        extractErrorMessage(err, '근무시간 저장에 실패했습니다.'),
      );
    }
  }, [consultantId, hasChanges, grid, triggerHaptic, updateAvailability]);

  const handleReset = useCallback(() => {
    if (originalGrid) {
      setGrid(structuredClone(originalGrid));
    }
  }, [originalGrid]);

  const handleAddVacation = useCallback(async () => {
    if (!consultantId || !vacStartDate || !vacEndDate) return;
    if (!isValidDate(vacStartDate) || !isValidDate(vacEndDate)) {
      Alert.alert(
        '입력 확인',
        '날짜를 YYYY-MM-DD 형식(예: 2026-05-13)으로 입력해 주세요.',
      );
      return;
    }
    if (vacStartDate > vacEndDate) {
      Alert.alert('입력 확인', '종료일은 시작일과 같거나 이후여야 합니다.');
      return;
    }
    triggerHaptic();
    try {
      await createVacation.mutateAsync({
        consultantId,
        startDate: vacStartDate,
        endDate: vacEndDate,
        reason: vacReason || undefined,
      });
      setVacStartDate('');
      setVacEndDate('');
      setVacReason('');
    } catch (err) {
      Alert.alert(
        '등록 실패',
        extractErrorMessage(err, '휴가 등록에 실패했습니다.'),
      );
    }
  }, [consultantId, vacStartDate, vacEndDate, vacReason, triggerHaptic, createVacation]);

  const handleDeleteVacation = useCallback(
    async (vacationDate: string) => {
      if (!consultantId) return;
      const cid = consultantId;
      try {
        await deleteVacation.mutateAsync({
          consultantId: cid,
          date: vacationDate.includes('T')
            ? vacationDate.slice(0, 10)
            : vacationDate,
        });
      } catch (err) {
        Alert.alert(
          '삭제 실패',
          extractErrorMessage(err, '휴가 삭제에 실패했습니다.'),
        );
      }
    },
    [consultantId, deleteVacation],
  );

  const isLoading = loadingSlots || loadingVacations;
  const loadError = slotsError || vacationsError;

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: '근무 가능 시간' }} />
        <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
          <EmptyState
            icon={<Clock size={32} color={theme.colors.textTertiary} />}
            title="로그인이 필요합니다"
            description="상담사 계정으로 로그인한 뒤 다시 시도해 주세요"
          />
        </View>
      </>
    );
  }

  if (!isConsultant || !consultantId) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: '근무 가능 시간' }} />
        <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
          <EmptyState
            icon={<Clock size={32} color={theme.colors.textTertiary} />}
            title="상담사만 접근할 수 있습니다"
            description="상담사 계정으로 로그인한 뒤 다시 시도해 주세요"
          />
        </View>
      </>
    );
  }

  if (!tenantId) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: '근무 가능 시간' }} />
        <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
          <EmptyState
            icon={<Clock size={32} color={theme.colors.textTertiary} />}
            title="기관 정보가 없습니다"
            description="기관(테넌트)을 선택한 뒤 다시 시도해 주세요"
          />
        </View>
      </>
    );
  }

  if (loadError && !isLoading) {
    const message = extractErrorMessage(
      slotsErrorObj ?? vacationsErrorObj,
      '네트워크 상태를 확인한 뒤 다시 시도해 주세요',
    );
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: '근무 가능 시간' }} />
        <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
          <EmptyState
            icon={<Clock size={32} color={theme.colors.textTertiary} />}
            title="불러오기에 실패했습니다"
            description={message}
          />
          <Pressable
            onPress={() => {
              refetchSlots();
              refetchVacations();
            }}
            style={[
              styles.bottomButton,
              {
                marginHorizontal: theme.spacing.lg,
                marginTop: theme.spacing.md,
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Text
              style={{
                color: theme.colors.textOnPrimary,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.sm,
              }}
            >
              다시 시도
            </Text>
          </Pressable>
        </View>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: '근무 가능 시간' }} />
        <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
          <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
            <SkeletonLoader height={24} width="50%" />
            <SkeletonLoader height={200} />
            <SkeletonLoader height={24} width="40%" />
            <SkeletonLoader height={120} />
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: '근무 가능 시간' }} />
      <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { padding: theme.spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* 주간 근무 시간 섹션 */}
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={theme.colors.primary} />
              <Text
                style={[
                  theme.textStyles.h3,
                  { color: theme.colors.textMain, marginLeft: theme.spacing.sm },
                ]}
              >
                주간 근무 시간
              </Text>
            </View>

            <View
              style={[
                styles.gridContainer,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.xl,
                  ...theme.shadows.sm,
                },
              ]}
            >
              {/* 요일 헤더 */}
              <View style={styles.dayHeaderRow}>
                <View style={styles.timeLabel} />
                {DAYS_OF_WEEK.map((d) => (
                  <View key={d.key} style={styles.dayHeaderCell}>
                    <Text
                      style={{
                        fontFamily: theme.fontFamily.semibold,
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.textSecondary,
                        textAlign: 'center',
                      }}
                    >
                      {d.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* 시간 슬롯 그리드 */}
              <ScrollView
                nestedScrollEnabled
                style={styles.gridScroll}
                showsVerticalScrollIndicator={false}
              >
                {TIME_SLOTS.map((time) => (
                  <View key={time} style={styles.timeRow}>
                    <View style={styles.timeLabel}>
                      <Text
                        style={{
                          fontFamily: theme.fontFamily.regular,
                          fontSize: theme.fontSize['2xs'],
                          color: theme.colors.textTertiary,
                        }}
                      >
                        {time}
                      </Text>
                    </View>
                    {DAYS_OF_WEEK.map((d) => {
                      const active = grid[d.key]?.[time] ?? false;
                      return (
                        <Pressable
                          key={`${d.key}-${time}`}
                          onPress={() => toggleSlot(d.key, time)}
                          style={[
                            styles.slotCell,
                            {
                              backgroundColor: active
                                ? theme.colors.primary
                                : theme.colors.gray[100],
                              borderRadius: theme.borderRadius.sm,
                            },
                          ]}
                          accessibilityLabel={`${d.label} ${time} ${active ? '활성' : '비활성'}`}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                        >
                          {active && (
                            <View
                              style={[
                                styles.slotDot,
                                { backgroundColor: theme.colors.textOnPrimary },
                              ]}
                            />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
            </View>
          </Animated.View>

          {/* 휴가 관리 섹션 */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(300)}
            style={{ marginTop: theme.spacing['3xl'] }}
          >
            <View style={styles.sectionHeader}>
              <CalendarOff size={20} color={theme.colors.primary} />
              <Text
                style={[
                  theme.textStyles.h3,
                  { color: theme.colors.textMain, marginLeft: theme.spacing.sm },
                ]}
              >
                휴가 관리
              </Text>
            </View>

            <View
              style={[
                styles.vacationForm,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.xl,
                  padding: theme.spacing.lg,
                  ...theme.shadows.sm,
                },
              ]}
            >
              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <Text
                    style={[
                      theme.textStyles.label,
                      { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs },
                    ]}
                  >
                    시작일
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.bgMain,
                        borderColor: theme.colors.border,
                        borderRadius: theme.borderRadius.lg,
                        color: theme.colors.textMain,
                        fontFamily: theme.fontFamily.regular,
                        fontSize: theme.fontSize.sm,
                      },
                    ]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={vacStartDate}
                    onChangeText={setVacStartDate}
                    keyboardType="numbers-and-punctuation"
                    accessibilityLabel="휴가 시작일"
                  />
                </View>
                <Text
                  style={{
                    color: theme.colors.textTertiary,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.base,
                    marginHorizontal: theme.spacing.sm,
                    alignSelf: 'flex-end',
                    marginBottom: theme.spacing.md,
                  }}
                >
                  ~
                </Text>
                <View style={styles.dateField}>
                  <Text
                    style={[
                      theme.textStyles.label,
                      { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs },
                    ]}
                  >
                    종료일
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.bgMain,
                        borderColor: theme.colors.border,
                        borderRadius: theme.borderRadius.lg,
                        color: theme.colors.textMain,
                        fontFamily: theme.fontFamily.regular,
                        fontSize: theme.fontSize.sm,
                      },
                    ]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={vacEndDate}
                    onChangeText={setVacEndDate}
                    keyboardType="numbers-and-punctuation"
                    accessibilityLabel="휴가 종료일"
                  />
                </View>
              </View>

              <Text
                style={[
                  theme.textStyles.label,
                  {
                    color: theme.colors.textSecondary,
                    marginTop: theme.spacing.md,
                    marginBottom: theme.spacing.xs,
                  },
                ]}
              >
                사유 (선택)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.bgMain,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.lg,
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                  },
                ]}
                placeholder="휴가 사유를 입력하세요"
                placeholderTextColor={theme.colors.textTertiary}
                value={vacReason}
                onChangeText={setVacReason}
                accessibilityLabel="휴가 사유"
              />

              <Pressable
                onPress={handleAddVacation}
                disabled={!vacStartDate || !vacEndDate || createVacation.isPending}
                style={[
                  styles.addButton,
                  {
                    backgroundColor:
                      !vacStartDate || !vacEndDate
                        ? theme.colors.gray[300]
                        : theme.colors.primary,
                    borderRadius: theme.borderRadius.lg,
                    marginTop: theme.spacing.lg,
                  },
                ]}
                accessibilityLabel="휴가 등록"
                accessibilityRole="button"
              >
                {createVacation.isPending ? (
                  <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
                ) : (
                  <Plus size={18} color={theme.colors.textOnPrimary} />
                )}
                <Text
                  style={{
                    color: theme.colors.textOnPrimary,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.sm,
                    marginLeft: theme.spacing.xs,
                  }}
                >
                  휴가 등록
                </Text>
              </Pressable>
            </View>

            {/* 휴가 목록 */}
            <View style={{ marginTop: theme.spacing.lg }}>
              {vacationList && vacationList.length > 0 ? (
                vacationList.map((vac: Vacation, idx: number) => (
                  <Animated.View
                    key={vac.id}
                    entering={FadeInUp.delay(idx * 60).duration(250)}
                    style={[
                      styles.vacationItem,
                      {
                        backgroundColor: theme.colors.surface,
                        borderRadius: theme.borderRadius.lg,
                        padding: theme.spacing.lg,
                        marginBottom: theme.spacing.sm,
                        ...theme.shadows.sm,
                      },
                    ]}
                  >
                    <View style={styles.vacationInfo}>
                      <Text
                        style={{
                          fontFamily: theme.fontFamily.semibold,
                          fontSize: theme.fontSize.sm,
                          color: theme.colors.textMain,
                        }}
                      >
                        {formatDate(vac.date)}
                      </Text>
                      {vac.reason ? (
                        <Text
                          style={{
                            fontFamily: theme.fontFamily.regular,
                            fontSize: theme.fontSize.xs,
                            color: theme.colors.textSecondary,
                            marginTop: theme.spacing['2xs'],
                          }}
                          numberOfLines={1}
                        >
                          {vac.reason}
                        </Text>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => handleDeleteVacation(vac.date)}
                      hitSlop={8}
                      accessibilityLabel="휴가 삭제"
                      accessibilityRole="button"
                    >
                      <Trash2 size={18} color={theme.colors.error} />
                    </Pressable>
                  </Animated.View>
                ))
              ) : (
                <EmptyState
                  icon={<CalendarOff size={32} color={theme.colors.textTertiary} />}
                  title="등록된 휴가가 없습니다"
                  description="위에서 휴가 기간을 등록해 주세요"
                />
              )}
            </View>
          </Animated.View>

          {/* 하단 여백 (저장 바 가림 방지) */}
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* 하단 고정 저장 바 */}
        <Animated.View
          entering={FadeInUp.duration(300)}
          style={[
            styles.bottomBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.divider,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
              ...theme.shadows.lg,
            },
          ]}
        >
          <Pressable
            onPress={handleReset}
            disabled={!hasChanges}
            style={[
              styles.bottomButton,
              {
                backgroundColor: hasChanges
                  ? theme.colors.surfaceAlt
                  : theme.colors.gray[100],
                borderRadius: theme.borderRadius.lg,
              },
            ]}
            accessibilityLabel="초기화"
            accessibilityRole="button"
          >
            <RotateCcw
              size={18}
              color={hasChanges ? theme.colors.textMain : theme.colors.textTertiary}
            />
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.sm,
                color: hasChanges ? theme.colors.textMain : theme.colors.textTertiary,
                marginLeft: theme.spacing.xs,
              }}
            >
              초기화
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={!hasChanges || updateAvailability.isPending}
            style={[
              styles.bottomButton,
              styles.saveButton,
              {
                backgroundColor: hasChanges
                  ? theme.colors.primary
                  : theme.colors.gray[300],
                borderRadius: theme.borderRadius.lg,
              },
            ]}
            accessibilityLabel="저장"
            accessibilityRole="button"
          >
            {updateAvailability.isPending ? (
              <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
            ) : (
              <Save size={18} color={theme.colors.textOnPrimary} />
            )}
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textOnPrimary,
                marginLeft: theme.spacing.xs,
              }}
            >
              {updateAvailability.isPending ? '저장 중...' : '저장'}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridContainer: {
    padding: 12,
    overflow: 'hidden',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    width: 44,
    justifyContent: 'center',
  },
  gridScroll: {
    maxHeight: 320,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  slotCell: {
    flex: 1,
    height: 28,
    marginHorizontal: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vacationForm: {},
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  dateField: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  vacationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vacationInfo: {
    flex: 1,
    marginRight: 12,
  },
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    gap: 12,
  },
  bottomButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  saveButton: {
    flex: 2,
  },
});
