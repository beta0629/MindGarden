/**
 * Apple G1.2 UGC (P2-C) — 법적 동의 체크리스트 (필수 2개 + 선택 1개).
 *
 * <p>디자이너 시안 §A.4.5 LegalConsentChecklist organism. EULA 동의 화면 + 소셜 가입 화면이
 * 공유하는 동의 행 컬렉션. 카드형 컨테이너 + 분리선 + ConsentCheckRow 3개.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
import { StyleSheet, View } from 'react-native';
import { ConsentCheckRow } from '@/components/molecules/ConsentCheckRow';
import { EULA_SCREEN_LABELS } from '@/constants/eulaTerms';
import { useTheme } from '@/theme';

export type LegalConsentChecklistProps = {
  readonly termsChecked: boolean;
  readonly privacyChecked: boolean;
  readonly marketingChecked: boolean;
  readonly onToggleTerms: () => void;
  readonly onTogglePrivacy: () => void;
  readonly onToggleMarketing: () => void;
  readonly onOpenTerms?: () => void;
  readonly onOpenPrivacy?: () => void;
  readonly disabled?: boolean;
};

export function LegalConsentChecklist({
  termsChecked,
  privacyChecked,
  marketingChecked,
  onToggleTerms,
  onTogglePrivacy,
  onToggleMarketing,
  onOpenTerms,
  onOpenPrivacy,
  disabled = false,
}: LegalConsentChecklistProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.gray[200],
          borderRadius: theme.borderRadius.lg,
        },
      ]}
    >
      <ConsentCheckRow
        required
        label={EULA_SCREEN_LABELS.termsConsent}
        checked={termsChecked}
        onToggle={onToggleTerms}
        onViewPress={onOpenTerms}
        viewLinkLabel={EULA_SCREEN_LABELS.viewLink}
        disabled={disabled}
        testID="legal-consent-terms"
      />

      <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

      <ConsentCheckRow
        required
        label={EULA_SCREEN_LABELS.privacyConsent}
        checked={privacyChecked}
        onToggle={onTogglePrivacy}
        onViewPress={onOpenPrivacy}
        viewLinkLabel={EULA_SCREEN_LABELS.viewLink}
        disabled={disabled}
        testID="legal-consent-privacy"
      />

      <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

      <ConsentCheckRow
        required={false}
        label={EULA_SCREEN_LABELS.marketingConsent}
        checked={marketingChecked}
        onToggle={onToggleMarketing}
        disabled={disabled}
        testID="legal-consent-marketing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },
});

export default LegalConsentChecklist;
