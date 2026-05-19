/**
 * ShopSkuDetailPage — SKU 상세 PDP (MVP+ 히어로 이미지·고정 CTA)
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ImageIcon } from 'lucide-react';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import PriceText from '../../../components/shop/atoms/PriceText';
import SafeText from '../../../components/common/SafeText';
import {
  CLIENT_SHOP_ROUTES,
  CLIENT_SHOP_TEST_IDS,
  SHOP_CATEGORY_TABS,
  normalizeShopCatalogCategory
} from '../../../constants/clientShopConstants';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import {
  fetchShopCart,
  fetchShopCatalogSku,
  mergeCartLine,
  replaceShopCart
} from '../../../services/clientShopService';
import { toDisplayString } from '../../../utils/safeDisplay';

const ShopSkuDetailPage = () => {
  const { skuCode } = useParams();
  const navigate = useNavigate();
  const { sessionLoading, isLoggedIn } = useClientShopAuth();
  const [sku, setSku] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  const loadSku = useCallback(async() => {
    if (!skuCode) {
      return;
    }
    try {
      setLoading(true);
      setMessage('');
      setImageFailed(false);
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

  const handleAddToCart = async() => {
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

  const categoryKey = normalizeShopCatalogCategory(sku?.catalogCategory);
  const categoryLabel =
    SHOP_CATEGORY_TABS.find((tab) => tab.key === categoryKey)?.label || categoryKey;
  const thumbnailUrl = toDisplayString(sku?.thumbnailUrl, '');
  const showHeroImage = Boolean(thumbnailUrl) && !imageFailed;

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
          <SafeText>{message}</SafeText>
        </p>
      ) : null}

      {sku ? (
        <article
          className="client-shop__pdp"
          data-testid={CLIENT_SHOP_TEST_IDS.PDP}
        >
          <figure className="client-shop__pdp-image-wrapper">
            {showHeroImage ? (
              <img
                src={thumbnailUrl}
                alt=""
                className="client-shop__pdp-image"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="client-shop__pdp-image-placeholder" aria-hidden>
                <ImageIcon size={40} />
              </div>
            )}
          </figure>

          <div className="client-shop__pdp-body">
            <span className="client-shop__pdp-category-badge">
              <SafeText>{categoryLabel}</SafeText>
            </span>
            <h2 className="client-shop__pdp-title">
              <SafeText>{sku.title}</SafeText>
            </h2>
            <div className="client-shop__pdp-price-row">
              <PriceText amountMinor={sku.unitPriceMinor} currency={sku.currency} />
            </div>
            {sku.descriptionText ? (
              <p className="client-shop__pdp-desc">
                <SafeText>{sku.descriptionText}</SafeText>
              </p>
            ) : null}
          </div>

          <footer className="client-shop__pdp-footer">
            <button
              type="button"
              className="client-shop__cta client-shop__cta--primary"
              disabled={loading}
              onClick={handleAddToCart}
              data-testid={CLIENT_SHOP_TEST_IDS.PDP_ADD_TO_CART}
            >
              장바구니 담기
            </button>
          </footer>
        </article>
      ) : null}
    </ShopClientLayout>
  );
};

export default ShopSkuDetailPage;
