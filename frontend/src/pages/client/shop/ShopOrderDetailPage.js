/**
 * ShopOrderDetailPage — 주문 상세 + 미결제 시 결제 준비 (Phase 2a)
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import FulfillmentLineList from '../../../components/shop/molecules/FulfillmentLineList';
import CheckoutSummary from '../../../components/shop/organisms/CheckoutSummary';
import {
  CLIENT_SHOP_ROUTES,
  isShopOrderAwaitingPayment,
  SHOP_ORDER_STATUS_LABELS
} from '../../../constants/clientShopConstants';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import { fetchShopOrder, prepareShopPayment } from '../../../services/clientShopService';
import { formatShopMoney } from '../../../utils/clientShopFormat';
import { useTranslation } from 'react-i18next';

const ShopOrderDetailPage = () => {
  const { t } = useTranslation();
  const { orderPublicId } = useParams();
  const { sessionLoading, isLoggedIn } = useClientShopAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');

  const loadOrder = useCallback(async () => {
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
    } catch (e) {
      setMessage(e.message || '주문 상세를 불러오지 못했습니다.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderPublicId]);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn) {
      loadOrder();
    }
  }, [sessionLoading, isLoggedIn, loadOrder]);

  const handlePreparePayment = async () => {
    if (!orderPublicId) {
      return;
    }
    try {
      setLoading(true);
      setMessage('');
      const result = await prepareShopPayment(orderPublicId);
      if (result?.paymentUrl) {
        setPaymentUrl(result.paymentUrl);
        window.open(result.paymentUrl, '_blank', 'noopener,noreferrer');
      }
      setMessage('결제 페이지를 열었습니다. 완료 후 이 화면을 새로고침해 주세요.');
      await loadOrder();
    } catch (e) {
      setMessage(e.message || '결제 준비에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading || !isLoggedIn) {
    return <ShopClientSessionLoading title="주문 상세" />;
  }

  const awaitingPayment = isShopOrderAwaitingPayment(order);
  const lines = order?.lines || [];

  return (
    <ShopClientLayout title="주문 상세" testId="client-shop-order-detail">
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
              <span>{t('common.labels.status', '상태')}</span>
              <span>{SHOP_ORDER_STATUS_LABELS[order.status] || order.status}</span>
            </p>
            <p className="client-shop__summary-row">
              <span>주문 번호</span>
              <span>{order.orderPublicId}</span>
            </p>
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
                    {line.title} × {line.quantity}
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

          {awaitingPayment ? (
            <>
              <button
                type="button"
                className="client-shop__cta"
                disabled={loading}
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
