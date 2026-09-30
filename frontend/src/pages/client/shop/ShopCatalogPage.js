/**
 * ShopCatalogPage — 내담자 몰 목록 (보통 쇼핑몰 · 결제 최단 경로)
 * 판매 중 + 홈 공개 상품 전부 · 관리자 순서 유지 · 오른쪽 sticky 장바구니 · 좁은 웹 하단 바
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import MallEmptyState from '../../../components/shop/molecules/MallEmptyState';
import MallToast from '../../../components/shop/molecules/MallToast';
import MallUsageBanner from '../../../components/shop/molecules/MallUsageBanner';
import MallBeforeBuyCard from '../../../components/shop/organisms/MallBeforeBuyCard';
import MallCartBar from '../../../components/shop/organisms/MallCartBar';
import MallCartSummary from '../../../components/shop/organisms/MallCartSummary';
import MallProductCard from '../../../components/shop/organisms/MallProductCard';
import {
  CLIENT_MALL_COPY,
  CLIENT_MALL_TEST_IDS,
  CLIENT_MALL_USAGE_BANNER,
  CLIENT_MALL_USAGE_BANNER_EXAMPLE
} from '../../../constants/clientMallConstants';
import {
  CLIENT_SHOP_CATALOG_EMPTY_TEST_ID,
  CLIENT_SHOP_ROUTES,
  CLIENT_SHOP_TEST_IDS,
  SHOP_SKU_ADD_FIRST_TEST_ID,
  buildShopSkuDetailPath
} from '../../../constants/clientShopConstants';
import { RoleUtils } from '../../../constants/roles';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import useClientMallCart from '../../../hooks/useClientMallCart';
import { fetchShopCatalog } from '../../../services/clientShopService';
import { buildBuyNowCheckoutPath } from '../../../utils/clientMallBuyNow';

const buildLoginPath = (redirect) => `/login?redirect=${encodeURIComponent(redirect)}`;

const ShopCatalogPage = () => {
  const navigate = useNavigate();
  const { sessionLoading, isLoggedIn, user } = useClientShopAuth({ requireLogin: false });
  const authenticatedCatalog = isLoggedIn && RoleUtils.isClient(user);
  const [catalog, setCatalog] = useState([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadCatalog = useCallback(async() => {
    try {
      setCatalogLoaded(false);
      setLoadError('');
      setCatalog(await fetchShopCatalog({ authenticated: authenticatedCatalog }));
    } catch {
      setCatalog([]);
      setLoadError(CLIENT_MALL_COPY.LOAD_FAILED);
    } finally {
      setCatalogLoaded(true);
    }
  }, [authenticatedCatalog]);

  useEffect(() => {
    if (!sessionLoading) {
      loadCatalog();
    }
  }, [sessionLoading, loadCatalog]);

  const mall = useClientMallCart({
    isLoggedIn,
    sessionReady: !sessionLoading && catalogLoaded,
    catalog
  });

  const goCheckout = useCallback(() => {
    if (!isLoggedIn) {
      navigate(buildLoginPath(CLIENT_SHOP_ROUTES.CHECKOUT));
      return;
    }
    navigate(CLIENT_SHOP_ROUTES.CHECKOUT);
  }, [isLoggedIn, navigate]);

  const handleBuyNow = useCallback((skuCode) => {
    const path = buildBuyNowCheckoutPath(skuCode);
    navigate(isLoggedIn ? path : buildLoginPath(path));
  }, [isLoggedIn, navigate]);

  if (sessionLoading) {
    return <ShopClientSessionLoading title={CLIENT_MALL_COPY.PAGE_TITLE} />;
  }

  const { summary } = mall;
  const showEmpty = catalogLoaded && catalog.length === 0;

  const aside = (
    <MallCartSummary
      cart={mall.cart}
      summary={summary}
      lastAddedSku={mall.lastAddedSku}
      onCheckout={goCheckout}
    />
  );

  return (
    <ShopClientLayout
      title={CLIENT_MALL_COPY.PAGE_TITLE}
      testId={CLIENT_SHOP_TEST_IDS.CATALOG_PAGE}
      meta={<p className="client-mall-page__subtitle">{CLIENT_MALL_COPY.PAGE_SUBTITLE}</p>}
      aside={aside}
      cartQty={summary.quantity}
      cartPulse={mall.pulse}
      className="client-mall--catalog"
    >
      <MallUsageBanner
        text={CLIENT_MALL_USAGE_BANNER}
        example={CLIENT_MALL_USAGE_BANNER_EXAMPLE}
        testId={CLIENT_MALL_TEST_IDS.USAGE_BANNER}
      />
      {!isLoggedIn ? (
        <p className="client-mall-page__hint" data-testid="client-shop-catalog-login-cta">
          {CLIENT_MALL_COPY.LOGIN_REQUIRED}{' '}
          <Link to={buildLoginPath(CLIENT_SHOP_ROUTES.CATALOG)}>{CLIENT_MALL_COPY.LOGIN_LINK}</Link>
        </p>
      ) : null}
      {loadError || mall.error ? (
        <p className="client-mall-page__error" role="alert">{loadError || mall.error}</p>
      ) : null}
      {!catalogLoaded ? (
        <p className="client-mall-page__hint" data-testid={CLIENT_SHOP_TEST_IDS.CATALOG_LOADING} aria-busy="true" />
      ) : null}
      {showEmpty ? (
        <div data-testid={CLIENT_SHOP_CATALOG_EMPTY_TEST_ID}>
          <MallEmptyState
            title={CLIENT_MALL_COPY.EMPTY_TITLE}
            body={CLIENT_MALL_COPY.EMPTY_BODY}
            testId={CLIENT_MALL_TEST_IDS.CATALOG_EMPTY}
          />
        </div>
      ) : null}
      {catalog.length > 0 ? (
        <>
          <div className="client-mall-list-head" data-testid={CLIENT_MALL_TEST_IDS.LIST_HEAD}>
            <span>
              {CLIENT_MALL_COPY.LIST_HEAD_PREFIX}
              {catalog.length}
              {CLIENT_MALL_COPY.LIST_HEAD_SUFFIX}
            </span>
            <span className="client-mall-list-head__hint">{CLIENT_MALL_COPY.LIST_HEAD_HINT}</span>
          </div>
          <div className="client-mall-grid" role="list" data-testid={CLIENT_MALL_TEST_IDS.CATALOG_GRID}>
            {catalog.map((sku, index) => (
              <div key={sku.skuCode} className="client-mall-grid__cell">
                <MallProductCard
                  sku={sku}
                  addTestId={index === 0 ? SHOP_SKU_ADD_FIRST_TEST_ID : undefined}
                  buyNowTestId={index === 0 ? CLIENT_MALL_TEST_IDS.CARD_BUY_NOW : undefined}
                  detailTo={buildShopSkuDetailPath(sku.skuCode)}
                  onAdd={() => mall.add(sku.skuCode)}
                  onBuyNow={() => handleBuyNow(sku.skuCode)}
                />
              </div>
            ))}
          </div>
        </>
      ) : null}
      <MallBeforeBuyCard />
      <div className="client-mall-bar-spacer" aria-hidden="true" />
      <MallCartBar
        quantity={summary.quantity}
        subtotalMinor={summary.subtotalMinor}
        onAction={goCheckout}
        disabled={summary.isEmpty}
      />
      <MallToast toast={mall.toast} />
    </ShopClientLayout>
  );
};

export default ShopCatalogPage;
