/**
 * 환불 관리 페이지 — Clinic-OS quiet chrome
 * 라우트: /erp/refund-management
 * SSOT: docs/design-system/REFUND_MANAGEMENT_CLINIC_OS_HANDOFF.md
 *
 * Layout: QuietHeader → SummaryStrip 3 → RefundActionRail → chips → __stage
 *
 * @author CoreSolution
 * @since 2025-03-16
 * @updated 2026-09-08 Clinic-OS TO-BE
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import UnifiedModal from '../common/modals/UnifiedModal';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea } from '../dashboard-v2/content';
import {
  RefundFilterBlock,
  RefundHistoryTableBlock,
  RefundReasonStatsBlock,
  RefundErpSyncBlock,
  RefundAccountingBlock,
  RefundQuietHeader,
  RefundSummaryStrip,
  RefundActionRail
} from './refund-management';
import { FinancialRefundHubTabs } from './financial/FinancialRefundHubLayout';
import ErpPageShell from './shell/ErpPageShell';
import './refund-management/RefundManagement.css';
import StandardizedApi from '../../utils/standardizedApi';
import {
  useErpSilentRefresh,
  ErpSafeText,
  ErpSafeNumber,
  ERP_NUMBER_FORMAT
} from './common';
import notificationManager from '../../utils/notification';
import { useSavedViewPreference } from '../../hooks/useSavedViewPreference';
import SavedViewControls from '../admin/ClientComprehensiveManagement/molecules/SavedViewControls';
import {
  RM_SAVED_VIEW_PAGE_ID,
  RM_SAVED_VIEW_PERSIST_DEBOUNCE_MS,
  RM_DEFAULT_SELECTED_PERIOD,
  RM_DEFAULT_SELECTED_STATUS,
  RM_DEFAULT_REFUND_VIEW_MODE,
  buildRefundManagementDefaultSavedView
} from '../../constants/refundManagementSavedViewConstants';
import {
  RM_PAGE_TITLE,
  RM_MAIN_ARIA_LABEL,
  RM_LOADING,
  RM_ROW
} from '../../constants/refundManagementClinicOsStrings';
import { toSafeNumber } from '../../utils/safeDisplay';

const REFUND_STATISTICS_ENDPOINT = '/api/v1/admin/refund-statistics';
const REFUND_HISTORY_ENDPOINT = '/api/v1/admin/refund-history';
const ERP_SYNC_STATUS_ENDPOINT = '/api/v1/admin/erp-sync-status';
const REFLECT_ERP_REFUND_ENDPOINT = (mappingId) =>
  `/api/v1/admin/mappings/${mappingId}/reflect-erp-refund`;

const RM_DEFAULT_SAVED_VIEW = buildRefundManagementDefaultSavedView();

const RefundManagement = () => {
  const [loading, setLoading] = useState(false);
  const { silentListRefreshing, setSilentListRefreshing } = useErpSilentRefresh();
  const [isLoadingReflect, setIsLoadingReflect] = useState(false);
  const [refundStats, setRefundStats] = useState({});
  const [refundHistory, setRefundHistory] = useState([]);
  const [erpSyncStatus, setErpSyncStatus] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState(RM_DEFAULT_SELECTED_PERIOD);
  const [selectedStatus, setSelectedStatus] = useState(RM_DEFAULT_SELECTED_STATUS);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [refundViewMode, setRefundViewMode] = useState(RM_DEFAULT_REFUND_VIEW_MODE);
  const [detailRefund, setDetailRefund] = useState(null);
  const stageRef = useRef(null);

  const {
    savedView,
    setSavedView,
    views,
    activeViewId,
    saveNamedView,
    loadNamedView,
    resetToDefaultView,
    deleteNamedView
  } = useSavedViewPreference({
    pageId: RM_SAVED_VIEW_PAGE_ID,
    defaultView: RM_DEFAULT_SAVED_VIEW,
    namedViews: true
  });
  const savedViewFiltersRestoredRef = useRef(false);
  const savedViewPersistReadyRef = useRef(false);
  const savedViewPersistTimerRef = useRef(null);
  const savedViewMetaRef = useRef({
    sort: RM_DEFAULT_SAVED_VIEW.sort,
    density: RM_DEFAULT_SAVED_VIEW.density
  });

  const buildCurrentSavedViewPayload = useCallback(() => ({
    viewMode: refundViewMode,
    filters: {
      selectedPeriod,
      selectedStatus,
      refundViewMode
    },
    sort: savedViewMetaRef.current.sort,
    density: savedViewMetaRef.current.density
  }), [refundViewMode, selectedPeriod, selectedStatus]);

  const applySavedViewPayload = useCallback((payload) => {
    if (payload?.viewMode) {
      setRefundViewMode(payload.viewMode);
    }
    const storedFilters = payload?.filters ?? {};
    if (storedFilters.selectedPeriod != null) {
      setSelectedPeriod(storedFilters.selectedPeriod);
    }
    if (storedFilters.selectedStatus != null) {
      setSelectedStatus(storedFilters.selectedStatus);
    }
    if (storedFilters.refundViewMode != null) {
      setRefundViewMode(storedFilters.refundViewMode);
    }
    savedViewMetaRef.current = {
      sort: payload?.sort ?? RM_DEFAULT_SAVED_VIEW.sort,
      density: payload?.density ?? RM_DEFAULT_SAVED_VIEW.density
    };
  }, []);

  const handleSelectSavedView = useCallback((viewId) => {
    const payload = loadNamedView(viewId);
    applySavedViewPayload(payload);
  }, [loadNamedView, applySavedViewPayload]);

  const handleResetSavedView = useCallback(() => {
    const payload = resetToDefaultView();
    applySavedViewPayload(payload);
  }, [resetToDefaultView, applySavedViewPayload]);

  const handleSaveNamedView = useCallback((label) => {
    saveNamedView(label, buildCurrentSavedViewPayload());
  }, [saveNamedView, buildCurrentSavedViewPayload]);

  const handleDeleteSavedView = useCallback((viewId) => {
    const fallbackPayload = deleteNamedView(viewId);
    if (fallbackPayload) {
      applySavedViewPayload(fallbackPayload);
    }
  }, [deleteNamedView, applySavedViewPayload]);

  useEffect(() => {
    if (savedViewFiltersRestoredRef.current) {
      return;
    }
    savedViewFiltersRestoredRef.current = true;
    savedViewMetaRef.current = {
      sort: savedView.sort ?? RM_DEFAULT_SAVED_VIEW.sort,
      density: savedView.density ?? RM_DEFAULT_SAVED_VIEW.density
    };
    applySavedViewPayload(savedView);
    savedViewPersistReadyRef.current = true;
  }, [savedView, applySavedViewPayload]);

  useEffect(() => {
    if (!savedViewPersistReadyRef.current) {
      return undefined;
    }

    if (savedViewPersistTimerRef.current) {
      clearTimeout(savedViewPersistTimerRef.current);
    }

    savedViewPersistTimerRef.current = setTimeout(() => {
      savedViewPersistTimerRef.current = null;
      setSavedView(buildCurrentSavedViewPayload());
    }, RM_SAVED_VIEW_PERSIST_DEBOUNCE_MS);

    return () => {
      if (savedViewPersistTimerRef.current) {
        clearTimeout(savedViewPersistTimerRef.current);
        savedViewPersistTimerRef.current = null;
      }
    };
  }, [refundViewMode, selectedPeriod, selectedStatus, setSavedView, buildCurrentSavedViewPayload]);

  const loadRefundData = useCallback(async(options = {}) => {
    const silent = options.silent === true;
    try {
      if (silent) {
        setSilentListRefreshing(true);
      } else {
        setLoading(true);
      }
      const [statsRes, historyRes, syncRes] = await Promise.all([
        StandardizedApi.get(REFUND_STATISTICS_ENDPOINT, { period: selectedPeriod }),
        StandardizedApi.get(REFUND_HISTORY_ENDPOINT, {
          page: currentPage,
          size: 10,
          period: selectedPeriod,
          status: selectedStatus
        }),
        StandardizedApi.get(ERP_SYNC_STATUS_ENDPOINT)
      ]);

      if (statsRes?.success && statsRes.data) setRefundStats(statsRes.data);
      if (historyRes?.success && historyRes.data) {
        setRefundHistory(historyRes.data.refundHistory || []);
        setPageInfo(historyRes.data.pageInfo || {});
      }
      if (syncRes?.success && syncRes.data) setErpSyncStatus(syncRes.data);
    } catch (error) {
      console.error('환불 데이터 로드 실패:', error);
      notificationManager.show('환불 데이터를 불러오는데 실패했습니다.', 'error');
    } finally {
      if (silent) {
        setSilentListRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [currentPage, selectedPeriod, selectedStatus, setSilentListRefreshing]);

  useEffect(() => {
    loadRefundData();
  }, [loadRefundData]);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    setCurrentPage(0);
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(0);
  };

  const handleExportExcel = () => {
    notificationManager.show('엑셀 다운로드 기능은 추후 구현 예정입니다.', 'info');
  };

  const handleReflectErp = useCallback(
    async(refund) => {
      const mappingId = refund?.mappingId;
      if (mappingId == null) return;
      try {
        setIsLoadingReflect(true);
        await StandardizedApi.post(REFLECT_ERP_REFUND_ENDPOINT(mappingId), {});
        notificationManager.show('ERP 환불 반영 요청이 완료되었습니다.', 'success');
        loadRefundData({ silent: true });
      } catch (err) {
        if (err?.response?.status === 404 || err?.message?.includes('404')) {
          notificationManager.show('ERP 환불 반영 API는 추후 연동 예정입니다.', 'info');
        } else {
          notificationManager.show(err?.message || 'ERP 환불 반영에 실패했습니다.', 'error');
        }
      } finally {
        setIsLoadingReflect(false);
      }
    },
    [loadRefundData]
  );

  const handleBatchReflectErp = useCallback(async() => {
    if (!(Array.isArray(selectedRowIds) && selectedRowIds.length > 0)) {
      notificationManager.show('반영할 건을 선택해 주세요.', 'info');
      return;
    }
    try {
      setIsLoadingReflect(true);
      const firstId = selectedRowIds[0].mappingId;
      try {
        await StandardizedApi.post(REFLECT_ERP_REFUND_ENDPOINT(firstId), {});
      } catch (firstErr) {
        const is404 =
          firstErr?.response?.status === 404 ||
          Boolean(firstErr?.message?.includes('404'));
        if (is404) {
          notificationManager.show('ERP 환불 반영 API는 추후 연동 예정입니다.', 'info');
          return;
        }
        throw firstErr;
      }
      let successCount = 1;
      for (let i = 1; i < selectedRowIds.length; i++) {
        try {
          await StandardizedApi.post(
            REFLECT_ERP_REFUND_ENDPOINT(selectedRowIds[i].mappingId),
            {}
          );
          successCount += 1;
        } catch (e) {
          console.warn('ERP 환불 반영 개별 실패:', selectedRowIds[i]?.mappingId, e);
        }
      }
      notificationManager.show(
        `${successCount}건 ERP 환불 반영 요청을 보냈습니다.`,
        'success'
      );
      loadRefundData({ silent: true });
      setSelectedRowIds([]);
    } catch (err) {
      notificationManager.show(err?.message || '일괄 반영에 실패했습니다.', 'error');
    } finally {
      setIsLoadingReflect(false);
    }
  }, [selectedRowIds, loadRefundData]);

  const handleToggleRowSelection = useCallback((refund) => {
    setSelectedRowIds((prev) => {
      const key = { mappingId: refund.mappingId, terminatedAt: refund.terminatedAt };
      const exists = prev.some(
        (p) => p.mappingId === key.mappingId && p.terminatedAt === key.terminatedAt
      );
      if (exists) return prev.filter((p) => !(p.mappingId === key.mappingId && p.terminatedAt === key.terminatedAt));
      return [...prev, key];
    });
  }, []);

  const handleOpenDetail = useCallback((refund) => {
    setDetailRefund(refund || null);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailRefund(null);
  }, []);

  const handleViewInList = useCallback(() => {
    if (stageRef.current && typeof stageRef.current.scrollIntoView === 'function') {
      stageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const summary = refundStats?.summary || {};
  const pendingErpCount = toSafeNumber(erpSyncStatus?.pendingErpRequests);

  return (
    <AdminCommonLayout title={RM_PAGE_TITLE}>
      <ContentArea
        className="mg-v2-content-area refund-management__main"
        ariaLabel={RM_MAIN_ARIA_LABEL}
      >
        <ErpPageShell
          className="refund-management-shell refund-management--clinic-os"
          tabsSlot={<FinancialRefundHubTabs />}
          headerSlot={(
            <RefundQuietHeader
              onRefresh={() => loadRefundData({ silent: true })}
              refreshing={silentListRefreshing}
              disabled={loading}
            />
          )}
          mainAriaLabel={RM_MAIN_ARIA_LABEL}
        >
          <div className="refund-management" data-testid="refund-management">
            <RefundSummaryStrip
              loading={loading}
              totalRefundCount={toSafeNumber(summary.totalRefundCount)}
              totalRefundAmount={toSafeNumber(summary.totalRefundAmount)}
              pendingErpCount={pendingErpCount}
            />

            <RefundActionRail
              pendingCount={pendingErpCount}
              onViewInList={handleViewInList}
            />

            <div className="refund-management__saved-views">
              <SavedViewControls
                views={views}
                activeViewId={activeViewId}
                onSelectView={handleSelectSavedView}
                onSaveView={handleSaveNamedView}
                onResetToDefault={handleResetSavedView}
                onDeleteView={handleDeleteSavedView}
              />
            </div>

            <RefundFilterBlock
              selectedPeriod={selectedPeriod}
              selectedStatus={selectedStatus}
              onPeriodChange={handlePeriodChange}
              onStatusChange={handleStatusChange}
              onExportExcel={handleExportExcel}
              onBatchReflectErp={handleBatchReflectErp}
              selectedRowIds={selectedRowIds}
              isLoadingReflect={isLoadingReflect}
              silentListRefreshing={silentListRefreshing}
            />

            <div
              ref={stageRef}
              className="refund-management__stage"
              aria-busy={loading || silentListRefreshing}
              aria-label={RM_MAIN_ARIA_LABEL}
            >
              {loading ? (
                <UnifiedLoading
                  type="inline"
                  text={RM_LOADING.PAGE}
                  className="refund-management__inline-loading refund-management__inline-loading--section"
                  role="status"
                  aria-live="polite"
                  aria-busy="true"
                />
              ) : (
                <RefundHistoryTableBlock
                  refundHistory={refundHistory}
                  pageInfo={pageInfo}
                  onPageChange={setCurrentPage}
                  onReflectErp={handleReflectErp}
                  onOpenDetail={handleOpenDetail}
                  selectedRowIds={selectedRowIds}
                  onToggleRowSelection={handleToggleRowSelection}
                  isLoadingReflect={isLoadingReflect}
                />
              )}
            </div>

            <RefundReasonStatsBlock
              refundReasonStats={refundStats?.refundReasonStats}
              isLoading={loading}
            />
            <RefundErpSyncBlock erpSyncStatus={erpSyncStatus} isLoading={loading} />
            <RefundAccountingBlock erpSyncStatus={erpSyncStatus} isLoading={loading} />
          </div>
        </ErpPageShell>
      </ContentArea>

      <UnifiedModal
        isOpen={Boolean(detailRefund)}
        onClose={handleCloseDetail}
        title={RM_ROW.DETAIL_TITLE}
        size="medium"
        variant="detail"
      >
        {detailRefund ? (
          <dl className="refund-management__detail-list">
            <div className="refund-management__detail-row">
              <dt>환불일시</dt>
              <dd><ErpSafeText value={detailRefund.terminatedAt} /></dd>
            </div>
            <div className="refund-management__detail-row">
              <dt>내담자</dt>
              <dd><ErpSafeText value={detailRefund.clientName} /></dd>
            </div>
            <div className="refund-management__detail-row">
              <dt>상담사</dt>
              <dd><ErpSafeText value={detailRefund.consultantName} /></dd>
            </div>
            <div className="refund-management__detail-row">
              <dt>패키지</dt>
              <dd><ErpSafeText value={detailRefund.packageName} /></dd>
            </div>
            <div className="refund-management__detail-row">
              <dt>환불 회기</dt>
              <dd>
                <ErpSafeNumber
                  value={detailRefund.refundedSessions}
                  formatType={ERP_NUMBER_FORMAT.COUNT}
                />
              </dd>
            </div>
            <div className="refund-management__detail-row">
              <dt>환불 금액</dt>
              <dd>
                <ErpSafeNumber
                  value={detailRefund.refundAmount}
                  formatType={ERP_NUMBER_FORMAT.CURRENCY}
                />
              </dd>
            </div>
            <div className="refund-management__detail-row">
              <dt>환불 사유</dt>
              <dd><ErpSafeText value={detailRefund.standardizedReason} /></dd>
            </div>
            <div className="refund-management__detail-row">
              <dt>ERP 상태</dt>
              <dd><ErpSafeText value={detailRefund.erpStatus} /></dd>
            </div>
            {detailRefund.erpReference ? (
              <div className="refund-management__detail-row">
                <dt>ERP 참조</dt>
                <dd><ErpSafeText value={detailRefund.erpReference} /></dd>
              </div>
            ) : null}
            <div className="refund-management__detail-row">
              <dt>매핑 ID</dt>
              <dd><ErpSafeText value={detailRefund.mappingId} /></dd>
            </div>
          </dl>
        ) : null}
      </UnifiedModal>
    </AdminCommonLayout>
  );
};

export default RefundManagement;
