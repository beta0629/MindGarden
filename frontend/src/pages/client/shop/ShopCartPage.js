/**
 * ShopCartPage — 장바구니 수정 (수량 · 빼기) → 「결제하기」 결제 전 확인 직행
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import SessionCountTicket from '../../../components/shop/atoms/SessionCountTicket';
import MallEmptyState from '../../../components/shop/molecules/MallEmptyState';
import MallQtyStepper from '../../../components/shop/molecules/MallQtyStepper';
import MallUsageBanner from '../../../components/shop/molecules/MallUsageBanner';
import MallCartBar from '../../../components/shop/organisms/MallCartBar';
import MGButton from '../../../components/common/MGButton';
import SafeText from '../../../components/common/SafeText';
import {
  CLIENT_MALL_COPY,
  CLIENT_MALL_USAGE_BANNER,
  CLIENT_MALL_USAGE_BANNER_EXAMPLE
} from '../../../constants/clientMallConstants';
import { CLIENT_SHOP_ROUTES, CLIENT_SHOP_TEST_IDS } from '../../../constants/clientShopConstants';
import { RoleUtils } from '../../../constants/roles';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import useClientMallCart from '../../../hooks/useClientMallCart';
import { fetchShopCatalog } from '../../../services/clientShopService';
import {
  formatMallNumber,
  formatMallWon,
  formatValidityLabel,
  indexCatalogBySku,
  resolveValidityMonths
} from '../../../utils/clientMall';

const ShopCartPage = () => {
  const navigate = useNavigate();
  const { sessionLoading, isLoggedIn, user } = useClientShopAuth({
    loginRedirectPath: CLIENT_SHOP_ROUTES.CART
  });
  const [catalog, setCatalog] = useState([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  const loadCatalog = useCallback(async() => {
    try {
      setCatalog(await fetchShopCatalog({ authenticated: RoleUtils.isClient(user) }));
    } catch {
      setCatalog([]);
    } finally {
      setCatalogLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn && !catalogLoaded) {
      loadCatalog();
    }
  }, [sessionLoading, isLoggedIn, catalogLoaded, loadCatalog]);

  const mall = useClientMallCart({
    isLoggedIn,
    sessionReady: !sessionLoading && isLoggedIn && catalogLoaded,
    catalog
  });

  if (sessionLoading || !isLoggedIn) {
    return <ShopClientSessionLoading title={CLIENT_MALL_COPY.CART_TITLE} />;
  }

  const { cart, summary } = mall;
  const bySku = indexCatalogBySku(catalog);
  const goCheckout = () => navigate(CLIENT_SHOP_ROUTES.CHECKOUT);

  const aside = summary.isEmpty ? null : (
    <section className="client-mall-cart">
      <h2 className="client-mall-cart__title">{CLIENT_MALL_COPY.CART_PAGE_SUMMARY_TITLE}</h2>
      <p className="client-mall-cart__total" data-testid="client-shop-cart-subtotal">
        <span className="client-mall-cart__total-label">{CLIENT_MALL_COPY.CART_TOTAL}</span>
        <span className="client-mall-cart__total-amount">
          <span className="client-mall-cart__total-num">{formatMallNumber(summary.subtotalMinor)}</span>
          {CLIENT_MALL_COPY.WON_UNIT}
        </span>
      </p>
      <MGButton
        variant="primary"
        size="large"
        fullWidth
        disabled={mall.busy}
        preventDoubleClick={false}
        className="client-mall-btn client-mall-btn--primary"
        onClick={goCheckout}
      >
        {CLIENT_MALL_COPY.CART_CHECKOUT}
      </MGButton>
      <p className="client-mall-cart__help">{CLIENT_MALL_COPY.CART_NEXT_HINT}</p>
    </section>
  );

  return (
    <ShopClientLayout
      title={CLIENT_MALL_COPY.CART_TITLE}
      testId={CLIENT_SHOP_TEST_IDS.CART_PAGE}
      aside={aside}
      cartQty={summary.quantity}
      className="client-mall--cart"
    >
      {mall.error ? <p className="client-mall-page__error" role="alert">{mall.error}</p> : null}
      {mall.loaded && summary.isEmpty ? (
        <MallEmptyState
          title={CLIENT_MALL_COPY.CART_EMPTY_TITLE}
          body={CLIENT_MALL_COPY.CART_EMPTY_HELP}
          action={(
            <MGButton
              variant="outline"
              preventDoubleClick={false}
              className="client-mall-btn client-mall-btn--ink-line"
              onClick={() => navigate(CLIENT_SHOP_ROUTES.CATALOG)}
            >
              {CLIENT_MALL_COPY.CART_BROWSE}
            </MGButton>
          )}
        />
      ) : null}
      {!summary.isEmpty ? (
        <>
          <MallUsageBanner text={CLIENT_MALL_USAGE_BANNER} example={CLIENT_MALL_USAGE_BANNER_EXAMPLE} />
          <section className="client-mall-box" aria-label={CLIENT_MALL_COPY.CART_TITLE}>
            {cart.lines.map((line) => {
              const months = resolveValidityMonths(bySku.get(line.skuCode));
              return (
                <article key={line.skuCode} className="client-mall-line client-mall-line--cart">
                  <header className="client-mall-line__head">
                    <div className="client-mall-line__name">
                      <p className="client-mall-line__title">
                        <SafeText>{line.title}</SafeText>
                        <SessionCountTicket
                          sessionCount={line.sessionCount}
                          className="client-mall-chip"
                          testId={`cart-session-ticket-${line.skuCode}`}
                        />
                      </p>
                      <p className="client-mall-line__unit">
                        {formatMallWon(line.unitPriceMinor)}
                        {months != null ? ` · ${formatValidityLabel(months)}` : ''}
                      </p>
                    </div>
                    <span className="client-mall-line__total">
                      {formatMallWon((Number(line.unitPriceMinor) || 0) * line.quantity)}
                    </span>
                  </header>
                  <div className="client-mall-line__controls">
                    <MallQtyStepper
                      quantity={line.quantity}
                      onChange={(delta) => mall.changeQuantity(line.skuCode, delta)}
                      disabled={mall.busy}
                    />
                    <button
                      type="button"
                      className="client-mall-link-btn"
                      onClick={() => mall.remove(line.skuCode)}
                      disabled={mall.busy}
                    >
                      {CLIENT_MALL_COPY.CART_REMOVE}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
          <div className="client-mall-bar-spacer" aria-hidden="true" />
          <MallCartBar
            quantity={summary.quantity}
            subtotalMinor={summary.subtotalMinor}
            onAction={goCheckout}
            disabled={mall.busy}
          />
        </>
      ) : null}
    </ShopClientLayout>
  );
};

export default ShopCartPage;
