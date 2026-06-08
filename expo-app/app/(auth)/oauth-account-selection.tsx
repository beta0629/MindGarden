/**
 * 동일 전화번호로 복수 계정이 있을 때 — 미리보기 + 선택 완료 (`OAuth2Controller` v1)
 *
 * @author MindGarden
 * @since 2026-05-14
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { fontSize as fontSizeTokens } from '@/theme/typography';
import { AuthService } from '@/services/AuthService';
import { navigateAfterAuthenticated } from '@/utils/navigateAfterAuth';

function firstParam(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

interface CandidateRow {
  userId: number;
  optionLabel: string;
  roleDisplayLabel: string;
  dashboardGuide: string;
}

export default function OauthAccountSelectionScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    selectionToken?: string | string[];
    provider?: string | string[];
  }>();

  const selectionToken = useMemo(() => firstParam(params.selectionToken), [params.selectionToken]);
  const providerLabel = useMemo(() => {
    const p = firstParam(params.provider).toUpperCase();
    if (p === 'NAVER') return '네이버';
    if (p === 'APPLE') return 'Apple';
    return '카카오';
  }, [params.provider]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const loadPreview = useCallback(async () => {
    if (!selectionToken) {
      setError('선택 토큰이 없습니다. 로그인 화면으로 돌아가 주세요.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await AuthService.fetchOAuthAccountSelectionPreview(selectionToken);
    setLoading(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setCandidates(
      res.data.candidates.map((c) => ({
        userId: c.userId,
        optionLabel: c.optionLabel,
        roleDisplayLabel: c.roleDisplayLabel,
        dashboardGuide: c.dashboardGuide,
      })),
    );
    if (res.data.candidates.length === 1) {
      const only = res.data.candidates[0];
      if (only) {
        setSelectedUserId(only.userId);
      }
    }
  }, [selectionToken]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  const onConfirm = async () => {
    if (!selectionToken || selectedUserId == null) {
      setError('연결할 계정을 선택해 주세요.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await AuthService.completeOAuthAccountSelection(selectionToken, selectedUserId);
      if (!res.ok) {
        setError(res.message);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await navigateAfterAuthenticated();
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectionToken) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.bgMain }]}>
        <Text style={{ color: theme.colors.error }}>유효하지 않은 진입입니다.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.replace('/(auth)/login' as Href)}>
          <Text style={{ color: theme.colors.primary }}>로그인으로</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.colors.bgMain }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: theme.colors.textMain }]}>계정 선택</Text>
      <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
        동일한 연락처로 여러 역할의 계정이 있습니다. {providerLabel}로 연결할 계정을 하나만 선택해
        주세요.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <>
          {candidates.map((c) => {
            const selected = selectedUserId === c.userId;
            return (
              <Pressable
                key={c.userId}
                onPress={() => setSelectedUserId(c.userId)}
                style={[
                  styles.card,
                  {
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    backgroundColor: selected ? theme.colors.primaryLight + '22' : 'transparent',
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>
                  {c.roleDisplayLabel}
                </Text>
                <Text style={[styles.cardLine, { color: theme.colors.textSecondary }]}>
                  {c.optionLabel}
                </Text>
                <Text style={[styles.cardGuide, { color: theme.colors.textTertiary }]}>
                  {c.dashboardGuide}
                </Text>
              </Pressable>
            );
          })}
        </>
      )}

      {Boolean(error) && (
        <Text style={[styles.error, { color: theme.colors.error }]} accessibilityRole="alert">
          {error}
        </Text>
      )}

      <Pressable
        style={[
          styles.primaryBtn,
          {
            backgroundColor: theme.colors.primary,
            opacity: loading || candidates.length === 0 ? 0.5 : 1,
          },
        ]}
        onPress={onConfirm}
        disabled={loading || submitting || candidates.length === 0}
        accessibilityRole="button"
        accessibilityLabel="선택한 계정으로 계속"
      >
        {submitting ? (
          <ActivityIndicator color={theme.colors.textOnPrimary} />
        ) : (
          <Text style={[styles.primaryBtnText, { color: theme.colors.textOnPrimary }]}>
            선택 완료
          </Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
        <Text style={{ color: theme.colors.textTertiary }}>취소</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: fontSizeTokens['2xl'], fontWeight: '700', marginBottom: 8 },
  sub: { fontSize: fontSizeTokens.sm, lineHeight: 20, marginBottom: 16 },
  card: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: fontSizeTokens.base, fontWeight: '600', marginBottom: 4 },
  cardLine: { fontSize: fontSizeTokens.sm, marginBottom: 4 },
  cardGuide: { fontSize: fontSizeTokens.xs, lineHeight: 18 },
  error: { marginTop: 12, marginBottom: 8, fontSize: fontSizeTokens.sm },
  primaryBtn: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: fontSizeTokens.base, fontWeight: '600' },
  backBtn: { alignItems: 'center', marginTop: 16, padding: 12 },
});
