/**
 * 특정 날짜 감정 일기 상세 화면
 *
 * - 날짜 + 이모지 + 감정 태그 + 메모 표시
 * - 수정/삭제 버튼
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Edit3, Trash2 } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTheme } from '@/theme';
import { fontSize as fontSizeTokens } from '@/theme/typography';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { Chip } from '@/components/atoms/Chip';
import { EmptyState } from '@/components/atoms/EmptyState';
import {
  useMoodJournalDetail,
  useDeleteMoodJournal,
} from '@/api/hooks/useMoodJournal';
import { MOOD_EMOJIS } from '@/constants/moodConstants';

export default function MoodJournalDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const { data: entry, isLoading } = useMoodJournalDetail(date ?? '');
  const deleteMutation = useDeleteMoodJournal();

  const hapticFeedback = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const dateLabel = date
    ? format(parseISO(date), 'yyyy년 M월 d일 (EEEE)', { locale: ko })
    : '';

  const moodDef = entry
    ? MOOD_EMOJIS.find((m) => m.value === entry.moodValue)
    : null;

  const handleEdit = () => {
    hapticFeedback();
    router.push('/(client)/(wellness)/mood-journal/create');
  };

  const handleDelete = () => {
    hapticFeedback();
    Alert.alert('삭제 확인', '이 기록을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          if (!date) return;
          try {
            await deleteMutation.mutateAsync(date);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            router.back();
          } catch {
            Alert.alert('오류', '삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top']}
      >
        <AppTopBar title="감정 일기" canGoBack />
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

  if (!entry) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top']}
      >
        <AppTopBar title="감정 일기" canGoBack />
        <EmptyState
          title="기록이 없습니다"
          description={`${dateLabel}에 작성된 감정 일기가 없어요.`}
          actionLabel="기록하기"
          onAction={handleEdit}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <AppTopBar title="감정 일기" canGoBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* 날짜 */}
        <Animated.View entering={FadeInDown.springify()}>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              textAlign: 'center',
            }}
          >
            {dateLabel}
          </Text>
        </Animated.View>

        {/* 이모지 + 라벨 */}
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          style={styles.emojiSection}
        >
          <Text style={styles.bigEmoji}>{entry.emoji}</Text>
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.xl,
              color: theme.colors.textMain,
              marginTop: 8,
            }}
          >
            {moodDef?.label ?? ''}
          </Text>
        </Animated.View>

        {/* 감정 태그 */}
        {entry.tags.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(160).springify()}
            style={[
              styles.card,
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
                fontSize: theme.fontSize.sm,
                color: theme.colors.textMain,
                marginBottom: 10,
              }}
            >
              감정 태그
            </Text>
            <View style={styles.tagRow}>
              {entry.tags.map((tag) => (
                <Chip key={tag} label={tag} selected disabled />
              ))}
            </View>
          </Animated.View>
        )}

        {/* 메모 */}
        {entry.memo ? (
          <Animated.View
            entering={FadeInDown.delay(240).springify()}
            style={[
              styles.card,
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
                fontSize: theme.fontSize.sm,
                color: theme.colors.textMain,
                marginBottom: 8,
              }}
            >
              한줄 메모
            </Text>
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                lineHeight: 22,
              }}
            >
              {entry.memo}
            </Text>
          </Animated.View>
        ) : null}

        {/* 공유 상태 */}
        {entry.sharedWithConsultant && (
          <Animated.View entering={FadeInDown.delay(320).springify()}>
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textTertiary,
                textAlign: 'center',
                marginTop: 12,
              }}
            >
              상담사에게 공유된 기록입니다
            </Text>
          </Animated.View>
        )}

        {/* 수정/삭제 버튼 */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.actionRow}
        >
          <Pressable
            onPress={handleEdit}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.primary,
                borderWidth: 1,
                borderRadius: theme.borderRadius.lg,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
            accessibilityLabel="수정"
            accessibilityRole="button"
          >
            <Edit3 size={18} color={theme.colors.primary} />
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.sm,
                color: theme.colors.primary,
                marginLeft: 6,
              }}
            >
              수정
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.error,
                borderWidth: 1,
                borderRadius: theme.borderRadius.lg,
                opacity: deleteMutation.isPending ? 0.6 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
            accessibilityLabel="삭제"
            accessibilityRole="button"
          >
            <Trash2 size={18} color={theme.colors.error} />
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.sm,
                color: theme.colors.error,
                marginLeft: 6,
              }}
            >
              삭제
            </Text>
          </Pressable>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  bigEmoji: {
    fontSize: fontSizeTokens['5xl'] + fontSizeTokens.xl,
  },
  card: {
    padding: 16,
    marginTop: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  bottomSpacer: { height: 32 },
});
