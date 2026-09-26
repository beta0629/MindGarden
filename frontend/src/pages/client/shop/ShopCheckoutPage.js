/**
 * ShopCheckoutPage — 체크아웃·포인트 사용·상담 매핑 선택·결제 준비
 * Clinic-OS · shot-client-cart-tobe
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import SessionCountTicket from '../../../components/shop/atoms/SessionCountTicket';
import PointInput from '../../../components/shop/molecules/PointInput';
import CheckoutSummary from '../../../components/shop/organisms/CheckoutSummary';
import MGButton from '../../../components/common/MGButton';
import SafeText from '../../../components/common/SafeText';
import { formatShopMoney, formatShopPoints } from '../../../utils/clientShopFormat';
import {
  SHOP_CHECKOUT_AGREEMENT_LABEL,
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_CHECKOUT_MAPPING_COPY,
  SHOP_CATALOG_CATEGORY,
  CLIENT_SHOP_ROUTES,
  SHOP_PAYMENT_VERIFY_ERROR_PHASE,
  buildShopOrderDetailPath
} from '../../../constants/clientShopConstants';
import {
  CLIENT_WEB_SUITE_COPY,
  CLIENT_WEB_SUITE_TEST_IDS
} from '../../../constants/clientWebSuiteConstants';
import {
  CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE,
  CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE
} from '../../../constants/legalPublic';
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
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import { useSession } from '../../../contexts/SessionContext';
import {
  cancelShopOrder,
  fetchConsultantMappings,
  fetchPointBalance,
  fetchShopCart,
  fetchShopCatalog,
  postShopCheckout,
  prepareShopPayment
} from '../../../services/clientShopService';
import {
  assertPortOneCustomerReadyBeforeCheckout,
  resolveSessionPhoneNumber,
  resolveSessionPhoneVerified
} from '../../../utils/clientShopPaymentCustomer';
import { runShopCheckoutWithPortOneGuard } from '../../../utils/shopCheckoutPortOneGuard';
import { runShopPortOnePaymentIfReady } from '../../../utils/shopPortOneCheckout';
import {
  buildConsultantPickerOptions,
  collectCartConsultationTitles,
  resolveInitialMappingId,
  shouldShowConsultantMappingPicker,
  findUniquePreselectedMapping,
  resolveBestMappingRowForConsultant,
  distinctConsultantKey
} from '../../../utils/clientShopCheckoutMapping';

const createIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}`;
};

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

const ShopCheckoutPage = () => {
  const [alert, AlertModal] = useAlert();
  const { sessionLoading, isLoggedIn, user } = useClientShopAuth({
    requireLogin: false,
    loginRedirectPath: CLIENT_SHOP_ROUTES.CHECKOUT
  });
  const navigate = useNavigate();
  const { checkSession } = useSession();
  const [cart, setCart] = useState({ lines: [], subtotalMinor: 0 });
  const [catalog, setCatalog] = useState([]);
  const [balance, setBalance] = useState({ availableMinor: 0, heldMinor: 0 });
  const [consultantMappings, setConsultantMappings] = useState([]);
  const [selectedMappingId, setSelectedMappingId] = useState('');
  const [pointsInput, setPointsInput] = useState('0');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [checkoutResult, setCheckoutResult] = useState(null);

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

  const loadData = useCallback(async() => {
    try {
      setLoading(true);
      setMessage('');
      const [catalogData, cartData, balanceData] = await Promise.all([
        fetchShopCatalog(),
        fetchShopCart(),
        fetchPointBalance()
      ]);
      setCatalog(catalogData);
      setCart(cartData);
      setBalance(balanceData);

      const needsMapping = cartHasConsultationSku(cartData.lines, catalogData);
      if (needsMapping) {
        const mappings = await fetchConsultantMappings();
        setConsultantMappings(mappings);
        setSelectedMappingId(
          resolveInitialMappingId(
            mappings,
            collectCartConsultationTitles(cartData.lines, catalogData)
          )
        );
      } else {
        setConsultantMappings([]);
        setSelectedMappingId('');
      }
    } catch (e) {
      setMessage(e.message || '결제 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn) {
      loadData();
    }
  }, [sessionLoading, isLoggedIn, loadData]);

  // /client/settings 복귀 후 게이트가 동일 useSession().user 를 읽도록 soft refresh
  useEffect(() => {
    if (sessionLoading || !isLoggedIn || typeof checkSession !== 'function') {
      return undefined;
    }
    let cancelled = false;
    const refreshGateUser = () => {
      if (!cancelled) {
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
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
      }
    };
  }, [sessionLoading, isLoggedIn, checkSession]);

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
      return '0 이상 입력해 주세요.';
    }
    if (parsed > availableMinor) {
      return '보유 포인트를 초과할 수 없습니다.';
    }
    if (parsed > subtotalMinor) {
      return '상품 금액을 초과할 수 없습니다.';
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

  const portOneCustomerGate = useMemo(
    () => assertPortOneCustomerReadyBeforeCheckout(user),
    // userId + phone gate 필드만 — silent SET_USER 참조 변경으로 불필요 재계산 방지
    [
      user?.id ?? null,
      resolveSessionPhoneNumber(user),
      resolveSessionPhoneVerified(user)
    ]
  );

  const consultantPickerOptions = useMemo(
    () => buildConsultantPickerOptions(consultantMappings, cartConsultationTitles),
    [consultantMappings, cartConsultationTitles]
  );

  const assignedMappingLabel = useMemo(() => {
    if (consultantMappings.length === 0) {
      return '';
    }
    const key = distinctConsultantKey(consultantMappings[0]);
    const bucket = consultantMappings.filter((row) => distinctConsultantKey(row) === key);
    const row =
      resolveBestMappingRowForConsultant(bucket, cartConsultationTitles)
      || findUniquePreselectedMapping(consultantMappings)
      || consultantMappings[0];
    const name = row?.consultantDisplayName || '';
    return `${SHOP_CHECKOUT_MAPPING_COPY.AUTO_PREFIX}: ${name}`;
  }, [consultantMappings, cartConsultationTitles]);

  const showMappingPicker = shouldShowConsultantMappingPicker(consultantMappings);

  const handleUseAllPoints = () => {
    setPointsInput(String(Math.min(availableMinor, subtotalMinor)));
  };

  const handleCheckout = async() => {
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
    const lines = cart.lines || [];
    if (lines.length === 0) {
      setMessage('장바구니가 비어 있습니다.');
      return;
    }
    if (isBelowMinCardCashDue(cashDueMinor)) {
      await showMinCardPaymentAlert();
      return;
    }
    if (!portOneCustomerGate.ready) {
      // 동일 문구는 CHECKOUT_PHONE_GATE 배너에 이미 표시 — setMessage 중복 방지
      const gateEl = document.querySelector(
        `[data-testid="${CLIENT_WEB_SUITE_TEST_IDS.CHECKOUT_PHONE_GATE}"]`
      );
      if (gateEl && typeof gateEl.scrollIntoView === 'function') {
        gateEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return;
    }
    const mappingIdForCheckout = hasConsultationInCart
      ? (selectedMappingId || resolveInitialMappingId(consultantMappings, cartConsultationTitles))
      : null;
    try {
      setLoading(true);
      setMessage('');
      setCheckoutResult(null);
      const flow = await runShopCheckoutWithPortOneGuard({
        user,
        pointsRedeemMinor,
        mappingIdForCheckout,
        createIdempotencyKey,
        postShopCheckout,
        prepareShopPayment,
        runShopPortOnePaymentIfReady,
        cancelShopOrder
      });
      if (flow.status === 'PAYMENT_VERIFIED') {
        const orderId = flow.checkoutResult?.orderPublicId;
        if (orderId) {
          navigate(buildShopOrderDetailPath(orderId), { replace: true });
          return;
        }
        navigate(CLIENT_SHOP_ROUTES.ORDERS, { replace: true });
        return;
      }
      if (flow.checkoutResult && flow.status !== 'ORPHAN_CANCELLED') {
        setCheckoutResult(flow.checkoutResult);
      } else {
        setCheckoutResult(null);
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
      if (
        isBelowMinCardCashDue(cashDueMinor)
        || errMsg.includes('최소 금액')
        || errMsg.includes('카드 결제는')
        || errMsg.includes(String(MIN_PAYMENT_AMOUNT))
        || errMsg.includes(formatPaymentAmountForDisplay(MIN_PAYMENT_AMOUNT))
      ) {
        await showMinCardPaymentAlert();
      } else {
        setMessage(errMsg || SHOP_CHECKOUT_ERROR_COPY.CHECKOUT_FAILED);
      }
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return <ShopClientSessionLoading title={CLIENT_WEB_SUITE_COPY.CHECKOUT_TITLE} />;
  }

  const loginRedirect = `/login?redirect=${encodeURIComponent(CLIENT_SHOP_ROUTES.CHECKOUT)}`;

  if (!isLoggedIn) {
    return (
      <ShopClientLayout
        title={CLIENT_WEB_SUITE_COPY.CHECKOUT_TITLE}
        testId="client-shop-checkout"
        aside={(
          <div className="client-web-page-shell__card client-shop-checkout-receipt">
            <p className="client-shop-checkout-receipt__note">
              {CLIENT_WEB_SUITE_COPY.CHECKOUT_LOGIN_GATE_BODY}
            </p>
            <button
              type="button"
              className="client-web-page-shell__cta"
              disabled
              aria-disabled="true"
            >
              {CLIENT_WEB_SUITE_COPY.CHECKOUT_PAY_CTA}
            </button>
          </div>
        )}
      >
        <section
          className="client-web-page-shell__card client-shop-checkout-gate"
          data-testid={CLIENT_WEB_SUITE_TEST_IDS.CHECKOUT_LOGIN_GATE}
          aria-label={CLIENT_WEB_SUITE_COPY.CHECKOUT_LOGIN_GATE_TITLE}
        >
          <h2 className="client-shop-checkout-gate__title">
            {CLIENT_WEB_SUITE_COPY.CHECKOUT_LOGIN_GATE_TITLE}
          </h2>
          <p className="client-shop-checkout-gate__body">
            {CLIENT_WEB_SUITE_COPY.CHECKOUT_LOGIN_GATE_BODY}
          </p>
          <Link className="client-web-page-shell__cta" to={loginRedirect}>
            {CLIENT_WEB_SUITE_COPY.CHECKOUT_LOGIN_CTA}
          </Link>
        </section>
      </ShopClientLayout>
    );
  }

  const lines = cart.lines || [];
  const checkoutBlocked =
    Boolean(pointsError) ||
    Boolean(mappingError) ||
    (hasConsultationInCart && consultantMappings.length === 0) ||
    !portOneCustomerGate.ready;

  return (
    <ShopClientLayout title={CLIENT_WEB_SUITE_COPY.CHECKOUT_TITLE} testId="client-shop-checkout">
      <AlertModal />
      {lines.length === 0 ? (
        <p className="client-shop__empty">
          장바구니가 비어 있습니다.{' '}
          <Link to={CLIENT_SHOP_ROUTES.CATALOG}>상품 보러 가기</Link>
        </p>
      ) : (
        <>
          <section className="client-shop__section" aria-label="주문 상품">
            <h2 className="client-shop__section-title">주문 상품</h2>
            {lines.map((line) => (
              <div key={line.skuCode} className="client-shop__checkout-line">
                <div className="client-shop__checkout-line-main">
                  <p className="client-shop__checkout-line-title">
                    <SafeText>{line.title}</SafeText>
                    {' × '}
                    {line.quantity}
                  </p>
                  <SessionCountTicket
                    sessionCount={line.sessionCount}
                    testId={`checkout-session-ticket-${line.skuCode}`}
                  />
                </div>
                <span className="client-shop__checkout-line-total">
                  {formatShopMoney(line.lineTotalMinor)}
                </span>
              </div>
            ))}
          </section>

          {hasConsultationInCart ? (
            <section className="client-shop__section" aria-label="담당 상담사">
              <h2 className="client-shop__section-title">
                {SHOP_CHECKOUT_MAPPING_COPY.SECTION_TITLE}
              </h2>
              {consultantMappings.length === 0 ? (
                <p className="client-shop__message client-shop__message--error" role="alert">
                  {SHOP_CHECKOUT_MAPPING_COPY.NO_MAPPING}
                </p>
              ) : showMappingPicker ? (
                <>
                  <label className="client-shop__field-label" htmlFor="shop-consultant-mapping">
                    {SHOP_CHECKOUT_MAPPING_COPY.SECTION_TITLE}
                  </label>
                  <select
                    id="shop-consultant-mapping"
                    className="client-shop__select"
                    value={selectedMappingId}
                    onChange={(e) => setSelectedMappingId(e.target.value)}
                    disabled={loading}
                    aria-required="true"
                  >
                    <option value="">{SHOP_CHECKOUT_MAPPING_COPY.SELECT_PLACEHOLDER}</option>
                    {consultantPickerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {mappingError ? (
                    <p className="client-shop__message client-shop__message--error" role="alert">
                      {mappingError}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="client-shop__message">{assignedMappingLabel}</p>
              )}
            </section>
          ) : null}

          <section className="client-shop__section" aria-label="포인트 사용">
            <h2 className="client-shop__section-title">포인트 사용</h2>
            <p className="client-shop__message">
              보유 포인트:{' '}
              <strong className="client-shop__point-amount--accent">
                {formatShopPoints(availableMinor)}
              </strong>
            </p>
            <PointInput
              value={pointsInput}
              onChange={setPointsInput}
              onUseAll={handleUseAllPoints}
              maxMinor={Math.min(availableMinor, subtotalMinor)}
              disabled={loading}
            />
            {pointsError ? (
              <p className="client-shop__message client-shop__message--error" role="alert">
                {pointsError}
              </p>
            ) : null}
          </section>

          <CheckoutSummary
            subtotalMinor={subtotalMinor}
            pointsRedeemMinor={pointsRedeemMinor}
            cashDueMinor={cashDueMinor}
          />

          <p
            className="client-shop__message"
            data-testid="shop-checkout-usage-period-note"
          >
            {CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE}
          </p>
          <p
            className="client-shop__message"
            data-testid="shop-checkout-payment-type-note"
          >
            {CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE}
          </p>

          <label className="client-shop__checkbox-row">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>{SHOP_CHECKOUT_AGREEMENT_LABEL}</span>
          </label>

          {!portOneCustomerGate.ready && portOneCustomerGate.message ? (
            <div
              className="client-shop__message client-shop__message--error"
              role="alert"
              data-testid={CLIENT_WEB_SUITE_TEST_IDS.CHECKOUT_PHONE_GATE}
            >
              <p>{portOneCustomerGate.message}</p>
              <Link className="client-web-page-shell__cta client-web-page-shell__cta--ghost" to="/client/settings">
                {CLIENT_WEB_SUITE_COPY.CHECKOUT_SETTINGS_LINK}
              </Link>
            </div>
          ) : null}

          {message ? (
            <p className="client-shop__message" role="status">
              {message}
            </p>
          ) : null}

          <MGButton
            type="button"
            variant="primary"
            size="large"
            fullWidth
            className="client-shop__cta-mg"
            disabled={loading || !agreed || checkoutBlocked}
            loading={loading}
            preventDoubleClick
            onClick={handleCheckout}
          >
            {formatShopMoney(cashDueMinor)} 결제하기
          </MGButton>

          {checkoutResult?.orderPublicId ? (
            <p className="client-shop__message">
              주문 번호: {checkoutResult.orderPublicId}
            </p>
          ) : null}
        </>
      )}
    </ShopClientLayout>
  );
};

export default ShopCheckoutPage;
