/**
 * MappingManagementPage - 매칭 관리 페이지 (신규 구성)
 * ContentArea + ContentHeader + MappingKpiSection + MappingSearchSection + MappingListBlock
 * 비즈니스 로직 유지, 화면·구조 완전 신규
 *
 * @author Core Solution
 * @since 2025-02-22
 */

import React, { useState, useEffect, useCallback } from 'react';
import ActionBar from '../../../common/ActionBar';
import ActionBarButton from '../../../common/ActionBarButton';
import { SidePeekShell } from '../../../common';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';
import { useConfirm } from '../../../../hooks/useConfirm';
import { useSession } from '../../../../contexts/SessionContext';
import UnifiedLoading from '../../../common/UnifiedLoading';
import ContentArea from '../../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../../dashboard-v2/content/ContentHeader';
import MappingKpiSection from '../organisms/MappingKpiSection';
import MappingSearchSection from '../organisms/MappingSearchSection';
import MappingListBlock from '../organisms/MappingListBlock';
import MappingScheduleSidePeekContent from '../integrated-schedule/molecules/MappingScheduleSidePeekContent';
import MappingCreationModal from '../../MappingCreationModal';
import ConsultantTransferModal from '../../mapping/ConsultantTransferModal';
import ConsultantTransferHistory from '../../mapping/ConsultantTransferHistory';
import PartialRefundModal from '../../mapping/PartialRefundModal';
import PaymentConfirmationModal from '../../PaymentConfirmationModal';
import MappingDetailModal from '../../mapping/MappingDetailModal';
import MappingEditModal from '../../MappingEditModal';
import UnifiedModal from '../../../common/modals/UnifiedModal';
import '../../../../styles/unified-design-tokens.css';
import '../../../../styles/dashboard-tokens-extension.css';
import '../../AdminDashboard/AdminDashboardB0KlA.css';
import '../MappingManagementPage.css';
import { API_ENDPOINTS } from '../../../../constants/apiEndpoints';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_COMMON_CODES_GROUPS_MAPPING_STATUS = '/api/v1/common-codes/groups/MAPPING_STATUS';

const MAPPING_MGMT_PEEK_LAYOUT_CLASS = 'mapping-management__peek-layout';
const MAPPING_MGMT_PEEK_LAYOUT_OPEN_MODIFIER = 'mapping-management__peek-layout--peek-open';
const MAPPING_MGMT_MAIN_REGION_CLASS = 'mapping-management__main-region';


