/**
 * 환불 관리 시스템 페이지 (새 레이아웃 + 아토믹 디자인)
 * 라우트: /erp/refund-management, AdminCommonLayout 유지
 *
 * @author CoreSolution
 * @since 2025-03-16
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { List } from 'lucide-react';
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
import { buildErpMgButtonClassName } from './common/erpMgButtonProps';
import notificationManager from '../../utils/notification';

/** 환불 이력 보기 전환 옵션 (현재 테이블만 지원, 카드 뷰 추후 구현) */
const REFUND_VIEW_MODE_OPTIONS = [
  { value: 'table', icon: List, label: '테이블' }
];

const REFUND_STATISTICS_ENDPOINT = '/api/v1/admin/refund-statistics';
const REFUND_HISTORY_ENDPOINT = '/api/v1/admin/refund-history';
const ERP_SYNC_STATUS_ENDPOINT = '/api/v1/admin/erp-sync-status';
const REFLECT_ERP_REFUND_ENDPOINT = (mappingId) =>
  `/api/v1/admin/mappings/${mappingId}/reflect-erp-refund`;

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
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [refundViewMode, setRefundViewMode] = useState('table');

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
          />
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
          {loading ? (
            <div
              className="refund-management__inline-loading"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <UnifiedLoading type="inline" text="환불 데이터를 불러오는 중..." />
            </div>
          ) : null}
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
              <RefundHistoryTableBlock
                refundHistory={refundHistory}
                pageInfo={pageInfo}
                onPageChange={setCurrentPage}
                onReflectErp={handleReflectErp}
                selectedRowIds={selectedRowIds}
                onToggleRowSelection={handleToggleRowSelection}
                isLoadingReflect={isLoadingReflect}
              />
            </ContentCard>
          </ContentSection>
          <RefundReasonStatsBlock refundReasonStats={refundStats?.refundReasonStats} />
          <RefundErpSyncBlock erpSyncStatus={erpSyncStatus} />
          <RefundAccountingBlock erpSyncStatus={erpSyncStatus} />
        </ErpPageShell>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default RefundManagement;
