/**
 * ShopCheckoutPage — 체크아웃·포인트 사용·결제 준비
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import PointInput from '../../../components/shop/molecules/PointInput';
import CheckoutSummary from '../../../components/shop/organisms/CheckoutSummary';
import { formatShopMoney, formatShopPoints } from '../../../utils/clientShopFormat';
import { SHOP_CHECKOUT_AGREEMENT_LABEL, CLIENT_SHOP_ROUTES } from '../../../constants/clientShopConstants';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import {
  fetchPointBalance,
  fetchShopCart,
  postShopCheckout,
  prepareShopPayment
} from '../../../services/clientShopService';

const createIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}`;
};

const ShopCheckoutPage = () => {
  const { sessionLoading, isLoggedIn } = useClientShopAuth();
  const [cart, setCart] = useState({ lines: [], subtotalMinor: 0 });
  const [balance, setBalance] = useState({ availableMinor: 0, heldMinor: 0 });
  const [pointsInput, setPointsInput] = useState('0');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [checkoutResult, setCheckoutResult] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setMessage('');
      const [cartData, balanceData] = await Promise.all([
        fetchShopCart(),
        fetchPointBalance()
      ]);
      setCart(cartData);
      setBalance(balanceData);
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
    const lines = cart.lines || [];
    if (lines.length === 0) {
      setMessage('장바구니가 비어 있습니다.');
      return;
    }
    try {
      setLoading(true);
      setMessage('');
      setCheckoutResult(null);
      const result = await postShopCheckout(createIdempotencyKey(), pointsRedeemMinor);
      setCheckoutResult(result);
      if (result?.nextStep === 'PAYMENT' && result.orderPublicId) {
        await prepareShopPayment(result.orderPublicId);
      }
      setMessage('주문이 접수되었습니다. 결제 안내에 따라 진행해 주세요.');
      await loadData();
    } catch (e) {
      setMessage(e.message || '체크아웃에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading || !isLoggedIn) {
    return null;
  }

  const lines = cart.lines || [];

  return (
    <ShopClientLayout title="결제하기" testId="client-shop-checkout">
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
              <p key={line.skuCode} className="client-shop__summary-row">
                <span>
                  {line.title} × {line.quantity}
                </span>
                <span>{formatShopMoney(line.lineTotalMinor)}</span>
              </p>
            ))}
          </section>

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

          <label className="client-shop__checkbox-row">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>{SHOP_CHECKOUT_AGREEMENT_LABEL}</span>
          </label>

          {message ? (
            <p className="client-shop__message" role="status">
              {message}
            </p>
          ) : null}

          <button
            type="button"
            className="client-shop__cta"
            disabled={loading || !agreed || Boolean(pointsError)}
            onClick={handleCheckout}
          >
            {formatShopMoney(cashDueMinor)} 결제하기
          </button>

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
