/**
 * ShopCheckoutPage — 결제 전 확인 (한 화면: 주문 상품 · 구매자/휴대폰 인증 · 전체 동의 · 환불 요약 · 결제)
 * 「N원 결제하기」는 휴대폰 인증 + 전체 동의가 끝나야 활성. PG 실패·닫기 후에도 입력·인증·동의 유지.
 * 바로 구매(?mode=buyNow&sku=&qty=)는 서버 장바구니를 읽거나 바꾸지 않고 그 SKU 한 줄만 체크아웃 lines 로 보낸다.
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import MallEmptyState from '../../../components/shop/molecules/MallEmptyState';
import MallInfoRows from '../../../components/shop/molecules/MallInfoRows';
import MallPayFailedAlert from '../../../components/shop/molecules/MallPayFailedAlert';
import PointInput from '../../../components/shop/molecules/PointInput';
import MallAgreements from '../../../components/shop/organisms/MallAgreements';
import MallCartBar from '../../../components/shop/organisms/MallCartBar';
import MallCheckoutLine from '../../../components/shop/organisms/MallCheckoutLine';
import MallPayPanel from '../../../components/shop/organisms/MallPayPanel';
import MallPhoneVerifyInline from '../../../components/shop/organisms/MallPhoneVerifyInline';
import MGButton from '../../../components/common/MGButton';
import SafeText from '../../../components/common/SafeText';
import {
  CLIENT_MALL_AGREEMENT_ITEMS,
  CLIENT_MALL_AGREEMENT_KEYS,
  CLIENT_MALL_CHECKOUT_COPY,
  CLIENT_MALL_CHECKOUT_SOURCE_BUY_NOW,
  CLIENT_MALL_COPY,
  CLIENT_MALL_MIN_AMOUNT_ERROR_MARKERS,
  CLIENT_MALL_TEST_IDS,
  CLIENT_MALL_THIRD_PARTY_BODY,
  CLIENT_REFUND_NOTICE,
  buildClientMallProductUsageNotice
} from '../../../constants/clientMallConstants';
import {
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_CHECKOUT_MAPPING_COPY,
  SHOP_CATALOG_CATEGORY,
  CLIENT_SHOP_ROUTES,
  SHOP_PAYMENT_VERIFY_ERROR_PHASE,
  SHOP_USER_CANCEL_OUTCOME,
  buildShopOrderDetailPath,
  buildShopPaymentCompletePath,
  buildShopPaymentReturnPath
} from '../../../constants/clientShopConstants';
import {
  CLIENT_WEB_SUITE_COPY,
  CLIENT_WEB_SUITE_TEST_IDS
} from '../../../constants/clientWebSuiteConstants';
import { CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE } from '../../../constants/legalPublic';
import {
  MIN_PAYMENT_AMOUNT,
  formatPaymentAmountForDisplay,
  isBelowMinCardCashDue
} from '../../../constants/paymentAmountConstants';
import {
  PAYMENT_MIN_CARD_AMOUNT_I18N_KEY,
  PAYMENT_MIN_CARD_AMOUNT_TITLE_I18N_KEY
} from '../../../utils/minPaymentAmountMessage';
import { useAlert } from '../../../hooks/useAlert';
import usePhoneVerifyFlow from '../../../hooks/usePhoneVerifyFlow';
import { RoleUtils } from '../../../constants/roles';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import { useSession } from '../../../contexts/SessionContext';
import {
  cancelShopOrder,
  cancelShopPaymentByUser,
  fetchConsultantMappings,
  fetchPointBalance,
  fetchShopCart,
  fetchShopCatalog,
  mergeCartLine,
  postShopCheckout as postShopCheckoutRequest,
  prepareShopPayment,
  replaceShopCart
} from '../../../services/clientShopService';
import {
  assertPortOneCustomerReadyBeforeCheckout,
  resolveSessionFullName,
  resolveSessionPhoneNumber,
  resolveSessionPhoneVerified
} from '../../../utils/clientShopPaymentCustomer';
import { runShopCheckoutWithPortOneGuard } from '../../../utils/shopCheckoutPortOneGuard';
import { runShopPortOnePaymentIfReady } from '../../../utils/shopPortOneCheckout';
import {
  buildShopCheckoutSignature,
  buildShopPaymentCancelNavigationState,
  createShopCheckoutIdempotencyKeyStore,
  resolvePortOneFailureReason,
  resolveShopPaymentCancelDestination
} from '../../../utils/shopPaymentCancel';
import {
  buildConsultantPickerOptions,
  collectCartConsultationTitles,
  resolveInitialMappingId,
  shouldShowConsultantMappingPicker,
  findUniquePreselectedMapping,
  resolveBestMappingRowForConsultant,
  distinctConsultantKey
} from '../../../utils/clientShopCheckoutMapping';
import {
  buildCartFromGuestLines,
  formatMallNumber,
  formatMallWon,
  indexCatalogBySku,
  resolveMallPayBlock,
  resolveMallPayBlockMessage,
  resolveValidityMonths,
  summarizeMallCart
} from '../../../utils/clientMall';
import {
  clampBuyNowQuantity,
  parseBuyNowQuery,
  toBuyNowCheckoutLines
} from '../../../utils/clientMallBuyNow';
import { buildSettingsPathWithReturnTo } from '../../../utils/clientSettingsReturnTo';
import { applyVerifiedPhoneToSession } from '../../../utils/clientPhoneVerifiedSession';

const EMPTY_AGREEMENTS = Object.freeze(
  CLIENT_MALL_AGREEMENT_ITEMS.reduce((acc, item) => ({ ...acc, [item.key]: false }), {})
);

/**
 * @param {Array<{ skuCode?: string }>} cartLines
 * @param {Array<{ skuCode?: string, catalogCategory?: string }>} catalog
 */
