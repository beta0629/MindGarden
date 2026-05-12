/**
 * 커뮤니티 글쓰기 (내담자) — 제목·본문·익명 토글·게시
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
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';

import { useTheme } from '@/theme';
import { useCommunityStore } from '@/stores/useCommunityStore';

const ANONYMOUS_NICKNAMES = [
  '익명의 구름', '익명의 바람', '익명의 별', '익명의 달',
  '익명의 숲', '익명의 파도', '익명의 하늘', '익명의 꽃',
];

export default function ClientCommunityCreate() {
  const theme = useTheme();
  const router = useRouter();
  const { addPost } = useCommunityStore();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const randomIdx = Math.floor(Math.random() * ANONYMOUS_NICKNAMES.length);
    const nickname = isAnonymous
      ? (ANONYMOUS_NICKNAMES[randomIdx] ?? '익명')
      : '나';

    addPost({
      tab: 'reviews',
      author: nickname,
      specialty: '',
      title: title.trim(),
      body: body.trim(),
      isConsultant: false,
      isAnonymous,
    });

    Alert.alert(
      '게시 완료',
      '글이 등록되었습니다. 검수 후 게시됩니다.',
      [{ text: '확인', onPress: () => router.back() }],
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={16}
          style={styles.backBtn}
          accessibilityLabel="뒤로가기"
          accessibilityRole="button"
        >
          <ArrowLeft size={24} color={theme.colors.textMain} />
        </Pressable>
        <Text
          style={{
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.lg,
            color: theme.colors.textMain,
            flex: 1,
            textAlign: 'center',
          }}
        >
          후기 작성
        </Text>
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[
            styles.submitBtn,
            {
              backgroundColor: canSubmit
                ? theme.colors.primary
                : theme.colors.border,
              borderRadius: theme.borderRadius.lg,
            },
          ]}
          accessibilityLabel="게시"
          accessibilityRole="button"
        >
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textOnPrimary,
            }}
          >
            게시
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.springify()}>
            {/* 제목 */}
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="제목을 입력하세요"
              placeholderTextColor={theme.colors.textTertiary}
              style={[
                styles.titleInput,
                {
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.xl,
                  borderBottomColor: theme.colors.divider,
                },
              ]}
              maxLength={100}
              accessibilityLabel="제목"
            />

            {/* 본문 */}
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="상담 경험이나 후기를 나눠주세요..."
              placeholderTextColor={theme.colors.textTertiary}
              style={[
                styles.bodyInput,
                {
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.base,
                },
              ]}
              multiline
              textAlignVertical="top"
              maxLength={2000}
              accessibilityLabel="본문"
            />

            {/* 익명 토글 */}
            <View
              style={[
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
                    fontSize: theme.fontSize.base,
                    color: theme.colors.textMain,
                  }}
                >
                  익명으로 게시
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  닉네임이 자동으로 생성됩니다
                </Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary + '60',
                }}
                thumbColor={isAnonymous ? theme.colors.primary : theme.colors.gray[400]}
                accessibilityLabel="익명 토글"
              />
            </View>

            {/* 안내 */}
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
                color: theme.colors.textTertiary,
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              게시글은 관리자 검수 후 공개됩니다
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  titleInput: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bodyInput: {
    minHeight: 200,
    paddingVertical: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: 16,
  },
  toggleText: { flex: 1, marginRight: 12 },
});
