/**
 * 내담자 결제 내역 — Clinic-OS 단열(aside 없음) · 필터 칩 바(URL 쿼리) · ≥768 표 / <768 카드
 * 출처는 본인 전용 온라인 주문 API(`/api/v1/clients/me/shop/orders`) 하나다.
 * 관리자 API(매칭 목록)는 부르지 않는다 — 센터 직접 결제분은 내담자 전용 API가 생기면 합친다.
 * 포맷·환불 문맥·상품명·합계는 utils/clientPaymentHistoryFormat 한 곳에서만.
 * 스펙: docs/design/clinic-os-client-payments.md
 *
 * @author CoreSolution
 * @since 2026-09-18
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useClientSessionReady } from '../../hooks/useClientSessionReady';
import { useSoftResourceLoad } from '../../hooks/useSoftResourceLoad';
import { useUserIdScopedLoad } from '../../hooks/useUserIdScopedLoad';
import {
  buildClientPaymentCaption,
  buildClientPaymentRows,
  filterClientPaymentRows,
  formatClientPaymentSummary,
  isUsableProductName,
  normalizePage,
  normalizePeriod,
  normalizeStatusFilter,
  paginateClientPaymentRows,
  summarizeClientPaymentRows
} from '../../utils/clientPaymentHistoryFormat';
import { fetchShopOrder, fetchShopOrders } from '../../services/clientShopService';
import { buildShopOrderDetailPath } from '../../constants/clientShopConstants';
import {
  CLIENT_PAYMENT_COPY,
  CLIENT_PAYMENT_HISTORY_PAGE_SIZE,
  CLIENT_PAYMENT_PERIOD,
  CLIENT_PAYMENT_PERIOD_OPTIONS,
  CLIENT_PAYMENT_QUERY_KEYS,
  CLIENT_PAYMENT_ROW_KIND,
  CLIENT_PAYMENT_SHOP_ORDERS_FETCH_SIZE,
  CLIENT_PAYMENT_SHOP_ORDERS_MAX_PAGES,
  CLIENT_PAYMENT_SKELETON_CARDS,
  CLIENT_PAYMENT_SKELETON_ROWS,
  CLIENT_PAYMENT_STATUS_FILTER,
  CLIENT_PAYMENT_STATUS_FILTER_OPTIONS,
  CLIENT_PAYMENT_TABLE_MIN_WIDTH_PX,
  CLIENT_PAYMENT_TEST_IDS
} from '../../constants/clientPaymentHistoryConstants';
import { CLIENT_WEB_SUITE_TEST_IDS } from '../../constants/clientWebSuiteConstants';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import SafeText from '../common/SafeText';
import MGPagination from '../common/MGPagination';
import ClientWebPageShell from './ClientWebPageShell';
import './ClientPaymentHistory.css';

const CLIENT_PAYMENT_HISTORY_TITLE_ID = 'client-payment-history-title';
const MOBILE_MEDIA_QUERY = `(max-width: ${CLIENT_PAYMENT_TABLE_MIN_WIDTH_PX - 1}px)`;
const SHOP_ORDER_PAGE_START = 0;

/**
 * 온라인 주문을 서버 page/size 로 끝까지 읽는다 (백엔드 변경 없음).
 *
 * @returns {Promise<Array<object>>}
 */
const fetchAllShopOrders = async() => {
  const all = [];
  for (let page = SHOP_ORDER_PAGE_START; page < CLIENT_PAYMENT_SHOP_ORDERS_MAX_PAGES; page += 1) {
    // eslint-disable-next-line no-await-in-loop
    const chunk = await fetchShopOrders(page, CLIENT_PAYMENT_SHOP_ORDERS_FETCH_SIZE);
    const list = Array.isArray(chunk) ? chunk : [];
    all.push(...list);
    if (list.length < CLIENT_PAYMENT_SHOP_ORDERS_FETCH_SIZE) {
      break;
    }
  }
  return all;
};

/**
 * 주문 상세 → 상품명·회기 (단일 라인일 때만 회기).
 *
 * @param {object|null} order
 * @returns {{ productTitle: string|null, sessions: number|null }}
 */
const toShopOrderDetail = (order) => {
  const lines = order && Array.isArray(order.lines) ? order.lines : [];
  const named = lines.find((line) => line && isUsableProductName(line.title));
  return {
    productTitle: named ? named.title : null,
    sessions: lines.length === 1 && lines[0] ? lines[0].sessionCount ?? null : null
  };
};

