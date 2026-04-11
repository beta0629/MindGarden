import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import MGCard from '../common/MGCard';
import { useSession } from '../../contexts/SessionContext';
import StandardizedApi from '../../utils/standardizedApi';
import { ERP_API } from '../../constants/api';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import { Package, FileText, ShoppingCart, Eye } from 'lucide-react';
import './ErpCommon.css';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import { PurchaseHubSubNav, normalizeErpListResponse } from './purchase/PurchaseHubSections';
import { ErpFilterToolbar, useErpSilentRefresh } from './common';
import ErpPageShell from './shell/ErpPageShell';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from './common/erpMgButtonProps';

/**
 * ERP 구매 관리 페이지 — 비품 구매 요청 및 주문 관리
 */
const PurchaseManagement = () => {
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [activeTab, setActiveTab] = useState('items');
  const [items, setItems] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { silentListRefreshing, setSilentListRefreshing } = useErpSilentRefresh();
  const [error, setError] = useState(null);
  const [purchaseInitialFetchDone, setPurchaseInitialFetchDone] = useState(false);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn && user?.id) {
      loadData();
    }
  }, [sessionLoading, isLoggedIn, user?.id, activeTab]);

  const loadData = async(options = {}) => {
    const silent = options.silent === true;
    try {
      if (silent) {
        setSilentListRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      switch (activeTab) {
        case 'items':
          await loadItems();
          break;
        case 'requests':
          await loadPurchaseRequests();
          break;
        case 'orders':
          await loadPurchaseOrders();
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
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
    }
  };

  if (sessionLoading) {
    return (
      <AdminCommonLayout title="구매 관리">
        <ContentHeader
          title="구매 관리"
          subtitle="세션 확인 중"
        />
        <ContentArea className="erp-system mg-v2-content-area" ariaLabel="구매 관리">
          <div className="erp-initial-fetch-inline" role="status" aria-live="polite">
            <UnifiedLoading type="inline" text="세션 정보를 불러오는 중..." />
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <AdminCommonLayout title="구매 관리">
        <div className="erp-error">
          <h3>로그인이 필요합니다.</h3>
          <p>구매 관리 기능을 사용하려면 로그인해주세요.</p>
        </div>
      </AdminCommonLayout>
    );
  }

  const showInitialInlineLoad = loading && !purchaseInitialFetchDone;

  return (
    <AdminCommonLayout title="구매 관리">
      <ContentArea className="erp-system mg-v2-content-area">
        <ErpPageShell
          headerSlot={
            <ContentHeader
              title="구매 관리"
              subtitle="조달·품목·구매 요청을 허브에서 오갈 수 있습니다. 아래에서 목록·주문을 확인하세요."
            />
          }
          tabsSlot={<PurchaseHubSubNav />}
          mainAriaLabel="구매 관리 목록 및 본문"
        >
          <div className="erp-container">
            <div className="erp-tabs">
              <MGButton
                type="button"
                variant="outline"
                size="medium"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} erp-tab ${activeTab === 'items' ? 'active' : ''}`}
                onClick={() => setActiveTab('items')}
                preventDoubleClick={false}
              >
                <Package size={18} aria-hidden />
                비품 목록
              </MGButton>
              <MGButton
                type="button"
                variant="outline"
                size="medium"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} erp-tab ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
                preventDoubleClick={false}
              >
                <FileText size={18} aria-hidden />
                구매 요청
              </MGButton>
              <MGButton
                type="button"
                variant="outline"
                size="medium"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} erp-tab ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
                preventDoubleClick={false}
              >
                <ShoppingCart size={18} aria-hidden />
                구매 주문
              </MGButton>
            </div>

            <ErpFilterToolbar
              ariaLabel="구매 목록 도구"
              secondaryRow={
                <div className="purchase-management__toolbar-actions">
                  <MGButton
                    variant="secondary"
                    size="small"
                    className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: silentListRefreshing })}
                    onClick={() => loadData({ silent: true })}
                    loading={silentListRefreshing}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    disabled={loading}
                    aria-label="목록 새로고침"
                  >
                    목록 새로고침
                  </MGButton>
                </div>
              }
            />

            <div className="erp-content">
          {showInitialInlineLoad && (
            <div className="erp-initial-fetch-inline" role="status" aria-live="polite">
              <UnifiedLoading type="inline" text="데이터를 불러오는 중..." />
            </div>
          )}

          {loading && !showInitialInlineLoad && (
            <div className="purchase-management-loading-container">
              <UnifiedLoading type="inline" text="로딩 중..." />
            </div>
          )}

          {error && (
            <div className="erp-error">
              <SafeErrorDisplay error={error} variant="banner" />
              <MGButton
                variant="outline"
                size="small"
                className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: silentListRefreshing })}
                onClick={() => loadData({ silent: true })}
                loading={silentListRefreshing}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                disabled={loading}
                aria-label="다시 시도"
              >
                다시 시도
              </MGButton>
            </div>
          )}

          {purchaseInitialFetchDone && !loading && !error && (
            <>
              {activeTab === 'items' && (
                <div className="erp-section">
                  <h2>비품 목록</h2>
                  <div className="erp-grid">
                    {items.map((item) => (
                      <div key={item.id} className="erp-card">
                        <div className="erp-card-header">
                          <h3><SafeText>{item.name}</SafeText></h3>
                          <span className={`erp-status ${item.stockQuantity > 10 ? 'success' : 'warning'}`}>
                            {item.stockQuantity > 10 ? '충분' : '부족'}
                          </span>
                        </div>
                        <div className="erp-card-body">
                          <p className="erp-description"><SafeText>{item.description}</SafeText></p>
                          <div className="erp-details">
                            <div className="erp-detail">
                              <span className="erp-label">가격:</span>
                              <span className="erp-value">{toDisplayString(item.unitPrice != null ? `${item.unitPrice.toLocaleString()}원` : '—')}</span>
                            </div>
                            <div className="erp-detail">
                              <span className="erp-label">재고:</span>
                              <span className="erp-value">{toDisplayString(item.stockQuantity)}개</span>
                            </div>
                            <div className="erp-detail">
                              <span className="erp-label">카테고리:</span>
                              <span className="erp-value"><SafeText>{item.category}</SafeText></span>
                            </div>
                            <div className="erp-detail">
                              <span className="erp-label">공급업체:</span>
                              <span className="erp-value"><SafeText>{item.supplier}</SafeText></span>
                            </div>
                          </div>
                        </div>
                        <div className="erp-card-footer">
                          <MGButton
                            variant="primary"
                            size="small"
                            type="button"
                            className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: false })}
                          >
                            <ShoppingCart size={16} aria-hidden />
                            구매 요청
                          </MGButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'requests' && (
                <div className="erp-section">
                  <h2>구매 요청</h2>
                  <div className="mg-purchase-request-cards-grid">
                    {purchaseRequests.map((request) => (
                      <MGCard
                        key={request.id}
                        variant="default"
                        className="mg-purchase-request-card"
                      >
                        <div className="mg-purchase-request-card__header">
                          <div className="mg-purchase-request-card__id">#{toDisplayString(request.id)}</div>
                          <div className="mg-purchase-request-card__date"><SafeText>{request.createdAt}</SafeText></div>
                        </div>

                        <div className="mg-purchase-request-card__body">
                          <div className="mg-purchase-request-card__field">
                            <span className="mg-purchase-request-card__label">아이템</span>
                            <span className="mg-purchase-request-card__value"><SafeText>{request.itemName}</SafeText></span>
                          </div>
                          <div className="mg-purchase-request-card__field">
                            <span className="mg-purchase-request-card__label">수량</span>
                            <span className="mg-purchase-request-card__value">{toDisplayString(request.quantity)}개</span>
                          </div>
                          <div className="mg-purchase-request-card__field">
                            <span className="mg-purchase-request-card__label">상태</span>
                            <span className={`erp-status ${toDisplayString(request.status, '').toLowerCase()}`}>
                              <SafeText>{request.status}</SafeText>
                            </span>
                          </div>
                        </div>

                        <div className="mg-purchase-request-card__footer">
                          <MGButton
                            variant="outline"
                            size="small"
                            className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
                            onClick={() => {}}
                            preventDoubleClick={true}
                          >
                            <Eye size={16} aria-hidden /> 상세
                          </MGButton>
                        </div>
                      </MGCard>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="erp-section">
                  <h2>구매 주문</h2>
                  <div className="mg-purchase-order-cards-grid">
                    {purchaseOrders.map((order) => (
                      <MGCard
                        key={order.id}
                        variant="default"
                        className="mg-purchase-order-card"
                      >
                        <div className="mg-purchase-order-card__header">
                          <div className="mg-purchase-order-card__id">#{toDisplayString(order.orderNumber)}</div>
                          <div className="mg-purchase-order-card__date"><SafeText>{order.createdAt}</SafeText></div>
                        </div>

                        <div className="mg-purchase-order-card__body">
                          <div className="mg-purchase-order-card__field">
                            <span className="mg-purchase-order-card__label">공급업체</span>
                            <span className="mg-purchase-order-card__value"><SafeText>{order.supplier}</SafeText></span>
                          </div>
                          <div className="mg-purchase-order-card__field">
                            <span className="mg-purchase-order-card__label">총 금액</span>
                            <span className="mg-purchase-order-card__value mg-purchase-order-card__value--amount">
                              {toDisplayString(order.totalAmount != null ? `${order.totalAmount.toLocaleString()}원` : '—')}
                            </span>
                          </div>
                          <div className="mg-purchase-order-card__field">
                            <span className="mg-purchase-order-card__label">상태</span>
                            <span className={`erp-status ${toDisplayString(order.status, '').toLowerCase()}`}>
                              <SafeText>{order.status}</SafeText>
                            </span>
                          </div>
                        </div>

                        <div className="mg-purchase-order-card__footer">
                          <MGButton
                            variant="outline"
                            size="small"
                            className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
                            onClick={() => {}}
                            preventDoubleClick={true}
                          >
                            <Eye size={16} aria-hidden /> 상세
                          </MGButton>
                        </div>
                      </MGCard>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
            </div>
          </div>
        </ErpPageShell>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default PurchaseManagement;
