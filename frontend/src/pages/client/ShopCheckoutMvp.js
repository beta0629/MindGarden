import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentArea from '../../components/dashboard-v2/content/ContentArea';
import ContentHeader from '../../components/dashboard-v2/content/ContentHeader';
import { useSession } from '../../hooks/useSession';
import StandardizedApi from '../../utils/standardizedApi';
import { CLIENT_SHOP_API } from '../../constants/clientShopApi';

const PAGE_TITLE_ID = 'client-shop-checkout-mvp-title';

/**
 * 내담자 온라인 결제 MVP — 카탈로그·장바구니·체크아웃·prepare-payment (StandardizedApi).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
const ShopCheckoutMvp = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: sessionLoading } = useSession();
  const [catalog, setCatalog] = useState([]);
  const [cart, setCart] = useState(null);
  const [balance, setBalance] = useState(null);
  const [pointsInput, setPointsInput] = useState('0');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastCheckout, setLastCheckout] = useState(null);
  const [lastPayment, setLastPayment] = useState(null);

  const loadAll = useCallback(async() => {
    try {
      setLoading(true);
      setMessage('');
      const [cRes, cartRes, balRes] = await Promise.all([
        StandardizedApi.get(CLIENT_SHOP_API.CATALOG),
        StandardizedApi.get(CLIENT_SHOP_API.CART),
        StandardizedApi.get(CLIENT_SHOP_API.POINTS_BALANCE)
      ]);
      if (cRes && cRes.success) {
        setCatalog(Array.isArray(cRes.data) ? cRes.data : []);
      }
      if (cartRes && cartRes.success) {
        setCart(cartRes.data || { lines: [], subtotalMinor: 0 });
      }
      if (balRes && balRes.success) {
        setBalance(balRes.data || { availableMinor: 0, heldMinor: 0 });
      }
    } catch (e) {
      console.error(e);
      setMessage(e.message || '불러오기에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
      return;
    }
    loadAll();
  }, [sessionLoading, isLoggedIn, navigate, loadAll]);

  const addToCart = async(skuCode) => {
    try {
      setLoading(true);
      setMessage('');
      const currentLines = (cart && cart.lines) ? cart.lines.map((l) => ({
        skuCode: l.skuCode,
        quantity: l.quantity
      })) : [];
      const idx = currentLines.findIndex((l) => l.skuCode === skuCode);
      if (idx >= 0) {
        currentLines[idx] = { skuCode, quantity: Math.min(99, currentLines[idx].quantity + 1) };
      } else {
        currentLines.push({ skuCode, quantity: 1 });
      }
      const res = await StandardizedApi.put(CLIENT_SHOP_API.CART, { lines: currentLines });
      if (res && res.success) {
        await loadAll();
      } else {
        setMessage(res?.message || '장바구니 갱신에 실패했습니다.');
      }
    } catch (e) {
      setMessage(e.message || '장바구니 갱신에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const checkout = async() => {
    try {
      setLoading(true);
      setMessage('');
      setLastPayment(null);
      const idem =
        (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : `idem-${Date.now()}`;
      const points = Math.max(0, parseInt(pointsInput, 10) || 0);
      const res = await StandardizedApi.post(CLIENT_SHOP_API.CHECKOUT, {
        idempotencyKey: idem,
        pointsToRedeemMinor: points
      });
      if (res && res.success) {
        setLastCheckout(res.data);
        setMessage('체크아웃이 완료되었습니다.');
        if (res.data && res.data.nextStep === 'PAYMENT' && res.data.orderPublicId) {
          const payRes = await StandardizedApi.post(
            CLIENT_SHOP_API.preparePayment(res.data.orderPublicId),
            {}
          );
          if (payRes && payRes.success) {
            setLastPayment(payRes.data);
          } else {
            setMessage(payRes?.message || '결제 준비에 실패했습니다.');
          }
        }
        await loadAll();
      } else {
        setMessage(res?.message || '체크아웃에 실패했습니다.');
      }
    } catch (e) {
      setMessage(e.message || '체크아웃에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading || !isLoggedIn) {
    return null;
  }

  const subtotal = cart ? cart.subtotalMinor : 0;

  return (
    <div className="mg-v2-ad-b0kla" data-testid="client-shop-checkout-mvp">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="온라인 결제 MVP">
          <ContentHeader
            title="온라인 상품 결제 (MVP)"
            subtitle="카탈로그·장바구니·체크아웃·결제 준비까지 한 화면에서 테스트합니다."
            titleId={PAGE_TITLE_ID}
          />
          <main aria-labelledby={PAGE_TITLE_ID} className="mg-v2-stack">
            {message ? (
              <p className="mg-v2-text-body" role="status">{message}</p>
            ) : null}
            {loading ? <p className="mg-v2-text-muted">처리 중…</p> : null}
            <section aria-label="포인트 잔액">
              <h2 className="mg-v2-heading-sm">포인트</h2>
              {balance ? (
                <p className="mg-v2-text-body">
                  가용 {balance.availableMinor}원 · 예약 {balance.heldMinor}원
                </p>
              ) : (
                <p className="mg-v2-text-muted">잔액을 불러오는 중입니다.</p>
              )}
              <label className="mg-v2-text-body" htmlFor="shop-points-input">사용 포인트(원)</label>
              <input
                id="shop-points-input"
                type="number"
                min="0"
                className="mg-v2-input"
                value={pointsInput}
                onChange={(e) => setPointsInput(e.target.value)}
              />
            </section>
            <section aria-label="카탈로그">
              <h2 className="mg-v2-heading-sm">카탈로그</h2>
              {catalog.length === 0 ? (
                <p className="mg-v2-text-muted">노출된 상품이 없습니다. 테넌트에 SKU를 등록해 주세요.</p>
              ) : (
                <ul className="mg-v2-stack">
                  {catalog.map((row) => (
                    <li key={row.skuCode} className="mg-v2-card">
                      <div className="mg-v2-text-body">{row.title}</div>
                      <div className="mg-v2-text-muted">{row.skuCode} · {row.unitPriceMinor}원</div>
                      <button
                        type="button"
                        className="mg-v2-btn mg-v2-btn--secondary"
                        onClick={() => addToCart(row.skuCode)}
                        disabled={loading}
                      >
                        장바구니 담기
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section aria-label="장바구니">
              <h2 className="mg-v2-heading-sm">장바구니</h2>
              <p className="mg-v2-text-body">합계 {subtotal}원</p>
              {cart && cart.lines && cart.lines.length > 0 ? (
                <ul className="mg-v2-stack">
                  {cart.lines.map((l) => (
                    <li key={l.skuCode} className="mg-v2-text-body">
                      {l.title} × {l.quantity} = {l.lineTotalMinor}원
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mg-v2-text-muted">장바구니가 비어 있습니다.</p>
              )}
            </section>
            <section aria-label="체크아웃">
              <button
                type="button"
                className="mg-v2-btn mg-v2-btn--primary"
                onClick={checkout}
                disabled={loading || !cart || !cart.lines || cart.lines.length === 0}
              >
                체크아웃 및 (필요 시) 결제 준비
              </button>
              {lastCheckout ? (
                <pre className="mg-v2-text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(lastCheckout, null, 2)}
                </pre>
              ) : null}
              {lastPayment ? (
                <pre className="mg-v2-text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(lastPayment, null, 2)}
                </pre>
              ) : null}
            </section>
          </main>
        </ContentArea>
      </div>
    </div>
  );
};

export default ShopCheckoutMvp;
