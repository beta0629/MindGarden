/**
 * /legal/refund — 청약철회·환불 공개 안내 (웹 RefundPolicyPublicPage 패리티)
 * 테넌트 refundPolicyText 우선, 없으면 플랫폼 SSOT ## refund 폴백.
 * Modal-only 공개 법적 문서 금지.
 *
 * @author MindGarden
 * @since 2026-09-11
 */
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { fontSize as fontSizeTokens } from '@/theme/typography';
import {
  LEGAL_PUBLIC_LABELS,
  PLATFORM_LEGAL_SECTIONS,
} from '@/constants/legalPublic';
import { useMerchantLegal } from '@/hooks/useMerchantLegal';
import { hasMerchantLegalGuideText } from '@/utils/merchantLegal';
import {
  extractPlatformLegalSection,
  fetchPlatformLegalCopyMarkdown,
  renderQuietLegalPlainFromMarkdown,
} from '@/utils/platformLegalCopy';

export default function RefundPolicyPublicScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { legal, centerName, loading: merchantLoading } = useMerchantLegal();

  const tenantRefundText = useMemo(() => {
    const raw = legal?.refundPolicyText ?? '';
    return hasMerchantLegalGuideText(raw) ? raw.trim() : '';
  }, [legal?.refundPolicyText]);

  const [platformPlain, setPlatformPlain] = useState('');
  const [platformLoading, setPlatformLoading] = useState(false);
  const [platformFailed, setPlatformFailed] = useState(false);

  useEffect(() => {
    if (tenantRefundText) {
      setPlatformPlain('');
      setPlatformFailed(false);
      setPlatformLoading(false);
      return;
    }

    let cancelled = false;
    setPlatformLoading(true);
    setPlatformFailed(false);

    (async () => {
      try {
        const markdown = await fetchPlatformLegalCopyMarkdown();
        if (cancelled) return;
        const section = extractPlatformLegalSection(
          markdown,
          PLATFORM_LEGAL_SECTIONS.REFUND,
        );
        const plain = renderQuietLegalPlainFromMarkdown(section);
        setPlatformPlain(plain);
        setPlatformFailed(!plain);
      } catch {
        if (!cancelled) {
          setPlatformPlain('');
          setPlatformFailed(true);
        }
      } finally {
        if (!cancelled) {
          setPlatformLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tenantRefundText]);

  const loading = merchantLoading || (!tenantRefundText && platformLoading);
  const showTenant = Boolean(tenantRefundText);
  const failed = !loading && !showTenant && (platformFailed || !platformPlain);

  const pageTitle = centerName.trim()
    ? `${centerName.trim()} — ${LEGAL_PUBLIC_LABELS.REFUND}`
    : LEGAL_PUBLIC_LABELS.REFUND;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bgMain }]} testID="refund-policy-public-page">
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.bgMain,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.headerSide}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <Text
            style={{
              color: theme.colors.primary,
              fontSize: fontSizeTokens.base,
              fontWeight: '600',
            }}
          >
            뒤로
          </Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.textMain }]} numberOfLines={1}>
          {pageTitle}
        </Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator
      >
        <Text
          style={[
            styles.h1,
            {
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
            },
          ]}
          accessibilityRole="header"
        >
          {LEGAL_PUBLIC_LABELS.REFUND}
        </Text>

        {loading ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text
              style={[styles.statusText, { color: theme.colors.textSecondary }]}
            >
              불러오는 중…
            </Text>
          </View>
        ) : failed ? (
          <Text
            testID="refund-policy-empty"
            style={[styles.statusText, { color: theme.colors.textSecondary }]}
          >
            문서를 확인할 수 없습니다.
          </Text>
        ) : showTenant ? (
          <Text
            testID="refund-policy-tenant-body"
            style={[
              styles.article,
              {
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.regular,
              },
            ]}
          >
            {tenantRefundText}
          </Text>
        ) : (
          <Text
            testID="refund-policy-platform-body"
            style={[
              styles.article,
              {
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.regular,
              },
            ]}
          >
            {platformPlain}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerSide: { minWidth: 56, justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizeTokens.base,
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 48,
  },
  h1: {
    fontSize: fontSizeTokens.xl,
    marginBottom: 16,
  },
  article: {
    fontSize: fontSizeTokens.sm,
    lineHeight: 22,
  },
  statusBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  statusText: {
    fontSize: fontSizeTokens.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
});
