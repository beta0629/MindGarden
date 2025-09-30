import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleLayout from '../layout/SimpleLayout';
import { apiGet, apiPost, apiPut } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import { 
    MAPPING_API_ENDPOINTS, 
    MAPPING_MESSAGES,
    DEFAULT_MAPPING_CONFIG 
} from '../../constants/mapping';
import MappingCreationModal from './MappingCreationModal';
import MappingCard from './mapping/MappingCard';
import MappingFilters from './mapping/MappingFilters';
import MappingStats from './mapping/MappingStats';
import ConsultantTransferModal from './mapping/ConsultantTransferModal';
import ConsultantTransferHistory from './mapping/ConsultantTransferHistory';
import PartialRefundModal from './mapping/PartialRefundModal';
import PaymentConfirmationModal from './PaymentConfirmationModal';
import MappingDetailModal from './mapping/MappingDetailModal';
import MappingEditModal from './MappingEditModal';
import './MappingManagement.css';

/**
 * 매핑 관리 페이지 컴포넌트
 * - 매핑 목록 조회 및 관리
 * - 매핑 상태 변경 (승인, 거부 등)
 * - 매핑 생성, 수정, 삭제
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const MappingManagement = () => {
    const navigate = useNavigate();
    const [mappings, setMappings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedMapping, setSelectedMapping] = useState(null);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showTransferHistory, setShowTransferHistory] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingMappings, setPendingMappings] = useState([]);
    const [mappingStatusInfo, setMappingStatusInfo] = useState({});
    
    // 환불 처리 관련 상태
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundMapping, setRefundMapping] = useState(null);
    const [refundReason, setRefundReason] = useState('');
    
    // 부분 환불 관련 상태
    const [showPartialRefundModal, setShowPartialRefundModal] = useState(false);
    const [partialRefundMapping, setPartialRefundMapping] = useState(null);
    
    // 상세보기 관련 상태
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailMapping, setDetailMapping] = useState(null);
    
    // 매핑 수정 관련 상태
    const [showEditModal, setShowEditModal] = useState(false);
    const [editMapping, setEditMapping] = useState(null);

    // 데이터 로드
    useEffect(() => {
        loadMappings();
        loadMappingStatusInfo();
    }, []);

    // 페이지 로드 시 스크롤을 맨 위로 이동
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const loadMappings = async () => {
        setLoading(true);
        try {
            // 실제 API 호출 시도
            const response = await apiGet(MAPPING_API_ENDPOINTS.LIST);
            if (response.success) {
                setMappings(response.data || []);
            } else {
                // API 실패 시 테스트 데이터 사용
                const testData = getTestMappings();
                setMappings(testData);
            }
        } catch (error) {
            console.error('매핑 목록 로드 실패:', error);
            // 오류 시 테스트 데이터 사용
            const testData = getTestMappings();
            setMappings(testData);
        } finally {
            setLoading(false);
        }
    };

    // 매핑 상태 정보 일괄 로드
    const loadMappingStatusInfo = async () => {
        try {
            const response = await apiGet('/api/common-codes/group/MAPPING_STATUS');
            if (response && response.length > 0) {
                const statusInfoMap = {};
                
                // 각 상태별 정보를 맵으로 정리
                response.forEach(code => {
                    statusInfoMap[code.codeValue] = {
                        label: code.koreanName || code.codeLabel,
                        color: code.colorCode || '#6c757d',
                        icon: code.icon || '📋'
                    };
                });
                
                setMappingStatusInfo(statusInfoMap);
            } else {
                // 기본값 설정
                setMappingStatusInfo({
                    'PENDING_PAYMENT': { label: '입금대기', color: '#ffc107', icon: '⏳' },
                    'PAYMENT_CONFIRMED': { label: '입금확인', color: '#17a2b8', icon: '💰' },
                    'ACTIVE': { label: '활성', color: '#28a745', icon: '✅' },
                    'TERMINATED': { label: '종료', color: '#dc3545', icon: '❌' },
                    'SESSIONS_EXHAUSTED': { label: '회기소진', color: '#6f42c1', icon: '🔚' },
                    'INACTIVE': { label: '비활성', color: '#6c757d', icon: '⚪' },
                    'SUSPENDED': { label: '일시정지', color: '#fd7e14', icon: '⏸️' },
                    'CANCELLED': { label: '취소', color: '#dc3545', icon: '🚫' }
                });
            }
        } catch (error) {
            console.error('매핑 상태 정보 로드 오류:', error);
            // 오류 시 기본값 설정
            setMappingStatusInfo({
                'PENDING_PAYMENT': { label: '입금대기', color: '#ffc107', icon: '⏳' },
                'PAYMENT_CONFIRMED': { label: '입금확인', color: '#17a2b8', icon: '💰' },
                'ACTIVE': { label: '활성', color: '#28a745', icon: '✅' },
                'TERMINATED': { label: '종료', color: '#dc3545', icon: '❌' },
                'SESSIONS_EXHAUSTED': { label: '회기소진', color: '#6f42c1', icon: '🔚' },
                'INACTIVE': { label: '비활성', color: '#6c757d', icon: '⚪' },
                'SUSPENDED': { label: '일시정지', color: '#fd7e14', icon: '⏸️' },
                'CANCELLED': { label: '취소', color: '#dc3545', icon: '🚫' }
            });
        }
    };

    // 테스트용 매핑 데이터
    const getTestMappings = () => {
        return [
            {
                id: 1,
                consultant: { id: 1, name: '김상담', email: 'consultant1@mindgarden.com' },
                client: { id: 1, name: '이내담', email: 'client1@mindgarden.com' },
                clientId: 1,
                consultantId: 1,
                consultantName: '김상담',
                clientName: '이내담',
                status: 'ACTIVE',
                paymentStatus: 'APPROVED',
                totalSessions: DEFAULT_MAPPING_CONFIG.TOTAL_SESSIONS,
                remainingSessions: 7,
                usedSessions: 3,
                packageName: DEFAULT_MAPPING_CONFIG.PACKAGE_NAME,
                packagePrice: DEFAULT_MAPPING_CONFIG.PACKAGE_PRICE,
                startDate: '2024-12-01T00:00:00',
                notes: '정기 상담 진행 중'
            },
            {
                id: 2,
                consultant: { id: 2, name: '박상담', email: 'consultant2@mindgarden.com' },
                client: { id: 2, name: '최내담', email: 'client2@mindgarden.com' },
                clientId: 2,
                consultantId: 2,
                consultantName: '박상담',
                clientName: '최내담',
                status: 'PENDING_PAYMENT',
                paymentStatus: 'PENDING',
                totalSessions: 5,
                remainingSessions: 5,
                usedSessions: 0,
                packageName: '단기 상담 패키지',
                packagePrice: 250000,
                startDate: '2024-12-15T00:00:00',
                notes: '신규 매핑, 결제 대기 중'
            },
            {
                id: 3,
                consultant: { id: 1, name: '김상담', email: 'consultant1@mindgarden.com' },
                client: { id: 3, name: '정내담', email: 'client3@mindgarden.com' },
                clientId: 3,
                consultantId: 1,
                consultantName: '김상담',
                clientName: '정내담',
                status: 'SESSIONS_EXHAUSTED',
                paymentStatus: 'APPROVED',
                totalSessions: 8,
                remainingSessions: 0,
                usedSessions: 8,
                packageName: '중기 상담 패키지',
                packagePrice: 400000,
                startDate: '2024-11-01T00:00:00',
                notes: '상담 완료, 회기 소진'
            },
            {
                id: 4,
                consultant: { id: 4, name: '테스트상담사', email: 'test-consultant@mindgarden.com' },
                client: { id: 4, name: '테스트내담자001', email: 'test-client001@mindgarden.com' },
                clientId: 4,
                consultantId: 4,
                consultantName: '테스트상담사',
                clientName: '테스트내담자001',
                status: 'ACTIVE',
                paymentStatus: 'APPROVED',
                totalSessions: 10,
                remainingSessions: 8,
                usedSessions: 2,
                packageName: '테스트 패키지',
                packagePrice: 500000,
                startDate: '2024-12-01T00:00:00',
                notes: '테스트용 매핑'
            },
            {
                id: 5,
                consultant: { id: 5, name: '박상담사', email: 'park-consultant@mindgarden.com' },
                client: { id: 5, name: '테스트내담자002', email: 'test-client002@mindgarden.com' },
                clientId: 5,
                consultantId: 5,
                consultantName: '박상담사',
                clientName: '테스트내담자002',
                status: 'ACTIVE',
                paymentStatus: 'APPROVED',
                totalSessions: 15,
                remainingSessions: 12,
                usedSessions: 3,
                packageName: '표준 패키지',
                packagePrice: 750000,
                startDate: '2024-12-05T00:00:00',
                notes: '정기 상담 진행 중'
            }
        ];
    };

    // 매핑 승인
    const handleApproveMapping = async (mappingId) => {
        try {
            const response = await apiPost(`/api/admin/mappings/${mappingId}/approve`, {
                adminName: '관리자'
            });
            
            if (response.success) {
                notificationManager.success('매핑이 승인되었습니다.');
                loadMappings();
            } else {
                notificationManager.error('매핑 승인에 실패했습니다.');
            }
        } catch (error) {
            console.error('매핑 승인 실패:', error);
            notificationManager.error('매핑 승인에 실패했습니다.');
        }
    };

    // 결제 확인 (모달에서 처리됨)
    const handleConfirmPayment = async (mappingId) => {
        // 모달에서 처리되므로 여기서는 목록만 새로고침
        loadMappings();
    };

    // 입금 확인 (모달에서 처리됨)
    const handleConfirmDeposit = async (mappingId) => {
        // 모달에서 처리되므로 여기서는 목록만 새로고침
        loadMappings();
    };

    // 매핑 거부
    const handleRejectMapping = async (mappingId) => {
        try {
            const response = await apiPost(`/api/admin/mappings/${mappingId}/reject`, {
                reason: '관리자 거부'
            });
            
            if (response.success) {
                notificationManager.success('매핑이 거부되었습니다.');
                loadMappings();
            } else {
                notificationManager.error('매핑 거부에 실패했습니다.');
            }
        } catch (error) {
            console.error('매핑 거부 실패:', error);
            notificationManager.error('매핑 거부에 실패했습니다.');
        }
    };

    // 매핑 생성 완료 핸들러
    const handleMappingCreated = () => {
        setShowCreateModal(false);
        loadMappings();
    };

    // 상담사 변경 핸들러
    const handleTransferConsultant = (mapping) => {
        setSelectedMapping(mapping);
        setShowTransferModal(true);
    };

    // 상담사 변경 완료 핸들러
    const handleTransferCompleted = (newMapping) => {
        setShowTransferModal(false);
        setSelectedMapping(null);
        loadMappings();
        notificationManager.success('상담사가 성공적으로 변경되었습니다.');
    };

    // 상담사 변경 이력 보기 핸들러
    const handleViewTransferHistory = (clientId) => {
        setSelectedClientId(clientId);
        setShowTransferHistory(true);
    };

    // 상담사 변경 이력 닫기 핸들러
    const handleCloseTransferHistory = () => {
        setShowTransferHistory(false);
        setSelectedClientId(null);
    };

    // 환불 처리 핸들러 (부분 환불)
    const handleRefundMapping = (mapping) => {
        // ACTIVE 상태이고 남은 회기가 있는 매핑만 환불 가능
        if (mapping.status !== 'ACTIVE') {
            notificationManager.warning('활성 상태의 매핑만 환불 처리할 수 있습니다.');
            return;
        }
        
        if (mapping.remainingSessions <= 0) {
            notificationManager.warning('남은 회기가 없는 매핑은 환불 처리할 수 없습니다.');
            return;
        }

        // 부분 환불 모달 열기
        setPartialRefundMapping(mapping);
        setShowPartialRefundModal(true);
    };

    // 전체 환불 처리 핸들러 (기존 로직 유지)
    const handleFullRefundMapping = (mapping) => {
        setRefundMapping(mapping);
        setRefundReason('');
        setShowRefundModal(true);
    };
    
    // 상세보기 핸들러
    const handleViewMapping = (mapping) => {
        setDetailMapping(mapping);
        setShowDetailModal(true);
    };

    // 환불 모달 닫기
    const handleCloseRefundModal = () => {
        setShowRefundModal(false);
        setRefundMapping(null);
        setRefundReason('');
    };

    // 환불 처리 실행
    const handleRefundProcess = async () => {
        if (!refundReason.trim()) {
            notificationManager.warning('⚠️ 환불 사유를 반드시 입력해주세요.');
            return;
        }

        if (refundReason.trim().length < 5) {
            notificationManager.warning('⚠️ 환불 사유를 5자 이상 상세히 입력해주세요.');
            return;
        }

        const confirmMessage = `${refundMapping.clientName}과의 매핑을 환불 처리하시겠습니까?\n\n환불 회기: ${refundMapping.remainingSessions}회\n환불 사유: ${refundReason.trim()}\n\n이 작업은 되돌릴 수 없습니다.`;
        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setLoading(true);

            const response = await apiPost(`/api/admin/mappings/${refundMapping.id}/terminate`, {
                reason: refundReason.trim()
            });

            if (response.success) {
                notificationManager.success('매핑이 환불 처리되었습니다. 관련 스케줄도 자동으로 취소됩니다.');
                handleCloseRefundModal();
                loadMappings(); // 데이터 새로고침
                
                // 스케줄 컴포넌트에 환불 처리 완료 이벤트 발송
                window.dispatchEvent(new CustomEvent('refundProcessed', {
                    detail: {
                        mappingId: refundMapping.id,
                        clientName: refundMapping.clientName,
                        consultantName: refundMapping.consultantName,
                        reason: refundReason.trim()
                    }
                }));
            } else {
                notificationManager.error(response.message || '환불 처리에 실패했습니다.');
            }

        } catch (error) {
            console.error('환불 처리 실패:', error);
            notificationManager.error('환불 처리에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 매핑 수정 핸들러들
    const handleEditMapping = (mapping) => {
        setEditMapping(mapping);
        setShowEditModal(true);
    };

    const handleEditSuccess = (updatedData) => {
        // 매핑 목록 새로고침
        loadMappings();
        // 수정 모달 닫기
        setShowEditModal(false);
        setEditMapping(null);
    };

    // 필터 핸들러들
    const handleStatusChange = (status) => {
        setFilterStatus(status);
    };

    const handleSearchChange = (term) => {
        setSearchTerm(term);
    };

    const handleResetFilters = () => {
        setFilterStatus('ALL');
        setSearchTerm('');
    };

    // 통계 카드 클릭 핸들러
    const handleStatCardClick = (stat) => {
        switch (stat.action) {
            case 'payment':
                // 결제 확인 모달 열기
                if (stat.value > 0) {
                    const pendingMappings = mappings.filter(mapping => 
                        mapping.status === 'PENDING' || mapping.paymentStatus === 'PENDING'
                    );
                    setPendingMappings(pendingMappings);
                    setShowPaymentModal(true);
                    notificationManager.info(`${stat.label} 매핑의 결제 확인을 진행합니다.`);
                } else {
                    notificationManager.info('결제 대기 중인 매핑이 없습니다.');
                }
                break;
            case 'view':
                // 해당 상태의 매핑만 필터링
                setFilterStatus(stat.id);
                notificationManager.info(`${stat.label} 매핑을 필터링합니다.`);
                break;
            case 'view_all':
                // 전체 매핑 표시
                setFilterStatus('ALL');
                notificationManager.info('전체 매핑을 표시합니다.');
                break;
        }
    };

    // 결제 확인 모달 핸들러
    const handlePaymentConfirmed = (updatedMappings) => {
        // 매핑 목록 새로고침
        loadMappings();
        setShowPaymentModal(false);
        setPendingMappings([]);
    };

    const handlePaymentModalClose = () => {
        setShowPaymentModal(false);
        setPendingMappings([]);
    };

    // 필터링된 매핑 목록 (최신 순으로 정렬)
    const filteredMappings = mappings
        .filter(mapping => {
            const matchesStatus = filterStatus === 'ALL' || mapping.status === filterStatus;
            const matchesSearch = searchTerm === '' || 
                (mapping.consultantName && mapping.consultantName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (mapping.clientName && mapping.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (mapping.packageName && mapping.packageName.toLowerCase().includes(searchTerm.toLowerCase()));
            
            return matchesStatus && matchesSearch;
        })
        .sort((a, b) => {
            // 최신 순으로 정렬 (ID가 큰 것이 최신)
            return b.id - a.id;
        });

            if (loading) {
        return (
            <SimpleLayout>
                <div className="mapping-management">
                    <div className="loading-container">
                        <div className="loading-spinner">{MAPPING_MESSAGES.LOADING}</div>
                    </div>
                </div>
            </SimpleLayout>
        );
    }

    return (
        <SimpleLayout>
            <div className="mapping-management">
            <div className="mapping-header">
                <div className="header-content">
                    <h1>🔗 매핑 관리</h1>
                    <p>상담사와 내담자 간의 매핑을 관리합니다.</p>
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <i className="bi bi-plus-circle"></i> 새 매핑 생성
                </button>
            </div>

            <MappingFilters
                filterStatus={filterStatus}
                searchTerm={searchTerm}
                onStatusChange={handleStatusChange}
                onSearchChange={handleSearchChange}
                onReset={handleResetFilters}
            />

            <MappingStats 
                mappings={mappings} 
                onStatCardClick={handleStatCardClick}
            />

            <div className="mapping-list">
                {filteredMappings.length === 0 ? (
                    <div className="no-mappings">
                        <div className="no-mappings-icon">🔗</div>
                        <h3>{MAPPING_MESSAGES.NO_MAPPINGS}</h3>
                        <p>{MAPPING_MESSAGES.NO_MAPPINGS_DESC}</p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => setShowCreateModal(true)}
                        >
                            매핑 생성하기
                        </button>
                    </div>
                ) : (
                    <div className="mapping-grid">
                        {filteredMappings.map(mapping => (
                            <MappingCard
                                key={mapping.id}
                                mapping={mapping}
                                statusInfo={mappingStatusInfo[mapping.status] || {
                                    label: mapping.status,
                                    color: '#6c757d',
                                    icon: '📋'
                                }}
                                onApprove={handleApproveMapping}
                                onReject={handleRejectMapping}
                                onConfirmPayment={handleConfirmPayment}
                                onConfirmDeposit={handleConfirmDeposit}
                                onEdit={handleEditMapping}
                                onView={handleViewMapping}
                                onTransfer={handleTransferConsultant}
                                onViewTransferHistory={handleViewTransferHistory}
                                onRefund={handleRefundMapping}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* 매핑 생성 모달 */}
            <MappingCreationModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onMappingCreated={handleMappingCreated}
            />

            {/* 상담사 변경 모달 */}
            <ConsultantTransferModal
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                currentMapping={selectedMapping}
                onTransfer={handleTransferCompleted}
            />

            {/* 상담사 변경 이력 모달 */}
            <ConsultantTransferHistory
                isOpen={showTransferHistory}
                onClose={handleCloseTransferHistory}
                clientId={selectedClientId}
            />

            {/* 결제 확인 모달 */}
            <PaymentConfirmationModal
                isOpen={showPaymentModal}
                onClose={handlePaymentModalClose}
                mappings={pendingMappings}
                onPaymentConfirmed={handlePaymentConfirmed}
            />

            {/* 부분 환불 모달 */}
            <PartialRefundModal
                mapping={partialRefundMapping}
                isOpen={showPartialRefundModal}
                onClose={() => {
                    setShowPartialRefundModal(false);
                    setPartialRefundMapping(null);
                }}
                onSuccess={() => {
                    loadMappings(); // 데이터 새로고침
                }}
            />

            {/* 상세보기 모달 */}
            <MappingDetailModal
                mapping={detailMapping}
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setDetailMapping(null);
                }}
            />

            {/* 환불 처리 모달 */}
            {showRefundModal && refundMapping && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}>
                        {/* 모달 헤더 */}
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid #e9ecef',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '16px 16px 0 0'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <h3 style={{
                                    margin: 0,
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#343a40'
                                }}>
                                    🔄 매핑 환불 처리
                                </h3>
                                <button
                                    onClick={handleCloseRefundModal}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                        color: '#6c757d',
                                        padding: '0',
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* 모달 내용 */}
                        <div style={{
                            padding: '24px',
                            maxHeight: '60vh',
                            overflowY: 'auto'
                        }}>
                            {/* 매핑 정보 */}
                            <div style={{
                                backgroundColor: '#f8f9fa',
                                padding: '16px',
                                borderRadius: '8px',
                                marginBottom: '20px'
                            }}>
                                <h4 style={{
                                    margin: '0 0 12px 0',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: '#343a40'
                                }}>
                                    환불 대상 매핑 정보
                                </h4>
                                <div style={{ fontSize: '14px', color: '#6c757d', lineHeight: '1.5' }}>
                                    <p><strong>상담사:</strong> {refundMapping.consultantName}</p>
                                    <p><strong>내담자:</strong> {refundMapping.clientName}</p>
                                    <p><strong>패키지:</strong> {refundMapping.packageName}</p>
                                    <p><strong>총 회기:</strong> {refundMapping.totalSessions}회</p>
                                    <p><strong>사용 회기:</strong> {refundMapping.usedSessions}회</p>
                                    <p style={{ color: '#dc3545', fontWeight: '600' }}>
                                        <strong>환불 회기:</strong> {refundMapping.remainingSessions}회
                                    </p>
                                </div>
                            </div>

                            {/* 환불 사유 입력 */}
                            <div>
                                <h4 style={{
                                    margin: '0 0 12px 0',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: '#343a40'
                                }}>
                                    환불 사유 <span style={{ color: '#dc3545' }}>*</span>
                                </h4>
                                <textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="환불 사유를 상세히 입력해주세요..."
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: `2px solid ${!refundReason.trim() ? '#dc3545' : '#e9ecef'}`,
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        minHeight: '80px'
                                    }}
                                />
                                {!refundReason.trim() && (
                                    <div style={{
                                        color: '#dc3545',
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        fontWeight: '500'
                                    }}>
                                        ⚠️ 환불 사유를 반드시 입력해주세요.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 모달 푸터 */}
                        <div style={{
                            padding: '20px 24px',
                            borderTop: '1px solid #e9ecef',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px'
                        }}>
                            <button
                                onClick={handleCloseRefundModal}
                                disabled={loading}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: 'white',
                                    border: '2px solid #6c757d',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#6c757d',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleRefundProcess}
                                disabled={loading}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: !refundReason.trim() ? '#6c757d' : '#dc3545',
                                    border: `2px solid ${!refundReason.trim() ? '#6c757d' : '#dc3545'}`,
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: 'white',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {loading ? '처리 중...' : '환불 처리'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 매핑 수정 모달 */}
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
        </SimpleLayout>
    );
};

export default MappingManagement;