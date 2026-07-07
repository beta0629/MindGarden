/**
 * 환불 관리 시스템 페이지 (새 레이아웃 + 아토믹 디자인)
 * 라우트: /erp/refund-management, AdminCommonLayout 유지
 *
 * @author CoreSolution
 * @since 2025-03-16
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentHeader, ContentArea, ContentSection, ContentCard } from '../dashboard-v2/content';
import { ViewModeToggle } from '../common';
import {
  RefundKpiBlock,
  RefundFilterBlock,
  RefundHistoryTableBlock,
  RefundReasonStatsBlock,
  RefundErpSyncBlock,
  RefundAccountingBlock
} from './refund-management';
import { FinancialRefundHubTabs } from './financial/FinancialRefundHubLayout';
import ErpPageShell from './shell/ErpPageShell';
import './refund-management/RefundManagement.css';
import '../admin/mapping-management/organisms/MappingListBlock.css';
import StandardizedApi from '../../utils/standardizedApi';
import { useErpSilentRefresh } from './common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from './common/erpMgButtonProps';
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

/** 환불 이력 보기 전환 옵션 (현재 테이블만 지원, 카드 뷰 추후 구현) */
const REFUND_VIEW_MODE_OPTIONS = [
  { value: 'table', label: '테이블' }
];

const REFUND_STATISTICS_ENDPOINT = '/api/v1/admin/refund-statistics';
const REFUND_HISTORY_ENDPOINT = '/api/v1/admin/refund-history';
const ERP_SYNC_STATUS_ENDPOINT = '/api/v1/admin/erp-sync-status';
const REFLECT_ERP_REFUND_ENDPOINT = (mappingId) =>
  `/api/v1/admin/mappings/${mappingId}/reflect-erp-refund`;

/** 초기·필터 변경 시 목록/KPI 등 공통 로딩 문구 (UnifiedLoading) */
const REFUND_MANAGEMENT_LOADING_TEXT = '환불 데이터를 불러오는 중...';

const RM_DEFAULT_SAVED_VIEW = buildRefundManagementDefaultSavedView();

const RefundManagement = () => {
  const navigate = useNavigate();
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
  }, [currentPage, selectedPeriod, selectedStatus]);

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

  return (
    <AdminCommonLayout title="환불 관리">
      <ContentHeader
        title="환불 관리 시스템"
        subtitle="상담 환불 현황 및 환불·결제 연동"
        actions={
          <MGButton
            type="button"
            variant="outline"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              className: 'refund-management__nav-back'
            })}
            onClick={() => navigate('/erp/dashboard')}
            aria-label="운영 현황으로 돌아가기"
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            preventDoubleClick={false}
          >
            <span>운영 현황으로 돌아가기</span>
          </MGButton>
        }
      />
      <FinancialRefundHubTabs />
      <ContentArea
        className="mg-v2-ad-b0kla refund-management__main"
        ariaLabel="환불 관리 콘텐츠"
      >
        <ErpPageShell mainAriaLabel="환불 관리 본문">
          <RefundKpiBlock
            refundStats={refundStats}
            selectedPeriod={selectedPeriod}
            erpSyncStatus={erpSyncStatus}
            isLoading={loading}
          />
          <div className="mg-w-full mg-mb-md">
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
            onRefresh={() => loadRefundData({ silent: true })}
            onExportExcel={handleExportExcel}
            onBatchReflectErp={handleBatchReflectErp}
            selectedRowIds={selectedRowIds}
            isLoadingReflect={isLoadingReflect}
            silentListRefreshing={silentListRefreshing}
          />
          <ContentSection noCard className="mg-v2-mapping-list-block">
            <ContentCard className="mg-v2-mapping-list-block__card">
              <div className="mg-v2-mapping-list-block__header">
                <div className="mg-v2-mapping-list-block__title">환불 이력</div>
                <ViewModeToggle
                  viewMode={refundViewMode}
                  onViewModeChange={setRefundViewMode}
                  options={REFUND_VIEW_MODE_OPTIONS}
                  className="mg-v2-mapping-list-block__toggle"
                  ariaLabel="목록 보기 전환"
                />
              </div>
              {loading ? (
                <UnifiedLoading
                  type="inline"
                  text={REFUND_MANAGEMENT_LOADING_TEXT}
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
                  selectedRowIds={selectedRowIds}
                  onToggleRowSelection={handleToggleRowSelection}
                  isLoadingReflect={isLoadingReflect}
                />
              )}
            </ContentCard>
          </ContentSection>
          <RefundReasonStatsBlock
            refundReasonStats={refundStats?.refundReasonStats}
            isLoading={loading}
          />
          <RefundErpSyncBlock erpSyncStatus={erpSyncStatus} isLoading={loading} />
          <RefundAccountingBlock erpSyncStatus={erpSyncStatus} isLoading={loading} />
        </ErpPageShell>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default RefundManagement;
