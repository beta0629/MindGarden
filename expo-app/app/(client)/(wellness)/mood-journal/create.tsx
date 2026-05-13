/**
 * 기분 기록 화면
 *
 * - 이모지 5단계 선택 (scale 애니메이션 + haptics)
 * - 감정 태그 칩 다중 선택
 * - 한줄 메모 TextInput
 * - 상담사 공유 토글
 * - 저장 버튼
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTheme } from '@/theme';
import { fontSize as fontSizeTokens } from '@/theme/typography';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { Chip } from '@/components/atoms/Chip';
import {
  useCreateMoodJournal,
  useMoodJournalDetail,
  useUpdateMoodJournal,
} from '@/api/hooks/useMoodJournal';
import { MOOD_EMOJIS, EMOTION_TAGS, type EmotionTag } from '@/constants/moodConstants';

const EMOJI_BUTTON_SIZE = 56;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

interface EmojiButtonProps {
  readonly emoji: string;
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
}

function EmojiButton({ emoji, label, selected, onPress }: EmojiButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(1.3, { damping: 8 }, () => {
      scale.value = withSpring(1);
    });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.emojiButtonWrap}
      accessibilityLabel={`${label} 선택`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Animated.View
        style={[
          styles.emojiCircle,
          {
            backgroundColor: selected
              ? theme.colors.primaryLight + '40'
              : theme.colors.accentSoft,
            borderColor: selected ? theme.colors.primary : 'transparent',
            borderWidth: selected ? 2 : 0,
          },
          animatedStyle,
        ]}
      >
        <Text style={styles.emojiText}>{emoji}</Text>
      </Animated.View>
      <Text
        style={{
          fontFamily: selected ? theme.fontFamily.semibold : theme.fontFamily.regular,
          fontSize: theme.fontSize.xs,
          color: selected ? theme.colors.primary : theme.colors.textSecondary,
          marginTop: 6,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function MoodJournalCreate() {
  const theme = useTheme();
  const router = useRouter();
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const editDate =
    typeof dateParam === 'string' && ISO_DATE.test(dateParam) ? dateParam : undefined;
  const isEdit = Boolean(editDate);
  const targetDate =
    isEdit && editDate ? editDate : format(new Date(), 'yyyy-MM-dd');
  const dateLabel = format(
    parseISO(targetDate),
    'M월 d일 (EEEE)',
    { locale: ko },
  );

  const [selectedMood, setSelectedMood] = useState(0);
  const [selectedTags, setSelectedTags] = useState<EmotionTag[]>([]);
  const [memo, setMemo] = useState('');
  const [shareWithConsultant, setShareWithConsultant] = useState(false);

  const { data: existing, isLoading: entryLoading } = useMoodJournalDetail(
    isEdit ? targetDate : '',
  );

  const createMutation = useCreateMoodJournal();
  const updateMutation = useUpdateMoodJournal();

  useEffect(() => {
    if (!existing) return;
    setSelectedMood(existing.moodValue);
    setSelectedTags([...existing.tags]);
    setMemo(existing.memo);
    setShareWithConsultant(existing.sharedWithConsultant);
  }, [existing]);

  const hapticFeedback = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const toggleTag = (tag: EmotionTag) => {
    hapticFeedback();
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSave = async () => {
    if (selectedMood === 0) {
      Alert.alert('알림', '오늘의 기분을 선택해주세요.');
      return;
    }
    hapticFeedback();
    try {
      const payload = {
        date: targetDate,
        moodValue: selectedMood,
        tags: selectedTags,
        memo,
        sharedWithConsultant: shareWithConsultant,
      };
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } catch {
      Alert.alert('오류', '저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (isEdit && entryLoading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top']}
      >
        <AppTopBar title="기분 수정" canGoBack />
        <View style={styles.loadingWrap}>
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

  if (isEdit && !existing) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top']}
      >
        <AppTopBar title="기분 수정" canGoBack />
        <View style={styles.loadingWrap}>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              textAlign: 'center',
              paddingHorizontal: 24,
            }}
          >
            이 날짜에 수정할 감정 일기가 없습니다.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const savePending = createMutation.isPending || updateMutation.isPending;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <AppTopBar title={isEdit ? '기분 수정' : '기분 기록'} canGoBack />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 날짜 */}
          <Animated.View entering={FadeInDown.springify()}>
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              {dateLabel}
            </Text>
          </Animated.View>

          {/* 이모지 선택 */}
          <Animated.View
            entering={FadeInDown.delay(80).springify()}
            style={[
              styles.section,
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
                marginBottom: 16,
              }}
            >
              오늘의 기분은 어떤가요?
            </Text>
            <View style={styles.emojiRow}>
              {MOOD_EMOJIS.map((m) => (
                <EmojiButton
                  key={m.value}
                  emoji={m.emoji}
                  label={m.label}
                  selected={selectedMood === m.value}
                  onPress={() => setSelectedMood(m.value)}
                />
              ))}
            </View>
          </Animated.View>

          {/* 감정 태그 */}
          <Animated.View
            entering={FadeInDown.delay(160).springify()}
            style={[
              styles.section,
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
              어떤 감정을 느꼈나요?
            </Text>
            <View style={styles.tagWrap}>
              {EMOTION_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  selected={selectedTags.includes(tag)}
                  onPress={() => toggleTag(tag)}
                  style={styles.tagChip}
                />
              ))}
            </View>
          </Animated.View>

          {/* 한줄 메모 */}
          <Animated.View
            entering={FadeInDown.delay(240).springify()}
            style={[
              styles.section,
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
              한줄 메모
            </Text>
            <TextInput
              value={memo}
              onChangeText={setMemo}
              placeholder="오늘 하루를 한 줄로 표현해보세요"
              placeholderTextColor={theme.colors.textTertiary}
              style={[
                styles.memoInput,
                {
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textMain,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.lg,
                  backgroundColor: theme.colors.bgMain,
                },
              ]}
              maxLength={100}
              accessibilityLabel="한줄 메모 입력"
            />
          </Animated.View>

          {/* 상담사 공유 */}
          <Animated.View
            entering={FadeInDown.delay(320).springify()}
            style={[
              styles.section,
              styles.toggleRow,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.xl,
                ...theme.shadows.sm,
              },
            ]}
          >
            <View style={styles.toggleText}>
              <Text
                style={{
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textMain,
                }}
              >
                상담사에게 공유
              </Text>
              <Text
                style={{
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textSecondary,
                  marginTop: 2,
                }}
              >
                담당 상담사가 기록을 확인할 수 있어요
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

          {/* 저장 버튼 */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Pressable
              onPress={handleSave}
              disabled={savePending}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.xl,
                  opacity: savePending ? 0.6 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
              accessibilityLabel="저장"
              accessibilityRole="button"
            >
              <Text
                style={{
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                  color: theme.colors.textOnPrimary,
                }}
              >
                {savePending ? '저장 중...' : '저장'}
              </Text>
            </Pressable>
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  section: {
    padding: 16,
    marginTop: 12,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  emojiButtonWrap: {
    alignItems: 'center',
    width: EMOJI_BUTTON_SIZE + 12,
  },
  emojiCircle: {
    width: EMOJI_BUTTON_SIZE,
    height: EMOJI_BUTTON_SIZE,
    borderRadius: EMOJI_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: fontSizeTokens['3xl'],
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    marginBottom: 0,
  },
  memoInput: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleText: {
    flex: 1,
    marginRight: 12,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 20,
  },
  bottomSpacer: { height: 32 },
});
