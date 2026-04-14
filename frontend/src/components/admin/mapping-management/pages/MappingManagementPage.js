/**
 * MappingManagementPage - 매칭 관리 페이지 (신규 구성)
 * ContentArea + ContentHeader + MappingKpiSection + MappingSearchSection + MappingListBlock
 * 비즈니스 로직 유지, 화면·구조 완전 신규
 *
 * @author Core Solution
 * @since 2025-02-22
 */

import React, { useState, useEffect } from 'react';
import MGButton from '../../../common/MGButton';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';
import { useSession } from '../../../../contexts/SessionContext';
import UnifiedLoading from '../../../common/UnifiedLoading';
import ContentArea from '../../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../../dashboard-v2/content/ContentHeader';
import MappingKpiSection from '../organisms/MappingKpiSection';
import MappingSearchSection from '../organisms/MappingSearchSection';
import MappingListBlock from '../organisms/MappingListBlock';
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

const MappingManagementPage = () => {
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

  const loadMappings = async() => {
    if (isLoadingMappings) return;
    setIsLoadingMappings(true);
    setLoading(true);
    try {
      const response = await StandardizedApi.get('/api/v1/admin/mappings');
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
      notificationManager.error('매칭 목록을 불러오는데 실패했습니다.');
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
      ACTIVE: '활성',
      INACTIVE: '비활성',
      PENDING_PAYMENT: '결제 대기',
      PAYMENT_CONFIRMED: '결제 확인',
      TERMINATED: '종료됨',
      SESSIONS_EXHAUSTED: '회기 소진',
      SUSPENDED: '일시정지'
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
      const response = await StandardizedApi.get('/api/v1/common-codes/groups/MAPPING_STATUS');
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
        setMappingStatusInfo({
          PENDING_PAYMENT: { label: '입금대기', color: 'var(--mg-warning-500)', icon: null },
          PAYMENT_CONFIRMED: { label: '입금확인', color: 'var(--mg-info-500)', icon: null },
          ACTIVE: { label: '활성', color: 'var(--mg-success-500)', icon: null },
          TERMINATED: { label: '종료', color: 'var(--mg-error-500)', icon: null },
          SESSIONS_EXHAUSTED: { label: '회기소진', color: 'var(--mg-purple-500)', icon: null },
          INACTIVE: { label: '비활성', color: 'var(--mg-secondary-500)', icon: null },
          SUSPENDED: { label: '일시정지', color: 'var(--mg-warning-500)', icon: null },
          CANCELLED: { label: '취소', color: 'var(--mg-error-500)', icon: null }
        });
      }
    } catch (error) {
      console.error('매칭 상태 정보 로드 오류:', error);
      setMappingStatusInfo({
        PENDING_PAYMENT: { label: '입금대기', color: 'var(--mg-warning-500)', icon: null },
        PAYMENT_CONFIRMED: { label: '입금확인', color: 'var(--mg-info-500)', icon: null },
        ACTIVE: { label: '활성', color: 'var(--mg-success-500)', icon: null },
        TERMINATED: { label: '종료', color: 'var(--mg-error-500)', icon: null },
        SESSIONS_EXHAUSTED: { label: '회기소진', color: 'var(--mg-purple-500)', icon: null },
        INACTIVE: { label: '비활성', color: 'var(--mg-secondary-500)', icon: null },
        SUSPENDED: { label: '일시정지', color: 'var(--mg-warning-500)', icon: null },
        CANCELLED: { label: '취소', color: 'var(--mg-error-500)', icon: null }
      });
    }
  };

  const handleApproveMapping = async(mappingId) => {
    try {
      const response = await StandardizedApi.post(`/api/v1/admin/mappings/${mappingId}/approve`, {
        adminName: user?.name || user?.userId || '관리자'
      });
      if (response) {
        notificationManager.success('매칭이 승인되었습니다.');
        loadMappings();
      } else {
        notificationManager.error('매칭 승인에 실패했습니다.');
      }
    } catch (error) {
      console.error('매칭 승인 실패:', error);
      notificationManager.error(error.message || '매칭 승인에 실패했습니다.');
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
    notificationManager.success('상담사가 성공적으로 변경되었습니다.');
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
      notificationManager.warning('활성 상태의 매칭만 환불 처리할 수 있습니다.');
      return;
    }
    if (mapping.remainingSessions <= 0) {
      notificationManager.warning('남은 회기가 없는 매칭은 환불 처리할 수 없습니다.');
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
      notificationManager.warning('환불 사유를 반드시 입력해주세요.');
      return;
    }
    if (refundReason.trim().length < 5) {
      notificationManager.warning('환불 사유를 5자 이상 상세히 입력해주세요.');
      return;
    }
    const confirmMessage = `${refundMapping.clientName}과의 매칭을 환불 처리하시겠습니까?\n\n환불 회기: ${refundMapping.remainingSessions}회\n환불 사유: ${refundReason.trim()}\n\n이 작업은 되돌릴 수 없습니다.`;
    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(confirmMessage, resolve);
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await StandardizedApi.post(`/api/v1/admin/mappings/${refundMapping.id}/terminate`, {
        reason: refundReason.trim()
      });
      if (response?.success) {
        notificationManager.success('매칭이 환불 처리되었습니다. 관련 스케줄도 자동으로 취소됩니다.');
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
        notificationManager.error(response?.message || '환불 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('환불 처리 실패:', error);
      notificationManager.error('환불 처리에 실패했습니다.');
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
          notificationManager.info(`${stat.label} 매칭의 결제 확인을 진행합니다.`);
        } else {
          notificationManager.info('결제 대기 중인 매칭이 없습니다.');
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
        <UnifiedLoading type="inline" text="데이터를 불러오는 중..." variant="pulse" />
      </div>
    );
  }

  return (
    <>
      <ContentArea ariaLabel="매칭 관리 본문" className="mg-v2-mapping-management">
        <ContentHeader
          title="매칭 관리"
          subtitle="상담사와 내담자 간의 매칭을 관리합니다."
          titleId="mapping-management-title"
          actions={
            <MGButton
              type="button"
              variant="primary"
              className="mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary"
              onClick={() => setShowCreateModal(true)}
            >
              새 매칭 생성
            </MGButton>
          }
        />

        <section aria-labelledby="mapping-management-title">
          <MappingSearchSection
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
            placeholder="상담사, 내담자, 패키지명 또는 #상태로 검색..."
          />

          <MappingKpiSection mappings={mappings} onStatCardClick={handleStatCardClick} />

          <MappingListBlock
            mappings={filteredMappings}
            mappingStatusInfo={mappingStatusInfo}
            getStatusKoreanName={getStatusKoreanName}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            getStatusIconComponent={getStatusIconComponent}
            getStatusVariant={getStatusVariant}
            onView={handleViewMapping}
            onEdit={handleEditMapping}
            onRefund={handleRefundMapping}
            onConfirmPayment={handleConfirmPayment}
            onConfirmDeposit={handleConfirmDeposit}
            onApprove={handleApproveMapping}
            onCreateClick={() => setShowCreateModal(true)}
          />
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
        title="매칭 환불 처리"
        size="medium"
        className="mg-v2-ad-b0kla"
        loading={loading}
        backdropClick={!loading}
        actions={
          <>
            <MGButton
              variant="secondary"
              onClick={handleCloseRefundModal}
              disabled={loading}
              preventDoubleClick
            >
              취소
            </MGButton>
            <MGButton
              variant="danger"
              onClick={handleRefundProcess}
              disabled={!refundReason.trim() || loading}
              preventDoubleClick={true}
            >
              환불 처리
            </MGButton>
          </>
        }
      >
        {refundMapping && (
          <div className="mapping-refund-modal-body">
            <div className="mapping-refund-info">
              <h4 className="mapping-refund-info-title">환불 대상 매칭 정보</h4>
              <div className="mapping-refund-info-content">
                <p>
                  <strong>상담사:</strong> {refundMapping.consultantName}
                </p>
                <p>
                  <strong>내담자:</strong> {refundMapping.clientName}
                </p>
                <p>
                  <strong>패키지:</strong> {refundMapping.packageName}
                </p>
                <p>
                  <strong>총 회기:</strong> {refundMapping.totalSessions}회
                </p>
                <p>
                  <strong>사용 회기:</strong> {refundMapping.usedSessions}회
                </p>
                <p className="mapping-refund-info-sessions">
                  <strong>환불 회기:</strong> {refundMapping.remainingSessions}회
                </p>
              </div>
            </div>
            <div className="mapping-refund-reason">
              <h4 className="mapping-refund-reason-title">
                환불 사유 <span className="mapping-refund-required">*</span>
              </h4>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="환불 사유를 상세히 입력해주세요..."
                rows={4}
                className={`mapping-refund-reason-input ${!refundReason.trim() ? 'mapping-refund-reason-input--error' : ''}`}
              />
              {!refundReason.trim() && (
                <div className="mapping-refund-reason-error">환불 사유를 반드시 입력해주세요.</div>
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
    </>
  );
};

export default MappingManagementPage;
