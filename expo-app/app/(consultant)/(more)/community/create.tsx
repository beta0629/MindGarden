/**
 * 커뮤니티 글쓰기 (상담사) — 칼럼·전문지식 작성
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';

import { useTheme } from '@/theme';
import { COMMUNITY_QUERY_KEYS } from '@/api/hooks/useCommunity';
import { useCommunityStore } from '@/stores/useCommunityStore';
import { createRemoteCommunityPost } from '@/services/communityApi';
import { COMMUNITY_DEMO_LABELS } from '@/constants/communityData';

export default function ConsultantCommunityCreate() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addPost, prependRemotePost } = useCommunityStore();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      const remote = await createRemoteCommunityPost({
        postKind: 'CONSULTANT_COLUMN',
        title: title.trim(),
        body: body.trim(),
        specialty: COMMUNITY_DEMO_LABELS.newConsultantSpecialty,
        anonymous: false,
      });
      if (remote) {
        prependRemotePost(remote);
        await queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.all });
        Alert.alert('접수되었습니다', '관리자 검수 후 피드에 공개됩니다.', [
          { text: '확인', onPress: () => router.back() },
        ]);
        return;
      }
    } catch {
      /* §11.1 폴백 */
    }

    addPost({
      tab: 'columns',
      author: COMMUNITY_DEMO_LABELS.newConsultantAuthor,
      specialty: COMMUNITY_DEMO_LABELS.newConsultantSpecialty,
      title: title.trim(),
      body: body.trim(),
      isConsultant: true,
      isAnonymous: false,
    });

    Alert.alert(
      '기기에 저장됨',
      '칼럼이 이 기기(MMKV)에만 등록되었습니다. /api/v1/community 연동 후 프로필명·검수 흐름이 적용됩니다.',
      [{ text: '확인', onPress: () => router.back() }],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
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
          칼럼 작성
        </Text>
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[
            styles.submitBtn,
            {
              backgroundColor: canSubmit ? theme.colors.primary : theme.colors.border,
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

            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="전문 지식이나 칼럼을 작성해주세요..."
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
              maxLength={5000}
              accessibilityLabel="본문"
            />

            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderRadius: theme.borderRadius.lg,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textSecondary,
                }}
              >
                상담사 칼럼은 서버 연동 시 프로필에 등록된 표시명으로 게시됩니다.
              </Text>
              <Text
                style={{
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textTertiary,
                  marginTop: 4,
                }}
              >
                전문적인 내용을 공유하여 내담자들에게 도움을 줄 수 있습니다.
              </Text>
            </View>
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
    minHeight: 240,
    paddingVertical: 14,
  },
  infoBox: {
    padding: 16,
    marginTop: 16,
  },
});
