import React, { useState, useEffect, useMemo } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useSession } from '../../contexts/SessionContext';
import StandardizedApi from '../../utils/standardizedApi';
import { ERP_API } from '../../constants/api';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea } from '../dashboard-v2/content';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import { PurchaseHubSubNav, normalizeErpListResponse } from './purchase/PurchaseHubSections';
import PurchaseQuietHeader from './purchase/PurchaseQuietHeader';
import PurchaseSummaryStrip from './purchase/PurchaseSummaryStrip';
import { ErpEmptyState, useErpSilentRefresh } from './common';
import ErpPageShell from './shell/ErpPageShell';
import MGButton from '../common/MGButton';
import TabChipRow from '../common/TabChipRow';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from './common/erpMgButtonProps';
import {
  PM_PAGE_TITLE,
  PM_MAIN_ARIA_LABEL,
  PM_SESSION,
  PM_LOGIN,
  PM_TAB_ARIA_LABEL,
  PM_TAB_ITEMS,
  PM_TABS,
  PM_EMPTY,
  PM_LOADING,
  PM_ERRORS,
  PM_RETRY,
  PM_STOCK
} from '../../constants/purchaseManagementStrings';
import '../../styles/unified-design-tokens.css';
import './ErpCommon.css';
import './PurchaseManagement.css';

/**
 * 구매 상태 → Clinic-OS 배지 modifier
 * @param {unknown} rawStatus
 * @returns {string}
 */
function toPurchaseStatusModifier(rawStatus) {
  const key = toDisplayString(rawStatus, '').toLowerCase();
  switch (key) {
    case 'success':
    case 'approved':
    case 'completed':
      return 'purchase-management__status--approved';
    case 'warning':
    case 'pending':
      return 'purchase-management__status--pending';
    case 'danger':
    case 'rejected':
      return 'purchase-management__status--danger';
    case 'processing':
      return 'purchase-management__status--processing';
    case 'info':
      return 'purchase-management__status--info';
    default:
      return 'purchase-management__status--info';
  }
}

/**
 * ERP 센터 경비 페이지 — 비품·구매 요청·구매 주문 관리
 */