const MappingManagementPage = () => {
  const { t } = useTranslation();
  const [confirm, ConfirmModal] = useConfirm();
  const { user } = useSession();
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [mappingStatusInfo, setMappingStatusInfo] = useState({});
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTransferHistory, setShowTransferHistory] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingMappings, setPendingMappings] = useState([]);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundMapping, setRefundMapping] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [showPartialRefundModal, setShowPartialRefundModal] = useState(false);
  const [partialRefundMapping, setPartialRefundMapping] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailMapping, setDetailMapping] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMapping, setEditMapping] = useState(null);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  const [peekMapping, setPeekMapping] = useState(null);

  const handleMappingPeek = useCallback((mapping) => {
    setPeekMapping(mapping);
  }, []);

  const handleClosePeek = useCallback(() => {
    setPeekMapping(null);
  }, []);

  const loadMappings = async() => {
    if (isLoadingMappings) return;
    setIsLoadingMappings(true);
    setLoading(true);
    try {
      const response = await StandardizedApi.get(API_ENDPOINTS.ADMIN.MAPPINGS.LIST);
      if (response && response.mappings) {
        setMappings(response.mappings);
      } else if (response && Array.isArray(response)) {
        setMappings(response);
      } else {
        setMappings([]);
      }
    } catch (error) {
      console.error('매칭 목록 로드 실패:', error);
      setMappings([]);
      notificationManager.error(t('admin:mapping.page.msgListLoadFailed'));
    } finally {
      setLoading(false);
      setIsLoadingMappings(false);
    }
  };

  useEffect(() => {
    loadMappings();
    loadMappingStatusInfo();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const getStatusKoreanName = (status) => {
    const statusMap = {
      ACTIVE: t('admin:mapping.page.status.active'),
      INACTIVE: t('admin:mapping.page.status.inactive'),
      PENDING_PAYMENT: t('admin:mapping.page.status.pendingPayment'),
      PAYMENT_CONFIRMED: t('admin:mapping.page.status.paymentConfirmed'),
      TERMINATED: t('admin:mapping.page.status.terminated'),
      SESSIONS_EXHAUSTED: t('admin:mapping.page.status.sessionsExhausted'),
      SUSPENDED: t('admin:mapping.page.status.suspended')
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      ACTIVE: 'var(--mg-success-500)',
      INACTIVE: 'var(--mg-secondary-500)',
      PENDING_PAYMENT: 'var(--mg-warning-500)',
      PAYMENT_CONFIRMED: 'var(--mg-info-500)',
      DEPOSIT_PENDING: 'var(--mg-info-500)',
      TERMINATED: 'var(--mg-error-500)',
      SESSIONS_EXHAUSTED: 'var(--mg-purple-500)',
      SUSPENDED: 'var(--mg-warning-500)'
    };
    return colorMap[status] || 'var(--mg-secondary-500)';
  };

  /** 아토믹 디자인 배지 variant (mg-v2-badge.xxx) */
  const getStatusVariant = (status) => {
    const variantMap = {
      ACTIVE: 'success',
      INACTIVE: 'secondary',
      PENDING_PAYMENT: 'warning',
      PAYMENT_CONFIRMED: 'info',
      DEPOSIT_PENDING: 'info',
      TERMINATED: 'error',
      SESSIONS_EXHAUSTED: 'secondary',
      SUSPENDED: 'warning'
    };
    return variantMap[status] || 'secondary';
  };

  /** Display boundary: no Lucide in status row; badge label only. */
  const getStatusIcon = () => null;

  const getStatusIconComponent = () => null;

  const loadMappingStatusInfo = async() => {
    try {
      const response = await StandardizedApi.get(API_COMMON_CODES_GROUPS_MAPPING_STATUS);
      if (response && response.length > 0) {
        const statusInfoMap = {};
        response.forEach((code) => {
          statusInfoMap[code.codeValue] = {
            label: code.koreanName || code.codeLabel,
            color: code.colorCode || 'var(--mg-secondary-500)',
            icon: null
          };
        });
        const statusMapping = {
          ACTIVE: 'ACTIVE_MAPPING',
          INACTIVE: 'INACTIVE_MAPPING',
          TERMINATED: 'TERMINATED_MAPPING',
          SESSIONS_EXHAUSTED: 'SESSIONS_EXHAUSTED_MAPPING'
        };
        Object.entries(statusMapping).forEach(([actualStatus, apiStatus]) => {
          if (statusInfoMap[apiStatus]) {
            statusInfoMap[actualStatus] = statusInfoMap[apiStatus];
          }
        });
        setMappingStatusInfo(statusInfoMap);
      } else {
        setMappingStatusInfo(buildFallbackStatusInfo());
      }
    } catch (error) {
      console.error('매칭 상태 정보 로드 오류:', error);
      setMappingStatusInfo(buildFallbackStatusInfo());
    }
  };

  const buildFallbackStatusInfo = () => ({
    PENDING_PAYMENT: { label: t('admin:mapping.page.status.depositPending'), color: 'var(--mg-warning-500)', icon: null },
    PAYMENT_CONFIRMED: { label: t('admin:mapping.page.status.depositConfirmed'), color: 'var(--mg-info-500)', icon: null },
    ACTIVE: { label: t('admin:mapping.page.status.active'), color: 'var(--mg-success-500)', icon: null },
    TERMINATED: { label: t('admin:mapping.page.status.ended'), color: 'var(--mg-error-500)', icon: null },
    SESSIONS_EXHAUSTED: { label: t('admin:mapping.page.status.sessionsExhaustedShort'), color: 'var(--mg-purple-500)', icon: null },
    INACTIVE: { label: t('admin:mapping.page.status.inactive'), color: 'var(--mg-secondary-500)', icon: null },
    SUSPENDED: { label: t('admin:mapping.page.status.suspended'), color: 'var(--mg-warning-500)', icon: null },
    CANCELLED: { label: t('admin:mapping.page.status.cancelled'), color: 'var(--mg-error-500)', icon: null }
  });

  const handleApproveMapping = async(mappingId) => {
    try {
      const response = await StandardizedApi.post(`/api/v1/admin/mappings/${mappingId}/approve`, {
        adminName: user?.name || user?.userId || t('admin:mapping.page.adminFallback')
      });
      if (response) {
        notificationManager.success(t('admin:mapping.page.msgApproveSuccess'));
        loadMappings();
      } else {
        notificationManager.error(t('admin:mapping.page.msgApproveFailed'));
      }
    } catch (error) {
      console.error('매칭 승인 실패:', error);
      notificationManager.error(error.message || t('admin:mapping.page.msgApproveFailed'));
    }
  };

  const handleConfirmPayment = async() => {
    loadMappings();
  };

  const handleConfirmDeposit = async() => {
    loadMappings();
  };

  const handleMappingCreated = () => {
    setShowCreateModal(false);
    loadMappings();
  };

  const handleTransferConsultant = (mapping) => {
    setSelectedMapping(mapping);
    setShowTransferModal(true);
  };

  const handleTransferCompleted = () => {
    setShowTransferModal(false);
    setSelectedMapping(null);
    loadMappings();
    notificationManager.success(t('admin:mapping.page.msgTransferSuccess'));
  };

  const handleViewTransferHistory = (clientId) => {
    setSelectedClientId(clientId);
    setShowTransferHistory(true);
  };

  const handleCloseTransferHistory = () => {
    setShowTransferHistory(false);
    setSelectedClientId(null);
  };

  const handleRefundMapping = (mapping) => {
    if (mapping.status !== 'ACTIVE') {
      notificationManager.warning(t('admin:mapping.page.msgRefundOnlyActive'));
      return;
    }
    if (mapping.remainingSessions <= 0) {
      notificationManager.warning(t('admin:mapping.page.msgRefundNoRemaining'));
      return;
    }
    setPartialRefundMapping(mapping);
    setShowPartialRefundModal(true);
  };

  const handleFullRefundMapping = (mapping) => {
    setRefundMapping(mapping);
    setRefundReason('');
    setShowRefundModal(true);
  };

  const handleViewMapping = (mapping) => {
    setDetailMapping(mapping);
    setShowDetailModal(true);
  };

  const handleCloseRefundModal = () => {
    setShowRefundModal(false);
    setRefundMapping(null);
    setRefundReason('');
  };

  const handleRefundProcess = async() => {
    if (!refundReason.trim()) {
      notificationManager.warning(t('admin:mapping.page.msgRefundReasonRequired'));
      return;
    }
    if (refundReason.trim().length < 5) {
      notificationManager.warning(t('admin:mapping.page.msgRefundReasonMin'));
      return;
    }
    const confirmMessage = t('admin:mapping.page.refundConfirm', {
      clientName: refundMapping.clientName,
      sessions: refundMapping.remainingSessions,
      reason: refundReason.trim()
    });
    const confirmed = await confirm({ message: confirmMessage, variant: 'danger' });
    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await StandardizedApi.post(`/api/v1/admin/mappings/${refundMapping.id}/terminate`, {
        reason: refundReason.trim()
      });
      if (response?.success) {
        notificationManager.success(t('admin:mapping.page.msgRefundSuccess'));
        handleCloseRefundModal();
        loadMappings();
        window.dispatchEvent(
          new CustomEvent('refundProcessed', {
            detail: {
              mappingId: refundMapping.id,
              clientName: refundMapping.clientName,
              consultantName: refundMapping.consultantName,
              reason: refundReason.trim()
            }
          })
        );
      } else {
        notificationManager.error(response?.message || t('admin:mapping.page.msgRefundFailed'));
      }
    } catch (error) {
      console.error('환불 처리 실패:', error);
      notificationManager.error(t('admin:mapping.page.msgRefundFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditMapping = (mapping) => {
    setEditMapping(mapping);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    loadMappings();
    setShowEditModal(false);
    setEditMapping(null);
  };

  const handleStatCardClick = (stat) => {
    const count = stat.count ?? (parseInt(String(stat.value).replace(/[^0-9]/g, ''), 10) || 0);
    switch (stat.action) {
      case 'payment':
        if (count > 0) {
          const pending = mappings.filter(
            (m) => m.status === 'PENDING_PAYMENT' || m.paymentStatus === 'PENDING'
          );
          setPendingMappings(pending);
          setShowPaymentModal(true);
          notificationManager.info(t('admin:mapping.page.statPaymentBoard', { label: stat.label }));
        } else {
          notificationManager.info(t('admin:mapping.page.statPaymentEmpty'));
        }
        break;
      case 'view':
        setFilterStatus(stat.id);
        break;
      case 'view_all':
        setFilterStatus('ALL');
        break;
      default:
        break;
    }
  };

  const handlePaymentConfirmed = () => {
    loadMappings();
    setShowPaymentModal(false);
    setPendingMappings([]);
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setPendingMappings([]);
  };

  const filteredMappings = mappings
    .filter((mapping) => {
      const matchesStatus =
        filterStatus === 'ALL' || mapping.status === filterStatus;
      const matchesSearch =
        !searchTerm ||
        (mapping.consultantName &&
          mapping.consultantName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (mapping.clientName &&
          mapping.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (mapping.packageName &&
          mapping.packageName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (searchTerm.startsWith('#') &&
          mapping.status === searchTerm.substring(1).toUpperCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => (b.id || 0) - (a.id || 0));

  if (loading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <UnifiedLoading
          type="inline"
          text={t('admin:mapping.page.loadingText')}
          variant="pulse"
        />
      </div>
    );
  }

  return (
    <>
      <ContentArea
        ariaLabel={t('admin:mapping.page.regionLabel')}
        className="mg-v2-mapping-management"
      >
        <ContentHeader
          title={t('admin:mapping.page.title')}
          subtitle={t('admin:mapping.page.subtitle')}
          titleId="mapping-management-title"
          actions={
            <ActionBarButton
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary"
            >
              {t('admin:mapping.page.newMapping')}
            </ActionBarButton>
          }
        />

        <section aria-labelledby="mapping-management-title">
          <MappingSearchSection
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
            placeholder={t('admin:mapping.page.searchPlaceholder')}
          />

          <MappingKpiSection mappings={mappings} onStatCardClick={handleStatCardClick} />

          <div
            className={[
              MAPPING_MGMT_PEEK_LAYOUT_CLASS,
              peekMapping ? MAPPING_MGMT_PEEK_LAYOUT_OPEN_MODIFIER : ''
            ].filter(Boolean).join(' ')}
          >
            <div className={MAPPING_MGMT_MAIN_REGION_CLASS} data-region="R-MAIN">
              <MappingListBlock
                mappings={filteredMappings}
                mappingStatusInfo={mappingStatusInfo}
                getStatusKoreanName={getStatusKoreanName}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                getStatusIconComponent={getStatusIconComponent}
                getStatusVariant={getStatusVariant}
                onView={handleMappingPeek}
                onEdit={handleEditMapping}
                onRefund={handleRefundMapping}
                onConfirmPayment={handleConfirmPayment}
                onConfirmDeposit={handleConfirmDeposit}
                onApprove={handleApproveMapping}
                onCreateClick={() => setShowCreateModal(true)}
              />
            </div>
            <SidePeekShell
              isOpen={Boolean(peekMapping)}
              onClose={handleClosePeek}
              title="상세"
              ariaLabel={
                peekMapping
                  ? `${peekMapping.clientName || '매칭'} 상세`
                  : '상세'
              }
            >
              <MappingScheduleSidePeekContent mapping={peekMapping} />
            </SidePeekShell>
          </div>
        </section>
      </ContentArea>

      <MappingCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onMappingCreated={handleMappingCreated}
      />

      <ConsultantTransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        currentMapping={selectedMapping}
        onTransfer={handleTransferCompleted}
      />

      <ConsultantTransferHistory
        isOpen={showTransferHistory}
        onClose={handleCloseTransferHistory}
        clientId={selectedClientId}
      />

      <PaymentConfirmationModal
        isOpen={showPaymentModal}
        onClose={handlePaymentModalClose}
        mappings={pendingMappings}
        onPaymentConfirmed={handlePaymentConfirmed}
      />

      <PartialRefundModal
        mapping={partialRefundMapping}
        isOpen={showPartialRefundModal}
        onClose={() => {
          setShowPartialRefundModal(false);
          setPartialRefundMapping(null);
        }}
        onSuccess={loadMappings}
      />

      <MappingDetailModal
        mapping={detailMapping}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setDetailMapping(null);
        }}
      />

      <UnifiedModal
        isOpen={Boolean(showRefundModal && refundMapping)}
        onClose={handleCloseRefundModal}
        title={t('admin:mapping.page.modal.title')}
        size="medium"
        className="mg-v2-ad-b0kla"
        loading={loading}
        backdropClick={!loading}
        actions={
          <ActionBar align="end" gap="md">
            <ActionBarButton variant="outline" onClick={handleCloseRefundModal} disabled={loading}>
              {t('admin.actions.cancel')}
            </ActionBarButton>
            <ActionBarButton
              variant="danger"
              onClick={handleRefundProcess}
              loading={loading}
              disabled={!refundReason.trim() || loading}
            >
              {t('admin:mapping.page.modal.refundButton')}
            </ActionBarButton>
          </ActionBar>
        }
      >
        {refundMapping && (
          <div className="mapping-refund-modal-body">
            <div className="mapping-refund-info">
              <h4 className="mapping-refund-info-title">
                {t('admin:mapping.page.modal.infoTitle')}
              </h4>
              <div className="mapping-refund-info-content">
                <p>
                  <strong>{t('admin:mapping.page.modal.consultant')}</strong> {refundMapping.consultantName}
                </p>
                <p>
                  <strong>{t('admin:mapping.page.modal.client')}</strong> {refundMapping.clientName}
                </p>
                <p>
                  <strong>{t('admin:mapping.page.modal.package')}</strong> {refundMapping.packageName}
                </p>
                <p>
                  <strong>{t('admin:mapping.page.modal.totalSessions')}</strong> {refundMapping.totalSessions}{t('admin:mapping.page.modal.sessionUnit')}
                </p>
                <p>
                  <strong>{t('admin:mapping.page.modal.usedSessions')}</strong> {refundMapping.usedSessions}{t('admin:mapping.page.modal.sessionUnit')}
                </p>
                <p className="mapping-refund-info-sessions">
                  <strong>{t('admin:mapping.page.modal.refundSessionsLabel')}</strong> {refundMapping.remainingSessions}{t('admin:mapping.page.modal.sessionUnit')}
                </p>
              </div>
            </div>
            <div className="mapping-refund-reason">
              <h4 className="mapping-refund-reason-title">
                {t('admin:mapping.page.modal.reasonTitle')}{' '}
                <span className="mapping-refund-required">
                  {t('admin:mapping.page.modal.reasonRequiredMark', '*')}
                </span>
              </h4>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder={t('admin:mapping.page.modal.reasonPlaceholder')}
                rows={4}
                className={`mapping-refund-reason-input ${!refundReason.trim() ? 'mapping-refund-reason-input--error' : ''}`}
              />
              {!refundReason.trim() && (
                <div className="mapping-refund-reason-error">
                  {t('admin:mapping.page.modal.reasonError')}
                </div>
              )}
            </div>
          </div>
        )}
      </UnifiedModal>

      <MappingEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditMapping(null);
        }}
        mapping={editMapping}
        onSuccess={handleEditSuccess}
      />
      <ConfirmModal />
    </>
  );
};

export default MappingManagementPage;
