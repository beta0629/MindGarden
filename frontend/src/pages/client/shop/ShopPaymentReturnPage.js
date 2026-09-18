/**
 * ShopPaymentReturnPage — PortOne redirect 복귀 후 BE verify (P0 money).
 *
 * @author MindGarden
 * @since 2026-09-17
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import {
  buildShopOrderDetailPath,
  clearShopPendingPaymentVerify,
  CLIENT_SHOP_ROUTES,
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_PAYMENT_RETURN_COPY
} from '../../../constants/clientShopConstants';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import { fetchShopOrder } from '../../../services/clientShopService';
import {
  parseShopPaymentReturnQuery,
  resolveShopPaymentReturnPaymentId,
  resolveShopPaymentVerifyAmount
} from '../../../utils/clientShopPaymentReturn';
import { verifyShopPaymentWithRetry } from '../../../utils/shopPaymentVerifyRetry';

const ShopPaymentReturnPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { sessionLoading, isLoggedIn } = useClientShopAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [orderPublicId, setOrderPublicId] = useState(null);
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
        const detailId = query.orderPublicId;
        if (detailId) {
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

  if (sessionLoading || !isLoggedIn) {
    return <ShopClientSessionLoading title={SHOP_PAYMENT_RETURN_COPY.TITLE} />;
  }

  const orderLink = orderPublicId
    ? buildShopOrderDetailPath(orderPublicId)
    : CLIENT_SHOP_ROUTES.ORDERS;

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
      {error ? (
        <p className="client-shop__message">
          <Link to={orderLink}>
            {orderPublicId
              ? SHOP_PAYMENT_RETURN_COPY.ORDER_LINK
              : SHOP_PAYMENT_RETURN_COPY.ORDERS_LINK}
          </Link>
        </p>
      ) : null}
    </ShopClientLayout>
  );
};

export default ShopPaymentReturnPage;
