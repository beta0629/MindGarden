/**
 * 일반 로그인(전화 + 비밀번호) 다중 매치 시 계정 선택 화면 — P1 silent first 차단(2026-06-11).
 *
 * <p>{@code POST /api/v1/auth/login} 응답이 {@code multipleAccounts: true} 일 때
 * `(auth)/login.tsx` 가 본 화면으로 라우팅한다. 사용자가 카드를 선택하면
 * {@code POST /api/v1/auth/select-account} 호출 후 인증 흐름을 마저 진행한다.</p>
 *
 * <p>OAuth `(auth)/oauth-account-selection.tsx` 와 카드 패턴은 동일하지만, 로그인 단계에서 BE 가
 * 이미 후보 목록을 응답에 포함시키므로 별도 preview API 가 필요하지 않다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
import { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { fontSize as fontSizeTokens } from '@/theme/typography';
import { AuthService, type PasswordLoginAccountCandidate } from '@/services/AuthService';
import { navigateAfterAuthenticated } from '@/utils/navigateAfterAuth';

function firstParam(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

function safeParseCandidates(raw: string): PasswordLoginAccountCandidate[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const result: PasswordLoginAccountCandidate[] = [];
    for (const item of parsed as unknown[]) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const obj = item as Record<string, unknown>;
      const idRaw = obj.userId;
      const userId =
        typeof idRaw === 'number'
          ? idRaw
          : typeof idRaw === 'string' && /^\d+$/.test(idRaw)
            ? Number(idRaw)
            : null;
      if (userId == null) {
        continue;
      }
      result.push({
        userId,
        role: typeof obj.role === 'string' ? obj.role : null,
        roleDisplayLabel:
          typeof obj.roleDisplayLabel === 'string' ? obj.roleDisplayLabel : null,
        dashboardGuide:
          typeof obj.dashboardGuide === 'string' ? obj.dashboardGuide : null,
        optionLabel: typeof obj.optionLabel === 'string' ? obj.optionLabel : null,
        maskedEmail: typeof obj.maskedEmail === 'string' ? obj.maskedEmail : null,
        branchName: typeof obj.branchName === 'string' ? obj.branchName : null,
      });
    }
    return result;
  } catch {
    return [];
  }
}

export default function PasswordLoginAccountSelectionScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    selectionToken?: string | string[];
    candidates?: string | string[];
  }>();

  const selectionToken = useMemo(() => firstParam(params.selectionToken), [params.selectionToken]);
  const candidates = useMemo(
    () => safeParseCandidates(firstParam(params.candidates)),
    [params.candidates],
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    candidates.length === 1 && candidates[0] ? candidates[0].userId : null,
  );

  const onConfirm = useCallback(async () => {
    if (!selectionToken || selectedUserId == null) {
      setError('연결할 계정을 선택해 주세요.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await AuthService.completePasswordLoginAccountSelection(
        selectionToken,
        selectedUserId,
      );
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
  }, [selectionToken, selectedUserId]);

  if (!selectionToken || candidates.length === 0) {
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
      <Text
        style={[styles.title, { color: theme.colors.textMain }]}
        accessibilityRole="header"
      >
        연결할 계정을 선택해주세요
      </Text>
      <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
        동일한 휴대폰 번호로 등록된 계정이 여러 개 있습니다. 로그인할 계정을 하나만 선택해 주세요.
      </Text>

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
            testID={`account-selection-candidate-${c.userId}`}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>
              {c.roleDisplayLabel ?? c.optionLabel ?? `계정 ${c.userId}`}
            </Text>
            {c.dashboardGuide ? (
              <Text style={[styles.cardLine, { color: theme.colors.textSecondary }]}>
                {c.dashboardGuide}
              </Text>
            ) : null}
            {c.maskedEmail ? (
              <Text style={[styles.cardGuide, { color: theme.colors.textTertiary }]}>
                {c.maskedEmail}
              </Text>
            ) : null}
            {c.branchName ? (
              <Text style={[styles.cardGuide, { color: theme.colors.textTertiary }]}>
                {c.branchName}
              </Text>
            ) : null}
          </Pressable>
        );
      })}

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
            opacity: candidates.length === 0 ? 0.5 : 1,
          },
        ]}
        onPress={onConfirm}
        disabled={submitting || candidates.length === 0}
        accessibilityRole="button"
        accessibilityLabel="선택한 계정으로 계속"
        testID="account-selection-confirm"
      >
        {submitting ? (
          <ActivityIndicator color={theme.colors.textOnPrimary} />
        ) : (
          <Text style={[styles.primaryBtnText, { color: theme.colors.textOnPrimary }]}>
            선택한 계정으로 계속
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
