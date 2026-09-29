/**
 * ShopPaymentCompletePage — 「결제가 완료됐어요」 (추가된 회기 · 사용 기한 · 금액 · 주문번호)
 * primary 「내 회기 보기」 하나 · secondary 「결제 내역 보기」 · 예약/일정 버튼 없음.
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
  CLIENT_MALL_COMPLETE_COPY,
  CLIENT_MALL_COPY,
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
import { fetchShopCatalog, fetchShopOrder, replaceShopCart } from '../../../services/clientShopService';
import {
  addMonthsClamped,
  formatMallDotDate,
  formatMallWon,
  indexCatalogBySku,
  resolveValidityMonths
} from '../../../utils/clientMall';
import { hasBuyNowStash, restoreBuyNowCartIfNeeded } from '../../../utils/clientMallBuyNow';
import { normalizeShopSessionCount } from '../../../utils/shopSessionCount';
import { requestClientHomeMappingsSoftRefresh } from '../../../utils/clientHomeSoftRefresh';

const PAID_STATUS = 'PAID';
const CheckIcon = ICONS.CHECK_CIRCLE;

const ShopPaymentCompletePage = () => {
  const { orderPublicId } = useParams();
  const navigate = useNavigate();
  const { sessionLoading, isLoggedIn, user } = useClientShopAuth();
  const [order, setOrder] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [failed, setFailed] = useState(false);
  const [wasBuyNow, setWasBuyNow] = useState(false);
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
        if (hasBuyNowStash()) {
          setWasBuyNow(true);
          try {
            await restoreBuyNowCartIfNeeded(replaceShopCart);
          } catch {
            // 보관본 유지 — 다음 쇼핑 화면에서 재시도
          }
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
  const expiryTexts = Array.from(new Set(
    lines
      .map((line) => resolveValidityMonths(bySku.get(line.skuCode)))
      .filter((months) => months != null)
      .map((months) => `${formatMallDotDate(addMonthsClamped(today, months))}${CLIENT_MALL_COMPLETE_COPY.EXPIRE_SUFFIX}`)
  ));
  const productText = lines.map((line) => `${line.title} × ${line.quantity}`).join(', ');

  const rows = order ? [
    { key: 'product', label: CLIENT_MALL_COMPLETE_COPY.ROW_PRODUCT, value: <SafeText>{productText}</SafeText> },
    {
      key: 'sessions',
      label: CLIENT_MALL_COMPLETE_COPY.ROW_SESSIONS,
      value: `${totalSessions}${CLIENT_MALL_COPY.SESSION_UNIT}`
    },
    ...expiryTexts.map((text, index) => ({
      key: `expire-${index}`,
      label: CLIENT_MALL_COMPLETE_COPY.ROW_EXPIRE,
      value: text
    })),
    { key: 'amount', label: CLIENT_MALL_COMPLETE_COPY.ROW_AMOUNT, value: formatMallWon(order.cashDueMinor) },
    { key: 'order', label: CLIENT_MALL_COMPLETE_COPY.ROW_ORDER_ID, value: <SafeText>{order.orderPublicId}</SafeText> }
  ] : [];

  return (
    <ShopClientLayout
      title=""
      testId="client-shop-payment-complete"
      restoreBuyNow={false}
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
          {CheckIcon ? <CheckIcon size={ICON_SIZES.XXXL} aria-hidden className="client-mall-complete__icon" /> : null}
          <h1 className="client-mall-complete__title">{CLIENT_MALL_COMPLETE_COPY.HEADING}</h1>
          <p className="client-mall-complete__lead">
            {totalSessions}
            {CLIENT_MALL_COMPLETE_COPY.SESSIONS_ADDED_SUFFIX}
          </p>
          <MallInfoRows rows={rows} className="client-mall-rows--wide" />
          <div className="client-mall-complete__actions">
            <MGButton
              variant="primary"
              size="large"
              fullWidth
              preventDoubleClick={false}
              className="client-mall-btn client-mall-btn--primary"
              onClick={() => navigate(CLIENT_MALL_ROUTES.SESSIONS)}
              data-testid={CLIENT_MALL_TEST_IDS.COMPLETE_PRIMARY}
            >
              {CLIENT_MALL_COMPLETE_COPY.PRIMARY}
            </MGButton>
            <MGButton
              variant="outline"
              size="large"
              fullWidth
              preventDoubleClick={false}
              className="client-mall-btn client-mall-btn--ink-line"
              onClick={() => navigate(CLIENT_MALL_ROUTES.PAYMENT_HISTORY)}
            >
              {CLIENT_MALL_COMPLETE_COPY.SECONDARY}
            </MGButton>
          </div>
          <p className="client-mall-complete__help">{CLIENT_MALL_COMPLETE_COPY.HELP}</p>
          {wasBuyNow ? <p className="client-mall-complete__help">{CLIENT_MALL_COMPLETE_COPY.BUY_NOW_CART_KEPT}</p> : null}
        </section>
      ) : null}
    </ShopClientLayout>
  );
};

export default ShopPaymentCompletePage;
