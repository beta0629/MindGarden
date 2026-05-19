/**
 * ShopSkuDetailPage — SKU 상세 PDP 골격 (Phase 2a)
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Coins } from 'lucide-react';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import PriceText from '../../../components/shop/atoms/PriceText';
import { CLIENT_SHOP_ROUTES } from '../../../constants/clientShopConstants';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import {
  fetchShopCart,
  fetchShopCatalogSku,
  mergeCartLine,
  replaceShopCart
} from '../../../services/clientShopService';

const ShopSkuDetailPage = () => {
  const { skuCode } = useParams();
  const navigate = useNavigate();
  const { sessionLoading, isLoggedIn } = useClientShopAuth();
  const [sku, setSku] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadSku = useCallback(async () => {
    if (!skuCode) {
      return;
    }
    try {
      setLoading(true);
      setMessage('');
      const row = await fetchShopCatalogSku(decodeURIComponent(skuCode));
      if (!row) {
        setMessage('상품을 찾을 수 없거나 노출되지 않습니다.');
        setSku(null);
        return;
      }
      setSku(row);
    } catch (e) {
      setMessage(e.message || '상품 정보를 불러오지 못했습니다.');
      setSku(null);
    } finally {
      setLoading(false);
    }
  }, [skuCode]);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn) {
      loadSku();
    }
  }, [sessionLoading, isLoggedIn, loadSku]);

  const handleAddToCart = async () => {
    if (!sku?.skuCode) {
      return;
    }
    try {
      setLoading(true);
      setMessage('');
      const cart = await fetchShopCart();
      const lines = mergeCartLine(cart.lines, sku.skuCode, 1);
      await replaceShopCart(lines);
      navigate(CLIENT_SHOP_ROUTES.CART);
    } catch (e) {
      setMessage(e.message || '장바구니에 담지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading || !isLoggedIn) {
    return <ShopClientSessionLoading title="상품 상세" />;
  }

  return (
    <ShopClientLayout title="상품 상세" testId="client-shop-sku-detail">
      <p className="client-shop__message">
        <Link to={CLIENT_SHOP_ROUTES.CATALOG}>← 상품 목록</Link>
      </p>

      {loading && !sku ? (
        <p className="client-shop__message">불러오는 중…</p>
      ) : null}

      {message ? (
        <p className="client-shop__message client-shop__message--error" role="alert">
          {message}
        </p>
      ) : null}

      {sku ? (
        <article className="client-shop__pdp" data-testid={`sku-detail-${sku.skuCode}`}>
          <span className="client-shop__accent-bar client-shop__pdp-accent" aria-hidden />
          <div className="client-shop__pdp-body">
            <h2 className="client-shop__sku-title">{sku.title}</h2>
            {sku.descriptionText ? (
              <p className="client-shop__sku-desc">{sku.descriptionText}</p>
            ) : null}
            <div className="client-shop__pdp-price-row">
              <PriceText amountMinor={sku.unitPriceMinor} currency={sku.currency} />
              <Coins size={20} color="var(--mg-color-accent-main)" aria-label="포인트 사용 가능" />
            </div>
            <button
              type="button"
              className="client-shop__cta"
              disabled={loading}
              onClick={handleAddToCart}
            >
              장바구니에 담기
            </button>
          </div>
        </article>
      ) : null}
    </ShopClientLayout>
  );
};

export default ShopSkuDetailPage;
