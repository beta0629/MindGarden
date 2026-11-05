/**
 * PortOne V2 browser SDK WebView — prepare 응답 필드로만 requestPayment.
 *
 * @author MindGarden
 * @since 2026-05-20
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/theme';
import {
  buildPortOnePaymentWebViewHtml,
  type PortOnePaymentRequestParams,
  type PortOnePaymentSdkResult,
} from '@/utils/portonePayment';

export type PortOnePaymentWebViewProps = {
  visible: boolean;
  request: PortOnePaymentRequestParams | null;
  onResult: (result: PortOnePaymentSdkResult | undefined) => void;
  onDismiss: () => void;
};

const isPaymentReturnUrl = (url: string): boolean => {
  if (!url) {
    return false;
  }
  const lower = url.toLowerCase();
  return (
    lower.startsWith('mindgarden://') ||
    lower.includes('payment-return') ||
    lower.startsWith('exp://')
  );
};

const parseReturnUrl = (url: string): PortOnePaymentSdkResult => {
  try {
    const qIndex = url.indexOf('?');
    const query = qIndex >= 0 ? url.slice(qIndex + 1) : '';
    const params = new URLSearchParams(query);
    const result: PortOnePaymentSdkResult = {};
    const paymentId = params.get('paymentId');
    const code = params.get('code');
    const message = params.get('message');
    const pgCode = params.get('pgCode');
    const pgMessage = params.get('pgMessage');
    if (paymentId) result.paymentId = paymentId;
    if (code) result.code = code;
    if (message) result.message = message;
    if (pgCode) result.pgCode = pgCode;
    if (pgMessage) result.pgMessage = pgMessage;
    return result;
  } catch {
    return { code: 'RETURN_PARSE_ERROR', message: '결제 복귀 URL을 해석하지 못했습니다.' };
  }
};

/**
 * PortOne 결제 WebView 모달.
 */
export function PortOnePaymentWebView({
  visible,
  request,
  onResult,
  onDismiss,
}: PortOnePaymentWebViewProps) {
  const theme = useTheme();
  const settledRef = useRef(false);

  const html = useMemo(
    () => (request ? buildPortOnePaymentWebViewHtml(request) : ''),
    [request],
  );

  useEffect(() => {
    if (visible && request) {
      settledRef.current = false;
    }
  }, [visible, request]);

  const settle = useCallback(
    (result: PortOnePaymentSdkResult | undefined) => {
      if (settledRef.current) {
        return;
      }
      settledRef.current = true;
      onResult(result);
    },
    [onResult],
  );

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as {
          type?: string;
          payload?: PortOnePaymentSdkResult;
        };
        if (data?.type === 'PORTONE_RESULT') {
          settle(data.payload || {});
          return;
        }
        if (data?.type === 'PORTONE_ERROR') {
          settle({
            code: 'SDK_ERROR',
            message: data.payload?.message || '결제 모듈 오류',
          });
        }
      } catch {
        // ignore non-JSON
      }
    },
    [settle],
  );

  const handleShouldStart = useCallback(
    (nav: { url?: string }): boolean => {
      const url = nav.url || '';
      if (isPaymentReturnUrl(url)) {
        settle(parseReturnUrl(url));
        return false;
      }
      return true;
    },
    [settle],
  );

  if (!visible || !request) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top', 'bottom']}
      >
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
            }}
          >
            결제
          </Text>
          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="결제 닫기"
            hitSlop={8}
          >
            <Text
              style={{
                color: theme.colors.primary,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.sm,
              }}
            >
              닫기
            </Text>
          </Pressable>
        </View>
        {html ? (
          <WebView
            originWhitelist={['*']}
            source={{ html, baseUrl: 'https://cdn.portone.io' }}
            onMessage={handleMessage}
            onShouldStartLoadWithRequest={handleShouldStart}
            onNavigationStateChange={(nav) => {
              if (isPaymentReturnUrl(nav.url)) {
                settle(parseReturnUrl(nav.url));
              }
            }}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            )}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            style={styles.webview}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  webview: { flex: 1 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
