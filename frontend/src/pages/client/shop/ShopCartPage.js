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
import MallSessionChip from '../../../components/shop/atoms/MallSessionChip';
import MallEmptyState from '../../../components/shop/molecules/MallEmptyState';
import MallQtyStepper from '../../../components/shop/molecules/MallQtyStepper';
import MallUsageBanner from '../../../components/shop/molecules/MallUsageBanner';
import MallCartBar from '../../../components/shop/organisms/MallCartBar';
import MGButton from '../../../components/common/MGButton';
import SafeText from '../../../components/common/SafeText';
import {
  CLIENT_MALL_CHECKOUT_COPY,
  CLIENT_MALL_COPY,
  CLIENT_MALL_TEST_IDS,
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
  formatMallSessionLabel,
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
    <section className="client-mall-cart" data-testid={CLIENT_MALL_TEST_IDS.CART_PAGE_ASIDE}>
      <h2 className="client-mall-cart__title">{CLIENT_MALL_COPY.CART_PAGE_SUMMARY_TITLE}</h2>
      <dl className="client-mall-pay__rows">
        {cart.lines.map((line) => (
          <div key={line.skuCode} className="client-mall-pay__row">
            <dt>
              <SafeText>{line.title}</SafeText>
              {CLIENT_MALL_COPY.LINE_TIMES}
              {line.quantity}
            </dt>
            <dd>{formatMallWon((Number(line.unitPriceMinor) || 0) * line.quantity)}</dd>
          </div>
        ))}
        <div className="client-mall-pay__row">
          <dt>{CLIENT_MALL_COPY.CART_PAGE_SESSIONS}</dt>
          <dd>{formatMallSessionLabel(summary.totalSessions)}</dd>
        </div>
      </dl>
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
        preventDoubleClick={false}
        className="client-mall-btn client-mall-btn--primary"
        onClick={goCheckout}
      >
        {CLIENT_MALL_COPY.CART_CHECKOUT}
      </MGButton>
      {summary.validityMonths != null ? (
        <p className="client-mall-pay__meta">
          {CLIENT_MALL_COPY.VALIDITY_PREFIX}
          {summary.validityMonths}
          {CLIENT_MALL_COPY.CART_PAGE_VALIDITY_SUFFIX}
        </p>
      ) : null}
      <p className="client-mall-cart__help">{CLIENT_MALL_COPY.CART_NEXT_HINT}</p>
    </section>
  );

  return (
    <ShopClientLayout
      title={CLIENT_MALL_COPY.CART_TITLE}
      testId={CLIENT_SHOP_TEST_IDS.CART_PAGE}
      meta={<p className="client-mall-page__subtitle">{CLIENT_MALL_COPY.CART_PAGE_SUBTITLE}</p>}
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
          <section className="client-mall-box" aria-label={CLIENT_MALL_COPY.CART_TITLE}>
            <header className="client-mall-box__head">
              <h2 className="client-mall-box__title">{CLIENT_MALL_COPY.CART_PAGE_LIST_TITLE}</h2>
              <span className="client-mall-box__caption" data-testid={CLIENT_MALL_TEST_IDS.CART_PAGE_LIST_COUNT}>
                {summary.quantity}
                {CLIENT_MALL_COPY.CART_COUNT_SUFFIX}
              </span>
            </header>
            {cart.lines.map((line) => {
              const months = resolveValidityMonths(bySku.get(line.skuCode));
              return (
                <article key={line.skuCode} className="client-mall-line client-mall-line--cart">
                  <header className="client-mall-line__head">
                    <div className="client-mall-line__name">
                      <p className="client-mall-line__title">
                        <SafeText>{line.title}</SafeText>
                        <MallSessionChip sessionCount={line.sessionCount} testId={`cart-session-ticket-${line.skuCode}`} />
                      </p>
                      <p className="client-mall-line__unit">
                        {formatMallWon(line.unitPriceMinor)}
                        {months != null ? `${CLIENT_MALL_CHECKOUT_COPY.PAY_ROW_POINTS_SEPARATOR}${formatValidityLabel(months)}` : ''}
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
                    />
                    <button
                      type="button"
                      className="client-mall-link-btn"
                      onClick={() => mall.remove(line.skuCode)}
                    >
                      {CLIENT_MALL_COPY.CART_REMOVE}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
          <MallUsageBanner text={CLIENT_MALL_USAGE_BANNER} example={CLIENT_MALL_USAGE_BANNER_EXAMPLE} />
          <div className="client-mall-bar-spacer" aria-hidden="true" />
          <MallCartBar
            quantity={summary.quantity}
            subtotalMinor={summary.subtotalMinor}
            onAction={goCheckout}
          />
        </>
      ) : null}
    </ShopClientLayout>
  );
};

export default ShopCartPage;
