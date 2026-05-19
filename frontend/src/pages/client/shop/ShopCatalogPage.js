/**
 * ShopCatalogPage — PLP (카탈로그 목록)
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import ShopTenantBanner from '../../../components/shop/organisms/ShopTenantBanner';
import ShopCategoryTabs from '../../../components/shop/molecules/ShopCategoryTabs';
import SkuCard from '../../../components/shop/molecules/SkuCard';
import {
  SHOP_CATALOG_CATEGORY,
  CLIENT_SHOP_ROUTES,
  CLIENT_SHOP_TEST_IDS,
  buildShopSkuDetailPath
} from '../../../constants/clientShopConstants';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import {
  fetchShopCatalog,
  fetchShopCart,
  mergeCartLine,
  replaceShopCart
} from '../../../services/clientShopService';

const ShopCatalogPage = () => {
  const navigate = useNavigate();
  const { sessionLoading, isLoggedIn, user } = useClientShopAuth();
  const [catalog, setCatalog] = useState([]);
  const [activeCategory, setActiveCategory] = useState(SHOP_CATALOG_CATEGORY.CONSULTATION);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true);
      setMessage('');
      setCatalog(await fetchShopCatalog());
    } catch (e) {
      setMessage(e.message || '카탈로그를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn) {
      loadCatalog();
    }
  }, [sessionLoading, isLoggedIn, loadCatalog]);

  const filteredCatalog = useMemo(
    () => catalog.filter((row) => row.catalogCategory === activeCategory),
    [catalog, activeCategory]
  );

  const handleAddToCart = async (skuCode) => {
    try {
      setLoading(true);
      setMessage('');
      const cart = await fetchShopCart();
      const lines = mergeCartLine(cart.lines, skuCode, 1);
      await replaceShopCart(lines);
      navigate(CLIENT_SHOP_ROUTES.CART);
    } catch (e) {
      setMessage(e.message || '장바구니에 담지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading || !isLoggedIn) {
    return <ShopClientSessionLoading title="상품 둘러보기" />;
  }

  const tenantLabel = user?.tenantName || user?.organizationName || null;

  return (
    <ShopClientLayout title="상품 둘러보기" testId={CLIENT_SHOP_TEST_IDS.CATALOG_PAGE}>
      <ShopTenantBanner tenantLabel={tenantLabel} />
      <ShopCategoryTabs activeKey={activeCategory} onChange={setActiveCategory} />
      {message ? (
        <p className="client-shop__message client-shop__message--error" role="alert">
          {message}
        </p>
      ) : null}
      {loading && catalog.length === 0 ? (
        <p className="client-shop__message">불러오는 중…</p>
      ) : null}
      {filteredCatalog.length === 0 ? (
        <p className="client-shop__empty">이 카테고리에 노출된 상품이 없습니다.</p>
      ) : (
        <div className="client-shop__grid" role="list">
          {filteredCatalog.map((sku, index) => (
            <SkuCard
              key={sku.skuCode}
              sku={sku}
              loading={loading}
              detailTo={buildShopSkuDetailPath(sku.skuCode)}
              onAddToCart={() => handleAddToCart(sku.skuCode)}
              addButtonTestId={index === 0 ? 'shop-sku-add-first' : null}
            />
          ))}
        </div>
      )}
    </ShopClientLayout>
  );
};

export default ShopCatalogPage;
