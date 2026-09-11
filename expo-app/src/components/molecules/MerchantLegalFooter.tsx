/**
 * Clinic-OS 테넌트 사업자·약관 푸터 (웹 MerchantLegalFooterPreview 패리티)
 * 안내 컬럼: /legal/terms · privacy · products · refund (Modal-only 공개 법적 문서 금지)
 *
 * @author MindGarden
 * @since 2026-09-09
 */
import { useCallback, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { useTenantStore } from '@/stores/useTenantStore';
import type { MerchantLegalFields } from '@/utils/merchantLegal';
import { buildPublicLegalWebUrl } from '@/utils/buildPublicLegalWebUrl';
import { LEGAL_PUBLIC_PATHS } from '@/constants/legalPublic';
import {
  buildMerchantLegalPublicFooterLinks,
  type MerchantLegalPublicLinkItem,
} from '@/components/molecules/merchantLegalFooterHelpers';

const I18N_KEYS = Object.freeze({
  SECTION_GUIDES: 'auth.merchantLegal.section.guides',
  PLACEHOLDER_BIZ: 'auth.merchantLegal.placeholders.biz',
  PLACEHOLDER_REP: 'auth.merchantLegal.placeholders.rep',
  PLACEHOLDER_PHONE: 'auth.merchantLegal.placeholders.phone',
  PLACEHOLDER_ADDRESS: 'auth.merchantLegal.placeholders.address',
  PLACEHOLDER_MAIL_ORDER: 'auth.merchantLegal.placeholders.mailOrder',
  FALLBACK_CENTER: 'auth.merchantLegal.fallbackCenterName',
} as const);

const MAX_FONT_SIZE_MULTIPLIER = 1.6;

export type MerchantLegalFooterProps = {
  readonly centerName?: string;
  readonly legal?: MerchantLegalFields;
  readonly compact?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

/**
 * 테넌트 사업자 정보 + 공개 /legal/* 링크 푸터.
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
  const router = useRouter();
  const tenantCode = useTenantStore((s) => s.tenantCode);

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

  const links = useMemo(() => buildMerchantLegalPublicFooterLinks(), []);

  const openPublicLink = useCallback(
    (item: MerchantLegalPublicLinkItem) => {
      if (item.openNativeRefund || item.path === LEGAL_PUBLIC_PATHS.REFUND) {
        router.push(LEGAL_PUBLIC_PATHS.REFUND);
        return;
      }
      const url = buildPublicLegalWebUrl(item.path, tenantCode);
      router.push({
        pathname: '/(auth)/legal-webview',
        params: {
          url: encodeURIComponent(url),
          title: item.label,
        },
      });
    },
    [router, tenantCode],
  );

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
        {links.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => openPublicLink(item)}
            accessibilityRole="link"
            accessibilityLabel={item.label}
            hitSlop={8}
            testID={item.testID}
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
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
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
});