const cartHasConsultationSku = (cartLines, catalog) => {
  const consultationCodes = new Set(
    (catalog || [])
      .filter((row) => row.catalogCategory === SHOP_CATALOG_CATEGORY.CONSULTATION)
      .map((row) => row.skuCode)
  );
  return (cartLines || []).some((line) => consultationCodes.has(line.skuCode));
};

const isMinAmountError = (errMsg) =>
  CLIENT_MALL_MIN_AMOUNT_ERROR_MARKERS.some((marker) => errMsg.includes(marker))
  || errMsg.includes(String(MIN_PAYMENT_AMOUNT))
  || errMsg.includes(formatPaymentAmountForDisplay(MIN_PAYMENT_AMOUNT));

const ShopCheckoutPage = () => {
  const [alert, AlertModal] = useAlert();
  const { sessionLoading, isLoggedIn, user } = useClientShopAuth({
    requireLogin: false,
    loginRedirectPath: CLIENT_SHOP_ROUTES.CHECKOUT
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { checkSession } = useSession();
  const buyNowQuery = useMemo(() => parseBuyNowQuery(location.search), [location.search]);
  const isBuyNow = buyNowQuery != null;
  const buyNowSku = buyNowQuery?.skuCode ?? '';
  const [buyNowQty, setBuyNowQty] = useState(() => buyNowQuery?.quantity ?? 1);
  const [serverCart, setServerCart] = useState({ lines: [], subtotalMinor: 0 });
  const [catalog, setCatalog] = useState([]);
  const [balance, setBalance] = useState({ availableMinor: 0, heldMinor: 0 });
  const [consultantMappings, setConsultantMappings] = useState([]);
  const [selectedMappingId, setSelectedMappingId] = useState('');
  const [pointsInput, setPointsInput] = useState('0');
  const [agreements, setAgreements] = useState(EMPTY_AGREEMENTS);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [payFailureReason, setPayFailureReason] = useState('');
  const idempotencyStoreRef = useRef(null);
  if (idempotencyStoreRef.current == null) {
    idempotencyStoreRef.current = createShopCheckoutIdempotencyKeyStore();
  }

  useEffect(() => {
    if (buyNowQuery) {
      setBuyNowQty(buyNowQuery.quantity);
    }
  }, [buyNowQuery]);

  const buyNowLines = useMemo(
    () => (isBuyNow ? toBuyNowCheckoutLines({ skuCode: buyNowSku, quantity: buyNowQty }) : null),
    [isBuyNow, buyNowSku, buyNowQty]
  );

  const cart = useMemo(
    () => (buyNowLines ? buildCartFromGuestLines(buyNowLines, catalog) : serverCart),
    [buyNowLines, catalog, serverCart]
  );

  const showMinCardPaymentAlert = useCallback(async() => {
    await alert({
      variant: 'warning',
      titleKey: PAYMENT_MIN_CARD_AMOUNT_TITLE_I18N_KEY,
      messageKey: PAYMENT_MIN_CARD_AMOUNT_I18N_KEY,
      interpolation: { amount: formatPaymentAmountForDisplay(MIN_PAYMENT_AMOUNT) }
    });
  }, [alert]);

  const hasConsultationInCart = useMemo(
    () => cartHasConsultationSku(cart.lines, catalog),
    [cart.lines, catalog]
  );

  const cartConsultationTitles = useMemo(
    () => collectCartConsultationTitles(cart.lines, catalog),
    [cart.lines, catalog]
  );

  const authenticatedCatalog = RoleUtils.isClient(user);

  const loadData = useCallback(async() => {
    try {
      setLoading(true);
      setMessage('');
      const [catalogData, cartData, balanceData] = await Promise.all([
        fetchShopCatalog({ authenticated: authenticatedCatalog }),
        isBuyNow ? Promise.resolve(null) : fetchShopCart(),
        fetchPointBalance()
      ]);
      setCatalog(catalogData);
      if (cartData) {
        setServerCart(cartData);
      }
      setBalance(balanceData);

      const checkoutLines = isBuyNow
        ? buildCartFromGuestLines([{ skuCode: buyNowSku, quantity: 1 }], catalogData).lines
        : cartData.lines;
      const needsMapping = cartHasConsultationSku(checkoutLines, catalogData);
      if (needsMapping) {
        const mappings = await fetchConsultantMappings();
        setConsultantMappings(mappings);
        setSelectedMappingId((prev) => prev || resolveInitialMappingId(
          mappings,
          collectCartConsultationTitles(checkoutLines, catalogData)
        ));
      } else {
        setConsultantMappings([]);
        setSelectedMappingId('');
      }
    } catch (e) {
      setMessage(e.message || CLIENT_MALL_CHECKOUT_COPY.LOAD_FAILED);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [authenticatedCatalog, isBuyNow, buyNowSku]);

  const postShopCheckout = useCallback(
    (idempotencyKey, pointsToRedeemMinor, consultantClientMappingId) => postShopCheckoutRequest(
      idempotencyKey,
      pointsToRedeemMinor,
      consultantClientMappingId,
      buyNowLines
    ),
    [buyNowLines]
  );

  useEffect(() => {
    if (!sessionLoading && isLoggedIn) {
      loadData();
    }
  }, [sessionLoading, isLoggedIn, loadData]);

  // 설정 화면 인증 후 복귀·탭 포커스 시 게이트가 동일 useSession().user 를 읽도록 soft refresh
  useEffect(() => {
    if (sessionLoading || !isLoggedIn || typeof checkSession !== 'function') {
      return undefined;
    }
    let cancelledRefresh = false;
    const refreshGateUser = () => {
      if (!cancelledRefresh) {
        // silent — isLoading 토글로 이 effect 가 재진입하지 않게 함
        void checkSession(true, { silent: true });
      }
    };
    refreshGateUser();
    const onFocus = () => refreshGateUser();
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
    }
    return () => {
      cancelledRefresh = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
      }
    };
  }, [sessionLoading, isLoggedIn, checkSession]);

  const portOneCustomerGate = useMemo(
    () => assertPortOneCustomerReadyBeforeCheckout(user),
    // userId + phone gate 필드만 — silent SET_USER 참조 변경으로 불필요 재계산 방지
    [
      user?.id ?? null,
      resolveSessionPhoneNumber(user),
      resolveSessionPhoneVerified(user)
    ]
  );

  const phoneFlow = usePhoneVerifyFlow({
    initialPhoneDigits: resolveSessionPhoneNumber(user) || '',
    initiallyVerified: portOneCustomerGate.ready,
    onVerified: ({ phoneDigits, response }) => applyVerifiedPhoneToSession({
      phoneDigits,
      phoneVerifiedAt: response?.phoneVerifiedAt ?? null,
      checkSession
    })
  });

  const subtotalMinor = cart.subtotalMinor || 0;
  const availableMinor = balance.availableMinor || 0;

  const pointsRedeemMinor = useMemo(() => {
    const parsed = Math.max(0, parseInt(pointsInput, 10) || 0);
    return Math.min(parsed, availableMinor, subtotalMinor);
  }, [pointsInput, availableMinor, subtotalMinor]);

  const cashDueMinor = Math.max(0, subtotalMinor - pointsRedeemMinor);

  const pointsError = useMemo(() => {
    const parsed = parseInt(pointsInput, 10) || 0;
    if (parsed < 0) {
      return CLIENT_MALL_CHECKOUT_COPY.POINTS_NEGATIVE;
    }
    if (parsed > availableMinor) {
      return CLIENT_MALL_CHECKOUT_COPY.POINTS_OVER_BALANCE;
    }
    if (parsed > subtotalMinor) {
      return CLIENT_MALL_CHECKOUT_COPY.POINTS_OVER_SUBTOTAL;
    }
    return '';
  }, [pointsInput, availableMinor, subtotalMinor]);

  const mappingError = useMemo(() => {
    if (!hasConsultationInCart) {
      return '';
    }
    if (consultantMappings.length === 0) {
      return SHOP_CHECKOUT_MAPPING_COPY.NO_MAPPING;
    }
    if (shouldShowConsultantMappingPicker(consultantMappings) && !selectedMappingId) {
      return SHOP_CHECKOUT_MAPPING_COPY.REQUIRED;
    }
    return '';
  }, [hasConsultationInCart, consultantMappings, selectedMappingId]);

  const consultantPickerOptions = useMemo(
    () => buildConsultantPickerOptions(consultantMappings, cartConsultationTitles),
    [consultantMappings, cartConsultationTitles]
  );

  const assignedConsultantName = useMemo(() => {
    if (consultantMappings.length === 0) {
      return '';
    }
    const key = distinctConsultantKey(consultantMappings[0]);
    const bucket = consultantMappings.filter((row) => distinctConsultantKey(row) === key);
    const row =
      resolveBestMappingRowForConsultant(bucket, cartConsultationTitles)
      || findUniquePreselectedMapping(consultantMappings)
      || consultantMappings[0];
    return row?.consultantDisplayName || '';
  }, [consultantMappings, cartConsultationTitles]);

  const showMappingPicker = shouldShowConsultantMappingPicker(consultantMappings);
  const bySku = useMemo(() => indexCatalogBySku(catalog), [catalog]);
  const summary = useMemo(() => summarizeMallCart(cart, catalog), [cart, catalog]);
  const allAgreed = CLIENT_MALL_AGREEMENT_ITEMS.every((item) => agreements[item.key]);
  const phoneVerified = portOneCustomerGate.ready;
  const payBlock = resolveMallPayBlock({ phoneVerified, allAgreed });
  const noMapping = hasConsultationInCart && consultantMappings.length === 0;
  const blockMessage = noMapping
    ? SHOP_CHECKOUT_MAPPING_COPY.NO_MAPPING
    : resolveMallPayBlockMessage(payBlock);
  const checkoutBlocked =
    Boolean(pointsError) ||
    Boolean(mappingError) ||
    noMapping;
  const payDisabled = loading || Boolean(blockMessage) || checkoutBlocked || summary.isEmpty;

  const handleToggleAgreement = (key, value) => {
    setAgreements((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleAll = (value) => {
    setAgreements(
      CLIENT_MALL_AGREEMENT_ITEMS.reduce((acc, item) => ({ ...acc, [item.key]: value }), {})
    );
  };

  const handleQuantityChange = async(skuCode, delta) => {
    if (isBuyNow) {
      setBuyNowQty((prev) => clampBuyNowQuantity(prev + delta));
      return;
    }
    try {
      setLoading(true);
      setMessage('');
      await replaceShopCart(mergeCartLine(serverCart.lines, skuCode, delta));
      setServerCart(await fetchShopCart());
    } catch (e) {
      setMessage(e.message || CLIENT_MALL_CHECKOUT_COPY.LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleUseAllPoints = () => {
    setPointsInput(String(Math.min(availableMinor, subtotalMinor)));
  };

  const handleCheckout = async() => {
    if (blockMessage || pointsError || mappingError || summary.isEmpty) {
      setMessage(pointsError || mappingError || '');
      return;
    }
    if (isBelowMinCardCashDue(cashDueMinor)) {
      await showMinCardPaymentAlert();
      return;
    }
    if (!portOneCustomerGate.ready) {
      return;
    }
    const mappingIdForCheckout = hasConsultationInCart
      ? (selectedMappingId || resolveInitialMappingId(consultantMappings, cartConsultationTitles))
      : null;
    const idempotencyStore = idempotencyStoreRef.current;
    const checkoutSignature = buildShopCheckoutSignature({
      isBuyNow,
      lines: isBuyNow ? buyNowLines : serverCart.lines,
      pointsRedeemMinor,
      mappingId: mappingIdForCheckout
    });
    try {
      setLoading(true);
      setMessage('');
      setPayFailureReason('');
      const flow = await runShopCheckoutWithPortOneGuard({
        user,
        pointsRedeemMinor,
        mappingIdForCheckout,
        createIdempotencyKey: () => idempotencyStore.keyFor(checkoutSignature),
        postShopCheckout,
        prepareShopPayment,
        runShopPortOnePaymentIfReady,
        cancelShopOrder,
        cancelShopPaymentByUser
      });
      if (flow.status === 'USER_CANCELLED') {
        if (flow.cancelOutcome === SHOP_USER_CANCEL_OUTCOME.CANCELLED) {
          idempotencyStore.reset();
        }
        navigate(
          resolveShopPaymentCancelDestination({
            checkoutSource: isBuyNow ? CLIENT_MALL_CHECKOUT_SOURCE_BUY_NOW : null,
            skuCode: buyNowSku
          }),
          { replace: true, state: buildShopPaymentCancelNavigationState() }
        );
        return;
      }
      if (flow.status === 'PAID_AFTER_CANCEL' && flow.checkoutResult?.orderPublicId) {
        navigate(buildShopPaymentReturnPath(flow.checkoutResult.orderPublicId, flow.paymentId), { replace: true });
        return;
      }
      if (flow.status === 'PAYMENT_VERIFIED') {
        const orderId = flow.checkoutResult?.orderPublicId;
        if (orderId) {
          navigate(buildShopPaymentCompletePath(orderId), { replace: true });
          return;
        }
        navigate(CLIENT_SHOP_ROUTES.ORDERS, { replace: true });
        return;
      }
      if (flow.status === 'NON_PAYMENT' && flow.checkoutResult?.orderPublicId) {
        navigate(buildShopOrderDetailPath(flow.checkoutResult.orderPublicId), { replace: true });
        return;
      }
      setMessage(flow.message);
      await loadData();
    } catch (e) {
      const errMsg = e.message || '';
      const verifyOrderId =
        e &&
        e.shopPaymentPhase === SHOP_PAYMENT_VERIFY_ERROR_PHASE &&
        e.orderPublicId != null &&
        String(e.orderPublicId).trim()
          ? String(e.orderPublicId).trim()
          : '';
      // PortOne SDK 성공 후 최종 verify 실패 → 주문 상세 「결제 확인」 경로로 유도
      if (verifyOrderId) {
        navigate(buildShopOrderDetailPath(verifyOrderId), {
          replace: true,
          state: {
            shopCheckoutMessage:
              errMsg || SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED_USE_ORDER_CONFIRM
          }
        });
        return;
      }
      if (e && e.portoneResult) {
        setPayFailureReason(
          resolvePortOneFailureReason(e.portoneResult, CLIENT_MALL_CHECKOUT_COPY.PAY_FAILED_REASON_FALLBACK)
        );
        return;
      }
      if (isBelowMinCardCashDue(cashDueMinor) || isMinAmountError(errMsg)) {
        await showMinCardPaymentAlert();
      } else {
        setMessage(errMsg || SHOP_CHECKOUT_ERROR_COPY.CHECKOUT_FAILED);
      }
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return <ShopClientSessionLoading title={CLIENT_MALL_CHECKOUT_COPY.TITLE} />;
  }

  const loginRedirect = `/login?redirect=${encodeURIComponent(`${CLIENT_SHOP_ROUTES.CHECKOUT}${location.search}`)}`;

  if (!isLoggedIn) {
    return (
      <ShopClientLayout title={CLIENT_MALL_CHECKOUT_COPY.TITLE} testId="client-shop-checkout">
        <section
          className="client-mall-box"
          data-testid={CLIENT_WEB_SUITE_TEST_IDS.CHECKOUT_LOGIN_GATE}
          aria-label={CLIENT_WEB_SUITE_COPY.CHECKOUT_LOGIN_GATE_TITLE}
        >
          <h2 className="client-mall-box__title">{CLIENT_WEB_SUITE_COPY.CHECKOUT_LOGIN_GATE_TITLE}</h2>
          <p className="client-mall-page__hint">{CLIENT_WEB_SUITE_COPY.CHECKOUT_LOGIN_GATE_BODY}</p>
          <Link className="client-mall-link-cta" to={loginRedirect}>
            {CLIENT_WEB_SUITE_COPY.CHECKOUT_LOGIN_CTA}
          </Link>
        </section>
      </ShopClientLayout>
    );
  }

  const lines = cart.lines || [];
  const orderCaption = isBuyNow
    ? CLIENT_MALL_CHECKOUT_COPY.BUY_NOW_CAPTION
    : `${CLIENT_MALL_CHECKOUT_COPY.CART_CAPTION_PREFIX}${summary.quantity}${CLIENT_MALL_COPY.CART_COUNT_SUFFIX}`
      + (summary.mixedValidity ? CLIENT_MALL_CHECKOUT_COPY.CART_CAPTION_MIXED_SUFFIX : '');

  const usageBodies = lines
    .map((line) => ({ line, months: resolveValidityMonths(bySku.get(line.skuCode)) }))
    .filter(({ months }) => months != null);
  const agreementBodies = {
    [CLIENT_MALL_AGREEMENT_KEYS.PURCHASE]: <p>{CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE}</p>,
    [CLIENT_MALL_AGREEMENT_KEYS.USAGE_REFUND]: (
      <>
        {usageBodies.map(({ line, months }) => (
          <p key={line.skuCode}>{buildClientMallProductUsageNotice(months)}</p>
        ))}
        <p>{CLIENT_REFUND_NOTICE}</p>
      </>
    ),
    [CLIENT_MALL_AGREEMENT_KEYS.THIRD_PARTY]: <p>{CLIENT_MALL_THIRD_PARTY_BODY}</p>
  };

  const consultantValue = (() => {
    if (!hasConsultationInCart) {
      return null;
    }
    if (consultantMappings.length === 0) {
      return (
        <span className="client-mall-field__error" role="alert">{SHOP_CHECKOUT_MAPPING_COPY.NO_MAPPING}</span>
      );
    }
    if (showMappingPicker) {
      return (
        <>
          <select
            id="shop-consultant-mapping"
            className="client-mall-field__input client-mall-field__select"
            value={selectedMappingId}
            onChange={(e) => setSelectedMappingId(e.target.value)}
            disabled={loading}
            aria-required="true"
            aria-label={SHOP_CHECKOUT_MAPPING_COPY.SECTION_TITLE}
          >
            <option value="">{SHOP_CHECKOUT_MAPPING_COPY.SELECT_PLACEHOLDER}</option>
            {consultantPickerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {mappingError ? (
            <span className="client-mall-field__error" role="alert">{mappingError}</span>
          ) : null}
        </>
      );
    }
    return <SafeText>{assignedConsultantName}</SafeText>;
  })();

  const buyerRows = [
    {
      key: 'name',
      label: CLIENT_MALL_CHECKOUT_COPY.BUYER_NAME,
      value: <SafeText>{resolveSessionFullName(user)}</SafeText>
    },
    ...(consultantValue != null
      ? [{ key: 'consultant', label: CLIENT_MALL_CHECKOUT_COPY.BUYER_CONSULTANT, value: consultantValue }]
      : []),
    {
      key: 'phone',
      label: CLIENT_MALL_CHECKOUT_COPY.BUYER_PHONE,
      value: <MallPhoneVerifyInline flow={phoneFlow} />
    }
  ];

  const payPanel = (
    <MallPayPanel
      subtotalMinor={subtotalMinor}
      pointsRedeemMinor={pointsRedeemMinor}
      cashDueMinor={cashDueMinor}
      availablePointsMinor={availableMinor}
      quantity={summary.quantity}
      totalSessions={summary.totalSessions}
      validityMonths={summary.validityMonths}
      mixedValidity={summary.mixedValidity}
      blockMessage={blockMessage}
      disabled={payDisabled}
      loading={loading}
      onPay={handleCheckout}
      message={message}
    />
  );

  return (
    <ShopClientLayout
      title={CLIENT_MALL_CHECKOUT_COPY.TITLE}
      eyebrow={CLIENT_MALL_CHECKOUT_COPY.EYEBROW}
      testId="client-shop-checkout"
      meta={<p className="client-mall-page__subtitle">{CLIENT_MALL_CHECKOUT_COPY.SUBTITLE}</p>}
      aside={lines.length > 0 ? payPanel : null}
      className="client-mall--checkout"
    >
      <AlertModal />
      {loaded && lines.length === 0 ? (
        <MallEmptyState
          title={CLIENT_MALL_CHECKOUT_COPY.EMPTY_TITLE}
          action={(
            <MGButton
              variant="outline"
              preventDoubleClick={false}
              className="client-mall-btn client-mall-btn--ink-line"
              onClick={() => navigate(CLIENT_SHOP_ROUTES.CATALOG)}
            >
              {CLIENT_MALL_COPY.CART_BROWSE}
            </MGButton>
          )}
        />
      ) : null}
      {lines.length > 0 ? (
        <>
          <MallPayFailedAlert reason={payFailureReason} />
          <section className="client-mall-box" aria-label={CLIENT_MALL_CHECKOUT_COPY.ORDER_SECTION}>
            <header className="client-mall-box__head">
              <h2 className="client-mall-box__title">{CLIENT_MALL_CHECKOUT_COPY.ORDER_SECTION}</h2>
              <span className="client-mall-box__caption">{orderCaption}</span>
            </header>
            {lines.map((line) => (
              <MallCheckoutLine
                key={line.skuCode}
                line={line}
                validityMonths={resolveValidityMonths(bySku.get(line.skuCode))}
                onQuantityChange={(delta) => handleQuantityChange(line.skuCode, delta)}
                disabled={loading}
              />
            ))}
          </section>

          <section className="client-mall-box" aria-label={CLIENT_MALL_CHECKOUT_COPY.BUYER_SECTION}>
            <header className="client-mall-box__head">
              <h2 className="client-mall-box__title">{CLIENT_MALL_CHECKOUT_COPY.BUYER_SECTION}</h2>
              {!phoneVerified ? (
                <span className="client-mall-box__caption">{CLIENT_MALL_CHECKOUT_COPY.BUYER_PHONE_CARD_HINT}</span>
              ) : null}
            </header>
            <MallInfoRows rows={buyerRows} className="client-mall-rows--wide" />
            {!phoneVerified && portOneCustomerGate.message ? (
              <p className="client-mall-page__hint" data-testid={CLIENT_WEB_SUITE_TEST_IDS.CHECKOUT_PHONE_GATE}>
                <Link to={buildSettingsPathWithReturnTo(`${location.pathname}${location.search}`)}>
                  {CLIENT_WEB_SUITE_COPY.CHECKOUT_SETTINGS_LINK}
                </Link>
              </p>
            ) : null}
          </section>

          {availableMinor > 0 ? (
            <section className="client-mall-box" aria-label={CLIENT_MALL_CHECKOUT_COPY.POINTS_SECTION}>
              <header className="client-mall-box__head">
                <h2 className="client-mall-box__title">{CLIENT_MALL_CHECKOUT_COPY.POINTS_SECTION}</h2>
                <span className="client-mall-box__caption">
                  {CLIENT_MALL_CHECKOUT_COPY.PAY_ROW_POINTS_BALANCE_PREFIX}
                  {formatMallNumber(availableMinor)}
                </span>
              </header>
              <PointInput
                value={pointsInput}
                onChange={setPointsInput}
                onUseAll={handleUseAllPoints}
                maxMinor={Math.min(availableMinor, subtotalMinor)}
                disabled={loading}
              />
              {pointsError ? (
                <p className="client-mall-field__error" role="alert">{pointsError}</p>
              ) : null}
            </section>
          ) : null}

          <MallAgreements
            checked={agreements}
            onToggle={handleToggleAgreement}
            onToggleAll={handleToggleAll}
            bodies={agreementBodies}
            disabled={loading}
          />

          <section
            className="client-mall-box"
            aria-label={CLIENT_MALL_CHECKOUT_COPY.REFUND_SECTION}
            data-testid={CLIENT_MALL_TEST_IDS.CHECKOUT_REFUND}
          >
            <h2 className="client-mall-box__title">{CLIENT_MALL_CHECKOUT_COPY.REFUND_SECTION}</h2>
            <ul className="client-mall-bullets">
              <li>{CLIENT_REFUND_NOTICE}</li>
            </ul>
          </section>

          <div className="client-mall-bar-spacer" aria-hidden="true" />
          <MallCartBar
            quantity={summary.quantity}
            subtotalMinor={cashDueMinor}
            heading={CLIENT_MALL_CHECKOUT_COPY.PAY_SECTION}
            label={`${formatMallWon(cashDueMinor)}${CLIENT_MALL_CHECKOUT_COPY.PAY_CTA_SUFFIX}`}
            onAction={handleCheckout}
            disabled={payDisabled}
            testId="client-mall-checkout-bar"
            actionTestId="client-mall-checkout-bar-pay"
          />
        </>
      ) : null}
    </ShopClientLayout>
  );
};

export default ShopCheckoutPage;
