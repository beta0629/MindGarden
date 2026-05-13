/**
 * 상담사 평가 화면
 * RatingStars + 태그 칩 + 한줄평 + 제출
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { Avatar } from '@/components/atoms/Avatar';
import { Chip } from '@/components/atoms/Chip';
import { RatingStars } from '@/components/molecules/RatingStars';
import { useConsultationDetail } from '@/api/hooks/useConsultations';
import { useCreateRating } from '@/api/hooks/useRatings';
import { maskEncryptedDisplay, resolveProfileImageUrlForNative } from '@/utils/displayString';

const REVIEW_TAGS = [
  '따뜻함',
  '전문성',
  '경청',
  '실용적',
  '편안함',
  '공감',
  '명확한 설명',
  '해결 중심',
];

export default function ClientSessionReview() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: detail } = useConsultationDetail(id);
  const createRating = useCreateRating();

  const consultantLabel = maskEncryptedDisplay(detail?.consultantName, '상담사');
  const consultantAvatarUri = resolveProfileImageUrlForNative(
    detail?.consultantProfileImageUrl,
  );

  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const toggleTag = (tag: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag],
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('별점을 선택해주세요');
      return;
    }
    if (!detail) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await createRating.mutateAsync({
        scheduleId: detail.id,
        consultantId: detail.consultantId,
        rating,
        tags: selectedTags,
        comment: comment.trim() || undefined,
      });
      Alert.alert('감사합니다', '평가가 제출되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('오류', '평가 제출 중 문제가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <AppTopBar title="상담사 평가" canGoBack />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 상담사 프로필 */}
          <Animated.View
            entering={FadeInDown.springify()}
            style={styles.profileSection}
          >
            <Avatar
              uri={consultantAvatarUri}
              name={consultantLabel}
              size="xl"
            />
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.lg,
                color: theme.colors.textMain,
                marginTop: 12,
              }}
            >
              {consultantLabel}
            </Text>
          </Animated.View>

          {/* 별점 */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.section}
          >
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
              상담은 어떠셨나요?
            </Text>
            <View style={styles.starsWrap}>
              <RatingStars value={rating} onChange={setRating} size={40} />
            </View>
          </Animated.View>

          {/* 태그 칩 */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.section}
          >
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
              어떤 점이 좋았나요?
            </Text>
            <View style={styles.tagGrid}>
              {REVIEW_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  selected={selectedTags.includes(tag)}
                  onPress={() => toggleTag(tag)}
                />
              ))}
            </View>
          </Animated.View>

          {/* 한줄평 */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.section}
          >
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
              한줄 코멘트 (선택)
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="상담에 대한 소감을 남겨주세요"
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              maxLength={200}
              style={[
                styles.textInput,
                {
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.lg,
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                },
              ]}
              accessibilityLabel="한줄 코멘트 입력"
            />
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textTertiary,
                alignSelf: 'flex-end',
                marginTop: 4,
              }}
            >
              {comment.length}/200
            </Text>
          </Animated.View>
        </ScrollView>

        {/* 하단 버튼 */}
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
            onPress={handleSubmit}
            disabled={createRating.isPending || rating === 0}
            style={[
              styles.submitButton,
              {
                backgroundColor:
                  rating > 0 ? theme.colors.primary : theme.colors.gray[300],
                borderRadius: theme.borderRadius.lg,
              },
            ]}
            accessibilityLabel="평가 제출"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                color: theme.colors.textOnPrimary,
              }}
            >
              {createRating.isPending ? '제출 중...' : '평가 제출'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  starsWrap: {
    alignItems: 'center',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  textInput: {
    borderWidth: 1,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
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
  submitButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