const PurchaseManagement = () => {
  const { isLoggedIn, isLoading: sessionLoading } = useSession();
  const [activeTab, setActiveTab] = useState(PM_TABS.ITEMS);
  const [items, setItems] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { silentListRefreshing, setSilentListRefreshing } = useErpSilentRefresh();
  const [error, setError] = useState(null);
  const [hasDataError, setHasDataError] = useState(false);
  const [purchaseInitialFetchDone, setPurchaseInitialFetchDone] = useState(false);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn) {
      loadData();
    }
  }, [sessionLoading, isLoggedIn, activeTab]);

  const loadData = async(options = {}) => {
    const silent = options.silent === true;
    try {
      if (silent) {
        setSilentListRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setHasDataError(false);

      await Promise.all([
        loadItems(),
        loadPurchaseRequests(),
        loadPurchaseOrders()
      ]);
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      setError(PM_ERRORS.LOAD_FAILED);
      setHasDataError(true);
    } finally {
      setPurchaseInitialFetchDone(true);
      if (silent) {
        setSilentListRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadItems = async() => {
    try {
      const raw = await StandardizedApi.get(ERP_API.ITEMS);
      const list = normalizeErpListResponse(raw);
      setItems(list);
    } catch (err) {
      console.error('아이템 로드 실패:', err);
      setError('아이템 목록을 불러오는 중 오류가 발생했습니다.');
      setHasDataError(true);
    }
  };

  const loadPurchaseRequests = async() => {
    try {
      const raw = await StandardizedApi.get(ERP_API.PURCHASE_REQUESTS);
      const list = normalizeErpListResponse(raw);
      setPurchaseRequests(list);
    } catch (err) {
      console.error('구매 요청 로드 실패:', err);
      setError('구매 요청 목록을 불러오는 중 오류가 발생했습니다.');
      setHasDataError(true);
    }
  };

  const loadPurchaseOrders = async() => {
    try {
      const raw = await StandardizedApi.get(ERP_API.PURCHASE_ORDERS);
      const list = normalizeErpListResponse(raw);
      setPurchaseOrders(list);
    } catch (err) {
      console.error('구매 주문 로드 실패:', err);
      setError('구매 주문 목록을 불러오는 중 오류가 발생했습니다.');
      setHasDataError(true);
    }
  };

  const summaryLoading = loading && !purchaseInitialFetchDone;
  const showInitialInlineLoad = loading && !purchaseInitialFetchDone && !(error && hasDataError);
  const showListLoading = loading && !showInitialInlineLoad;

  const activeEmptyTitle = useMemo(() => {
    switch (activeTab) {
      case PM_TABS.REQUESTS:
        return PM_EMPTY.REQUESTS;
      case PM_TABS.ORDERS:
        return PM_EMPTY.ORDERS;
      default:
        return PM_EMPTY.ITEMS;
    }
  }, [activeTab]);

  if (sessionLoading) {
    return (
      <AdminCommonLayout title={PM_PAGE_TITLE}>
        <ContentArea className="mg-v2-content-area" ariaLabel={PM_MAIN_ARIA_LABEL}>
          <div className="purchase-management">
            <PurchaseQuietHeader onRefresh={() => {}} disabled />
            <div className="purchase-management__initial-load" role="status" aria-live="polite">
              <UnifiedLoading type="inline" text={PM_SESSION.LOADING} />
            </div>
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <AdminCommonLayout title={PM_PAGE_TITLE}>
        <ContentArea className="mg-v2-content-area" ariaLabel={PM_MAIN_ARIA_LABEL}>
          <div className="erp-error">
            <h3>{PM_LOGIN.HEADING}</h3>
            <p>{PM_LOGIN.BODY}</p>
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  const renderItemsTab = () => {
    if (items.length === 0) {
      return <ErpEmptyState title={PM_EMPTY.ITEMS} />;
    }

    return (
      <div className="purchase-management__cards-grid">
        {items.map((item) => {
          const stockSufficient = item.stockQuantity > 10;
          return (
            <article key={item.id} className="purchase-management__card">
              <div className="purchase-management__card-header">
                <h3 className="purchase-management__card-title">
                  <SafeText>{item.name}</SafeText>
                </h3>
                <span
                  className={`purchase-management__status ${
                    stockSufficient
                      ? 'purchase-management__status--success'
                      : 'purchase-management__status--warning'
                  }`}
                >
                  {stockSufficient ? PM_STOCK.SUFFICIENT : PM_STOCK.LOW}
                </span>
              </div>
              <div className="purchase-management__card-body">
                {item.description ? (
                  <p className="purchase-management__card-description">
                    <SafeText>{item.description}</SafeText>
                  </p>
                ) : null}
                <div className="purchase-management__card-row">
                  <span className="purchase-management__card-label">가격</span>
                  <span className="purchase-management__card-value purchase-management__card-value--amount">
                    {toDisplayString(item.unitPrice != null ? `${item.unitPrice.toLocaleString()}원` : '—')}
                  </span>
                </div>
                <div className="purchase-management__card-row">
                  <span className="purchase-management__card-label">재고</span>
                  <span className="purchase-management__card-value">
                    {toDisplayString(item.stockQuantity)}개
                  </span>
                </div>
                <div className="purchase-management__card-row">
                  <span className="purchase-management__card-label">카테고리</span>
                  <span className="purchase-management__card-value">
                    <SafeText>{item.category}</SafeText>
                  </span>
                </div>
                <div className="purchase-management__card-row">
                  <span className="purchase-management__card-label">공급업체</span>
                  <span className="purchase-management__card-value">
                    <SafeText>{item.supplier}</SafeText>
                  </span>
                </div>
              </div>
              <div className="purchase-management__card-footer">
                <MGButton
                  variant="primary"
                  size="small"
                  type="button"
                  className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: false })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                >
                  구매 요청
                </MGButton>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  const renderRequestsTab = () => {
    if (purchaseRequests.length === 0) {
      return <ErpEmptyState title={PM_EMPTY.REQUESTS} />;
    }

    return (
      <div className="purchase-management__cards-grid">
        {purchaseRequests.map((request) => (
          <article key={request.id} className="purchase-management__card">
            <div className="purchase-management__card-header">
              <h3 className="purchase-management__card-title">
                #{toDisplayString(request.id)}
              </h3>
              <span className="purchase-management__card-meta">
                <SafeText>{request.createdAt}</SafeText>
              </span>
            </div>
            <div className="purchase-management__card-body">
              <div className="purchase-management__card-row">
                <span className="purchase-management__card-label">아이템</span>
                <span className="purchase-management__card-value">
                  <SafeText>{request.itemName}</SafeText>
                </span>
              </div>
              <div className="purchase-management__card-row">
                <span className="purchase-management__card-label">수량</span>
                <span className="purchase-management__card-value">
                  {toDisplayString(request.quantity)}개
                </span>
              </div>
              <div className="purchase-management__card-row">
                <span className="purchase-management__card-label">상태</span>
                <span
                  className={`purchase-management__status ${toPurchaseStatusModifier(request.status)}`}
                >
                  <SafeText>{request.status}</SafeText>
                </span>
              </div>
            </div>
            <div className="purchase-management__card-footer">
              <MGButton
                variant="outline"
                size="small"
                className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
                onClick={() => {}}
                preventDoubleClick
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              >
                상세
              </MGButton>
            </div>
          </article>
        ))}
      </div>
    );
  };

  const renderOrdersTab = () => {
    if (purchaseOrders.length === 0) {
      return <ErpEmptyState title={PM_EMPTY.ORDERS} />;
    }

    return (
      <div className="purchase-management__cards-grid">
        {purchaseOrders.map((order) => (
          <article key={order.id} className="purchase-management__card">
            <div className="purchase-management__card-header">
              <h3 className="purchase-management__card-title">
                #{toDisplayString(order.orderNumber)}
              </h3>
              <span className="purchase-management__card-meta">
                <SafeText>{order.createdAt}</SafeText>
              </span>
            </div>
            <div className="purchase-management__card-body">
              <div className="purchase-management__card-row">
                <span className="purchase-management__card-label">공급업체</span>
                <span className="purchase-management__card-value">
                  <SafeText>{order.supplier}</SafeText>
                </span>
              </div>
              <div className="purchase-management__card-row">
                <span className="purchase-management__card-label">총 금액</span>
                <span className="purchase-management__card-value purchase-management__card-value--amount">
                  {toDisplayString(order.totalAmount != null ? `${order.totalAmount.toLocaleString()}원` : '—')}
                </span>
              </div>
              <div className="purchase-management__card-row">
                <span className="purchase-management__card-label">상태</span>
                <span
                  className={`purchase-management__status ${toPurchaseStatusModifier(order.status)}`}
                >
                  <SafeText>{order.status}</SafeText>
                </span>
              </div>
            </div>
            <div className="purchase-management__card-footer">
              <MGButton
                variant="outline"
                size="small"
                className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
                onClick={() => {}}
                preventDoubleClick
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              >
                상세
              </MGButton>
            </div>
          </article>
        ))}
      </div>
    );
  };

  const renderStageContent = () => {
    if (showInitialInlineLoad) {
      return (
        <div className="purchase-management__initial-load" role="status" aria-live="polite">
          <UnifiedLoading type="inline" text={PM_LOADING.INLINE} />
        </div>
      );
    }

    if (showListLoading) {
      return (
        <div className="purchase-management__initial-load" role="status" aria-live="polite">
          <UnifiedLoading type="inline" text={PM_LOADING.LIST} />
        </div>
      );
    }

    if (error && hasDataError) {
      return (
        <div className="purchase-management__error" role="alert">
          <SafeErrorDisplay error={error} variant="banner" />
          <MGButton
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: silentListRefreshing })}
            onClick={() => loadData({ silent: true })}
            loading={silentListRefreshing}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            disabled={loading}
            aria-label={PM_RETRY.ARIA_LABEL}
          >
            {PM_RETRY.LABEL}
          </MGButton>
        </div>
      );
    }

    if (!purchaseInitialFetchDone) {
      return null;
    }

    switch (activeTab) {
      case PM_TABS.REQUESTS:
        return renderRequestsTab();
      case PM_TABS.ORDERS:
        return renderOrdersTab();
      default:
        return renderItemsTab();
    }
  };

  return (
    <AdminCommonLayout title={PM_PAGE_TITLE}>
      <ContentArea className="mg-v2-content-area" ariaLabel={PM_MAIN_ARIA_LABEL}>
        <ErpPageShell
          className="purchase-management-shell"
          headerSlot={
            <PurchaseQuietHeader
              onRefresh={() => loadData({ silent: true })}
              refreshing={silentListRefreshing}
              disabled={loading}
            />
          }
          tabsSlot={<PurchaseHubSubNav />}
          mainAriaLabel={PM_MAIN_ARIA_LABEL}
        >
          <div className="purchase-management" data-testid="purchase-management">
            <PurchaseSummaryStrip
              loading={summaryLoading}
              itemCount={items.length}
              requestCount={purchaseRequests.length}
              orderCount={purchaseOrders.length}
            />

            <div className="purchase-management__tabs-wrap">
              <TabChipRow
                ariaLabel={PM_TAB_ARIA_LABEL}
                items={PM_TAB_ITEMS}
                activeKey={activeTab}
                onChange={setActiveTab}
                size="sm"
              />
            </div>

            <div
              className="purchase-management__stage"
              aria-busy={loading || silentListRefreshing}
              aria-label={activeEmptyTitle}
            >
              {renderStageContent()}
            </div>
          </div>
        </ErpPageShell>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default PurchaseManagement;
