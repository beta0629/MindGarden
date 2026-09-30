/**
 * ShopSkuDetailPage — 상품 상세 (건너뛸 수 있는 선택 단계)
 * 「바로 구매」가 화면 유일 primary · 장바구니 요약의 「결제하기」는 secondary
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import MallSessionChip from '../../../components/shop/atoms/MallSessionChip';
import MallEmptyState from '../../../components/shop/molecules/MallEmptyState';
import MallInfoRows from '../../../components/shop/molecules/MallInfoRows';
import MallPaymentCancelNotice from '../../../components/shop/molecules/MallPaymentCancelNotice';
import MallPrice from '../../../components/shop/molecules/MallPrice';
import MallQtyStepper from '../../../components/shop/molecules/MallQtyStepper';
import MallToast from '../../../components/shop/molecules/MallToast';
import MallUsageBanner from '../../../components/shop/molecules/MallUsageBanner';
import MallCartSummary from '../../../components/shop/organisms/MallCartSummary';
import MGButton from '../../../components/common/MGButton';
import SafeText from '../../../components/common/SafeText';
import {
  CLIENT_MALL_COPY,
  CLIENT_REFUND_NOTICE,
  buildClientMallProductUsageNotice
} from '../../../constants/clientMallConstants';
import { CLIENT_SHOP_ROUTES, CLIENT_SHOP_TEST_IDS } from '../../../constants/clientShopConstants';
import { RoleUtils } from '../../../constants/roles';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import useClientMallCart from '../../../hooks/useClientMallCart';
import useShopPaymentCancelNotice from '../../../hooks/useShopPaymentCancelNotice';
import { fetchShopCatalog, fetchShopCatalogSku } from '../../../services/clientShopService';
import {
  buildMallCardDescription,
  buildValidityExampleText,
  formatMallNumber,
  formatMallSessionLabel,
  formatValidityLabel,
  resolveValidityMonths
} from '../../../utils/clientMall';
import { buildBuyNowCheckoutPath } from '../../../utils/clientMallBuyNow';

const buildLoginPath = (redirect) => `/login?redirect=${encodeURIComponent(redirect)}`;

const ShopSkuDetailPage = () => {
  const { skuCode } = useParams();
  const navigate = useNavigate();
  const { sessionLoading, isLoggedIn, user } = useClientShopAuth({ requireLogin: false });
  const authenticatedCatalog = isLoggedIn && RoleUtils.isClient(user);
  const [sku, setSku] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const payCancelNotice = useShopPaymentCancelNotice();

  const loadSku = useCallback(async() => {
    if (!skuCode) {
      setLoaded(true);
      return;
    }
    try {
      setLoaded(false);
      const [row, rows] = await Promise.all([
        fetchShopCatalogSku(decodeURIComponent(skuCode), { authenticated: authenticatedCatalog }),
        fetchShopCatalog({ authenticated: authenticatedCatalog }).catch(() => [])
      ]);
      setSku(row || null);
      setCatalog(rows);
    } catch {
      setSku(null);
    } finally {
      setLoaded(true);
    }
  }, [skuCode, authenticatedCatalog]);

  useEffect(() => {
    if (!sessionLoading) {
      loadSku();
    }
  }, [sessionLoading, loadSku]);

  const mall = useClientMallCart({
    isLoggedIn,
    sessionReady: !sessionLoading && loaded,
    catalog
  });

  const goCheckout = () => {
    navigate(isLoggedIn ? CLIENT_SHOP_ROUTES.CHECKOUT : buildLoginPath(CLIENT_SHOP_ROUTES.CHECKOUT));
  };

  const handleBuyNow = () => {
    if (!sku?.skuCode) {
      return;
    }
    const path = buildBuyNowCheckoutPath(sku.skuCode, quantity);
    navigate(isLoggedIn ? path : buildLoginPath(path));
  };

  if (sessionLoading) {
    return <ShopClientSessionLoading title={CLIENT_MALL_COPY.PAGE_TITLE} />;
  }

  const months = resolveValidityMonths(sku);
  const unit = Number(sku?.unitPriceMinor) || 0;
  const rows = sku ? [
    { key: 'composition', label: CLIENT_MALL_COPY.ROW_COMPOSITION, value: formatMallSessionLabel(sku.sessionCount) },
    ...(months != null ? [{
      key: 'validity',
      label: CLIENT_MALL_COPY.ROW_VALIDITY,
      value: `${formatValidityLabel(months)}${CLIENT_MALL_COPY.DETAIL_VALIDITY_INCLUSIVE}`,
      sub: buildValidityExampleText(months)
    }] : []),
    {
      key: 'sessions',
      label: CLIENT_MALL_COPY.DETAIL_ROW_SESSIONS_ADDED_LABEL,
      value: `${CLIENT_MALL_COPY.DETAIL_ROW_SESSIONS_ADDED_PREFIX}${formatMallSessionLabel(sku.sessionCount)}`
        + CLIENT_MALL_COPY.DETAIL_ROW_SESSIONS_ADDED_SUFFIX
    },
    { key: 'refund', label: CLIENT_MALL_COPY.DETAIL_ROW_REFUND_LABEL, value: CLIENT_REFUND_NOTICE }
  ] : [];

  const aside = (
    <MallCartSummary
      cart={mall.cart}
      summary={mall.summary}
      lastAddedSku={mall.lastAddedSku}
      onCheckout={goCheckout}
      secondary
    />
  );

  return (
    <ShopClientLayout
      title=""
      testId="client-shop-sku-detail"
      aside={aside}
      cartQty={mall.summary.quantity}
      cartPulse={mall.pulse}
      className="client-mall--detail"
    >
      <MallPaymentCancelNotice visible={payCancelNotice.visible} onClose={payCancelNotice.dismiss} />
      <nav className="client-mall-crumb">
        <Link to={CLIENT_SHOP_ROUTES.CATALOG}>{CLIENT_MALL_COPY.PAGE_TITLE}</Link>
        {sku ? (
          <>
            <span aria-hidden="true">{' › '}</span>
            <SafeText>{sku.title}</SafeText>
          </>
        ) : null}
      </nav>
      {mall.error ? <p className="client-mall-page__error" role="alert">{mall.error}</p> : null}
      {loaded && !sku ? (
        <MallEmptyState
          title={CLIENT_MALL_COPY.DETAIL_NOT_FOUND}
          body={CLIENT_MALL_COPY.EMPTY_BODY}
          action={<Link to={CLIENT_SHOP_ROUTES.CATALOG}>{CLIENT_MALL_COPY.DETAIL_BACK}</Link>}
        />
      ) : null}
      {sku ? (
        <>
          <article className="client-mall-box client-mall-detail" data-testid={CLIENT_SHOP_TEST_IDS.PDP}>
            <MallSessionChip sessionCount={sku.sessionCount} testId="pdp-session-count-ticket" />
            <h1 className="client-mall-detail__title"><SafeText>{sku.title}</SafeText></h1>
            <p className="client-mall-card__desc"><SafeText>{buildMallCardDescription(sku)}</SafeText></p>
            <MallPrice amountMinor={unit} sessionCount={sku.sessionCount} />
            <MallInfoRows rows={rows} className="client-mall-rows--wide" />
            <div className="client-mall-detail__qty">
              <MallQtyStepper quantity={quantity} onChange={(d) => setQuantity((q) => Math.max(1, q + d))} />
              <span className="client-mall-detail__sum">
                {CLIENT_MALL_COPY.CART_TOTAL}{' '}
                <strong>{formatMallNumber(unit * quantity)}{CLIENT_MALL_COPY.WON_UNIT}</strong>
              </span>
            </div>
            <div className="client-mall-detail__actions">
              <MGButton
                variant="outline"
                size="large"
                preventDoubleClick={false}
                className="client-mall-btn client-mall-btn--line"
                onClick={() => mall.add(sku.skuCode, quantity)}
                data-testid={CLIENT_SHOP_TEST_IDS.PDP_ADD_TO_CART}
              >
                {CLIENT_MALL_COPY.ADD_TO_CART}
              </MGButton>
              <MGButton
                variant="primary"
                size="large"
                className="client-mall-btn client-mall-btn--primary"
                onClick={handleBuyNow}
              >
                {CLIENT_MALL_COPY.BUY_NOW}
              </MGButton>
            </div>
          </article>
          {months != null ? <MallUsageBanner text={buildClientMallProductUsageNotice(months)} /> : null}
        </>
      ) : null}
      <MallToast toast={mall.toast} />
    </ShopClientLayout>
  );
};

export default ShopSkuDetailPage;
