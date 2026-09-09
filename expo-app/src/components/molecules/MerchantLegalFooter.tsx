/**
 * Clinic-OS 테넌트 사업자·약관 푸터 (웹 MerchantLegalFooterPreview 패리티)
 * 안내(환불·상품)는 등록 문구만 UnifiedModal 로 표시. /terms 링크 금지.
 *
 * @author MindGarden
 * @since 2026-09-09
 */
import { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import { useTheme } from '@/theme';
import type { MerchantLegalFields } from '@/utils/merchantLegal';
import {
  buildMerchantLegalFooterGuides,
  CLOSED_GUIDE_MODAL,
  openMerchantLegalGuideModal,
  type MerchantLegalGuideModalState,
} from '@/components/molecules/merchantLegalFooterHelpers';

const I18N_KEYS = Object.freeze({
  REFUND: 'auth.merchantLegal.guides.refund',
  PRICE: 'auth.merchantLegal.guides.price',
  SECTION_GUIDES: 'auth.merchantLegal.section.guides',
  PLACEHOLDER_BIZ: 'auth.merchantLegal.placeholders.biz',
  PLACEHOLDER_REP: 'auth.merchantLegal.placeholders.rep',
  PLACEHOLDER_PHONE: 'auth.merchantLegal.placeholders.phone',
  PLACEHOLDER_ADDRESS: 'auth.merchantLegal.placeholders.address',
  PLACEHOLDER_MAIL_ORDER: 'auth.merchantLegal.placeholders.mailOrder',
  FALLBACK_CENTER: 'auth.merchantLegal.fallbackCenterName',
} as const);

const MAX_FONT_SIZE_MULTIPLIER = 1.6;
const MODAL_BODY_MAX_HEIGHT = 320;

const MODAL_BODY_WEB_PRE_WRAP =
  Platform.OS === 'web'
    ? ({ whiteSpace: 'pre-wrap' } as Record<string, string>)
    : null;

export type MerchantLegalFooterProps = {
  readonly centerName?: string;
  readonly legal?: MerchantLegalFields;
  readonly compact?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

/**
 * 테넌트 사업자 정보 + 등록 안내 버튼 푸터.
 *
 * @param props centerName · legal · compact
 */
export function MerchantLegalFooter({
  centerName = '',
  legal,
  compact = true,
  style,
  testID = 'merchant-legal-footer',
}: MerchantLegalFooterProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const labels = useMemo(
    () => ({
      refund: t(I18N_KEYS.REFUND),
      price: t(I18N_KEYS.PRICE),
    }),
    [t],
  );

  const safeLegal = legal;
  const name =
    (centerName && String(centerName).trim()) || t(I18N_KEYS.FALLBACK_CENTER);
  const biz =
    safeLegal?.businessRegistrationNumber?.trim() || t(I18N_KEYS.PLACEHOLDER_BIZ);
  const rep = safeLegal?.representativeName?.trim() || t(I18N_KEYS.PLACEHOLDER_REP);
  const phone = safeLegal?.businessLandline?.trim() || t(I18N_KEYS.PLACEHOLDER_PHONE);
  const address =
    safeLegal?.businessAddress?.trim() || t(I18N_KEYS.PLACEHOLDER_ADDRESS);
  const mailOrder =
    safeLegal?.mailOrderReportNumber?.trim() || t(I18N_KEYS.PLACEHOLDER_MAIL_ORDER);

  const guides = useMemo(
    () =>
      buildMerchantLegalFooterGuides(
        safeLegal ?? {
          businessRegistrationNumber: '',
          representativeName: '',
          businessLandline: '',
          businessAddress: '',
          mailOrderReportNumber: '',
          refundPolicyText: '',
          productPriceGuideText: '',
        },
        labels,
      ),
    [safeLegal, labels],
  );

  const [guideModal, setGuideModal] =
    useState<MerchantLegalGuideModalState>(CLOSED_GUIDE_MODAL);

  const openGuide = useCallback((title: string, body: string) => {
    setGuideModal(openMerchantLegalGuideModal(title, body));
  }, []);

  const closeGuide = useCallback(() => {
    setGuideModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <View
      style={[
        styles.root,
        compact ? styles.rootCompact : null,
        {
          borderColor: theme.colors.divider,
          paddingTop: theme.spacing.md,
        },
        style,
      ]}
      accessibilityRole="summary"
      testID={testID}
    >
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[
          styles.title,
          {
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.sm,
            marginBottom: theme.spacing.xs,
          },
        ]}
        accessibilityRole="header"
      >
        {name}
      </Text>
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[
          styles.line,
          {
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
          },
        ]}
      >
        {biz}
        {' · '}
        {rep}
        {' · '}
        {phone}
      </Text>
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[
          styles.line,
          {
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
          },
        ]}
      >
        {address}
      </Text>
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={[
          styles.line,
          {
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
            marginBottom: theme.spacing.sm,
          },
        ]}
      >
        {mailOrder}
      </Text>

      {guides.length > 0 ? (
        <View style={styles.guidesBlock}>
          <Text
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            style={[
              styles.guidesTitle,
              {
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.xs,
                marginBottom: theme.spacing.xs,
              },
            ]}
          >
            {t(I18N_KEYS.SECTION_GUIDES)}
          </Text>
          {guides.map((guide) => (
            <Pressable
              key={guide.kind}
              onPress={() => openGuide(guide.label, guide.body)}
              accessibilityRole="button"
              accessibilityLabel={guide.label}
              hitSlop={8}
              testID={guide.testID}
              style={styles.guideBtn}
            >
              <Text
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                style={{
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize.xs,
                  flexShrink: 0,
                }}
                numberOfLines={1}
                ellipsizeMode="clip"
              >
                {guide.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {guideModal.isOpen ? (
        <UnifiedModal
          isOpen
          onClose={closeGuide}
          title={guideModal.title}
          actions={[
            {
              label: t('common.actions.ok'),
              onPress: closeGuide,
              variant: 'primary',
            },
          ]}
        >
          <ScrollView
            style={{ maxHeight: MODAL_BODY_MAX_HEIGHT }}
            showsVerticalScrollIndicator
          >
            <Text
              maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
              testID="merchant-legal-guide-modal-body"
              style={[
                styles.modalBody,
                {
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  lineHeight: 22,
                },
                MODAL_BODY_WEB_PRE_WRAP,
              ]}
            >
              {guideModal.body}
            </Text>
          </ScrollView>
        </UnifiedModal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rootCompact: {
    opacity: 0.92,
  },
  title: {},
  line: {
    lineHeight: 16,
    marginBottom: 2,
  },
  guidesBlock: {
    marginTop: 4,
  },
  guidesTitle: {},
  guideBtn: {
    paddingVertical: 4,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexWrap: 'nowrap',
  },
  modalBody: {},
});
