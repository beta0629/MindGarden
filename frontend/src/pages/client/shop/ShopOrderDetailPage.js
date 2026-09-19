/**
 * ShopOrderDetailPage — 주문 상세 + 미결제 시 결제 준비 (Phase 2a)
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import FulfillmentLineList from '../../../components/shop/molecules/FulfillmentLineList';
import CheckoutSummary from '../../../components/shop/organisms/CheckoutSummary';
import {
  canConfirmShopPayment,
  CLIENT_SHOP_ROUTES,
  CLIENT_SHOP_TEST_IDS,
  formatShopSessionCountDisplay,
  isShopOrderAwaitingPayment,
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_ORDER_STATUS_LABELS,
  SHOP_PAYMENT_LAUNCH_COPY
} from '../../../constants/clientShopConstants';
import {
  CLIENT_WEB_SUITE_COPY,
  CLIENT_WEB_SUITE_TEST_IDS
} from '../../../constants/clientWebSuiteConstants';
import SafeText from '../../../components/common/SafeText';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import {
  fetchShopOrder,
  prepareShopPayment
} from '../../../services/clientShopService';
import {
  assertPortOneCustomerReadyBeforeCheckout,
  buildPortOneCustomerFromUser,
  resolvePortOneCustomerFailMessage
} from '../../../utils/clientShopPaymentCustomer';
import { runShopPortOnePaymentIfReady } from '../../../utils/shopPortOneCheckout';
import { verifyShopPaymentWithRetry } from '../../../utils/shopPaymentVerifyRetry';
import { formatShopMoney } from '../../../utils/clientShopFormat';
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
import { useTranslation } from 'react-i18next';

/**
 * checkout → 주문 상세 navigate state 메시지를 1회만 읽는다.
 * @param {unknown} state
 * @returns {string}
 */
const readShopCheckoutMessageOnce = (state) => {
  if (!state || state.shopCheckoutMessage == null) {
    return '';
  }
  return String(state.shopCheckoutMessage).trim();
};

