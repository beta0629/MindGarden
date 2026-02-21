/**
 * MappingManagementPage - 매칭 관리 페이지 (아토믹 구조)
 * ContentArea + ContentHeader/Section 레이아웃, B0KlA 스타일
 *
 * @author MindGarden
 * @since 2025-02-22
 */

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Button from '../../../ui/Button/Button';
import { apiGet, apiPost } from '../../../../utils/ajax';
import notificationManager from '../../../../utils/notification';
import { useSession } from '../../../../contexts/SessionContext';
import UnifiedLoading from '../../../common/UnifiedLoading';
import ContentArea from '../../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../../dashboard-v2/content/ContentHeader';
import MappingFilterSection from '../organisms/MappingFilterSection';
import MappingStatsSection from '../organisms/MappingStatsSection';
import MappingListSection from '../organisms/MappingListSection';
import MappingCreationModal from '../../MappingCreationModal';
import ConsultantTransferModal from '../../mapping/ConsultantTransferModal';
import ConsultantTransferHistory from '../../mapping/ConsultantTransferHistory';
import PartialRefundModal from '../../mapping/PartialRefundModal';
import PaymentConfirmationModal from '../../PaymentConfirmationModal';
import MappingDetailModal from '../../mapping/MappingDetailModal';
import MappingEditModal from '../../MappingEditModal';
import '../../../../styles/unified-design-tokens.css';
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
  const [activeFilters, setActiveFilters] = useState({});
  const [mappingStatusOptions, setMappingStatusOptions] = useState([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTransferHistory, setShowTransferHistory] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingMappings, setPendingMappings] = useState([]);
  const [mappingStatusInfo, setMappingStatusInfo] = useState({});
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

  const loadMappings = async () => {
    if (isLoadingMappings) return;
    setIsLoadingMappings(true);
    setLoading(true);
    try {
      const response = await apiGet('/api/v1/admin/mappings');
      if (response && response.mappings) {
        setMappings(response.mappings);
      } else if (response && Array.isArray(response)) {
        setMappings(response);
      } else {
        setMappings([]);
      }
    } catch (error) {
      console.error('❌ 매칭 목록 로드 실패:', error);
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
      ACTIVE: 'var(--color-success)',
      INACTIVE: 'var(--color-text-secondary)',
      PENDING_PAYMENT: 'var(--color-warning)',
      PAYMENT_CONFIRMED: 'var(--color-info)',
      TERMINATED: 'var(--color-danger)',
      SESSIONS_EXHAUSTED: 'var(--color-warning)',
      SUSPENDED: 'var(--color-text-secondary)'
    };
    return colorMap[status] || 'var(--color-primary)';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      ACTIVE: '✅',
      INACTIVE: '⏸️',
      PENDING_PAYMENT: '⏳',
      PAYMENT_CONFIRMED: '💰',
      TERMINATED: '🚫',
      SESSIONS_EXHAUSTED: '⚠️',
      SUSPENDED: '⏸️'
    };
    return iconMap[status] || '📋';
  };

  const loadMappingStatusInfo = async () => {
    try {
      const response = await apiGet('/api/v1/common-codes/groups/MAPPING_STATUS');
      if (response && response.length > 0) {
        const statusInfoMap = {};
        response.forEach((code) => {
          statusInfoMap[code.codeValue] = {
            label: code.koreanName || code.codeLabel,
            color: code.colorCode || 'var(--mg-secondary-500)',
            icon: code.icon || '📋'
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
          PENDING_PAYMENT: { label: '입금대기', color: 'var(--mg-warning-500)', icon: '⏳' },
          PAYMENT_CONFIRMED: { label: '입금확인', color: 'var(--mg-info-500)', icon: '💰' },
          ACTIVE: { label: '활성', color: 'var(--mg-success-500)', icon: '✅' },
          TERMINATED: { label: '종료', color: 'var(--mg-error-500)', icon: '❌' },
          SESSIONS_EXHAUSTED: { label: '회기소진', color: 'var(--mg-purple-500)', icon: '🔚' },
          INACTIVE: { label: '비활성', color: 'var(--mg-secondary-500)', icon: '⚪' },
          SUSPENDED: { label: '일시정지', color: 'var(--mg-warning-500)', icon: '⏸️' },
          CANCELLED: { label: '취소', color: 'var(--mg-error-500)', icon: '🚫' }
        });
      }
    } catch (error) {
      console.error('매칭 상태 정보 로드 오류:', error);
      setMappingStatusInfo({
        PENDING_PAYMENT: { label: '입금대기', color: 'var(--mg-warning-500)', icon: '⏳' },
        PAYMENT_CONFIRMED: { label: '입금확인', color: 'var(--mg-info-500)', icon: '💰' },
        ACTIVE: { label: '활성', color: 'var(--mg-success-500)', icon: '✅' },
        TERMINATED: { label: '종료', color: 'var(--mg-error-500)', icon: '❌' },
        SESSIONS_EXHAUSTED: { label: '회기소진', color: 'var(--mg-purple-500)', icon: '🔚' },
        INACTIVE: { label: '비활성', color: 'var(--mg-secondary-500)', icon: '⚪' },
        SUSPENDED: { label: '일시정지', color: 'var(--mg-warning-500)', icon: '⏸️' },
        CANCELLED: { label: '취소', color: 'var(--mg-error-500)', icon: '🚫' }
      });
    }
  };

  const handleApproveMapping = async (mappingId) => {
    try {
      const response = await apiPost(`/api/v1/admin/mappings/${mappingId}/approve`, {
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

  const handleConfirmPayment = async () => {
    loadMappings();
  };

  const handleConfirmDeposit = async () => {
    loadMappings();
  };

  const handleRejectMapping = async (mappingId) => {
    try {
      const response = await apiPost(`/api/v1/admin/mappings/${mappingId}/reject`, {
        reason: '관리자 거부'
      });
      if (response) {
        notificationManager.success('매칭이 거부되었습니다.');
        loadMappings();
      } else {
        notificationManager.error('매칭 거부에 실패했습니다.');
      }
    } catch (error) {
      console.error('매칭 거부 실패:', error);
      notificationManager.error(error.message || '매칭 거부에 실패했습니다.');
    }
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

  const handleRefundProcess = async () => {
    if (!refundReason.trim()) {
      notificationManager.warning('⚠️ 환불 사유를 반드시 입력해주세요.');
      return;
    }
    if (refundReason.trim().length < 5) {
      notificationManager.warning('⚠️ 환불 사유를 5자 이상 상세히 입력해주세요.');
      return;
    }
    const confirmMessage = `${refundMapping.clientName}과의 매칭을 환불 처리하시겠습니까?\n\n환불 회기: ${refundMapping.remainingSessions}회\n환불 사유: ${refundReason.trim()}\n\n이 작업은 되돌릴 수 없습니다.`;
    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(confirmMessage, resolve);
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await apiPost(`/api/v1/admin/mappings/${refundMapping.id}/terminate`, {
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
    switch (stat.action) {
      case 'payment':
        if (stat.value > 0) {
          const pending = mappings.filter(
            (m) => m.status === 'PENDING' || m.paymentStatus === 'PENDING'
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
        notificationManager.info(`${stat.label} 매칭을 필터링합니다.`);
        break;
      case 'view_all':
        setFilterStatus('ALL');
        notificationManager.info('전체 매칭을 표시합니다.');
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
        !activeFilters.status ||
        activeFilters.status === 'ALL' ||
        mapping.status === activeFilters.status;
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
    .sort((a, b) => b.id - a.id);

  if (loading) {
    return (
      <div className="mg-v2-ad-b0kla mg-v2-mapping-management">
        <div className="mg-v2-ad-b0kla__container">
          <UnifiedLoading type="page" text="데이터를 불러오는 중..." variant="pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="mg-v2-ad-b0kla mg-v2-mapping-management">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea>
            <ContentHeader
              title="매칭 관리"
              subtitle="상담사와 내담자 간의 매칭을 관리합니다."
              actions={
                <button
                  type="button"
                  className="mg-v2-button mg-v2-button-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={20} style={{ marginRight: 8 }} />
                  새 매칭 생성
                </button>
              }
            />

            <MappingFilterSection
              onSearch={(term) => setSearchTerm(term)}
              onFilterChange={(filters) => {
                setActiveFilters(filters);
                setFilterStatus(filters.status || 'ALL');
              }}
              searchPlaceholder="상담사, 내담자, 패키지명 또는 #태그로 검색..."
              compact
              showQuickFilters
              quickFilterOptions={mappingStatusOptions}
            />

            <MappingStatsSection mappings={mappings} onStatCardClick={handleStatCardClick} />

            <MappingListSection
              mappings={filteredMappings}
              mappingStatusInfo={mappingStatusInfo}
              getStatusKoreanName={getStatusKoreanName}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              onView={handleViewMapping}
              onEdit={handleEditMapping}
              onRefund={handleRefundMapping}
              onConfirmPayment={handleConfirmPayment}
              onConfirmDeposit={handleConfirmDeposit}
              onApprove={handleApproveMapping}
              onCreateClick={() => setShowCreateModal(true)}
            />
          </ContentArea>
      </div>

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

      {showRefundModal && refundMapping && (
        <div className="mapping-refund-modal-overlay">
          <div className="mapping-refund-modal">
            <div className="mapping-refund-modal-header">
              <div className="mapping-refund-modal-header-content">
                <h3 className="mapping-refund-modal-title">🔄 매칭 환불 처리</h3>
                <button
                  type="button"
                  onClick={handleCloseRefundModal}
                  className="mapping-refund-modal-close"
                >
                  ×
                </button>
              </div>
            </div>
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
                  <div className="mapping-refund-reason-error">
                    ⚠️ 환불 사유를 반드시 입력해주세요.
                  </div>
                )}
              </div>
            </div>
            <div className="mapping-refund-modal-footer">
              <Button
                variant="secondary"
                onClick={handleCloseRefundModal}
                disabled={loading}
                preventDoubleClick
              >
                취소
              </Button>
              <Button
                variant="danger"
                onClick={handleRefundProcess}
                disabled={loading || !refundReason.trim()}
                preventDoubleClick
                loading={loading}
                loadingText="처리 중..."
              >
                환불 처리
              </Button>
            </div>
          </div>
        </div>
      )}

      <MappingEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditMapping(null);
        }}
        mapping={editMapping}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default MappingManagementPage;
