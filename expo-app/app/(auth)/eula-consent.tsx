/**
 * Apple G1.2 UGC (P2-C) — EULA 동의 화면 (신규 회원 + 기존 회원 첫 실행 + 약관 개정 재동의).
 *
 * <p>디자이너 시안 §A 화면 그대로 구현. 약관 본문을 끝까지 스크롤하고 필수 2개를 체크해야
 * CTA 가 활성화된다. 거부 시 로그아웃 모달을 노출한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';

import { EulaTermsPanel } from '@/components/organisms/EulaTermsPanel';
import { LegalConsentChecklist } from '@/components/organisms/LegalConsentChecklist';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import {
  EULA_CURRENT_VERSION,
  EULA_SCREEN_LABELS,
  EULA_TERMS_BODY,
} from '@/constants/eulaTerms';
import { submitEulaConsent } from '@/services/eulaConsentService';
import { AuthService } from '@/services/AuthService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEulaConsentStore } from '@/stores/useEulaConsentStore';
import { resolveLegalUrls } from '@/utils/legalUrls';
import { navigateAfterAuthenticated } from '@/utils/navigateAfterAuth';
import { useTheme } from '@/theme';

const HEADER_HEIGHT = 56;
const TERMS_PANEL_RATIO_MOBILE = 0.55;
const TERMS_PANEL_RATIO_TABLET = 0.5;
const TABLET_BREAKPOINT_WIDTH = 744;
const CTA_HEIGHT = 52;
const HAPTIC_LIGHT = Haptics.ImpactFeedbackStyle.Light;

function fireHaptic(): void {
  if (Platform.OS === 'web') {
    return;
  }
  Haptics.impactAsync(HAPTIC_LIGHT).catch(() => {
    /* noop */
  });
}

