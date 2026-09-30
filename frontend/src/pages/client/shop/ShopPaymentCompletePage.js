/**
 * ShopPaymentCompletePage — 「결제가 완료됐어요」 (추가된 회기 · 사용 기한 · 금액·결제 수단 · 주문번호 · 옆 「내 회기」)
 * primary 「내 회기 보기」 하나 · secondary 「결제 내역 보기」(좁은 화면은 텍스트 링크) · 예약/일정 버튼 없음.
 * 좁은 화면은 버튼을 카드 밖 하단 바로 빼서 primary · 도움말 · 링크 순서로 둔다.
 * 결제 확정이 아니거나 이행 재시도가 필요하면 주문 상세로 넘긴다.
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ShopClientLayout from '../../../components/shop/templates/ShopClientLayout';
import ShopClientSessionLoading from '../../../components/shop/templates/ShopClientSessionLoading';
import MallEmptyState from '../../../components/shop/molecules/MallEmptyState';
import MallInfoRows from '../../../components/shop/molecules/MallInfoRows';
import MGButton from '../../../components/common/MGButton';
import SafeText from '../../../components/common/SafeText';
import {
  CLIENT_MALL_CHECKOUT_SOURCE_BUY_NOW,
  CLIENT_MALL_COMPLETE_COPY,
  CLIENT_MALL_COPY,
  CLIENT_MALL_NARROW_MEDIA_QUERY,
  CLIENT_MALL_ROUTES,
  CLIENT_MALL_TEST_IDS
} from '../../../constants/clientMallConstants';
import {
  buildShopOrderDetailPath,
  canClientShopFulfillRetry
} from '../../../constants/clientShopConstants';
import { ICONS, ICON_SIZES } from '../../../constants/icons';
import { RoleUtils } from '../../../constants/roles';
import { useClientShopAuth } from '../../../hooks/useClientShopAuth';
import useMediaQuery from '../../../hooks/useMediaQuery';
import {
  fetchClientRemainingSessions,
  fetchShopCart,
  fetchShopCatalog,
  fetchShopOrder
} from '../../../services/clientShopService';
import {
  addMonthsClamped,
  formatMallDotDate,
  formatMallSessionsPlus,
  formatMallWon,
  indexCatalogBySku,
  resolveValidityMonths
} from '../../../utils/clientMall';
import { normalizeShopSessionCount } from '../../../utils/shopSessionCount';
import { requestClientHomeMappingsSoftRefresh } from '../../../utils/clientHomeSoftRefresh';

const PAID_STATUS = 'PAID';
const CheckIcon = ICONS.CHECK;

const ShopPaymentCompletePage = () => {
  const { orderPublicId } = useParams();
  const navigate = useNavigate();
  const { sessionLoading, isLoggedIn, user } = useClientShopAuth();
  const [order, setOrder] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [failed, setFailed] = useState(false);
  const [remainingSessions, setRemainingSessions] = useState(null);
  const [keptCartQty, setKeptCartQty] = useState(null);
  const isNarrow = useMediaQuery(CLIENT_MALL_NARROW_MEDIA_QUERY);
  const ranRef = useRef(false);

  useEffect(() => {
    if (sessionLoading || !isLoggedIn || ranRef.current || !orderPublicId) {
      return;
    }
    ranRef.current = true;
    const run = async() => {
      try {
        const id = decodeURIComponent(orderPublicId);
        const [row, rows] = await Promise.all([
          fetchShopOrder(id),
          fetchShopCatalog({ authenticated: RoleUtils.isClient(user) }).catch(() => [])
        ]);
        if (!row || row.status !== PAID_STATUS || canClientShopFulfillRetry(row)) {
          navigate(buildShopOrderDetailPath(id), { replace: true });
          return;
        }
        setCatalog(rows);
        setOrder(row);
        requestClientHomeMappingsSoftRefresh();
        const buyNow = row.checkoutSource === CLIENT_MALL_CHECKOUT_SOURCE_BUY_NOW;
        const [remaining, keptCart] = await Promise.all([
          fetchClientRemainingSessions(user?.id).catch(() => null),
          buyNow ? fetchShopCart().catch(() => null) : Promise.resolve(null)
        ]);
        setRemainingSessions(remaining);
        if (keptCart) {
          const qty = (keptCart.lines || []).reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
          setKeptCartQty(qty > 0 ? qty : null);
        }
      } catch {
        setFailed(true);
      }
    };
    run();
  }, [sessionLoading, isLoggedIn, orderPublicId, user, navigate]);

  if (sessionLoading || !isLoggedIn) {
    return <ShopClientSessionLoading title={CLIENT_MALL_COMPLETE_COPY.TITLE} />;
  }

  const lines = Array.isArray(order?.lines) ? order.lines : [];
  const bySku = indexCatalogBySku(catalog);
  const today = new Date();
  const totalSessions = lines.reduce(
    (sum, line) => sum + normalizeShopSessionCount(line.sessionCount) * (Number(line.quantity) || 0),
    0
  );
  const expiryDates = Array.from(new Set(
    lines
      .map((line) => resolveValidityMonths(line) ?? resolveValidityMonths(bySku.get(line.skuCode)))
      .filter((months) => months != null)
      .map((months) => formatMallDotDate(addMonthsClamped(today, months)))
  ));
  const expiryTexts = expiryDates.map((date) => `${date}${CLIENT_MALL_COMPLETE_COPY.EXPIRE_SUFFIX}`);
  const productText = lines.map((line) => `${line.title}${CLIENT_MALL_COPY.LINE_TIMES}${line.quantity}`).join(', ');
  const amountText = order
    ? `${formatMallWon(order.cashDueMinor)}${Number(order.cashDueMinor) > 0
      ? CLIENT_MALL_COMPLETE_COPY.AMOUNT_METHOD_SUFFIX
      : CLIENT_MALL_COMPLETE_COPY.AMOUNT_POINTS_ONLY_SUFFIX}`
    : '';

  const rows = order ? [
    { key: 'product', label: CLIENT_MALL_COMPLETE_COPY.ROW_PRODUCT, value: <SafeText>{productText}</SafeText> },
    {
      key: 'sessions',
      label: CLIENT_MALL_COMPLETE_COPY.ROW_SESSIONS,
      value: formatMallSessionsPlus(totalSessions)
    },
    ...expiryTexts.map((text, index) => ({
      key: `expire-${index}`,
      label: CLIENT_MALL_COMPLETE_COPY.ROW_EXPIRE,
      value: text
    })),
    { key: 'amount', label: CLIENT_MALL_COMPLETE_COPY.ROW_AMOUNT, value: amountText },
    { key: 'order', label: CLIENT_MALL_COMPLETE_COPY.ROW_ORDER_ID, value: <SafeText>{order.orderPublicId}</SafeText> }
  ] : [];

  const asideCard = order && (remainingSessions != null || expiryDates.length === 1) ? (
    <section className="client-mall-cart client-mall-complete-aside" data-testid={CLIENT_MALL_TEST_IDS.COMPLETE_ASIDE}>
      <h2 className="client-mall-cart__title">{CLIENT_MALL_COMPLETE_COPY.ASIDE_TITLE}</h2>
      {remainingSessions != null ? (
        <p className="client-mall-cart__total">
          <span className="client-mall-cart__total-label">{CLIENT_MALL_COMPLETE_COPY.ASIDE_REMAINING_LABEL}</span>
          <span className="client-mall-cart__total-amount">
            <span className="client-mall-cart__total-num">{remainingSessions}</span>
            {CLIENT_MALL_COMPLETE_COPY.ASIDE_REMAINING_UNIT}
          </span>
        </p>
      ) : null}
      {expiryDates.length === 1 ? (
        <p className="client-mall-pay__meta">
          {expiryDates[0]}
          {CLIENT_MALL_COMPLETE_COPY.ASIDE_EXPIRE_SUFFIX}
        </p>
      ) : null}
    </section>
  ) : null;
  const cartKeptNote = order && keptCartQty != null ? (
    <p className="client-mall-complete__kept" data-testid={CLIENT_MALL_TEST_IDS.COMPLETE_CART_KEPT}>
      {CLIENT_MALL_COMPLETE_COPY.BUY_NOW_CART_KEPT_PREFIX}
      {keptCartQty}
      {CLIENT_MALL_COMPLETE_COPY.BUY_NOW_CART_KEPT_SUFFIX}
    </p>
  ) : null;
  const aside = asideCard || cartKeptNote ? (
    <div className="client-mall-complete-side">
      {asideCard}
      {cartKeptNote}
    </div>
  ) : null;
  const goPaymentHistory = () => navigate(CLIENT_MALL_ROUTES.PAYMENT_HISTORY);
  const primaryAction = (
    <MGButton
      variant="primary"
      size="large"
      preventDoubleClick={false}
      className="client-mall-btn client-mall-btn--primary"
      onClick={() => navigate(CLIENT_MALL_ROUTES.SESSIONS)}
      data-testid={CLIENT_MALL_TEST_IDS.COMPLETE_PRIMARY}
    >
      {CLIENT_MALL_COMPLETE_COPY.PRIMARY}
    </MGButton>
  );
  const secondaryAction = isNarrow ? (
    <button
      type="button"
      className="client-mall-link-btn client-mall-complete__link"
      onClick={goPaymentHistory}
      data-testid={CLIENT_MALL_TEST_IDS.COMPLETE_SECONDARY}
    >
      {CLIENT_MALL_COMPLETE_COPY.SECONDARY}
    </button>
  ) : (
    <MGButton
      variant="outline"
      size="large"
      preventDoubleClick={false}
      className="client-mall-btn client-mall-btn--ink-line"
      onClick={goPaymentHistory}
      data-testid={CLIENT_MALL_TEST_IDS.COMPLETE_SECONDARY}
    >
      {CLIENT_MALL_COMPLETE_COPY.SECONDARY}
    </MGButton>
  );
  const helpText = <p className="client-mall-complete__help">{CLIENT_MALL_COMPLETE_COPY.HELP}</p>;

  return (
    <ShopClientLayout
      title=""
      testId="client-shop-payment-complete"
      aside={aside}
      className="client-mall--complete"
    >
      {failed ? (
        <MallEmptyState
          title={CLIENT_MALL_COMPLETE_COPY.LOAD_FAILED}
          action={orderPublicId ? (
            <Link to={buildShopOrderDetailPath(decodeURIComponent(orderPublicId))}>
              {CLIENT_MALL_COMPLETE_COPY.ORDER_LINK}
            </Link>
          ) : null}
        />
      ) : null}
      {order ? (
        <section className="client-mall-box client-mall-complete" data-testid={CLIENT_MALL_TEST_IDS.COMPLETE}>
          {CheckIcon ? (
            <span className="client-mall-complete__icon-ring" aria-hidden="true">
              <CheckIcon size={ICON_SIZES.XXL} aria-hidden className="client-mall-complete__icon" />
            </span>
          ) : null}
          <p className="client-mall-complete__eyebrow">{CLIENT_MALL_COMPLETE_COPY.EYEBROW}</p>
          <h1 className="client-mall-complete__title">{CLIENT_MALL_COMPLETE_COPY.HEADING}</h1>
          <p className="client-mall-complete__lead">
            {totalSessions}
            {CLIENT_MALL_COMPLETE_COPY.SESSIONS_ADDED_SUFFIX}
          </p>
          <MallInfoRows rows={rows} className="client-mall-rows--wide" />
          {isNarrow ? null : (
            <>
              <div className="client-mall-complete__actions">
                {primaryAction}
                {secondaryAction}
              </div>
              {helpText}
            </>
          )}
        </section>
      ) : null}
      {order && isNarrow ? (
        <div className="client-mall-complete-bar" data-testid={CLIENT_MALL_TEST_IDS.COMPLETE_BAR}>
          <div className="client-mall-complete__actions">
            {primaryAction}
            {helpText}
            {secondaryAction}
          </div>
        </div>
      ) : null}
    </ShopClientLayout>
  );
};

export default ShopPaymentCompletePage;