const ShopOrderDetailPage = () => {
  const { t } = useTranslation();
  const [alert, AlertModal] = useAlert();
  const { orderPublicId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionLoading, isLoggedIn, user } = useClientShopAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const pendingCheckoutMessageRef = useRef(
    readShopCheckoutMessageOnce(location.state)
  );
  const checkoutStateClearedRef = useRef(false);

  const portOneCustomerGate = useMemo(
    () => assertPortOneCustomerReadyBeforeCheckout(user),
    [user]
  );

  const consumePendingCheckoutMessage = useCallback(() => {
    const pending = pendingCheckoutMessageRef.current;
    if (!pending) {
      return;
    }
    pendingCheckoutMessageRef.current = '';
    setMessage(pending);
  }, []);

  const loadOrder = useCallback(async() => {
    if (!orderPublicId) {
      return;
    }
    try {
      setLoading(true);
      setMessage('');
      const data = await fetchShopOrder(orderPublicId);
      if (!data) {
        setMessage('주문을 찾을 수 없습니다.');
        setOrder(null);
        return;
      }
      setOrder(data);
      consumePendingCheckoutMessage();
    } catch (e) {
      setMessage(e.message || '주문 상세를 불러오지 못했습니다.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderPublicId, consumePendingCheckoutMessage]);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn) {
      loadOrder();
    }
  }, [sessionLoading, isLoggedIn, loadOrder]);

  useEffect(() => {
    if (checkoutStateClearedRef.current) {
      return;
    }
    const raw = readShopCheckoutMessageOnce(location.state);
    if (!raw) {
      return;
    }
    pendingCheckoutMessageRef.current = raw;
    checkoutStateClearedRef.current = true;
    navigate(`${location.pathname}${location.search || ''}`, {
      replace: true,
      state: {}
    });
  }, [location.state, location.pathname, location.search, navigate]);

  const showMinCardPaymentAlert = async() => {
    await alert({
      variant: 'warning',
      titleKey: PAYMENT_MIN_CARD_AMOUNT_TITLE_I18N_KEY,
      messageKey: PAYMENT_MIN_CARD_AMOUNT_I18N_KEY,
      interpolation: { amount: formatPaymentAmountForDisplay(MIN_PAYMENT_AMOUNT) }
    });
  };

  const handleConfirmPendingPayment = async() => {
    const paymentId = order?.paymentId && String(order.paymentId).trim();
    const cashDue = order?.cashDueMinor;
    if (!paymentId) {
      setMessage(SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED);
      return;
    }
    if (cashDue == null || !Number.isFinite(Number(cashDue))) {
      setMessage(SHOP_CHECKOUT_ERROR_COPY.INVALID_CASH_AMOUNT);
      return;
    }
    try {
      setLoading(true);
      setMessage(SHOP_PAYMENT_LAUNCH_COPY.CONFIRM_PENDING_PAYMENT_VERIFYING);
      await verifyShopPaymentWithRetry(paymentId, Number(cashDue));
      setMessage(SHOP_PAYMENT_LAUNCH_COPY.PAYMENT_COMPLETED);
      const refreshed = await fetchShopOrder(orderPublicId);
      if (!refreshed) {
        throw new Error(SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED);
      }
      setOrder(refreshed);
    } catch (e) {
      setMessage((e && e.message) || SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handlePreparePayment = async() => {
    if (!orderPublicId) {
      return;
    }
    if (isBelowMinCardCashDue(order?.cashDueMinor)) {
      await showMinCardPaymentAlert();
      return;
    }
    try {
      setLoading(true);
      setMessage('');
      const customer = buildPortOneCustomerFromUser(user);
      if (!customer || !portOneCustomerGate.ready) {
        setMessage(
          portOneCustomerGate.message
            || resolvePortOneCustomerFailMessage(user)
            || SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED
        );
        return;
      }
      const result = await prepareShopPayment(orderPublicId);
      const portoneFlow = await runShopPortOnePaymentIfReady(result, {
        orderName: `주문 ${orderPublicId}`,
        customer
      });
      if (portoneFlow.skipped) {
        if (result?.paymentUrl) {
          setPaymentUrl(result.paymentUrl);
          window.open(result.paymentUrl, '_blank', 'noopener,noreferrer');
        }
        setMessage('결제 페이지를 열었습니다. 완료 후 이 화면을 새로고침해 주세요.');
      } else if (portoneFlow.verified) {
        setMessage('결제가 완료되었습니다.');
      } else {
        setMessage('결제 모듈 호출이 완료되었습니다. 승인 반영까지 잠시 후 새로고침해 주세요.');
      }
      await loadOrder();
    } catch (e) {
      const errMsg = e.message || '';
      if (
        isBelowMinCardCashDue(order?.cashDueMinor)
        || errMsg.includes('최소 금액')
        || errMsg.includes('카드 결제는')
        || errMsg.includes(String(MIN_PAYMENT_AMOUNT))
        || errMsg.includes(formatPaymentAmountForDisplay(MIN_PAYMENT_AMOUNT))
      ) {
        await showMinCardPaymentAlert();
      } else {
        setMessage(errMsg || '결제 준비에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading || !isLoggedIn) {
    return <ShopClientSessionLoading title="주문 상세" />;
  }

  const awaitingPayment = isShopOrderAwaitingPayment(order);
  const canConfirmPendingPayment = canConfirmShopPayment(order);
  const displayPaymentId =
    order?.paymentId != null && String(order.paymentId).trim()
      ? String(order.paymentId).trim()
      : '';
  const lines = order?.lines || [];

  return (
    <ShopClientLayout title="주문 상세" testId="client-shop-order-detail">
      <AlertModal />
      <p className="client-shop__message">
        <Link to={CLIENT_SHOP_ROUTES.ORDERS}>← 내 구매 목록</Link>
      </p>

      {loading && !order ? (
        <p className="client-shop__message">불러오는 중…</p>
      ) : null}

      {message ? (
        <p
          className={`client-shop__message${
            order ? '' : ' client-shop__message--error'
          }`}
          role={order ? 'status' : 'alert'}
        >
          {message}
        </p>
      ) : null}

      {order ? (
        <>
          <section className="client-shop__section" aria-label="주문 정보">
            <h2 className="client-shop__section-title">주문 정보</h2>
            <p className="client-shop__summary-row">
              <span>{t('common.labels.status')}</span>
              <span>{SHOP_ORDER_STATUS_LABELS[order.status] || order.status}</span>
            </p>
            <p className="client-shop__summary-row">
              <span>주문 번호</span>
              <span>{order.orderPublicId}</span>
            </p>
            {displayPaymentId ? (
              <p className="client-shop__summary-row">
                <span>{SHOP_PAYMENT_LAUNCH_COPY.PAYMENT_ID_LABEL}</span>
                <span>{displayPaymentId}</span>
              </p>
            ) : null}
          </section>

          <FulfillmentLineList fulfillmentLines={order.fulfillmentLines} />

          <section className="client-shop__section" aria-label="주문 상품">
            <h2 className="client-shop__section-title">주문 상품</h2>
            {lines.length === 0 ? (
              <p className="client-shop__empty">상품 정보가 없습니다.</p>
            ) : (
              lines.map((line) => (
                <p key={`${line.lineNo}-${line.skuCode}`} className="client-shop__summary-row">
                  <span>
                    <SafeText>{line.title}</SafeText>
                    {' × '}
                    {line.quantity}
                    {' · '}
                    <SafeText>{formatShopSessionCountDisplay(line.sessionCount)}</SafeText>
                  </span>
                  <span>{formatShopMoney(line.lineTotalMinor)}</span>
                </p>
              ))
            )}
          </section>

          <CheckoutSummary
            subtotalMinor={order.subtotalMinor}
            pointsRedeemMinor={order.pointsRedeemMinor}
            cashDueMinor={order.cashDueMinor}
          />

          {canConfirmPendingPayment ? (
            <button
              type="button"
              className="client-shop__cta"
              disabled={loading}
              data-testid={CLIENT_SHOP_TEST_IDS.ORDER_DETAIL_CONFIRM_PAYMENT}
              onClick={handleConfirmPendingPayment}
            >
              {SHOP_PAYMENT_LAUNCH_COPY.CONFIRM_PENDING_PAYMENT}
            </button>
          ) : null}

          {awaitingPayment && !canConfirmPendingPayment ? (
            <>
              {!portOneCustomerGate.ready && portOneCustomerGate.message ? (
                <div
                  className="client-shop__message client-shop__message--error"
                  role="alert"
                  data-testid={CLIENT_WEB_SUITE_TEST_IDS.ORDER_DETAIL_PHONE_GATE}
                >
                  <p>{portOneCustomerGate.message}</p>
                  <Link
                    className="client-web-page-shell__cta client-web-page-shell__cta--ghost"
                    to="/client/settings"
                  >
                    {CLIENT_WEB_SUITE_COPY.CHECKOUT_SETTINGS_LINK}
                  </Link>
                </div>
              ) : null}
              <button
                type="button"
                className="client-shop__cta"
                disabled={loading || !portOneCustomerGate.ready}
                onClick={handlePreparePayment}
              >
                {formatShopMoney(order.cashDueMinor)} 결제하기
              </button>
              {paymentUrl ? (
                <p className="client-shop__message">
                  <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
                    결제 페이지 다시 열기
                  </a>
                </p>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </ShopClientLayout>
  );
};

export default ShopOrderDetailPage;