export default function EulaConsentScreen() {
  const theme = useTheme();
  const dimensions = useWindowDimensions();
  const screenHeight = dimensions.height || Dimensions.get('window').height;
  const isTablet = dimensions.width >= TABLET_BREAKPOINT_WIDTH;

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const setEulaRecord = useEulaConsentStore((s) => s.setRecord);

  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [readEnd, setReadEnd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [decliningLogout, setDecliningLogout] = useState(false);

  const legal = useMemo(() => resolveLegalUrls(), []);

  const termsPanelMaxHeight = useMemo(() => {
    const ratio = isTablet ? TERMS_PANEL_RATIO_TABLET : TERMS_PANEL_RATIO_MOBILE;
    return Math.max(240, Math.floor(screenHeight * ratio));
  }, [isTablet, screenHeight]);

  const canSubmit = terms && privacy && readEnd && !submitting;

  const handleOpenLegal = useCallback(
    (kind: 'terms' | 'privacy') => {
      const url = kind === 'terms' ? legal.terms : legal.privacy;
      if (!url) {
        setErrorMessage('약관 링크가 설정되어 있지 않습니다. 관리자에게 문의해 주세요.');
        return;
      }
      router.push({
        pathname: '/(auth)/legal-webview',
        params: {
          url: encodeURIComponent(url),
          title: kind === 'terms' ? '이용약관' : '개인정보 처리방침',
        },
      });
    },
    [legal],
  );

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      return;
    }
    fireHaptic();
    setSubmitting(true);
    setErrorMessage('');
    try {
      const response = await submitEulaConsent({
        termsConsent: true,
        privacyConsent: true,
        marketingConsent: marketing,
        termsVersion: EULA_CURRENT_VERSION,
      });
      if (userId != null) {
        setEulaRecord(userId, {
          acceptedVersion: response.acceptedVersion ?? EULA_CURRENT_VERSION,
          acceptedAt: response.acceptedAt ?? new Date().toISOString(),
        });
      }
      // EULA 동의 직후에는 게이트 재호출 무한 루프를 막기 위해 skipEulaGate=true
      await navigateAfterAuthenticated({ skipEulaGate: true });
    } catch (err) {
      const message = (err as { message?: string })?.message ?? '동의 처리에 실패했습니다.';
      setErrorMessage(message);
      setSubmitting(false);
    }
  }, [canSubmit, marketing, setEulaRecord, userId]);

  const handleConfirmDecline = useCallback(async () => {
    setDecliningLogout(true);
    try {
      await AuthService.logout();
    } catch {
      try {
        await useAuthStore.getState().logout();
      } catch {
        /* swallow — 어떤 경우에도 로그인 화면으로 복귀 */
      }
    } finally {
      setDecliningLogout(false);
      setDeclineModalOpen(false);
      router.replace('/(auth)/login' as Href);
    }
  }, []);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top', 'bottom']}
    >
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.colors.divider },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="동의하지 않고 종료"
          hitSlop={8}
          onPress={() => setDeclineModalOpen(true)}
          disabled={submitting}
          testID="eula-consent-close"
        >
          <X size={24} color={theme.colors.textMain} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          isTablet ? styles.tabletColumn : null,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          accessibilityRole="header"
          style={[
            styles.title,
            { color: theme.colors.textMain },
            theme.textStyles.h1,
          ]}
        >
          {EULA_SCREEN_LABELS.title}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme.colors.textSecondary },
            theme.textStyles.bodySmall,
          ]}
        >
          {EULA_SCREEN_LABELS.subtitle}
        </Text>

        <View style={styles.panelWrap}>
          <EulaTermsPanel
            body={EULA_TERMS_BODY}
            onReachEnd={() => setReadEnd(true)}
            maxHeight={termsPanelMaxHeight}
            testID="eula-terms-panel"
          />
        </View>

        {!readEnd ? (
          <Text
            style={[
              styles.scrollHint,
              { color: theme.colors.textTertiary },
              theme.textStyles.caption,
            ]}
            testID="eula-scroll-hint"
          >
            {EULA_SCREEN_LABELS.scrollHint}
          </Text>
        ) : null}

        <View style={styles.checklistWrap}>
          <LegalConsentChecklist
            termsChecked={terms}
            privacyChecked={privacy}
            marketingChecked={marketing}
            onToggleTerms={() => setTerms((v) => !v)}
            onTogglePrivacy={() => setPrivacy((v) => !v)}
            onToggleMarketing={() => setMarketing((v) => !v)}
            onOpenTerms={() => handleOpenLegal('terms')}
            onOpenPrivacy={() => handleOpenLegal('privacy')}
            disabled={submitting}
          />
        </View>

        {errorMessage.length > 0 ? (
          <Text
            accessibilityRole="alert"
            style={[
              styles.error,
              { color: theme.colors.error },
              theme.textStyles.caption,
            ]}
          >
            {errorMessage}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={EULA_SCREEN_LABELS.cta}
          accessibilityState={{ disabled: !canSubmit }}
          accessibilityHint={
            canSubmit
              ? undefined
              : '약관을 끝까지 읽고 필수 항목에 동의해야 활성화됩니다.'
          }
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[
            styles.cta,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius.lg,
              opacity: canSubmit ? 1 : 0.4,
            },
          ]}
          testID="eula-consent-submit"
        >
          {submitting ? (
            <ActivityIndicator color={theme.colors.textOnPrimary} />
          ) : (
            <Text
              style={[
                {
                  color: theme.colors.textOnPrimary,
                  fontFamily: theme.fontFamily.semibold,
                },
                theme.textStyles.button,
              ]}
            >
              {EULA_SCREEN_LABELS.cta}
            </Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={EULA_SCREEN_LABELS.decline}
          onPress={() => setDeclineModalOpen(true)}
          disabled={submitting}
          hitSlop={8}
          style={styles.declineRow}
          testID="eula-consent-decline"
        >
          <Text
            style={[
              {
                color: theme.colors.error,
                fontFamily: theme.fontFamily.medium,
              },
              theme.textStyles.label,
            ]}
          >
            {EULA_SCREEN_LABELS.decline}
          </Text>
        </Pressable>
      </ScrollView>

      <UnifiedModal
        isOpen={declineModalOpen}
        onClose={() => {
          if (decliningLogout) {
            return;
          }
          setDeclineModalOpen(false);
        }}
        title={EULA_SCREEN_LABELS.declineModalTitle}
        subtitle={EULA_SCREEN_LABELS.declineModalBody}
        backdropClick={!decliningLogout}
        showCloseButton={false}
        actions={[
          {
            label: EULA_SCREEN_LABELS.declineModalCancel,
            onPress: () => setDeclineModalOpen(false),
            variant: 'secondary',
            disabled: decliningLogout,
          },
          {
            label: decliningLogout
              ? '로그아웃 중...'
              : EULA_SCREEN_LABELS.declineModalConfirm,
            onPress: handleConfirmDecline,
            variant: 'danger',
            disabled: decliningLogout,
          },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  tabletColumn: {
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    marginTop: 20,
  },
  subtitle: {
    marginTop: 4,
  },
  panelWrap: {
    marginTop: 16,
  },
  scrollHint: {
    marginTop: 6,
    textAlign: 'center',
  },
  checklistWrap: {
    marginTop: 16,
  },
  error: {
    marginTop: 12,
  },
  cta: {
    marginTop: 20,
    marginBottom: 12,
    height: CTA_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineRow: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
