/**
 * 스케줄 상세 화면
 * 내담자 정보, 상담 정보, 액션 버튼, 메모, 이전 이력
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  RefreshControl,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Phone, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/theme';
import {
  useScheduleDetail,
  useStartConsultation,
  useCompleteConsultation,
} from '@/api/hooks/useSchedules';
import { Avatar } from '@/components/atoms/Avatar';
import { Badge } from '@/components/atoms/Badge';
import { SkeletonCard, SkeletonLoader } from '@/components/atoms/SkeletonLoader';

const STATUS_LABEL: Record<string, string> = {
  BOOKED: '예정',
  SCHEDULED: '예정',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소',
  NO_SHOW: '불참',
};

const STATUS_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'gray' | 'error'> = {
  BOOKED: 'info',
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'gray',
  NO_SHOW: 'error',
};

export default function ConsultantScheduleDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [memo, setMemo] = useState('');

  const detailQuery = useScheduleDetail(id);
  const startMutation = useStartConsultation();
  const completeMutation = useCompleteConsultation();

  const schedule = detailQuery.data;
  const isLoading = detailQuery.isLoading;

  const onRefresh = useCallback(() => {
    detailQuery.refetch();
  }, [detailQuery]);

  const handleStart = () => {
    if (!id) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert('상담 시작', '상담을 시작하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '시작',
        onPress: () => startMutation.mutate(id),
      },
    ]);
  };

  const handleComplete = () => {
    if (!id) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert('상담 완료', '상담을 완료하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '완료',
        onPress: () => completeMutation.mutate(id),
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      {/* 헤더 */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderBottomColor: theme.colors.divider,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <ArrowLeft size={24} color={theme.colors.textMain} />
        </Pressable>
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.lg,
            marginLeft: theme.spacing.md,
          }}
        >
          상담 상세
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={detailQuery.isFetching && !isLoading}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonLoader height={100} style={{ marginTop: 16 }} />
          </>
        ) : schedule ? (
          <>
            {/* 내담자 정보 카드 */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.xl,
                  padding: theme.spacing.lg,
                  ...theme.shadows.sm,
                },
              ]}
            >
              <View style={styles.clientRow}>
                <Avatar uri={schedule.clientProfileImageUrl} name={schedule.clientName} size="lg" />
                <View style={[styles.clientInfo, { marginLeft: theme.spacing.md }]}>
                  <Text
                    style={{
                      color: theme.colors.textMain,
                      fontFamily: theme.fontFamily.semibold,
                      fontSize: theme.fontSize.lg,
                    }}
                  >
                    {schedule.clientName} 님
                  </Text>
                  {schedule.contactNumber ? (
                    <View style={styles.contactRow}>
                      <Phone size={14} color={theme.colors.textSecondary} />
                      <Text
                        style={{
                          color: theme.colors.textSecondary,
                          fontFamily: theme.fontFamily.regular,
                          fontSize: theme.fontSize.sm,
                          marginLeft: theme.spacing.xs,
                        }}
                      >
                        {schedule.contactNumber}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* 상담 정보 */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.xl,
                  padding: theme.spacing.lg,
                  marginTop: theme.spacing.md,
                  ...theme.shadows.sm,
                },
              ]}
            >
              <View style={styles.infoRow}>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  날짜
                </Text>
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {schedule.date}
                </Text>
              </View>
              <View style={[styles.infoRow, { marginTop: theme.spacing.md }]}>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  시간
                </Text>
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {schedule.startTime} - {schedule.endTime}
                </Text>
              </View>
              {schedule.location ? (
                <View style={[styles.infoRow, { marginTop: theme.spacing.md }]}>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontFamily: theme.fontFamily.regular,
                      fontSize: theme.fontSize.sm,
                    }}
                  >
                    장소
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textMain,
                      fontFamily: theme.fontFamily.medium,
                      fontSize: theme.fontSize.sm,
                    }}
                  >
                    {schedule.location}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.infoRow, { marginTop: theme.spacing.md }]}>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  상태
                </Text>
                <Badge
                  variant={STATUS_VARIANT[schedule.status] ?? 'info'}
                  label={STATUS_LABEL[schedule.status] ?? schedule.status}
                />
              </View>
              <View style={[styles.infoRow, { marginTop: theme.spacing.md }]}>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  유형
                </Text>
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {schedule.consultationType}
                  {schedule.sessionNumber ? ` (${schedule.sessionNumber}회차)` : ''}
                </Text>
              </View>
            </View>

            {/* 액션 버튼 */}
            {schedule.status === 'SCHEDULED' ||
            schedule.status === 'BOOKED' ||
            schedule.status === 'IN_PROGRESS' ? (
              <View style={[styles.actionRow, { marginTop: theme.spacing.lg }]}>
                {schedule.status === 'SCHEDULED' || schedule.status === 'BOOKED' ? (
                  <Pressable
                    onPress={handleStart}
                    disabled={startMutation.isPending}
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor: theme.colors.primary,
                        borderRadius: theme.borderRadius.lg,
                        paddingVertical: theme.spacing.md,
                        opacity: startMutation.isPending ? 0.6 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="상담 시작"
                  >
                    <Text
                      style={{
                        color: theme.colors.textOnPrimary,
                        fontFamily: theme.fontFamily.semibold,
                        fontSize: theme.fontSize.base,
                        textAlign: 'center',
                      }}
                    >
                      상담 시작
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={handleComplete}
                    disabled={completeMutation.isPending}
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor: theme.colors.success,
                        borderRadius: theme.borderRadius.lg,
                        paddingVertical: theme.spacing.md,
                        opacity: completeMutation.isPending ? 0.6 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="상담 완료"
                  >
                    <Text
                      style={{
                        color: theme.colors.textOnPrimary,
                        fontFamily: theme.fontFamily.semibold,
                        fontSize: theme.fontSize.base,
                        textAlign: 'center',
                      }}
                    >
                      상담 완료
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : null}

            {/* 상담 메모 */}
            <Text
              style={{
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.lg,
                marginTop: theme.spacing['2xl'],
              }}
            >
              상담 메모
            </Text>
            <TextInput
              style={[
                styles.memoInput,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.lg,
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  padding: theme.spacing.md,
                  marginTop: theme.spacing.md,
                },
              ]}
              value={memo || schedule.memo || ''}
              onChangeText={setMemo}
              placeholder="상담 메모를 입력하세요..."
              placeholderTextColor={theme.colors.gray[400]}
              multiline
              textAlignVertical="top"
              accessibilityLabel="상담 메모"
            />

            {/* 이전 상담 이력 */}
            {schedule.previousSessions && schedule.previousSessions.length > 0 ? (
              <>
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.lg,
                    marginTop: theme.spacing['2xl'],
                  }}
                >
                  이전 상담 이력
                </Text>
                {schedule.previousSessions.map((session) => (
                  <View
                    key={session.id}
                    style={[
                      styles.historyItem,
                      {
                        borderLeftColor: theme.colors.primary,
                        paddingLeft: theme.spacing.md,
                        marginTop: theme.spacing.md,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: theme.colors.textMain,
                        fontFamily: theme.fontFamily.medium,
                        fontSize: theme.fontSize.sm,
                      }}
                    >
                      {session.date} {session.startTime}
                    </Text>
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        fontFamily: theme.fontFamily.regular,
                        fontSize: theme.fontSize.xs,
                        marginTop: theme.spacing['2xs'],
                      }}
                    >
                      {session.consultationType}
                      {session.sessionNumber ? ` · ${session.sessionNumber}회차` : ''}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}

            {/* 일지 작성 바로가기 */}
            {schedule.status === 'COMPLETED' && !schedule.hasRecord ? (
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push(`/(consultant)/(records)/create/${schedule.id}`);
                }}
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.borderRadius.lg,
                    paddingVertical: theme.spacing.md,
                    marginTop: theme.spacing.xl,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="일지 작성"
              >
                <MessageCircle
                  size={18}
                  color={theme.colors.textOnPrimary}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Text
                  style={{
                    color: theme.colors.textOnPrimary,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                  }}
                >
                  일지 작성하기
                </Text>
              </Pressable>
            ) : null}

            <View style={{ height: 32 }} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {},
  card: {},
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientInfo: {
    flex: 1,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoInput: {
    minHeight: 100,
    borderWidth: 1,
  },
  historyItem: {
    borderLeftWidth: 2,
  },
});
