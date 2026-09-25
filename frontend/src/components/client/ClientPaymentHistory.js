/**
 * 내담자 결제 내역 — suite: payment rows · aside period/status filter
 * 매핑 결제 + 쇼핑 PortOne(ONLINE/PAID) 주문을 함께 표시한다.
 *
 * @author CoreSolution
 * @since 2026-09-18
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StandardizedApi from '../../utils/standardizedApi';
import { isApiGetNullFailure, normalizeMappingsListPayload } from '../../utils/apiResponseNormalize';
import { isClientMappingPaymentSettled } from '../../constants/mapping';
import {
  resolveClientPaymentHistoryAmount,
  resolveClientPaymentHistoryMethodLabel,
  resolveClientPaymentHistoryStatus,
  resolveClientPaymentHistoryTitle,
  shouldIncludeInClientPaymentHistoryTotals
} from '../../utils/clientPaymentHistoryDisplay';
import {
  PACKAGE_PAYMENT_HISTORY_SOURCE,
  resolvePackagePaymentSourceLabel,
  resolvePackagePaymentSourceBadgeVariant
} from '../../constants/packagePaymentHistory';
import {
  buildShopOrderDetailPath,
  CLIENT_SHOP_ROUTES,
  SHOP_ORDER_STATUS_LABELS
} from '../../constants/clientShopConstants';
import { fetchShopOrders } from '../../services/clientShopService';
import { toSafeNumber } from '../../utils/safeDisplay';
import SafeText from '../common/SafeText';
import Badge from '../common/Badge';
import UnifiedLoading from '../common/UnifiedLoading';
import ClientWebPageShell from './ClientWebPageShell';
import {
  CLIENT_WEB_SUITE_COPY,
  CLIENT_WEB_SUITE_TEST_IDS
} from '../../constants/clientWebSuiteConstants';
import './ClientPaymentHistory.css';

const API_AUTH_CURRENT_USER = '/api/v1/auth/current-user';
const API_ADMIN_MAPPINGS_CLIENT = '/api/v1/admin/mappings/client';
const CLIENT_PAYMENT_HISTORY_TITLE_ID = 'client-payment-history-title';
const SHOP_ROW_KIND = 'SHOP_ORDER';

const FILTER_OPTIONS = Object.freeze([
  { id: 'all', labelKey: 'PAYMENT_FILTER_ALL' },
  { id: 'completed', labelKey: 'PAYMENT_FILTER_COMPLETED' },
  { id: 'pending', labelKey: 'PAYMENT_FILTER_PENDING' },
  { id: 'refunded', labelKey: 'PAYMENT_FILTER_REFUNDED' }
]);

/**
 * 클라이언트 쇼핑 주문(PAID/REFUNDED + 현금) → 결제 내역 행.
 * recipientId=null PortOne 결제가 매핑 목록에 누락되는 문제를 보완한다.
 *
 * @param {object} order
 * @returns {object|null}
 */
const mapShopOrderToPaymentRow = (order) => {
  if (!order || typeof order !== 'object') {
    return null;
  }
  const status = order.status != null ? String(order.status).trim().toUpperCase() : '';
  if (status !== 'PAID' && status !== 'REFUNDED') {
    return null;
  }
  const cashDue = Number(order.cashDueMinor ?? order.cashDue ?? 0);
  if (!Number.isFinite(cashDue) || cashDue <= 0) {
    return null;
  }
  const orderPublicId =
    order.orderPublicId != null && String(order.orderPublicId).trim()
      ? String(order.orderPublicId).trim()
      : null;
  if (!orderPublicId) {
    return null;
  }
  return {
    kind: SHOP_ROW_KIND,
    id: `shop-${orderPublicId}`,
    orderPublicId,
    packageName:
      order.title
      || order.orderName
      || CLIENT_WEB_SUITE_COPY.PAYMENT_SHOP_PRODUCT_FALLBACK,
    paymentAmount: cashDue,
    amount: cashDue,
    paymentMethod: CLIENT_WEB_SUITE_COPY.PAYMENT_SHOP_METHOD_PORTONE,
    paymentProvider: 'IAMPORT',
    paymentSource: PACKAGE_PAYMENT_HISTORY_SOURCE.ONLINE,
    paymentStatus: status === 'REFUNDED' ? 'REFUNDED' : 'CONFIRMED',
    paymentDate: order.paidAt || order.updatedAt || order.createdAt,
    createdAt: order.createdAt || order.paidAt || order.updatedAt
  };
};

