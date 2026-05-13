/**
 * 일지 상세 화면
 * 상담 정보, 요약, 전문가 메모, 태그, 수정 버튼
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
import { ArrowLeft, Edit3 } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useRecordDetail, useUpdateRecord } from '@/api/hooks/useRecords';
import { Chip } from '@/components/atoms/Chip';
import { SkeletonCard, SkeletonLoader } from '@/components/atoms/SkeletonLoader';

export default function ConsultantRecordDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isEditing, setIsEditing] = useState(false);

  const detailQuery = useRecordDetail(id);
  const updateMutation = useUpdateRecord();

  const record = detailQuery.data;
  const isLoading = detailQuery.isLoading;

  const [editSummary, setEditSummary] = useState('');
  const [editMemo, setEditMemo] = useState('');

  const onRefresh = useCallback(() => {
    detailQuery.refetch();
  }, [detailQuery]);

  const startEdit = () => {
    if (!record) return;
    setEditSummary(record.summary ?? '');
    setEditMemo(record.expertMemo ?? '');
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!record) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    updateMutation.mutate(
      {
        recordId: record.id,
        summary: editSummary.trim(),
        expertMemo: editMemo.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          Alert.alert('수정 완료', '상담일지가 수정되었습니다.');
        },
        onError: () => {
          Alert.alert('오류', '수정에 실패했습니다.');
        },
      },
    );
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
            flex: 1,
          }}
        >
          일지 상세
        </Text>
        {!isEditing && record ? (
          <Pressable
            onPress={startEdit}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="수정"
          >
            <Edit3 size={20} color={theme.colors.primary} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { padding: theme.spacing.lg },
        ]}
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
            <SkeletonLoader height={60} />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : record ? (
          <>
            {/* 상담 정보 */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.lg,
                },
              ]}
            >
              <Text
                style={{
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                }}
              >
                {record.clientName} 님
              </Text>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  marginTop: theme.spacing.xs,
                }}
              >
                {record.date} · {record.startTime} - {record.endTime}
              </Text>
            </View>

            {/* 요약 (공유) */}
            <Text
              style={{
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                marginTop: theme.spacing['2xl'],
              }}
            >
              상담 요약 (공유됨)
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.lg,
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                    padding: theme.spacing.md,
                    marginTop: theme.spacing.sm,
                  },
                ]}
                value={editSummary}
                onChangeText={setEditSummary}
                multiline
                textAlignVertical="top"
                accessibilityLabel="상담 요약 수정"
              />
            ) : (
              <Text
                style={[
                  styles.contentText,
                  {
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                    marginTop: theme.spacing.sm,
                    lineHeight: 22,
                  },
                ]}
              >
                {record.summary || '(작성되지 않음)'}
              </Text>
            )}

            {/* 전문가 메모 */}
            <Text
              style={{
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                marginTop: theme.spacing.xl,
              }}
            >
              전문가 메모 (비공개)
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.textInputLarge,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.lg,
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                    padding: theme.spacing.md,
                    marginTop: theme.spacing.sm,
                  },
                ]}
                value={editMemo}
                onChangeText={setEditMemo}
                multiline
                textAlignVertical="top"
                accessibilityLabel="전문가 메모 수정"
              />
            ) : (
              <Text
                style={[
                  styles.contentText,
                  {
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                    marginTop: theme.spacing.sm,
                    lineHeight: 22,
                  },
                ]}
              >
                {record.expertMemo || '(작성되지 않음)'}
              </Text>
            )}

            {/* 태그 */}
            {record.tags.length > 0 ? (
              <>
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                    marginTop: theme.spacing.xl,
                  }}
                >
                  태그
                </Text>
                <View style={[styles.tagRow, { marginTop: theme.spacing.sm }]}>
                  {record.tags.map((tag) => (
                    <Chip key={tag} label={tag} selected disabled />
                  ))}
                </View>
              </>
            ) : null}

            {/* 다음 상담 메모 */}
            {record.nextSessionMemo ? (
              <>
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                    marginTop: theme.spacing.xl,
                  }}
                >
                  다음 상담 제안
                </Text>
                {record.nextSessionDate ? (
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontFamily: theme.fontFamily.regular,
                      fontSize: theme.fontSize.sm,
                      marginTop: theme.spacing.sm,
                    }}
                  >
                    제안 날짜: {record.nextSessionDate}
                  </Text>
                ) : null}
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                    marginTop: theme.spacing.xs,
                    lineHeight: 22,
                  }}
                >
                  {record.nextSessionMemo}
                </Text>
              </>
            ) : null}

            {/* 수정 모드 저장 버튼 */}
            {isEditing ? (
              <View style={[styles.editActions, { marginTop: theme.spacing.xl }]}>
                <Pressable
                  onPress={() => setIsEditing(false)}
                  style={[
                    styles.secondaryButton,
                    {
                      borderColor: theme.colors.border,
                      borderRadius: theme.borderRadius.lg,
                      paddingVertical: theme.spacing.md,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="취소"
                >
                  <Text
                    style={{
                      color: theme.colors.textMain,
                      fontFamily: theme.fontFamily.semibold,
                      fontSize: theme.fontSize.base,
                      textAlign: 'center',
                    }}
                  >
                    취소
                  </Text>
                </Pressable>
                <View style={{ width: theme.spacing.md }} />
                <Pressable
                  onPress={handleSave}
                  disabled={updateMutation.isPending}
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: theme.colors.primary,
                      borderRadius: theme.borderRadius.lg,
                      paddingVertical: theme.spacing.md,
                      opacity: updateMutation.isPending ? 0.6 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="수정 저장"
                >
                  <Text
                    style={{
                      color: theme.colors.textOnPrimary,
                      fontFamily: theme.fontFamily.semibold,
                      fontSize: theme.fontSize.base,
                      textAlign: 'center',
                    }}
                  >
                    저장
                  </Text>
                </Pressable>
              </View>
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
  contentText: {},
  textInput: {
    borderWidth: 1,
    minHeight: 60,
  },
  textInputLarge: {
    borderWidth: 1,
    minHeight: 160,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  editActions: {
    flexDirection: 'row',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
  },
});
