/**
 * ShopPaymentReturnPage — PortOne redirect 복귀 후 BE verify (P0 money).
 * 결제 SUCCESS + FAILED+retryable 이면 주문 상세로 바로 이동하지 않고 재이행 UI 노출.
 *
 * @author MindGarden
 * @since 2026-09-17
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import FulfillmentLineList from '../../../components/shop/molecules/FulfillmentLineList';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import {
  buildShopOrderDetailPath,
  canClientShopFulfillRetry,
  clearShopPendingPaymentVerify,
  CLIENT_SHOP_ROUTES,
  resolveShopFulfillmentLines,
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_FULFILLMENT_RETRY_COPY,
  SHOP_PAYMENT_RETURN_COPY
} from '../../../constants/clientShopConstants';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import {
  fetchShopOrder,
  retryShopOrderFulfillment
} from '../../../services/clientShopService';
import {
  parseShopPaymentReturnQuery,
  resolveShopPaymentReturnPaymentId,
  resolveShopPaymentVerifyAmount
} from '../../../utils/clientShopPaymentReturn';
import { verifyShopPaymentWithRetry } from '../../../utils/shopPaymentVerifyRetry';
import { requestClientHomeMappingsSoftRefresh } from '../../../utils/clientHomeSoftRefresh';

const ShopPaymentReturnPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { sessionLoading, isLoggedIn } = useClientShopAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [orderPublicId, setOrderPublicId] = useState(null);
  const [order, setOrder] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const ranRef = useRef(false);

  useEffect(() => {
    if (sessionLoading || !isLoggedIn || ranRef.current) {
      return;
    }
    ranRef.current = true;

    const run = async() => {
      const query = parseShopPaymentReturnQuery(searchParams);
      setOrderPublicId(query.orderPublicId);

      if (query.code) {
        setError(true);
        setMessage(
          query.message ||
            `결제 모듈 오류: ${query.code}`
        );
        return;
      }

      const paymentId = resolveShopPaymentReturnPaymentId(query);
      if (!paymentId) {
        setError(true);
        setMessage(SHOP_PAYMENT_RETURN_COPY.MISSING_PAYMENT_ID);
        return;
      }

      setMessage(SHOP_PAYMENT_RETURN_COPY.VERIFYING);
      setError(false);

      try {
        const amount = await resolveShopPaymentVerifyAmount({
          paymentId,
          orderPublicId: query.orderPublicId,
          fetchOrder: fetchShopOrder
        });
        await verifyShopPaymentWithRetry(paymentId, amount);
        clearShopPendingPaymentVerify();
        requestClientHomeMappingsSoftRefresh();
        const detailId = query.orderPublicId;
        if (detailId) {
          const paidOrder = await fetchShopOrder(detailId);
          if (canClientShopFulfillRetry(paidOrder)) {
            setOrder(paidOrder);
            setError(false);
            setMessage(SHOP_PAYMENT_RETURN_COPY.PAID_FULFILLMENT_RETRY);
            return;
          }
          navigate(buildShopOrderDetailPath(detailId), { replace: true });
          return;
        }
        navigate(CLIENT_SHOP_ROUTES.ORDERS, { replace: true });
      } catch (e) {
        setError(true);
        setMessage(
          (e && e.message) ||
            SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED
        );
      }
    };

    run();
  }, [sessionLoading, isLoggedIn, searchParams, navigate]);

  const handleFulfillRetry = async() => {
    const id = orderPublicId || order?.orderPublicId;
    if (!id || retrying) {
      return;
    }
    try {
      setRetrying(true);
      setError(false);
      setMessage('');
      const updated = await retryShopOrderFulfillment(id);
      let nextOrder = updated;
      if (updated) {
        setOrder(updated);
      } else {
        const refreshed = await fetchShopOrder(id);
        if (refreshed) {
          setOrder(refreshed);
          nextOrder = refreshed;
        }
      }
      if (canClientShopFulfillRetry(nextOrder)) {
        setMessage(SHOP_FULFILLMENT_RETRY_COPY.FAILED);
      } else {
        setMessage(SHOP_FULFILLMENT_RETRY_COPY.SUCCESS);
        requestClientHomeMappingsSoftRefresh();
      }
    } catch (e) {
      setError(true);
      setMessage((e && e.message) || SHOP_FULFILLMENT_RETRY_COPY.FAILED);
      try {
        const refreshed = await fetchShopOrder(id);
        if (refreshed) {
          setOrder(refreshed);
        }
      } catch {
        // 상태 동기화 실패는 무시 (이미 오류 메시지 표시)
      }
    } finally {
      setRetrying(false);
    }
  };

  if (sessionLoading || !isLoggedIn) {
    return <ShopClientSessionLoading title={SHOP_PAYMENT_RETURN_COPY.TITLE} />;
  }

  const orderLink = orderPublicId
    ? buildShopOrderDetailPath(orderPublicId)
    : CLIENT_SHOP_ROUTES.ORDERS;
  const showFulfillRetry = canClientShopFulfillRetry(order);

  return (
    <ShopClientLayout title={SHOP_PAYMENT_RETURN_COPY.TITLE} testId="client-shop-payment-return">
      {message ? (
        <p
          className={`client-shop__message${error ? ' client-shop__message--error' : ''}`}
          role={error ? 'alert' : 'status'}
        >
          {message}
        </p>
      ) : null}
      {order ? (
        <FulfillmentLineList
          fulfillmentLines={resolveShopFulfillmentLines(order)}
          showRetry={showFulfillRetry}
          retrying={retrying}
          retryDisabled={retrying}
          onRetry={handleFulfillRetry}
        />
      ) : null}
      {error ? (
        <p className="client-shop__message">
          <Link to={orderLink}>
            {orderPublicId
              ? SHOP_PAYMENT_RETURN_COPY.ORDER_LINK
              : SHOP_PAYMENT_RETURN_COPY.ORDERS_LINK}
          </Link>
        </p>
      ) : null}
      {order && !error ? (
        <p className="client-shop__message">
          <Link to={orderLink}>{SHOP_PAYMENT_RETURN_COPY.ORDER_LINK}</Link>
        </p>
      ) : null}
    </ShopClientLayout>
  );
};

export default ShopPaymentReturnPage;
