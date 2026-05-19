/**
 * ShopCartPage — 장바구니
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import PriceText from '../../../components/shop/atoms/PriceText';
import { CLIENT_SHOP_ROUTES } from '../../../constants/clientShopConstants';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import {
  fetchShopCart,
  mergeCartLine,
  replaceShopCart
} from '../../../services/clientShopService';
import { formatShopMoney } from '../../../utils/clientShopFormat';

const ShopCartPage = () => {
  const navigate = useNavigate();
  const { sessionLoading, isLoggedIn } = useClientShopAuth();
  const [cart, setCart] = useState({ lines: [], subtotalMinor: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setMessage('');
      setCart(await fetchShopCart());
    } catch (e) {
      setMessage(e.message || '장바구니를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn) {
      loadCart();
    }
  }, [sessionLoading, isLoggedIn, loadCart]);

  const updateQuantity = async (skuCode, delta) => {
    try {
      setLoading(true);
      setMessage('');
      const lines = mergeCartLine(cart.lines, skuCode, delta);
      await replaceShopCart(lines);
      await loadCart();
    } catch (e) {
      setMessage(e.message || '수량 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading || !isLoggedIn) {
    return null;
  }

  const lines = cart.lines || [];
  const isEmpty = lines.length === 0;

  return (
    <ShopClientLayout title="장바구니" testId="client-shop-cart-page">
      {message ? (
        <p className="client-shop__message client-shop__message--error" role="alert">
          {message}
        </p>
      ) : null}
      {isEmpty ? (
        <p className="client-shop__empty">
          장바구니가 비어 있습니다.{' '}
          <Link to={CLIENT_SHOP_ROUTES.CATALOG}>상품 보러 가기</Link>
        </p>
      ) : (
        <>
          <section className="client-shop__section" aria-label="담은 상품">
            {lines.map((line) => (
              <div key={line.skuCode} className="client-shop__cart-line">
                <div>
                  <p className="client-shop__sku-title">{line.title}</p>
                  <PriceText amountMinor={line.unitPriceMinor} />
                </div>
                <div className="client-shop__qty-controls">
                  <button
                    type="button"
                    className="client-shop__qty-btn"
                    aria-label="수량 감소"
                    disabled={loading}
                    onClick={() => updateQuantity(line.skuCode, -1)}
                  >
                    −
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    type="button"
                    className="client-shop__qty-btn"
                    aria-label="수량 증가"
                    disabled={loading}
                    onClick={() => updateQuantity(line.skuCode, 1)}
                  >
                    +
                  </button>
                </div>
                <span className="client-shop__price">
                  {formatShopMoney(line.lineTotalMinor)}
                </span>
              </div>
            ))}
          </section>
          <p
            className="client-shop__summary-row client-shop__summary-total"
            data-testid="client-shop-cart-subtotal"
          >
            <span>합계</span>
            <span>{formatShopMoney(cart.subtotalMinor)}</span>
          </p>
          <button
            type="button"
            className="client-shop__cta"
            disabled={loading}
            onClick={() => navigate(CLIENT_SHOP_ROUTES.CHECKOUT)}
          >
            결제하기
          </button>
        </>
      )}
    </ShopClientLayout>
  );
};

export default ShopCartPage;
