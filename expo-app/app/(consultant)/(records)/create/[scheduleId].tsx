/**
 * 일지 작성 화면
 * 상담 정보 요약, 요약(공유), 전문가 메모(비공개), 태그, 다음 상담 제안
 *
 * @author MindGarden
 * @since 2026-05-12
 * @see docs/design-system/v2/CONSULTANT_CLIENT_SCREEN_WIREFRAMES.md §2
 */
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useScheduleDetail } from '@/api/hooks/useSchedules';
import { useCreateRecord } from '@/api/hooks/useRecords';
import { Chip } from '@/components/atoms/Chip';
import { SkeletonLoader } from '@/components/atoms/SkeletonLoader';

const TAG_OPTIONS = ['우울', '불안', '가족', '학업', '직장', '관계', '자아', '기타'];

export default function ConsultantRecordCreate() {
  const theme = useTheme();
  const router = useRouter();
  const { scheduleId } = useLocalSearchParams<{ scheduleId: string }>();

  const scheduleQuery = useScheduleDetail(scheduleId);
  const createMutation = useCreateRecord();

  const schedule = scheduleQuery.data;

  const [summary, setSummary] = useState('');
  const [expertMemo, setExpertMemo] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [nextSessionMemo, setNextSessionMemo] = useState('');

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSave = (status: 'DRAFT' | 'COMPLETED') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (status === 'COMPLETED' && !summary.trim()) {
      Alert.alert('알림', '상담 요약을 입력해주세요.');
      return;
    }

    createMutation.mutate(
      {
        scheduleId: Number(scheduleId),
        summary: summary.trim(),
        expertMemo: expertMemo.trim() || undefined,
        tags: selectedTags,
        nextSessionMemo: nextSessionMemo.trim() || undefined,
        status,
      },
      {
        onSuccess: () => {
          Alert.alert(
            status === 'COMPLETED' ? '저장 완료' : '임시 저장',
            status === 'COMPLETED' ? '상담일지가 저장되었습니다.' : '임시 저장되었습니다.',
            [{ text: '확인', onPress: () => router.back() }],
          );
        },
        onError: () => {
          Alert.alert('오류', '저장에 실패했습니다. 다시 시도해주세요.');
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
          일지 작성
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.lg }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 상담 정보 요약 */}
          {scheduleQuery.isLoading ? (
            <SkeletonLoader height={60} />
          ) : schedule ? (
            <View
              style={[
                styles.infoCard,
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
                {schedule.clientName} 님
              </Text>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  marginTop: theme.spacing.xs,
                }}
              >
                {schedule.date} · {schedule.startTime} - {schedule.endTime}
              </Text>
            </View>
          ) : null}

          {/* 요약 (공유) */}
          <Text
            style={[
              styles.sectionLabel,
              {
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                marginTop: theme.spacing['2xl'],
              },
            ]}
          >
            상담 요약 (내담자에게 공유됨)
          </Text>
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
            value={summary}
            onChangeText={setSummary}
            placeholder="내담자에게 공유될 한 줄 요약을 입력하세요..."
            placeholderTextColor={theme.colors.gray[400]}
            multiline
            textAlignVertical="top"
            accessibilityLabel="상담 요약"
          />

          {/* 전문가 메모 (비공개) */}
          <Text
            style={[
              styles.sectionLabel,
              {
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                marginTop: theme.spacing.xl,
              },
            ]}
          >
            전문가 메모 (비공개)
          </Text>
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
            value={expertMemo}
            onChangeText={setExpertMemo}
            placeholder="상담사만 볼 수 있는 상세 메모를 입력하세요..."
            placeholderTextColor={theme.colors.gray[400]}
            multiline
            textAlignVertical="top"
            accessibilityLabel="전문가 메모"
          />

          {/* 태그 */}
          <Text
            style={[
              styles.sectionLabel,
              {
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                marginTop: theme.spacing.xl,
              },
            ]}
          >
            태그 추가
          </Text>
          <View style={[styles.tagRow, { marginTop: theme.spacing.sm }]}>
            {TAG_OPTIONS.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                selected={selectedTags.includes(tag)}
                onPress={() => toggleTag(tag)}
              />
            ))}
          </View>

          {/* 다음 상담 제안 */}
          <Text
            style={[
              styles.sectionLabel,
              {
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                marginTop: theme.spacing.xl,
              },
            ]}
          >
            다음 상담 제안
          </Text>
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
            value={nextSessionMemo}
            onChangeText={setNextSessionMemo}
            placeholder="다음 상담에 대한 메모를 남겨주세요..."
            placeholderTextColor={theme.colors.gray[400]}
            multiline
            textAlignVertical="top"
            accessibilityLabel="다음 상담 제안 메모"
          />

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* 하단 고정 버튼 */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: theme.colors.surface,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
              borderTopColor: theme.colors.divider,
              ...theme.shadows.md,
            },
          ]}
        >
          <Pressable
            onPress={() => handleSave('DRAFT')}
            disabled={createMutation.isPending}
            style={[
              styles.secondaryButton,
              {
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.lg,
                paddingVertical: theme.spacing.md,
                opacity: createMutation.isPending ? 0.6 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="임시저장"
          >
            <Text
              style={{
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                textAlign: 'center',
              }}
            >
              임시저장
            </Text>
          </Pressable>
          <View style={{ width: theme.spacing.md }} />
          <Pressable
            onPress={() => handleSave('COMPLETED')}
            disabled={createMutation.isPending}
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.lg,
                paddingVertical: theme.spacing.md,
                opacity: createMutation.isPending ? 0.6 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="저장"
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
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
  infoCard: {},
  sectionLabel: {},
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
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
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
