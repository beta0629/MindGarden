/**
 * ShopOrdersPage — 내 구매 목록 (Phase 2a)
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import {
  buildShopOrderDetailPath,
  CLIENT_SHOP_ROUTES,
  SHOP_ORDER_STATUS_LABELS
} from '../../../constants/clientShopConstants';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import { fetchShopOrders } from '../../../services/clientShopService';
import { formatShopDateTime, formatShopMoney, formatShopPoints } from '../../../utils/clientShopFormat';

const ShopOrdersPage = () => {
  const { sessionLoading, isLoggedIn } = useClientShopAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setMessage('');
      setOrders(await fetchShopOrders(0, 20));
    } catch (e) {
      setMessage(e.message || '주문 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn) {
      loadOrders();
    }
  }, [sessionLoading, isLoggedIn, loadOrders]);

  if (sessionLoading || !isLoggedIn) {
    return null;
  }

  return (
    <ShopClientLayout title="내 구매" testId="client-shop-orders">
      {message ? (
        <p className="client-shop__message client-shop__message--error" role="alert">
          {message}
        </p>
      ) : null}
      {loading && orders.length === 0 ? (
        <p className="client-shop__message">불러오는 중…</p>
      ) : null}
      {orders.length === 0 && !loading ? (
        <p className="client-shop__empty">
          주문 내역이 없습니다.{' '}
          <Link to={CLIENT_SHOP_ROUTES.CATALOG}>상품 보러 가기</Link>
        </p>
      ) : (
        <ul className="client-shop__order-list">
          {orders.map((order) => (
            <li key={order.orderPublicId}>
              <Link
                to={buildShopOrderDetailPath(order.orderPublicId)}
                className="client-shop__order-card"
              >
                <div className="client-shop__order-card-main">
                  <p className="client-shop__order-status">
                    {SHOP_ORDER_STATUS_LABELS[order.status] || order.status}
                  </p>
                  <p className="client-shop__order-id">주문 {order.orderPublicId}</p>
                  <p className="client-shop__order-date">
                    {formatShopDateTime(order.createdAt)}
                  </p>
                </div>
                <div className="client-shop__order-card-amount">
                  {order.pointsRedeemMinor > 0 ? (
                    <span className="client-shop__ledger-amount">
                      - {formatShopPoints(order.pointsRedeemMinor)}
                    </span>
                  ) : null}
                  <span className="client-shop__price">
                    {formatShopMoney(order.cashDueMinor ?? order.subtotalMinor)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ShopClientLayout>
  );
};

export default ShopOrdersPage;