const StatusBadge = ({ badge, label }) => {
  if (!badge) {
    return (
      <span className="client-payment-history__status-empty">{CLIENT_PAYMENT_COPY.EMPTY_DASH}</span>
    );
  }
  return (
    <span
      className={`client-payment-badge client-payment-badge--${badge}`}
      data-testid={CLIENT_PAYMENT_TEST_IDS.BADGE}
      data-badge={badge}
    >
      {label}
    </span>
  );
};

const ProductName = ({ row, block = false }) => {
  const nameClass = [
    'client-payment-history__product-name',
    row.productIsFallback ? 'client-payment-history__product-name--fallback' : ''
  ].filter(Boolean).join(' ');
  if (row.kind === CLIENT_PAYMENT_ROW_KIND.SHOP_ORDER && !block && !row.productIsFallback) {
    return (
      <Link
        to={buildShopOrderDetailPath(row.orderPublicId)}
        className={`${nameClass} client-payment-history__product-link`}
        title={row.productName}
      >
        <SafeText>{row.productName}</SafeText>
      </Link>
    );
  }
  return (
    <span className={nameClass} title={row.productName}>
      <SafeText>{row.productName}</SafeText>
    </span>
  );
};

const FilterChips = ({ groupLabel, options, selected, onSelect }) => (
  <div className="client-payment-filter__group" role="group" aria-label={groupLabel}>
    {options.map((opt) => (
      <button
        key={opt.id}
        type="button"
        className="client-payment-filter__chip"
        aria-pressed={selected === opt.id}
        onClick={() => onSelect(opt.id)}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const SkeletonRows = () => (
  <>
    {Array.from({ length: CLIENT_PAYMENT_SKELETON_ROWS }).map((_, index) => (
      <tr
        // eslint-disable-next-line react/no-array-index-key
        key={index}
        className="client-payment-table__row client-payment-table__row--skeleton"
        aria-hidden="true"
        data-testid={CLIENT_PAYMENT_TEST_IDS.SKELETON}
      >
        <td><span className="client-payment-skeleton client-payment-skeleton--date" /></td>
        <td>
          <span className="client-payment-skeleton client-payment-skeleton--name" />
          <span className="client-payment-skeleton client-payment-skeleton--sub" />
        </td>
        <td className="client-payment-table__cell--amount">
          <span className="client-payment-skeleton client-payment-skeleton--amount" />
        </td>
        <td><span className="client-payment-skeleton client-payment-skeleton--method" /></td>
        <td><span className="client-payment-skeleton client-payment-skeleton--badge" /></td>
      </tr>
    ))}
  </>
);

const SkeletonCards = () => (
  <>
    {Array.from({ length: CLIENT_PAYMENT_SKELETON_CARDS }).map((_, index) => (
      <li
        // eslint-disable-next-line react/no-array-index-key
        key={index}
        className="client-payment-cards__item client-payment-cards__item--skeleton"
        aria-hidden="true"
        data-testid={CLIENT_PAYMENT_TEST_IDS.SKELETON}
      >
        <span className="client-payment-skeleton client-payment-skeleton--date" />
        <span className="client-payment-skeleton client-payment-skeleton--name" />
        <span className="client-payment-skeleton client-payment-skeleton--method" />
      </li>
    ))}
  </>
);

const PaymentTable = ({ rows, caption, isLoading }) => (
  <table className="client-payment-table" data-testid={CLIENT_PAYMENT_TEST_IDS.TABLE}>
    <caption className="sr-only">{caption}</caption>
    <colgroup>
      <col className="client-payment-table__col--date" />
      <col className="client-payment-table__col--product" />
      <col className="client-payment-table__col--amount" />
      <col className="client-payment-table__col--method" />
      <col className="client-payment-table__col--status" />
    </colgroup>
    <thead>
      <tr>
        <th scope="col">{CLIENT_PAYMENT_COPY.COL_DATE}</th>
        <th scope="col">{CLIENT_PAYMENT_COPY.COL_PRODUCT}</th>
        <th scope="col" className="client-payment-table__cell--amount">{CLIENT_PAYMENT_COPY.COL_AMOUNT}</th>
        <th scope="col">{CLIENT_PAYMENT_COPY.COL_METHOD}</th>
        <th scope="col">{CLIENT_PAYMENT_COPY.COL_STATUS}</th>
      </tr>
    </thead>
    <tbody>
      {isLoading ? <SkeletonRows /> : rows.map((row) => (
        <tr
          key={row.key}
          className={[
            'client-payment-table__row',
            row.kind === CLIENT_PAYMENT_ROW_KIND.SHOP_ORDER && !row.productIsFallback
              ? 'client-payment-table__row--link'
              : ''
          ].filter(Boolean).join(' ')}
          data-testid={CLIENT_PAYMENT_TEST_IDS.ROW}
        >
          <td className="client-payment-table__cell--date">
            <SafeText>{row.dateText}</SafeText>
          </td>
          <td className="client-payment-table__cell--product">
            <ProductName row={row} />
            {row.sessionsText ? (
              <span className="client-payment-history__sub">
                <SafeText>{row.sessionsText}</SafeText>
              </span>
            ) : null}
          </td>
          <td className="client-payment-table__cell--amount">
            <span
              className={[
                'client-payment-history__amount',
                row.amountMuted ? 'client-payment-history__amount--muted' : ''
              ].filter(Boolean).join(' ')}
            >
              <SafeText>{row.amountText}</SafeText>
            </span>
            {row.amountSubText ? (
              <span className="client-payment-history__sub client-payment-history__sub--amount">
                <SafeText>{row.amountSubText}</SafeText>
              </span>
            ) : null}
          </td>
          <td className="client-payment-table__cell--method">
            <span className="client-payment-history__method">
              <SafeText>{row.methodText || CLIENT_PAYMENT_COPY.EMPTY_DASH}</SafeText>
            </span>
            {row.channelText ? (
              <span className="client-payment-history__sub">
                <SafeText>{row.channelText}</SafeText>
              </span>
            ) : null}
          </td>
          <td className="client-payment-table__cell--status">
            <StatusBadge badge={row.badge} label={row.badgeLabel} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const CardBody = ({ row }) => (
  <>
    <span className="client-payment-cards__line client-payment-cards__line--top">
      <span className="client-payment-cards__date"><SafeText>{row.dateText}</SafeText></span>
      <StatusBadge badge={row.badge} label={row.badgeLabel} />
    </span>
    <span className="client-payment-cards__name">
      <ProductName row={row} block />
    </span>
    {row.sessionsText ? (
      <span className="client-payment-history__sub"><SafeText>{row.sessionsText}</SafeText></span>
    ) : null}
    <span className="client-payment-cards__line client-payment-cards__line--bottom">
      <span className="client-payment-cards__method">
        <SafeText>{row.methodText || CLIENT_PAYMENT_COPY.EMPTY_DASH}</SafeText>
        {row.channelText ? (
          <span className="client-payment-cards__channel">
            <SafeText>{`${CLIENT_PAYMENT_COPY.METHOD_CHANNEL_JOIN}${row.channelText}`}</SafeText>
          </span>
        ) : null}
      </span>
      <span
        className={[
          'client-payment-cards__amount',
          row.amountMuted ? 'client-payment-history__amount--muted' : ''
        ].filter(Boolean).join(' ')}
      >
        <SafeText>{row.amountText}</SafeText>
      </span>
    </span>
    {row.amountSubText ? (
      <span className="client-payment-history__sub client-payment-history__sub--amount">
        <SafeText>{row.amountSubText}</SafeText>
      </span>
    ) : null}
  </>
);

const PaymentCards = ({ rows, isLoading }) => (
  <ul className="client-payment-cards" data-testid={CLIENT_PAYMENT_TEST_IDS.CARDS}>
    {isLoading ? <SkeletonCards /> : rows.map((row) => (
      <li key={row.key} className="client-payment-cards__item" data-testid={CLIENT_PAYMENT_TEST_IDS.ROW}>
        {row.kind === CLIENT_PAYMENT_ROW_KIND.SHOP_ORDER && !row.productIsFallback ? (
          <Link to={buildShopOrderDetailPath(row.orderPublicId)} className="client-payment-cards__link">
            <CardBody row={row} />
          </Link>
        ) : (
          <div className="client-payment-cards__static">
            <CardBody row={row} />
          </div>
        )}
      </li>
    ))}
  </ul>
);

const ClientPaymentHistory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY);
  const [sources, setSources] = useState(null);
  const [shopOrderDetails, setShopOrderDetails] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestedDetailsRef = useRef(new Set());

  const period = normalizePeriod(searchParams.get(CLIENT_PAYMENT_QUERY_KEYS.PERIOD));
  const status = normalizeStatusFilter(searchParams.get(CLIENT_PAYMENT_QUERY_KEYS.STATUS));
  const requestedPage = normalizePage(searchParams.get(CLIENT_PAYMENT_QUERY_KEYS.PAGE));

  const { ready, userId } = useClientSessionReady();

  const { load: loadPayments } = useSoftResourceLoad(setIsLoading, async() => {
    setError(false);
    try {
      const shopOrders = await fetchAllShopOrders();
      setSources({ shopOrders });
    } catch (err) {
      setError(true);
      setSources(null);
    }
  });

  useUserIdScopedLoad({ userId, loadFn: loadPayments, enabled: ready });

  const loadPaymentData = useCallback(() => {
    void loadPayments({ silent: false });
  }, [loadPayments]);

  const allRows = useMemo(
    () => (sources ? buildClientPaymentRows({ ...sources, shopOrderDetails }) : []),
    [sources, shopOrderDetails]
  );
  const filteredRows = useMemo(
    () => filterClientPaymentRows(allRows, { period, status }),
    [allRows, period, status]
  );
  const summary = useMemo(() => summarizeClientPaymentRows(filteredRows), [filteredRows]);
  const { pageRows, page, totalPages } = paginateClientPaymentRows(
    filteredRows,
    requestedPage,
    CLIENT_PAYMENT_HISTORY_PAGE_SIZE
  );

  useEffect(() => {
    const pending = pageRows.filter((row) => row.kind === CLIENT_PAYMENT_ROW_KIND.SHOP_ORDER
      && row.productIsFallback
      && !requestedDetailsRef.current.has(row.orderPublicId));
    if (pending.length === 0) {
      return;
    }
    pending.forEach((row) => requestedDetailsRef.current.add(row.orderPublicId));
    Promise.all(pending.map((row) => fetchShopOrder(row.orderPublicId)
      .then((order) => [row.orderPublicId, toShopOrderDetail(order)])
      .catch(() => [row.orderPublicId, null])))
      .then((entries) => {
        const found = entries.filter(([, detail]) => detail && (detail.productTitle || detail.sessions != null));
        if (found.length === 0) {
          return;
        }
        setShopOrderDetails((prev) => {
          const next = { ...prev };
          found.forEach(([id, detail]) => {
            next[id] = detail;
          });
          return next;
        });
      });
  }, [pageRows]);

  const updateQuery = useCallback((changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value == null) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const handlePeriod = (id) => updateQuery({
    [CLIENT_PAYMENT_QUERY_KEYS.PERIOD]: id === CLIENT_PAYMENT_PERIOD.ALL ? null : id,
    [CLIENT_PAYMENT_QUERY_KEYS.PAGE]: null
  });
  const handleStatus = (id) => updateQuery({
    [CLIENT_PAYMENT_QUERY_KEYS.STATUS]: id === CLIENT_PAYMENT_STATUS_FILTER.ALL ? null : id,
    [CLIENT_PAYMENT_QUERY_KEYS.PAGE]: null
  });
  const handleReset = () => updateQuery({
    [CLIENT_PAYMENT_QUERY_KEYS.PERIOD]: null,
    [CLIENT_PAYMENT_QUERY_KEYS.STATUS]: null,
    [CLIENT_PAYMENT_QUERY_KEYS.PAGE]: null
  });
  const handlePage = (nextPage) => updateQuery({
    [CLIENT_PAYMENT_QUERY_KEYS.PAGE]: nextPage > 1 ? String(nextPage) : null
  });

  const isEmptyAll = !isLoading && !error && allRows.length === 0;
  const showFilterBar = !error && !isEmptyAll;
  const isEmptyFiltered = !isLoading && !error && allRows.length > 0 && filteredRows.length === 0;
  const caption = buildClientPaymentCaption(period, status, filteredRows.length);

  const filterBar = showFilterBar ? (
    <section className="client-payment-filter" data-testid={CLIENT_PAYMENT_TEST_IDS.FILTER_BAR}>
      <FilterChips
        groupLabel={CLIENT_PAYMENT_COPY.PERIOD_GROUP_LABEL}
        options={CLIENT_PAYMENT_PERIOD_OPTIONS}
        selected={period}
        onSelect={handlePeriod}
      />
      <span className="client-payment-filter__divider" aria-hidden="true" />
      <FilterChips
        groupLabel={CLIENT_PAYMENT_COPY.STATUS_GROUP_LABEL}
        options={CLIENT_PAYMENT_STATUS_FILTER_OPTIONS}
        selected={status}
        onSelect={handleStatus}
      />
      <p
        className="client-payment-filter__summary"
        aria-live="polite"
        data-testid={CLIENT_PAYMENT_TEST_IDS.SUMMARY}
      >
        {isLoading ? (
          <span className="client-payment-skeleton client-payment-skeleton--summary" aria-hidden="true" />
        ) : (
          <SafeText>{formatClientPaymentSummary(summary)}</SafeText>
        )}
      </p>
    </section>
  ) : null;

  let listContent;
  if (error) {
    listContent = (
      <div className="client-payment-history__state" role="alert" data-testid={CLIENT_PAYMENT_TEST_IDS.ERROR}>
        <span className="client-payment-history__alert-icon" aria-hidden="true" />
        <h2 className="client-payment-history__state-title">{CLIENT_PAYMENT_COPY.ERROR_TITLE}</h2>
        <p className="client-payment-history__state-body">{CLIENT_PAYMENT_COPY.ERROR_BODY}</p>
        <button type="button" className="client-payment-history__secondary" onClick={loadPaymentData}>
          {CLIENT_PAYMENT_COPY.RETRY}
        </button>
      </div>
    );
  } else if (isEmptyAll) {
    listContent = (
      <div className="client-payment-history__state" data-testid={CLIENT_PAYMENT_TEST_IDS.EMPTY}>
        <h2 className="client-payment-history__state-title">{CLIENT_PAYMENT_COPY.EMPTY_ALL_TITLE}</h2>
        <p className="client-payment-history__state-body">{CLIENT_PAYMENT_COPY.EMPTY_ALL_BODY}</p>
        <Link to={CLIENT_PAYMENT_COPY.SHOP_HREF} className="client-payment-history__primary">
          {CLIENT_PAYMENT_COPY.EMPTY_ALL_CTA}
        </Link>
      </div>
    );
  } else if (isEmptyFiltered) {
    listContent = (
      <div className="client-payment-history__state" data-testid={CLIENT_PAYMENT_TEST_IDS.EMPTY}>
        <h2 className="client-payment-history__state-title">{CLIENT_PAYMENT_COPY.EMPTY_FILTER_TITLE}</h2>
        <p className="client-payment-history__state-body">{CLIENT_PAYMENT_COPY.EMPTY_FILTER_BODY}</p>
        <button type="button" className="client-payment-history__secondary" onClick={handleReset}>
          {CLIENT_PAYMENT_COPY.EMPTY_FILTER_CTA}
        </button>
      </div>
    );
  } else if (isMobile) {
    listContent = <PaymentCards rows={pageRows} isLoading={isLoading} />;
  } else {
    listContent = <PaymentTable rows={pageRows} caption={caption} isLoading={isLoading} />;
  }

  const mainSlot = (
    <>
      {filterBar}
      <section
        className={[
          'client-payment-history__list',
          isMobile ? 'client-payment-history__list--cards' : ''
        ].filter(Boolean).join(' ')}
        aria-labelledby={CLIENT_PAYMENT_HISTORY_TITLE_ID}
        aria-busy={isLoading ? 'true' : 'false'}
      >
        {listContent}
      </section>
      {!isLoading && !error ? (
        <p className="client-payment-history__sub" data-testid={CLIENT_PAYMENT_TEST_IDS.CENTER_NOTE}>
          {CLIENT_PAYMENT_COPY.CENTER_PAYMENTS_NOTE}
        </p>
      ) : null}
      {!isLoading && !error && totalPages > 1 ? (
        <nav className="client-payment-history__pagination" data-testid={CLIENT_PAYMENT_TEST_IDS.PAGINATION}>
          <MGPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredRows.length}
            itemsPerPage={CLIENT_PAYMENT_HISTORY_PAGE_SIZE}
            onPageChange={handlePage}
            showInfo={false}
            showItemsPerPage={false}
            variant="compact"
          />
        </nav>
      ) : null}
    </>
  );

  return (
    <ClientWebPageShell
      activeNavId="payment"
      title={CLIENT_PAYMENT_COPY.TITLE}
      titleId={CLIENT_PAYMENT_HISTORY_TITLE_ID}
      testId={CLIENT_WEB_SUITE_TEST_IDS.PAYMENT_PAGE}
      className="client-payment-history"
      meta={(
        <Link to={CLIENT_PAYMENT_COPY.ORDERS_HREF} className="client-payment-history__orders-link">
          {CLIENT_PAYMENT_COPY.ORDERS_LINK}
        </Link>
      )}
      main={mainSlot}
    />
  );
};

export default ClientPaymentHistory;
