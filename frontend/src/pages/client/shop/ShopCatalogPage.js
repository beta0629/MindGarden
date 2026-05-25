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
  SHOP_CATEGORY_TABS,
  CLIENT_SHOP_ROUTES,
  CLIENT_SHOP_TEST_IDS,
  CLIENT_SHOP_CATALOG_EMPTY_TEST_ID,
  SHOP_SKU_ADD_FIRST_TEST_ID,
  normalizeShopCatalogCategory,
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
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [message, setMessage] = useState('');

  const loadCatalog = useCallback(async() => {
    try {
      setLoading(true);
      setCatalogLoaded(false);
      setMessage('');
      setCatalog(await fetchShopCatalog());
    } catch (e) {
      setCatalog([]);
      setMessage(e.message || '카탈로그를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setCatalogLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn) {
      loadCatalog();
    }
  }, [sessionLoading, isLoggedIn, loadCatalog]);

  /** 활성 탭에 SKU 없으면 동기 fallback — useEffect 탭 전환 시 empty testid 1프레임 노출 방지 */
  const displayCategory = useMemo(() => {
    if (catalog.length === 0) {
      return activeCategory;
    }
    const hasInActiveTab = catalog.some(
      (row) => normalizeShopCatalogCategory(row.catalogCategory) === activeCategory
    );
    if (hasInActiveTab) {
      return activeCategory;
    }
    const tabWithSkus = SHOP_CATEGORY_TABS.find((tab) =>
      catalog.some(
        (row) => normalizeShopCatalogCategory(row.catalogCategory) === tab.key
      )
    );
    return tabWithSkus?.key ?? activeCategory;
  }, [catalog, activeCategory]);

  const filteredCatalog = useMemo(
    () =>
      catalog.filter(
        (row) => normalizeShopCatalogCategory(row.catalogCategory) === displayCategory
      ),
    [catalog, displayCategory]
  );

  useEffect(() => {
    if (displayCategory !== activeCategory && catalog.length > 0) {
      setActiveCategory(displayCategory);
    }
  }, [displayCategory, activeCategory, catalog.length]);

  const handleAddToCart = async(skuCode) => {
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
      <ShopCategoryTabs activeKey={displayCategory} onChange={setActiveCategory} />
      {message ? (
        <p className="client-shop__message client-shop__message--error" role="alert">
          {message}
        </p>
      ) : null}
      {loading && !catalogLoaded ? (
        <p className="client-shop__message" data-testid={CLIENT_SHOP_TEST_IDS.CATALOG_LOADING}>
          불러오는 중…
        </p>
      ) : null}
      {catalogLoaded && !loading && filteredCatalog.length === 0 ? (
        <p className="client-shop__empty" data-testid={CLIENT_SHOP_CATALOG_EMPTY_TEST_ID}>
          이 카테고리에 노출된 상품이 없습니다.
        </p>
      ) : null}
      {filteredCatalog.length > 0 ? (
        <div className="client-shop__grid" role="list">
          {filteredCatalog.map((sku, index) => (
            <SkuCard
              key={sku.skuCode}
              sku={sku}
              loading={loading}
              detailTo={buildShopSkuDetailPath(sku.skuCode)}
              onAddToCart={() => handleAddToCart(sku.skuCode)}
              addButtonTestId={index === 0 ? SHOP_SKU_ADD_FIRST_TEST_ID : null}
            />
          ))}
        </div>
      ) : null}
    </ShopClientLayout>
  );
};

export default ShopCatalogPage;