const ClientPaymentHistory = () => {
  const { t } = useTranslation();
  const [paymentData, setPaymentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const loadPaymentData = useCallback(async() => {
    setIsLoading(true);
    setError(null);
    try {
      const userResponse = await StandardizedApi.get(API_AUTH_CURRENT_USER);
      if (!userResponse || !userResponse.id) {
        throw new Error(CLIENT_WEB_SUITE_COPY.PAYMENT_ERROR_TITLE);
      }
      const [mappingsResponse, shopOrders] = await Promise.all([
        StandardizedApi.get(API_ADMIN_MAPPINGS_CLIENT, {
          clientId: userResponse.id
        }),
        fetchShopOrders(0, 50).catch(() => [])
      ]);
      if (isApiGetNullFailure(mappingsResponse)) {
        throw new Error(CLIENT_WEB_SUITE_COPY.PAYMENT_ERROR_TITLE);
      }
      const mappings = normalizeMappingsListPayload(mappingsResponse).map((row) => ({
        ...row,
        kind: 'MAPPING'
      }));
      const shopRows = (Array.isArray(shopOrders) ? shopOrders : [])
        .map(mapShopOrderToPaymentRow)
        .filter(Boolean);

      const combined = [...mappings, ...shopRows].sort(
        (a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt)
      );
      const totalsEligible = combined.filter((row) => {
        if (row.kind === SHOP_ROW_KIND) {
          return row.paymentStatus === 'CONFIRMED';
        }
        return shouldIncludeInClientPaymentHistoryTotals(row);
      });
      setPaymentData({
        mappings: combined,
        totalAmount: totalsEligible.reduce((sum, row) => {
          if (row.kind === SHOP_ROW_KIND) {
            return sum + toSafeNumber(row.paymentAmount, 0);
          }
          return sum + resolveClientPaymentHistoryAmount(row);
        }, 0)
      });
    } catch (err) {
      setError(err.message || CLIENT_WEB_SUITE_COPY.PAYMENT_ERROR_TITLE);
      setPaymentData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  const getStatusText = (status) => {
    const statusMap = {
      CONFIRMED: t('common:client.ClientPaymentHistory.t_cd79fb92'),
      PAY: t('common:client.ClientPaymentHistory.t_f8e2bb71'),
      DEP: t('common:client.ClientPaymentHistory.t_a1b8faac'),
      PENDING: t('common:client.ClientPaymentHistory.t_ffc400e0'),
      REJECTED: t('common:client.ClientPaymentHistory.t_13b9aa71'),
      REFUNDED: t('common:client.ClientPaymentHistory.t_43aa0bad'),
      CANCELLED: t('common:client.ClientPaymentHistory.t_b6dcb84f')
    };
    return statusMap[status] || t('common:client.ClientPaymentHistory.t_8c5d2272');
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })
      .format(toSafeNumber(amount, 0));

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const filteredMappings = (paymentData?.mappings || []).filter((row) => {
    if (filter === 'all') return true;
    if (row.kind === SHOP_ROW_KIND) {
      if (filter === 'completed') return row.paymentStatus === 'CONFIRMED';
      if (filter === 'pending') return false;
      if (filter === 'refunded') return row.paymentStatus === 'REFUNDED';
      return true;
    }
    const status = resolveClientPaymentHistoryStatus(row);
    if (filter === 'completed') return isClientMappingPaymentSettled(status);
    if (filter === 'pending') return status === 'PENDING';
    if (filter === 'refunded') return status === 'REFUNDED';
    return true;
  });

  const mainSlot = (
    <>
      {isLoading ? (
        <div aria-busy="true" aria-live="polite">
          <UnifiedLoading type="inline" text={CLIENT_WEB_SUITE_COPY.PAYMENT_LOADING} />
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="client-web-page-shell__card" role="alert">
          <h3 className="client-payment-suite__title">{CLIENT_WEB_SUITE_COPY.PAYMENT_ERROR_TITLE}</h3>
          <p className="client-payment-suite__mute">
            <SafeText>{error}</SafeText>
          </p>
          <button type="button" className="client-web-page-shell__cta" onClick={loadPaymentData}>
            {CLIENT_WEB_SUITE_COPY.PAYMENT_RETRY}
          </button>
        </div>
      ) : null}

      {!isLoading && !error && (!paymentData || paymentData.mappings.length === 0) ? (
        <div className="client-web-page-shell__card">
          <h3 className="client-payment-suite__title">{CLIENT_WEB_SUITE_COPY.PAYMENT_EMPTY_TITLE}</h3>
          <p className="client-payment-suite__mute">{CLIENT_WEB_SUITE_COPY.PAYMENT_EMPTY_BODY}</p>
          <p className="client-payment-suite__mute">
            <Link to={CLIENT_SHOP_ROUTES.ORDERS}>
              {CLIENT_WEB_SUITE_COPY.PAYMENT_SHOP_ORDERS_LINK}
            </Link>
          </p>
        </div>
      ) : null}

      {!isLoading && !error && paymentData && paymentData.mappings.length > 0 ? (
        <section className="client-web-page-shell__card client-payment-rows" aria-label={CLIENT_WEB_SUITE_COPY.PAYMENT_TITLE}>
          <div className="client-payment-rows__head" aria-hidden="true">
            <span>{CLIENT_WEB_SUITE_COPY.PAYMENT_COL_DATE}</span>
            <span>{CLIENT_WEB_SUITE_COPY.PAYMENT_COL_PRODUCT}</span>
            <span>{CLIENT_WEB_SUITE_COPY.PAYMENT_COL_AMOUNT}</span>
            <span>{CLIENT_WEB_SUITE_COPY.PAYMENT_COL_METHOD}</span>
            <span>{CLIENT_WEB_SUITE_COPY.PAYMENT_COL_STATUS}</span>
          </div>
          {filteredMappings.map((mapping, index) => {
            if (mapping.kind === SHOP_ROW_KIND) {
              const sourceLabel = resolvePackagePaymentSourceLabel(mapping.paymentSource);
              const sourceVariant = resolvePackagePaymentSourceBadgeVariant(mapping.paymentSource);
              const statusLabel =
                mapping.paymentStatus === 'REFUNDED'
                  ? CLIENT_WEB_SUITE_COPY.PAYMENT_SHOP_STATUS_REFUNDED
                  : CLIENT_WEB_SUITE_COPY.PAYMENT_SHOP_STATUS_PAID;
              return (
                <article key={mapping.id || index} className="client-payment-rows__item">
                  <span className="client-payment-rows__date">
                    <SafeText>{formatDate(mapping.paymentDate || mapping.createdAt)}</SafeText>
                  </span>
                  <span className="client-payment-rows__product">
                    <Link to={buildShopOrderDetailPath(mapping.orderPublicId)}>
                      <SafeText>{mapping.packageName}</SafeText>
                    </Link>
                  </span>
                  <span className="client-payment-rows__amount">
                    <SafeText>{formatCurrency(mapping.paymentAmount)}</SafeText>
                  </span>
                  <span className="client-payment-rows__method">
                    <SafeText>{mapping.paymentMethod}</SafeText>
                    {sourceLabel && sourceVariant ? (
                      <>
                        {' '}
                        <Badge
                          variant="status"
                          statusVariant={sourceVariant}
                          size="sm"
                          data-testid="client-payment-source"
                        >
                          {sourceLabel}
                        </Badge>
                      </>
                    ) : null}
                  </span>
                  <span className="client-payment-rows__status">
                    <SafeText>
                      {SHOP_ORDER_STATUS_LABELS[mapping.paymentStatus === 'REFUNDED' ? 'REFUNDED' : 'PAID']
                        || statusLabel}
                    </SafeText>
                  </span>
                </article>
              );
            }

            const status = resolveClientPaymentHistoryStatus(mapping);
            const sourceLabel = resolvePackagePaymentSourceLabel(mapping.paymentSource);
            const sourceVariant = resolvePackagePaymentSourceBadgeVariant(mapping.paymentSource);
            return (
              <article key={mapping.id || index} className="client-payment-rows__item">
                <span className="client-payment-rows__date">
                  <SafeText>{formatDate(mapping.paymentDate || mapping.createdAt)}</SafeText>
                </span>
                <span className="client-payment-rows__product">
                  <SafeText>
                    {resolveClientPaymentHistoryTitle(
                      mapping,
                      t('common:client.ClientPaymentHistory.t_17cef764')
                    )}
                  </SafeText>
                </span>
                <span className="client-payment-rows__amount">
                  <SafeText>{formatCurrency(resolveClientPaymentHistoryAmount(mapping))}</SafeText>
                </span>
                <span className="client-payment-rows__method">
                  <SafeText>
                    {resolveClientPaymentHistoryMethodLabel(
                      mapping.paymentMethod,
                      mapping.paymentProvider,
                      t('common:client.ClientPaymentHistory.t_5c1a705c')
                    )}
                  </SafeText>
                  {sourceLabel && sourceVariant ? (
                    <>
                      {' '}
                      <Badge
                        variant="status"
                        statusVariant={sourceVariant}
                        size="sm"
                        data-testid="client-payment-source"
                      >
                        {sourceLabel}
                      </Badge>
                    </>
                  ) : null}
                </span>
                <span className="client-payment-rows__status">
                  <SafeText>{getStatusText(status)}</SafeText>
                </span>
              </article>
            );
          })}
        </section>
      ) : null}
    </>
  );

  const asideSlot = (
    <section className="client-web-page-shell__card client-payment-filter-aside">
      <h2 className="client-payment-filter-aside__title">
        {CLIENT_WEB_SUITE_COPY.PAYMENT_FILTER_TITLE}
      </h2>
      <div className="client-payment-filter-aside__list" role="group" aria-label={CLIENT_WEB_SUITE_COPY.PAYMENT_FILTER_TITLE}>
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`client-payment-filter-aside__btn${filter === opt.id ? ' is-active' : ''}`}
            onClick={() => setFilter(opt.id)}
            aria-pressed={filter === opt.id}
          >
            {CLIENT_WEB_SUITE_COPY[opt.labelKey]}
          </button>
        ))}
      </div>
      <p className="client-payment-suite__mute">
        <Link to={CLIENT_SHOP_ROUTES.ORDERS}>
          {CLIENT_WEB_SUITE_COPY.PAYMENT_SHOP_ORDERS_LINK}
        </Link>
      </p>
    </section>
  );

  return (
    <ClientWebPageShell
      activeNavId="payment"
      title={CLIENT_WEB_SUITE_COPY.PAYMENT_TITLE}
      titleId={CLIENT_PAYMENT_HISTORY_TITLE_ID}
      testId={CLIENT_WEB_SUITE_TEST_IDS.PAYMENT_PAGE}
      main={mainSlot}
      aside={asideSlot}
    />
  );
};

export default ClientPaymentHistory;
