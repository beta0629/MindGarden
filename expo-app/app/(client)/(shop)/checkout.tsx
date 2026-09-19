/**
 * ShopCheckout — 체크아웃·포인트 사용·결제
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { PointInput } from '@/components/shop/molecules/PointInput';
import { CheckoutSummary } from '@/components/shop/organisms/CheckoutSummary';
import { PriceText } from '@/components/shop/atoms/PriceText';
import { useClientShopCart } from '@/api/hooks/useClientShopCart';
import { useClientShopCatalog } from '@/api/hooks/useClientShopCatalog';
import { useClientShopConsultantMappings } from '@/api/hooks/useClientShopConsultantMappings';
import {
  useClientShopCheckout,
  useClientShopPointBalance,
} from '@/api/hooks/useClientShopCheckout';
import { formatShopMoney, formatShopPoints } from '@/utils/clientShopFormat';
import {
  SHOP_CHECKOUT_AGREEMENT_LABEL,
  SHOP_CHECKOUT_MAPPING_COPY,
} from '@/constants/clientShopConstants';
import {
  buildConsultantPickerOptions,
  cartHasConsultationSku,
  collectCartConsultationTitles,
  distinctConsultantKey,
  findUniquePreselectedMapping,
  resolveBestMappingRowForConsultant,
  resolveInitialMappingId,
  resolveMappingIdForCheckout,
  shouldShowConsultantMappingPicker,
  validateCheckoutMapping,
} from '@/utils/clientShopCheckout';
import { toDisplayString } from '@/utils/toDisplayString';

export default function ShopCheckoutScreen() {
  const theme = useTheme();
  const [pointsInput, setPointsInput] = useState('0');
  const [agreed, setAgreed] = useState(false);
  const [selectedMappingId, setSelectedMappingId] = useState('');
  const [message, setMessage] = useState('');

  const cartQuery = useClientShopCart();
  const catalogQuery = useClientShopCatalog();
  const balanceQuery = useClientShopPointBalance();
  const { checkout, isCheckingOut } = useClientShopCheckout();

  const cart = cartQuery.data ?? { lines: [], subtotalMinor: 0 };
  const catalog = catalogQuery.data ?? [];
  const balance = balanceQuery.data ?? { availableMinor: 0, heldMinor: 0 };

  const hasConsultationInCart = useMemo(
    () => cartHasConsultationSku(cart.lines, catalog),
    [cart.lines, catalog],
  );

  const cartConsultationTitles = useMemo(
    () => collectCartConsultationTitles(cart.lines, catalog),
    [cart.lines, catalog],
  );

  const mappingsQuery = useClientShopConsultantMappings(hasConsultationInCart);
  const consultantMappings = mappingsQuery.data ?? [];

  const subtotalMinor = cart.subtotalMinor || 0;
  const availableMinor = balance.availableMinor || 0;

  const pointsRedeemMinor = useMemo(() => {
    const parsed = Math.max(0, parseInt(pointsInput, 10) || 0);
    return Math.min(parsed, availableMinor, subtotalMinor);
  }, [pointsInput, availableMinor, subtotalMinor]);

  const cashDueMinor = Math.max(0, subtotalMinor - pointsRedeemMinor);

  const pointsError = useMemo(() => {
    const parsed = parseInt(pointsInput, 10) || 0;
    if (parsed < 0) return '0 이상 입력해 주세요.';
    if (parsed > availableMinor) return '보유 포인트를 초과할 수 없습니다.';
    if (parsed > subtotalMinor) return '상품 금액을 초과할 수 없습니다.';
    return '';
  }, [pointsInput, availableMinor, subtotalMinor]);

  const mappingError = useMemo(
    () =>
      validateCheckoutMapping(
        hasConsultationInCart,
        consultantMappings,
        selectedMappingId,
      ),
    [hasConsultationInCart, consultantMappings, selectedMappingId],
  );

  const showMappingPicker = shouldShowConsultantMappingPicker(consultantMappings);

  const consultantPickerOptions = useMemo(
    () => buildConsultantPickerOptions(consultantMappings, cartConsultationTitles),
    [consultantMappings, cartConsultationTitles],
  );

  const assignedMappingLabel = useMemo(() => {
    if (consultantMappings.length === 0) {
      return '';
    }
    const key = distinctConsultantKey(consultantMappings[0]);
    const bucket = consultantMappings.filter((row) => distinctConsultantKey(row) === key);
    const row =
      resolveBestMappingRowForConsultant(bucket, cartConsultationTitles)
      ?? findUniquePreselectedMapping(consultantMappings)
      ?? consultantMappings[0];
    const name = row?.consultantDisplayName ?? '';
    return `${SHOP_CHECKOUT_MAPPING_COPY.AUTO_PREFIX}: ${name}`;
  }, [consultantMappings, cartConsultationTitles]);

  useEffect(() => {
    if (!hasConsultationInCart) {
      setSelectedMappingId('');
      return;
    }
    const initial = resolveInitialMappingId(consultantMappings, cartConsultationTitles);
    if (initial) {
      setSelectedMappingId(initial);
      return;
    }
    if (consultantMappings.length === 0) {
      setSelectedMappingId('');
    }
  }, [hasConsultationInCart, consultantMappings, cartConsultationTitles]);

  const checkoutBlocked =
    Boolean(pointsError) ||
    Boolean(mappingError) ||
    (hasConsultationInCart && consultantMappings.length === 0);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      cartQuery.refetch(),
      balanceQuery.refetch(),
      catalogQuery.refetch(),
      hasConsultationInCart ? mappingsQuery.refetch() : Promise.resolve(),
    ]);
  }, [cartQuery, balanceQuery, catalogQuery, mappingsQuery, hasConsultationInCart]);

  const handleUseAllPoints = () => {
    setPointsInput(String(Math.min(availableMinor, subtotalMinor)));
  };

  const handleCheckout = async () => {
    if (!agreed) {
      setMessage('결제 진행에 동의해 주세요.');
      return;
    }
    if (pointsError) {
      setMessage(pointsError);
      return;
    }
    if (mappingError) {
      setMessage(mappingError);
      return;
    }
    if ((cart.lines ?? []).length === 0) {
      setMessage('장바구니가 비어 있습니다.');
      return;
    }
    const mappingIdForCheckout = resolveMappingIdForCheckout(
      hasConsultationInCart,
      selectedMappingId || resolveInitialMappingId(consultantMappings, cartConsultationTitles),
    );
    try {
      setMessage('');
      await checkout({
        pointsToRedeemMinor: pointsRedeemMinor,
        consultantClientMappingId: mappingIdForCheckout,
      });
      setMessage('주문이 접수되었습니다. 결제 안내에 따라 진행해 주세요.');
      await handleRefresh();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : '체크아웃에 실패했습니다.';
      setMessage(errMsg);
    }
  };

  const loading =
    cartQuery.isLoading ||
    balanceQuery.isLoading ||
    catalogQuery.isLoading ||
    (hasConsultationInCart && mappingsQuery.isLoading) ||
    isCheckingOut;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <AppTopBar title="결제" canGoBack />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={
                (cartQuery.isRefetching ||
                  balanceQuery.isRefetching ||
                  catalogQuery.isRefetching ||
                  mappingsQuery.isRefetching) &&
                !cartQuery.isLoading
              }
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          keyboardShouldPersistTaps="handled"
        >
          {loading && (cart.lines ?? []).length === 0 ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : null}

          {(cart.lines ?? []).length > 0 ? (
            <View
              style={[
                styles.section,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.xl,
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                  },
                ]}
              >
                주문 상품
              </Text>
              {(cart.lines ?? []).map((line) => (
                <View
                  key={line.skuCode}
                  style={[styles.orderLine, { borderBottomColor: theme.colors.divider }]}
                >
                  <Text
                    style={[
                      styles.orderTitle,
                      {
                        color: theme.colors.textMain,
                        fontFamily: theme.fontFamily.medium,
                        fontSize: theme.fontSize.sm,
                      },
                    ]}
                  >
                    {toDisplayString(line.title, line.skuCode)} × {line.quantity}
                  </Text>
                  <PriceText amountMinor={line.lineTotalMinor} />
                </View>
              ))}
            </View>
          ) : null}

          {hasConsultationInCart ? (
            <View
              style={[
                styles.section,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.xl,
                },
              ]}
              accessibilityLabel={SHOP_CHECKOUT_MAPPING_COPY.SECTION_TITLE}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                  },
                ]}
              >
                {SHOP_CHECKOUT_MAPPING_COPY.SECTION_TITLE}
              </Text>
              {consultantMappings.length === 0 ? (
                <Text
                  style={[
                    styles.errorText,
                    { color: theme.colors.error, fontFamily: theme.fontFamily.regular },
                  ]}
                  accessibilityRole="alert"
                >
                  {SHOP_CHECKOUT_MAPPING_COPY.NO_MAPPING}
                </Text>
              ) : showMappingPicker ? (
                <>
                  <Text
                    style={[
                      styles.mappingHint,
                      {
                        color: theme.colors.textSecondary,
                        fontFamily: theme.fontFamily.regular,
                        fontSize: theme.fontSize.sm,
                      },
                    ]}
                  >
                    {SHOP_CHECKOUT_MAPPING_COPY.SELECT_PLACEHOLDER}
                  </Text>
                  {consultantPickerOptions.map((option) => {
                    const selected = selectedMappingId === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setSelectedMappingId(option.value)}
                        disabled={loading}
                        style={({ pressed }) => [
                          styles.mappingRow,
                          {
                            borderColor: selected ? theme.colors.primary : theme.colors.divider,
                            backgroundColor: theme.colors.bgMain,
                            opacity: pressed ? 0.92 : 1,
                          },
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={option.label}
                      >
                        <Text
                          style={[
                            styles.mappingRowText,
                            {
                              color: theme.colors.textMain,
                              fontFamily: theme.fontFamily.medium,
                              fontSize: theme.fontSize.sm,
                            },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {mappingError ? (
                    <Text
                      style={[
                        styles.errorText,
                        { color: theme.colors.error, fontFamily: theme.fontFamily.regular },
                      ]}
                      accessibilityRole="alert"
                    >
                      {mappingError}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text
                  style={[
                    styles.mappingInfo,
                    {
                      color: theme.colors.textSecondary,
                      fontFamily: theme.fontFamily.regular,
                      fontSize: theme.fontSize.sm,
                    },
                  ]}
                >
                  {assignedMappingLabel}
                </Text>
              )}
            </View>
          ) : null}

          <View
            style={[
              styles.section,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.xl,
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                },
              ]}
            >
              포인트 사용
            </Text>
            <Text
              style={[
                styles.balanceHint,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                },
              ]}
            >
              보유 포인트:{' '}
              <Text style={{ color: theme.colors.accent, fontFamily: theme.fontFamily.semibold }}>
                {formatShopPoints(availableMinor)}
              </Text>
            </Text>
            <PointInput
              value={pointsInput}
              onChange={setPointsInput}
              onUseAll={handleUseAllPoints}
              maxMinor={Math.min(availableMinor, subtotalMinor)}
              disabled={loading}
            />
            {pointsError ? (
              <Text
                style={[
                  styles.errorText,
                  { color: theme.colors.error, fontFamily: theme.fontFamily.regular },
                ]}
                accessibilityRole="alert"
              >
                {pointsError}
              </Text>
            ) : null}
          </View>

          <CheckoutSummary
            subtotalMinor={subtotalMinor}
            pointsRedeemMinor={pointsRedeemMinor}
            cashDueMinor={cashDueMinor}
          />

          <Pressable
            onPress={() => setAgreed((v) => !v)}
            style={styles.agreeRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            accessibilityLabel={SHOP_CHECKOUT_AGREEMENT_LABEL}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: agreed ? theme.colors.primary : theme.colors.surface,
                },
              ]}
            >
              {agreed ? (
                <Text style={{ color: theme.colors.textOnPrimary, fontSize: 12 }}>✓</Text>
              ) : null}
            </View>
            <Text
              style={[
                styles.agreeText,
                {
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                },
              ]}
            >
              {SHOP_CHECKOUT_AGREEMENT_LABEL}
            </Text>
          </Pressable>

          {message ? (
            <Text
              style={[
                styles.message,
                {
                  color: message.includes('접수') ? theme.colors.success : theme.colors.error,
                  fontFamily: theme.fontFamily.regular,
                },
              ]}
              accessibilityRole="alert"
            >
              {message}
            </Text>
          ) : null}

          <Pressable
            onPress={handleCheckout}
            disabled={loading || !agreed || checkoutBlocked}
            style={({ pressed }) => [
              styles.payBtn,
              {
                backgroundColor: pressed ? theme.colors.primaryDark : theme.colors.primary,
                borderRadius: theme.borderRadius.lg,
                opacity: loading || !agreed || checkoutBlocked ? 0.6 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${formatShopMoney(cashDueMinor)} 결제하기`}
          >
            <Text
              style={[
                styles.payText,
                {
                  color: theme.colors.textOnPrimary,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.base,
                },
              ]}
            >
              {formatShopMoney(cashDueMinor)} 결제하기
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingBottom: 32 },
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },
  section: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  sectionTitle: { lineHeight: 22 },
  orderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  orderTitle: { flex: 1, lineHeight: 20, marginRight: 8 },
  mappingInfo: { lineHeight: 20 },
  mappingHint: { lineHeight: 20 },
  mappingRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  mappingRowText: { lineHeight: 20 },
  balanceHint: { lineHeight: 20 },
  errorText: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    minHeight: 44,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  agreeText: { flex: 1, lineHeight: 20 },
  message: {
    marginHorizontal: 16,
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  payBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payText: { lineHeight: 22 },
});
