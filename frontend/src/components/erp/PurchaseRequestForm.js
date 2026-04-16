import React, { useState, useEffect } from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import MGButton from '../common/MGButton';
import UnifiedLoading from '../common/UnifiedLoading';
import UnifiedModal from '../common/modals/UnifiedModal.js';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import { useSession } from '../../hooks/useSession';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import { toDisplayString } from '../../utils/safeDisplay';
import StandardizedApi from '../../utils/standardizedApi';
import { ERP_API } from '../../constants/api';
import './ErpCommon.css';
import './PurchaseRequestForm.css';
import { PurchaseHubSubNav, normalizeErpListResponse } from './purchase/PurchaseHubSections';
import ErpPageShell from './shell/ErpPageShell';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from './common/erpMgButtonProps';
import {
  ErpEmptyState,
  ErpFilterToolbar,
  ErpKpiStatCard,
  ErpSafeNumber,
  ErpSafeText,
  ERP_KPI_STAT_VARIANT,
  ERP_KPI_TREND_DIRECTION,
  ERP_NUMBER_FORMAT,
  useErpSilentRefresh
} from './common';

const PURCHASE_REQUEST_TITLE_ID = 'purchase-request-title';

/**
 * 구매 요청 폼 컴포넌트
 */
const PurchaseRequestForm = () => {
  const { user } = useSession();
  const [loading, setLoading] = useState(false);
  const { silentListRefreshing, setSilentListRefreshing } = useErpSilentRefresh();
  const [itemsInitialFetchDone, setItemsInitialFetchDone] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [itemQuantities, setItemQuantities] = useState({});
  const [reason, setReason] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async(options = {}) => {
    const silent = options.silent === true;
    try {
      if (silent) {
        setSilentListRefreshing(true);
      } else {
        setLoading(true);
      }
      const raw = await StandardizedApi.get(ERP_API.ITEMS);
      const list = normalizeErpListResponse(raw);
      setItems(list);
    } catch (err) {
      console.error('아이템 로드 실패:', err);
      setError('아이템 목록을 불러오는데 실패했습니다.');
    } finally {
      setItemsInitialFetchDone(true);
      if (silent) {
        setSilentListRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleItemSelect = (item) => {
    const isSelected = selectedItems.some((selected) => selected.id === item.id);

    if (isSelected) {
      setSelectedItems((prev) => prev.filter((selected) => selected.id !== item.id));
      setItemQuantities((prev) => {
        const newQuantities = { ...prev };
        delete newQuantities[item.id];
        return newQuantities;
      });
    } else {
      setSelectedItems((prev) => [...prev, item]);
      setItemQuantities((prev) => ({
        ...prev,
        [item.id]: 1
      }));
    }
  };

  const handleQuantityChange = (itemId, quantity) => {
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(1, quantity)
    }));
  };

  const isItemSelected = (item) => {
    return selectedItems.some((selected) => selected.id === item.id);
  };

  const selectedTotalAmount = selectedItems.reduce((total, item) => {
    const quantity = itemQuantities[item.id] || 1;
    return total + (item.unitPrice * quantity);
  }, 0);

  const handleSubmit = async(e) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      setError('최소 하나의 아이템을 선택해주세요.');
      return;
    }

    for (const item of selectedItems) {
      const quantity = itemQuantities[item.id] || 1;
      if (quantity < 1) {
        setError(`${toDisplayString(item.name)}의 수량은 1개 이상이어야 합니다.`);
        return;
      }
    }

    try {
      setLoading(true);
      setError('');

      const requesterId = user?.id;

      if (!requesterId) {
        setError('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      const requests = selectedItems.map((item) => ({
        requesterId: requesterId,
        itemId: item.id,
        quantity: itemQuantities[item.id] || 1,
        reason: reason
      }));

      const results = [];
      for (const request of requests) {
        const formData = new FormData();
        formData.append('requesterId', String(request.requesterId));
        formData.append('itemId', String(request.itemId));
        formData.append('quantity', String(request.quantity));
        if (request.reason) {
          formData.append('reason', request.reason);
        }
        const data = await StandardizedApi.postFormData(ERP_API.PURCHASE_REQUESTS, formData);
        results.push(data);
      }

      const allSuccess = results.every((result) => result && result.success);

      if (allSuccess) {
        setShowSuccessModal(true);
        setSelectedItems([]);
        setItemQuantities({});
        setReason('');
      } else {
        const failedItems = results
          .map((result, index) => (result.success ? null : toDisplayString(selectedItems[index]?.name)))
          .filter(Boolean);
        setError(`다음 아이템의 구매 요청에 실패했습니다: ${failedItems.join(', ')}`);
      }
    } catch (err) {
      console.error('구매 요청 생성 실패:', err);
      setError('구매 요청 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const shell = (inner) => (
    <AdminCommonLayout title="구매 요청">
      <div className="mg-v2-ad-b0kla mg-v2-purchase-request-form">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel="구매 요청 본문">
            <ErpPageShell
              headerSlot={
                <ContentHeader
                  title="구매 요청"
                  subtitle="조달 허브에서 조달·품목 화면과 이동할 수 있습니다. 필요한 비품을 요청하세요."
                  titleId={PURCHASE_REQUEST_TITLE_ID}
                  actions={
                    <MGButton
                      type="button"
                      variant="secondary"
                      className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
                      onClick={() => window.history.back()}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    >
                      뒤로가기
                    </MGButton>
                  }
                />
              }
              tabsSlot={<PurchaseHubSubNav />}
              mainAriaLabel="구매 요청 본문"
            >
              {inner}
            </ErpPageShell>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );

  const showInitialInlineLoad =
    loading && items.length === 0 && !itemsInitialFetchDone;

  return shell(
    <>
      <section
        aria-labelledby={PURCHASE_REQUEST_TITLE_ID}
        className="purchase-request-form-container"
        aria-busy={silentListRefreshing || loading}
      >
        {showInitialInlineLoad ? (
          <div
            className="purchase-request-form__initial-load"
            role="status"
            aria-live="polite"
          >
            <UnifiedLoading type="inline" text="데이터를 불러오는 중..." />
          </div>
        ) : (
        <div className="mg-v2-container mg-v2-purchase-request-form__inner">
          {items.length === 0 ? (
            <>
              {silentListRefreshing && (
                <UnifiedLoading type="inline" text="아이템 목록을 불러오는 중..." />
              )}
              <ErpEmptyState
                title="등록된 아이템이 없습니다"
                description="비품 목록이 비어 있습니다. 관리자에게 문의하거나 나중에 다시 시도해 주세요."
                actionSlot={
                  <MGButton
                    type="button"
                    variant="primary"
                    className={buildErpMgButtonClassName({ variant: 'primary', loading: silentListRefreshing })}
                    onClick={() => loadItems({ silent: true })}
                    loading={silentListRefreshing}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  >
                    다시 불러오기
                  </MGButton>
                }
              />
            </>
          ) : (
            <>
              <ErpFilterToolbar
                ariaLabel="구매 요청 도구"
                secondaryRow={
                  <div className="purchase-request-form__toolbar-actions">
                    <MGButton
                      type="button"
                      variant="secondary"
                      size="small"
                      onClick={() => loadItems({ silent: true })}
                      loading={silentListRefreshing}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      disabled={loading}
                      className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: silentListRefreshing })}
                      aria-label="아이템 목록 새로고침"
                    >
                      목록 새로고침
                    </MGButton>
                  </div>
                }
              />
              <section className="mg-v2-purchase-request-form__panel" aria-label="구매 요청서 작성">
              <h2 className="mg-v2-purchase-request-form__panel-title">구매 요청서 작성</h2>
              <form onSubmit={handleSubmit}>
                <div className="mg-v2-form-group">
                  <label className="mg-v2-form-label" htmlFor="purchase-item-grid">
                    아이템 선택 *
                  </label>
                  <div
                    id="purchase-item-grid"
                    className="mg-v2-purchase-request-form__item-grid"
                  >
                    {items.map((item) => (
                      <MGButton
                        key={item.id}
                        type="button"
                        variant="outline"
                        size="medium"
                        fullWidth
                        preventDoubleClick={false}
                        className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} mg-v2-purchase-item-card${isItemSelected(item) ? ' mg-v2-purchase-item-card--selected' : ''}`}
                        onClick={() => handleItemSelect(item)}
                      >
                        <div className="mg-flex mg-flex-col mg-w-full">
                          {isItemSelected(item) && (
                            <div className="mg-v2-purchase-item-card__check" aria-hidden>
                              ✓
                            </div>
                          )}
                          <div className="mg-v2-purchase-item-card__name">
                            <ErpSafeText value={item.name} />
                          </div>
                          <div className="mg-v2-purchase-item-card__category">
                            <ErpSafeText value={item.category} />
                          </div>
                          <div className="mg-v2-purchase-item-card__price">
                            <ErpSafeNumber value={item.unitPrice} formatType={ERP_NUMBER_FORMAT.CURRENCY} />
                          </div>
                          <div className="mg-v2-purchase-item-card__stock">
                            <span className="mg-v2-purchase-item-card__stock-label">재고:</span>
                            <ErpSafeText value={item.stockQuantity} />
                            <span>개</span>
                          </div>
                        </div>
                      </MGButton>
                    ))}
                  </div>
                </div>

                {selectedItems.length > 0 && (
                  <div className="mg-v2-form-group">
                    <span className="mg-v2-purchase-qty-section__label" id="purchase-qty-heading">
                      선택된 아이템 수량 설정 *
                    </span>
                    <div className="mg-v2-purchase-qty-list" role="group" aria-labelledby="purchase-qty-heading">
                      {selectedItems.map((item) => (
                        <div key={item.id} className="mg-v2-purchase-qty-row">
                          <div className="mg-v2-purchase-qty-row__main">
                            <div className="mg-v2-purchase-qty-row__name">
                              <ErpSafeText value={item.name} />
                            </div>
                            <div className="mg-v2-purchase-qty-row__calc">
                              <ErpSafeNumber value={item.unitPrice} formatType={ERP_NUMBER_FORMAT.CURRENCY} />
                              <span className="mg-v2-purchase-qty-row__mul">×</span>
                              <ErpSafeText value={itemQuantities[item.id] || 1} />
                              <span>개 = </span>
                              <ErpSafeNumber
                                value={item.unitPrice * (itemQuantities[item.id] || 1)}
                                formatType={ERP_NUMBER_FORMAT.CURRENCY}
                              />
                            </div>
                          </div>
                          <div className="mg-v2-purchase-qty-controls">
                            <MGButton
                              type="button"
                              variant="outline"
                              className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} mg-v2-purchase-qty-btn`}
                              aria-label="수량 감소"
                              onClick={() => handleQuantityChange(item.id, (itemQuantities[item.id] || 1) - 1)}
                              preventDoubleClick={false}
                              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            >
                              -
                            </MGButton>
                            <input
                              type="number"
                              className="mg-v2-purchase-qty-input"
                              min="1"
                              value={itemQuantities[item.id] || 1}
                              onChange={(e) => handleQuantityChange(item.id, Number.parseInt(e.target.value, 10) || 1)}
                              aria-label={`${toDisplayString(item.name)} 수량`}
                            />
                            <MGButton
                              type="button"
                              variant="outline"
                              className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} mg-v2-purchase-qty-btn`}
                              aria-label="수량 증가"
                              onClick={() => handleQuantityChange(item.id, (itemQuantities[item.id] || 1) + 1)}
                              preventDoubleClick={false}
                              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            >
                              +
                            </MGButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mg-v2-form-group">
                  <label className="mg-v2-form-label" htmlFor="purchase-reason">
                    구매 사유
                  </label>
                  <textarea
                    id="purchase-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="구매 사유를 입력해주세요..."
                    rows={4}
                    className="mg-v2-purchase-request-form__textarea"
                  />
                </div>

                {selectedItems.length > 0 && (
                  <div className="mg-v2-purchase-request-form__summary">
                    <div className="mg-v2-purchase-request-form__summary-kpi">
                      <ErpKpiStatCard
                        title="선택 항목 총액"
                        value={selectedTotalAmount}
                        formatType={ERP_NUMBER_FORMAT.CURRENCY}
                        variant={ERP_KPI_STAT_VARIANT.PRIMARY}
                        trend={{
                          direction: ERP_KPI_TREND_DIRECTION.NEUTRAL,
                          label: `${selectedItems.length}개 품목`
                        }}
                      />
                    </div>
                    <h3 className="mg-v2-purchase-request-form__summary-title">
                      선택된 아이템 요약 (
                      <ErpSafeText value={selectedItems.length} />
                      개)
                    </h3>
                    <div className="mg-v2-purchase-request-form__summary-list">
                      {selectedItems.map((item) => {
                        const quantity = itemQuantities[item.id] || 1;
                        const totalPrice = item.unitPrice * quantity;
                        return (
                          <div key={item.id} className="mg-v2-purchase-request-form__summary-row">
                            <div>
                              <strong>
                                <ErpSafeText value={item.name} />
                              </strong>
                              {' '}
                              (
                              <ErpSafeText value={item.category} />
                              )
                            </div>
                            <div className="mg-v2-purchase-request-form__summary-row-total">
                              <ErpSafeNumber value={item.unitPrice} formatType={ERP_NUMBER_FORMAT.CURRENCY} />
                              {' × '}
                              <ErpSafeText value={quantity} />
                              {' = '}
                              <ErpSafeNumber value={totalPrice} formatType={ERP_NUMBER_FORMAT.CURRENCY} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mg-v2-purchase-request-form__error-wrap">
                    <SafeErrorDisplay error={error} variant="banner" iconSize={18} />
                  </div>
                )}

                <div className="mg-v2-purchase-request-form__actions">
                  <MGButton
                    type="submit"
                    variant="primary"
                    size="large"
                    className={buildErpMgButtonClassName({ variant: 'primary', size: 'lg', loading })}
                    loading={loading}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    disabled={selectedItems.length === 0}
                    preventDoubleClick={false}
                  >
                    구매 요청 제출
                  </MGButton>
                </div>
              </form>
              </section>
            </>
          )}
        </div>
        )}
      </section>

      <UnifiedModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="구매 요청 완료"
        size="small"
        showCloseButton
        backdropClick
        className="mg-v2-ad-b0kla"
      >
        <div className="mg-v2-purchase-modal-success">
          <div className="mg-v2-purchase-modal-success__icon" aria-hidden>
            ✓
          </div>
          <h3 className="mg-v2-purchase-modal-success__title">
            구매 요청이 성공적으로 제출되었습니다!
          </h3>
          <p className="mg-v2-purchase-modal-success__desc">
            관리자 승인 후 구매가 진행됩니다.
          </p>
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({ variant: 'primary', loading: false })}
            onClick={() => setShowSuccessModal(false)}
            preventDoubleClick={false}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          >
            확인
          </MGButton>
        </div>
      </UnifiedModal>
    </>
  );
};

export default PurchaseRequestForm;
